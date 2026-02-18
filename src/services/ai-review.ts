// src/services/ai-review.ts
// AI 复盘服务 - 调用 DeepSeek API 生成时间维度的复盘总结

import type { Task, ScheduleItem } from "./api.types";
import { APP_CONFIG } from "@/config";

/** AI 复盘内容 */
export interface AIReview {
  period: "today" | "week" | "month"; // 时间维度
  summary: string; // AI 生成的总结
  insights: string[]; // 关键洞察
  suggestions: string[]; // 改进建议
  metrics: {
    completion_rate: number; // 完成率 (0-100)
    productivity_score: number; // 生产力评分 (0-100)
    consistency_score: number; // 坚持度评分 (0-100)
  };
  generated_at: string; // 生成时间
}

/** 复盘请求参数 */
export interface ReviewRequest {
  userId: number;
  period: "today" | "week" | "month";
  tasks: Task[];
  schedules: ScheduleItem[];
  context?: string; // 用户的额外上下文信息
}

/**
 * 调用 DeepSeek API 生成复盘
 * @param request 复盘请求
 * @returns AI 复盘内容
 */
export async function generateAIReview(
  request: ReviewRequest,
): Promise<AIReview> {
  const { userId, period, tasks, schedules, context } = request;

  // 计算时间范围
  const today = new Date();
  const dateRange = getDateRange(period, today);

  // 过滤出时间范围内的任务和日程
  const filteredTasks = tasks.filter((t) => {
    const taskDate = new Date(t.task_date);
    return taskDate >= dateRange.start && taskDate <= dateRange.end;
  });

  const filteredSchedules = schedules.filter((s) => {
    const scheduleDate = new Date(s.date);
    return scheduleDate >= dateRange.start && scheduleDate <= dateRange.end;
  });

  // 计算统计数据
  const metrics = calculateMetrics(filteredTasks, filteredSchedules);

  // 构建 AI 提示
  const prompt = buildPrompt(
    period,
    filteredTasks,
    filteredSchedules,
    metrics,
    context,
  );

  // 调用 DeepSeek API
  const response = await callDeepSeekAPI(prompt);

  // 解析响应并返回结构化数据
  const review = parseReviewResponse(response, period, metrics);

  return review;
}

/**
 * 根据时间维度获取日期范围
 */
function getDateRange(
  period: "today" | "week" | "month",
  baseDate: Date,
): { start: Date; end: Date } {
  const start = new Date(baseDate);
  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      // 本周一到本周日
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      break;
    case "month":
      // 本月1日到月末
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0);
      end.setMonth(end.getMonth() + 1);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

/**
 * 计算复盘指标
 */
function calculateMetrics(
  tasks: Task[],
  schedules: ScheduleItem[],
): AIReview["metrics"] {
  const tasksDone = tasks.filter((t) => t.status === "done").length;
  const tasksTotal = tasks.length;

  const schedulesDone = schedules.filter((s) => s.completed).length;
  const schedulesTotal = schedules.length;

  const totalItems = tasksTotal + schedulesTotal;
  const totalDone = tasksDone + schedulesDone;

  // 完成率
  const completion_rate =
    totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  // 生产力评分：基于完成率和任务数
  const productivity_score = Math.min(
    100,
    Math.round(completion_rate * (0.5 + tasksTotal / 20)),
  );

  // 坚持度评分：检查是否有连续完成
  const consistency_score = calculateConsistencyScore(tasks, schedules);

  return {
    completion_rate,
    productivity_score,
    consistency_score,
  };
}

/**
 * 计算坚持度评分
 */
function calculateConsistencyScore(
  tasks: Task[],
  schedules: ScheduleItem[],
): number {
  if (tasks.length === 0 && schedules.length === 0) return 0;

  // 统计每天的完成情况
  const dailyCompletion: Map<string, { total: number; done: number }> =
    new Map();

  tasks.forEach((t) => {
    const date = t.task_date;
    const record = dailyCompletion.get(date) || { total: 0, done: 0 };
    record.total++;
    if (t.status === "done") record.done++;
    dailyCompletion.set(date, record);
  });

  schedules.forEach((s) => {
    const date = s.date;
    const record = dailyCompletion.get(date) || { total: 0, done: 0 };
    record.total++;
    if (s.completed) record.done++;
    dailyCompletion.set(date, record);
  });

  // 计算每天的完成率
  let totalScore = 0;
  dailyCompletion.forEach((record) => {
    if (record.total > 0) {
      totalScore += (record.done / record.total) * 100;
    }
  });

  const daysWithData = dailyCompletion.size;
  return daysWithData > 0 ? Math.round(totalScore / daysWithData) : 0;
}

/**
 * 构建发送给 AI 的提示词
 */
function buildPrompt(
  period: "today" | "week" | "month",
  tasks: Task[],
  schedules: ScheduleItem[],
  metrics: AIReview["metrics"],
  context?: string,
): string {
  const periodText = {
    today: "今天",
    week: "这周",
    month: "这个月",
  }[period];

  const tasksList = tasks
    .map(
      (t) =>
        `- ${t.title} (状态: ${t.status === "done" ? "✓已完成" : "✗未完成"})`,
    )
    .join("\n");

  const schedulesList = schedules
    .map((s) => `- ${s.title} (状态: ${s.completed ? "✓已完成" : "✗未完成"})`)
    .join("\n");

  return `请为用户生成一份${periodText}的工作和生活复盘总结。

【时间维度】${periodText}

【完成指标】
- 完成率: ${metrics.completion_rate}%
- 生产力评分: ${metrics.productivity_score}/100
- 坚持度评分: ${metrics.consistency_score}/100

【任务完成情况】
${tasksList || "暂无任务"}

【日程完成情况】
${schedulesList || "暂无日程"}

${context ? `【用户背景】\n${context}` : ""}

请提供：
1. 一段简洁的总结（2-3句）
2. 3个关键洞察
3. 3个改进建议

格式要求：返回 JSON 格式，包含 summary, insights (数组), suggestions (数组) 三个字段`;
}

/**
 * 调用 DeepSeek API
 */
async function callDeepSeekAPI(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || "";

  if (!apiKey) {
    console.warn("[AI Review] DeepSeek API key not found, using mock response");
    return generateMockResponse();
  }

  try {
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "你是一个专业的生产力顾问，善于分析用户的任务完成情况并提供建设性的建议。",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("[AI Review] DeepSeek API call failed:", error);
    // 降级到 Mock 响应
    return generateMockResponse();
  }
}

/**
 * 生成 Mock 响应（开发和测试用）
 */
function generateMockResponse(): string {
  return JSON.stringify({
    summary:
      "今天你完成了大部分任务，表现出色。继续保持这样的势头，相信你能达到更多目标。",
    insights: [
      "你的时间管理能力逐渐提升，任务完成率达到了新的高度",
      "早晨的任务完成率最高，建议保持这个时间段的产出",
      "下午容易出现效率下降，可以尝试在此时安排一些简单的任务",
    ],
    suggestions: [
      "建议为重要任务预留充足的准备时间",
      "尝试使用番茄工作法来管理长任务",
      "定期审视你的目标，确保与当前的优先级保持一致",
    ],
  });
}

/**
 * 解析 AI 响应
 */
function parseReviewResponse(
  content: string,
  period: "today" | "week" | "month",
  metrics: AIReview["metrics"],
): AIReview {
  try {
    // 尝试从 JSON 块中提取
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : parseSimpleFormat(content);

    return {
      period,
      summary: parsed.summary || "无法生成总结",
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      metrics,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[AI Review] Failed to parse response:", error);
    return {
      period,
      summary: content,
      insights: [],
      suggestions: [],
      metrics,
      generated_at: new Date().toISOString(),
    };
  }
}

/**
 * 解析简单格式的响应
 */
function parseSimpleFormat(content: string): {
  summary: string;
  insights: string[];
  suggestions: string[];
} {
  const lines = content.split("\n").filter((line) => line.trim());
  return {
    summary: lines[0] || "",
    insights: [],
    suggestions: [],
  };
}
