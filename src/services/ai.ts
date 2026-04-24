// src/services/ai.ts
// AI 服务模块 - 提供计划优化建议功能
// 已重构：使用 ai-utils 统一客户端、JSON 解析、流处理

import { APP_CONFIG } from "@/config";
import { isAIFeatureEnabledSync } from "@/composables/useUserSettings";
import type {
  AIOptimizePlanRequest,
  AIOptimizePlanResponse,
  AIGeneratePlanRequest,
  AISuggestion,
  AIRecommendedTask,
} from "./api.types";
import {
  aiLogger,
  parseAIJSON,
  sendAIRequest,
  streamAIRequest,
  extractContentFromResponse,
  isAIAvailable,
} from "./ai-utils";

// ────────────────────────────────────────────
// 系统 Prompt（分离配置，便于维护）
// ────────────────────────────────────────────

const SYSTEM_PROMPT_PLAN_OPTIMIZE = `你是日程规划助手。分析用户计划并优化。
规则：直接输出纯JSON，禁止\`\`\`包裹，禁止额外文字。

格式：{"suggestions":[{"type":"warning|suggestion|info","message":"建议"}],"optimized_plan":{"title":"标题","description":"描述","start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD","recommended_tasks":[{"title":"任务","task_date":"YYYY-MM-DD","start_time":"HH:MM","end_time":"HH:MM","note":"描述","repeat_type":"none|daily|weekly|monthly","repeat_end_date":"YYYY-MM-DD"}]},"reasoning":"分析"}`;

const SYSTEM_PROMPT_PLAN_GENERATE = `你是日程规划助手。根据用户描述生成计划方案。
规则：直接输出纯JSON，禁止\`\`\`包裹，禁止额外文字。

格式：{"optimized_plan":{"title":"标题","description":"描述","start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD","recommended_tasks":[{"title":"任务","task_date":"YYYY-MM-DD","start_time":"HH:MM","end_time":"HH:MM","note":"描述","repeat_type":"none|daily|weekly|monthly","repeat_end_date":"YYYY-MM-DD"}]},"suggestions":[{"type":"suggestion","message":"建议"}],"reasoning":"分析"}`;

// ────────────────────────────────────────────
// 计划优化（非流式）
// ────────────────────────────────────────────

/**
 * 调用 AI 优化计划（非流式，带自动降级）
 */
export async function optimizePlanWithAI(
  request: AIOptimizePlanRequest,
  signal?: AbortSignal,
): Promise<AIOptimizePlanResponse> {
  // 检查是否启用 AI 功能
  if (!APP_CONFIG.AI_ENABLED) {
    return generateMockSuggestions(request);
  }
  if (!isAIFeatureEnabledSync("suggest")) {
    return generateMockSuggestions(request);
  }
  if (!APP_CONFIG.AI_API_KEY) {
    aiLogger.warn("AI API Key 未配置，返回默认建议");
    return generateMockSuggestions(request);
  }

  try {
    const prompt = buildOptimizationPrompt(request);

    const primaryPayload = {
      model: APP_CONFIG.AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT_PLAN_OPTIMIZE },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      stream: false,
      max_tokens: 4000,
    };

    // 发送主请求
    let result = await sendAIRequest(primaryPayload, {
      label: "计划优化",
      signal,
      retries: 1,
    });

    // 兼容 DeepSeek：400 时尝试精简版 payload
    if (!result.ok && result.status === 400) {
      aiLogger.log("主请求 400，尝试精简版 payload");
      const fallbackPayload = {
        model: APP_CONFIG.AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 4000,
      };
      result = await sendAIRequest(fallbackPayload, {
        label: "计划优化-fallback",
        signal,
        retries: 0, // fallback 不重试
      });
    }

    if (!result.ok || !result.text) {
      return generateMockSuggestions(request);
    }

    // 提取 content 并解析 JSON
    const content = extractContentFromResponse(result.text);
    if (!content) {
      aiLogger.error("AI 响应内容为空");
      return generateMockSuggestions(request);
    }

    const parsed = parseAIJSON<AIOptimizePlanResponse>(content);
    if (parsed) return parsed;

    aiLogger.error("AI 响应解析失败，返回 Mock 建议");
    return generateMockSuggestions(request);
  } catch (error) {
    aiLogger.error("AI 优化失败:", error);
    return generateMockSuggestions(request);
  }
}

// ────────────────────────────────────────────
// 计划优化（流式）
// ────────────────────────────────────────────

/**
 * 流式 AI 优化计划建议
 */
export async function* optimizePlanWithAIStream(
  request: AIOptimizePlanRequest,
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  if (!isAIAvailable()) {
    // 返回 Mock 数据的流式版本
    const mockData = generateMockSuggestions(request);
    const jsonStr = JSON.stringify(mockData);
    for (let i = 0; i < jsonStr.length; i += 20) {
      yield jsonStr.slice(i, i + 20);
      await new Promise((r) => setTimeout(r, 20));
    }
    return;
  }

  try {
    const prompt = buildOptimizationPrompt(request);

    const payload = {
      model: APP_CONFIG.AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT_PLAN_OPTIMIZE },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    };

    // 使用统一流式客户端
    for await (const chunk of streamAIRequest(payload, {
      label: "计划优化-流式",
      signal,
    })) {
      yield chunk;
    }
  } catch (error) {
    aiLogger.error("AI 流式优化失败:", error);
    // 流式异常时抛出错误，不静默降级为 Mock（避免混合数据）
    throw error;
  }
}

// ────────────────────────────────────────────
// AI 一句话生成计划（流式）
// ────────────────────────────────────────────

/**
 * 用户输入简短目标描述 → AI 生成完整计划 + 推荐任务
 */
export async function* generatePlanFromTextStream(
  request: AIGeneratePlanRequest,
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  if (!isAIAvailable()) {
    const mockResult = generateMockFromText(request.text);
    const jsonStr = JSON.stringify(mockResult);
    for (let i = 0; i < jsonStr.length; i += 20) {
      yield jsonStr.slice(i, i + 20);
      await new Promise((r) => setTimeout(r, 20));
    }
    return;
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const prompt = `目标：${request.text}
${request.user_context ? `背景：${request.user_context}` : ""}
今天：${today}
要求：生成标题、描述、合理日期、3-7个具体可执行的任务（含时间安排）`;

    const payload = {
      model: APP_CONFIG.AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT_PLAN_GENERATE },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    };

    for await (const chunk of streamAIRequest(payload, {
      label: "生成计划-流式",
      signal,
    })) {
      yield chunk;
    }
  } catch (error) {
    aiLogger.error("AI 生成计划失败:", error);
    // 流式异常时抛出错误，不静默降级为 Mock（避免混合数据）
    throw error;
  }
}

// ────────────────────────────────────────────
// Prompt 构建
// ────────────────────────────────────────────

function buildOptimizationPrompt(request: AIOptimizePlanRequest): string {
  const { title, description, start_date, end_date, user_context } = request;

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const durationDays =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  return `分析此计划并提供优化建议：
标题: ${title}
描述: ${description || "无"}
日期: ${start_date} ~ ${end_date}（${durationDays}天）
${user_context ? `背景: ${user_context}` : ""}
要求：评估合理性、优化标题描述、推荐具体任务（含HH:MM时间、可执行描述）`;
}

// ────────────────────────────────────────────
// 快速验证（不调用 AI）
// ────────────────────────────────────────────

export function quickValidatePlan(
  request: AIOptimizePlanRequest,
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const { title, start_date, end_date } = request;

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate > endDate) {
    suggestions.push({
      type: "warning",
      message: "开始日期不能晚于结束日期",
      field: "start_date",
    });
  }

  if (endDate < today) {
    suggestions.push({
      type: "warning",
      message: "结束日期已过期，建议设置未来的日期",
      field: "end_date",
    });
  }

  if (!title || title.trim().length < 2) {
    suggestions.push({
      type: "warning",
      message: "标题至少需要2个字符",
      field: "title",
    });
  }

  return suggestions;
}

// ────────────────────────────────────────────
// Mock 数据生成
// ────────────────────────────────────────────

function generateMockSuggestions(
  request: AIOptimizePlanRequest,
): AIOptimizePlanResponse {
  const { title, description, start_date, end_date } = request;
  const suggestions: AISuggestion[] = [];

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const durationDays =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  if (durationDays < 3) {
    suggestions.push({
      type: "warning",
      message: "计划时长较短（少于3天），建议确保任务目标明确且可在短期内完成。",
      field: "end_date",
    });
  } else if (durationDays > 90) {
    suggestions.push({
      type: "suggestion",
      message: "计划时长较长（超过3个月），建议将大目标拆分为多个阶段性小计划，便于追踪进度。",
      field: "end_date",
    });
  } else if (durationDays >= 7 && durationDays <= 30) {
    suggestions.push({
      type: "info",
      message: `计划时长为 ${durationDays} 天，适合培养习惯或完成中短期目标。`,
    });
  }

  if (title.length < 3) {
    suggestions.push({
      type: "warning",
      message: "标题过短，建议使用更具体的描述，例如「每日晨跑30分钟」而不是「跑步」。",
      field: "title",
    });
  }

  if (!description || description.length < 10) {
    suggestions.push({
      type: "suggestion",
      message: "建议添加详细描述，说明计划的目标、预期成果和执行方式，有助于保持动力。",
      field: "description",
    });
  }

  const recommendedTasks: AIRecommendedTask[] = [];
  const lowerTitle = title.toLowerCase();
  const defaultDate = start_date;

  const addTask = (taskTitle: string, opts?: Partial<AIRecommendedTask>) => {
    recommendedTasks.push({
      title: taskTitle,
      task_date: opts?.task_date ?? defaultDate,
      start_time: opts?.start_time,
      end_time: opts?.end_time,
      note: opts?.note,
      repeat_type: opts?.repeat_type ?? "none",
      repeat_end_date: opts?.repeat_end_date ?? end_date,
    });
  };

  if (
    lowerTitle.includes("学习") ||
    lowerTitle.includes("study") ||
    lowerTitle.includes("learn")
  ) {
    addTask("每日学习 60 分钟", {
      start_time: "07:30",
      note: "晨间高效时段",
      repeat_type: "daily",
    });
    addTask("完成练习/项目实践", {
      start_time: "20:00",
      note: "巩固所学",
      repeat_type: "daily",
    });
    addTask("整理学习笔记", { task_date: end_date, note: "复盘整合" });
  } else if (
    lowerTitle.includes("健身") ||
    lowerTitle.includes("运动") ||
    lowerTitle.includes("锻炼")
  ) {
    addTask("力量训练 45 分钟", { start_time: "18:30", repeat_type: "daily" });
    addTask("有氧 30 分钟", { start_time: "07:00", repeat_type: "daily" });
    addTask("周末拉伸放松", { task_date: end_date, note: "防止受伤" });
  } else if (
    lowerTitle.includes("阅读") ||
    lowerTitle.includes("read") ||
    lowerTitle.includes("书")
  ) {
    addTask("每日阅读 30 页", { start_time: "21:00", repeat_type: "daily" });
    addTask("撰写阅读笔记", { task_date: end_date, note: "输出关键观点" });
  } else if (
    lowerTitle.includes("工作") ||
    lowerTitle.includes("项目") ||
    lowerTitle.includes("project")
  ) {
    addTask("拆分任务与排期", { task_date: start_date, note: "明确优先级" });
    addTask("每周里程碑检查", {
      start_time: "09:00",
      repeat_type: "weekly",
      repeat_end_date: end_date,
    });
    addTask("风险清单更新", {
      start_time: "17:00",
      repeat_type: "weekly",
      repeat_end_date: end_date,
    });
  } else {
    addTask("将目标拆解为可执行子项", { task_date: start_date });
    addTask("设置阶段性检查点", { repeat_type: "monthly" });
    addTask("记录执行中的问题与改进", { repeat_type: "daily" });
    addTask("定期回顾并调整", {
      repeat_type: "weekly",
      repeat_end_date: end_date,
    });
  }

  return {
    suggestions,
    optimized_plan: {
      recommended_tasks: recommendedTasks,
    },
    reasoning: `基于计划时长（${durationDays}天）和标题内容，生成了针对性的建议和任务拆解。建议根据实际情况调整任务列表。`,
  };
}

/** 根据简短文本生成 Mock 计划 */
function generateMockFromText(text: string): AIOptimizePlanResponse {
  const today = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 14 * 86400000)
    .toISOString()
    .slice(0, 10);

  return {
    optimized_plan: {
      title: text.length > 20 ? text.slice(0, 20) + "..." : text,
      description: `基于「${text}」制定的计划方案，为期14天`,
      start_date: today,
      end_date: endDate,
      recommended_tasks: [
        {
          title: "制定详细执行方案",
          task_date: today,
          start_time: "09:00",
          end_time: "10:00",
          note: "明确目标和步骤",
        },
        {
          title: "每日核心任务",
          task_date: today,
          start_time: "10:00",
          end_time: "12:00",
          note: "执行主要任务",
          repeat_type: "daily",
          repeat_end_date: endDate,
        },
        {
          title: "阶段性回顾",
          task_date: endDate,
          start_time: "20:00",
          end_time: "21:00",
          note: "总结经验，调整方向",
        },
      ],
    },
    suggestions: [
      {
        type: "suggestion",
        message: "建议根据实际情况调整任务时间和内容",
      },
    ],
    reasoning: "基于用户描述生成的基础计划方案",
  };
}