// src/services/ai.ts
// AI 服务模块 - 提供计划优化建议功能

import { APP_CONFIG } from "@/config";
import type {
  AIOptimizePlanRequest,
  AIOptimizePlanResponse,
  AISuggestion,
  AIRecommendedTask,
} from "./api.types";

interface AIRequestResult {
  ok: boolean;
  status: number;
  statusText: string;
  text: string;
}

// 统一的请求发送函数，便于记录 4xx/5xx 的返回体
async function sendAIRequest(
  body: Record<string, any>,
  label: string,
): Promise<AIRequestResult> {
  try {
    const response = await fetch(
      `${APP_CONFIG.AI_API_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${APP_CONFIG.AI_API_KEY}`,
        },
        body: JSON.stringify(body),
      },
    );

    const text = await response.text();

    if (!response.ok) {
      console.error(
        `AI API 请求失败(${label}):`,
        response.status,
        response.statusText,
        text,
      );
      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        text,
      };
    }

    return {
      ok: true,
      status: response.status,
      statusText: response.statusText,
      text,
    };
  } catch (error: any) {
    console.error(`AI 请求异常(${label}):`, error);
    return { ok: false, status: 0, statusText: error?.message ?? "", text: "" };
  }
}

/**
 * 调用 OpenAI API 优化计划
 */
export async function optimizePlanWithAI(
  request: AIOptimizePlanRequest,
): Promise<AIOptimizePlanResponse> {
  // 检查是否启用 AI 功能
  if (!APP_CONFIG.AI_ENABLED) {
    return generateMockSuggestions(request);
  }

  // 检查 API Key
  if (!APP_CONFIG.AI_API_KEY) {
    console.warn("AI API Key 未配置，返回默认建议");
    return generateMockSuggestions(request);
  }

  try {
    const prompt = buildOptimizationPrompt(request);

    const primaryPayload = {
      model: APP_CONFIG.AI_MODEL,
      messages: [
        {
          role: "system",
          content: `你是一个专业的时间管理和日程规划助手。请严格按照以下JSON格式返回数据：

{
  "suggestions": [
    {
      "type": "warning|suggestion|info",
      "message": "建议内容",
      "field": "字段名（可选）"
    }
  ],
  "optimized_plan": {
    "title": "优化后的标题（可选）",
    "description": "优化后的描述（可选）",
    "start_date": "可选的优化开始日期(YYYY-MM-DD)",
    "end_date": "可选的优化结束日期(YYYY-MM-DD)",
    "recommended_tasks": [
      {
        "title": "任务标题",
        "task_date": "YYYY-MM-DD（可选，默认用计划开始日）",
        "start_time": "HH:MM（可选）",
        "end_time": "HH:MM（可选）",
        "note": "任务描述/备注",
        "repeat_type": "none|daily|monthly",
        "repeat_end_date": "YYYY-MM-DD（可选）"
      }
    ]
  },
  "reasoning": "简要说明你的分析思路"
}

【重要指令】：
1. 只返回这个JSON对象本身，不要有任何其他文本
2. 绝对不要使用 \`\`\`json 或 \`\`\` 包裹JSON
3. 不要添加任何说明文字、注释或额外内容
4. 确保JSON格式完全正确，所有字段都必须存在
5. 直接输出纯JSON，从 { 开始，到 } 结束`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      stream: false,
      max_tokens: 2000, // 增加 token 限制以容纳完整的任务列表和详细描述
    };

    // 发送请求，兼容 DeepSeek：如果 400 再尝试精简版 payload
    const primaryResult = await sendAIRequest(primaryPayload, "primary");
    let finalResult = primaryResult;

    if (!primaryResult.ok && primaryResult.status === 400) {
      const fallbackPayload = {
        model: APP_CONFIG.AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 2000,
      };
      finalResult = await sendAIRequest(fallbackPayload, "fallback");
    }

    if (!finalResult.ok || !finalResult.text) {
      return generateMockSuggestions(request);
    }

    const data = JSON.parse(finalResult.text);
    const content = data.choices?.[0]?.message?.content ?? "";

    if (!content) {
      console.error("AI 响应内容为空");
      return generateMockSuggestions(request);
    }

    // 优先解析 JSON；若失败则尝试提取正文中的 JSON；再失败则用纯文本作为建议
    const parsed = parseAIContent(content, request);
    if (parsed) return parsed;

    console.error("AI 响应解析失败，返回 Mock 建议", content);
    return generateMockSuggestions(request);
  } catch (error) {
    console.error("AI 优化失败:", error);
    return generateMockSuggestions(request);
  }
}

function parseAIContent(
  content: string,
  request: AIOptimizePlanRequest,
): AIOptimizePlanResponse | null {
  console.log("========== AI 解析开始 ==========");
  console.log("原始响应长度:", content.length);
  console.log("原始响应内容:\n", content);
  console.log("================================");

  const tryParse = (text: string, label: string) => {
    try {
      const result = JSON.parse(text) as AIOptimizePlanResponse;
      console.log(`✅ ${label} 解析成功`);
      return result;
    } catch (e: any) {
      console.log(`❌ ${label} 解析失败:`, e?.message);
      return null;
    }
  };

  // 步骤1：直接解析
  let parsed = tryParse(content, "步骤1-直接解析");
  if (parsed) return parsed;

  // 步骤2：移除所有 Markdown 代码块标记
  let cleaned = content.trim();

  // 移除开头的 ```json 或 ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/gm, "");
  // 移除结尾的 ```
  cleaned = cleaned.replace(/```$/gm, "");
  // 移除所有剩余的 ```
  cleaned = cleaned.replace(/```/g, "");
  cleaned = cleaned.trim();

  console.log("步骤2-清理后内容:\n", cleaned);
  parsed = tryParse(cleaned, "步骤2-清理Markdown");
  if (parsed) return parsed;

  // 步骤3：提取首尾大括号之间的 JSON
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const extracted = jsonMatch[0];
    console.log("步骤3-提取JSON片段长度:", extracted.length);
    console.log("步骤3-提取JSON开头:\n", extracted.substring(0, 200));
    parsed = tryParse(extracted, "步骤3-提取JSON");
    if (parsed) return parsed;
  }

  // 步骤4：尝试修复常见 JSON 问题（仅处理提取的JSON）
  if (jsonMatch) {
    try {
      let toFix = jsonMatch[0];
      // 先不要自动修复引号，因为可能破坏字符串内容
      toFix = toFix
        .replace(/,\s*}/g, "}") // 移除对象尾随逗号
        .replace(/,\s*]/g, "]") // 移除数组尾随逗号
        .replace(/:\s*undefined/g, ": null"); // 替换 undefined

      console.log("步骤4-修复后开头:\n", toFix.substring(0, 200));
      parsed = tryParse(toFix, "步骤4-修复常见问题");
      if (parsed) return parsed;
    } catch (e) {
      console.error("步骤4-修复尝试异常:", e);
    }
  }

  // 步骤5：尝试修复截断的 JSON（补全未闭合的字符串和结构）
  if (jsonMatch) {
    try {
      let toFix = jsonMatch[0];
      console.log("步骤5-尝试修复截断JSON");

      // 检查是否有未闭合的字符串（以 " 开始但未闭合）
      const lastQuoteIndex = toFix.lastIndexOf('"');
      const afterLastQuote = toFix.substring(lastQuoteIndex + 1);

      // 如果最后一个引号后没有配对的引号，说明字符串被截断
      if (lastQuoteIndex !== -1 && !afterLastQuote.includes('"')) {
        console.log("检测到未闭合字符串，尝试补全");
        toFix = toFix.substring(0, lastQuoteIndex + 1) + '"'; // 只保留到最后完整的引号
      }

      // 统计未闭合的结构
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = 0; i < toFix.length; i++) {
        const char = toFix[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (inString) continue;

        if (char === "{") openBraces++;
        if (char === "}") openBraces--;
        if (char === "[") openBrackets++;
        if (char === "]") openBrackets--;
      }

      console.log(`未闭合结构: { ${openBraces}, [ ${openBrackets}`);

      // 补全未闭合的结构
      if (openBrackets > 0) {
        toFix += "]".repeat(openBrackets);
      }
      if (openBraces > 0) {
        toFix += "}".repeat(openBraces);
      }

      // 移除尾随逗号
      toFix = toFix.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

      console.log("步骤5-修复截断后长度:", toFix.length);
      parsed = tryParse(toFix, "步骤5-修复截断JSON");
      if (parsed) return parsed;
    } catch (e) {
      console.error("步骤5-修复截断尝试异常:", e);
    }
  }

  // 所有尝试失败，输出详细诊断信息
  console.error("========== AI 解析完全失败 ==========");
  console.error("完整响应内容:\n", content);
  console.error("清理后内容:\n", cleaned);
  console.error(
    "提取的JSON:",
    jsonMatch ? jsonMatch[0].substring(0, 500) : "无法提取",
  );
  console.error("====================================");

  return {
    suggestions: [
      {
        type: "info",
        message:
          "AI 返回了非标准格式的内容，请查看浏览器控制台获取完整响应。点击「应用优化建议」按钮查看 Mock 建议。",
      },
    ],
    optimized_plan: {
      title: undefined,
      description: undefined,
      recommended_tasks: [],
    },
    reasoning: "AI 响应格式无法解析，已显示原始内容。",
  };
}

/**
 * 构建优化提示词
 */
function buildOptimizationPrompt(request: AIOptimizePlanRequest): string {
  const { title, description, start_date, end_date, user_context } = request;

  // 计算计划时长
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const durationDays =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  return `
请分析以下用户计划，提供优化建议：

计划标题: ${title}
计划描述: ${description || "无"}
开始日期: ${start_date}
结束日期: ${end_date}
计划时长: ${durationDays} 天
${user_context ? `用户背景: ${user_context}` : ""}

请从以下角度分析并提供建议：
1. 时间安排是否合理（是否过于紧凑或松散）
2. 计划标题和描述是否清晰明确
3. 推荐的具体任务列表（含日期/时间/重复/描述）
4. 任何潜在的风险或注意事项

请以 JSON 格式返回，结构如下：
{
  "suggestions": [
    {
      "type": "warning | suggestion | info",
      "message": "具体的建议内容",
      "field": "相关字段（可选）"
    }
  ],
  "optimized_plan": {
    "title": "优化后的标题（如果需要）",
    "description": "优化后的描述（如果需要）",
    "start_date": "可选优化后开始日期(YYYY-MM-DD)",
    "end_date": "可选优化后结束日期(YYYY-MM-DD)",
    "recommended_tasks": [
      {
        "title": "任务标题",
        "task_date": "YYYY-MM-DD（可选，默认用计划开始日）",
        "start_time": "HH:MM（可选）",
        "end_time": "HH:MM（可选）",
        "note": "任务描述/备注",
        "repeat_type": "none | daily | monthly",
        "repeat_end_date": "YYYY-MM-DD（可选）"
      }
    ]
  },
  "reasoning": "简要说明你的分析思路"
}
`;
}

/**
 * 生成模拟建议（当 AI 不可用时）
 */
function generateMockSuggestions(
  request: AIOptimizePlanRequest,
): AIOptimizePlanResponse {
  const { title, description, start_date, end_date } = request;
  const suggestions: AISuggestion[] = [];

  // 计算时长
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const durationDays =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  // 时长分析
  if (durationDays < 3) {
    suggestions.push({
      type: "warning",
      message:
        "计划时长较短（少于3天），建议确保任务目标明确且可在短期内完成。",
      field: "end_date",
    });
  } else if (durationDays > 90) {
    suggestions.push({
      type: "suggestion",
      message:
        "计划时长较长（超过3个月），建议将大目标拆分为多个阶段性小计划，便于追踪进度。",
      field: "end_date",
    });
  } else if (durationDays >= 7 && durationDays <= 30) {
    suggestions.push({
      type: "info",
      message: `计划时长为 ${durationDays} 天，适合培养习惯或完成中短期目标。`,
    });
  }

  // 标题和描述检查
  if (title.length < 3) {
    suggestions.push({
      type: "warning",
      message:
        "标题过短，建议使用更具体的描述，例如「每日晨跑30分钟」而不是「跑步」。",
      field: "title",
    });
  }

  if (!description || description.length < 10) {
    suggestions.push({
      type: "suggestion",
      message:
        "建议添加详细描述，说明计划的目标、预期成果和执行方式，有助于保持动力。",
      field: "description",
    });
  }

  // 生成推荐任务（基于标题关键词，包含时间/重复/描述）
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

/**
 * 快速验证计划合理性（不调用 AI）
 */
export function quickValidatePlan(
  request: AIOptimizePlanRequest,
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const { title, start_date, end_date } = request;

  // 日期有效性检查
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
