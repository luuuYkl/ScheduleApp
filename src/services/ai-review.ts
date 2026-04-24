// src/services/ai-review.ts
// AI 复盘服务 - 调用 DeepSeek API 生成时间维度的复盘总结

import type { Task, ScheduleItem } from "./api.types";
import { aiLogger, sendAIRequest, parseAIJSON, extractContentFromResponse, isAIAvailable, deduplicatedAICall } from "./ai-utils";

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
    const taskDate = new Date(t.start_date);
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
    const date = t.start_date;
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

const SYSTEM_PROMPT_REVIEW = "你是生产力顾问，分析用户任务完成情况并给出建设性建议。返回JSON：{\"summary\":\"2-3句总结\",\"insights\":[\"洞察1\",\"洞察2\",\"洞察3\"],\"suggestions\":[\"建议1\",\"建议2\",\"建议3\"]}";

/**
 * 构建发送给 AI 的提示词（精简版）
 */
function buildPrompt(
  period: "today" | "week" | "month",
  tasks: Task[],
  schedules: ScheduleItem[],
  metrics: AIReview["metrics"],
  context?: string,
): string {
  const periodText = { today: "今天", week: "这周", month: "这个月" }[period];
  const tasksList = tasks.map(t => `${t.title}(${t.status === "done" ? "✓" : "✗"})`).join(",");
  const schedulesList = schedules.map(s => `${s.title}(${s.completed ? "✓" : "✗"})`).join(",");
  return `${periodText}复盘|完成率${metrics.completion_rate}%|生产力${metrics.productivity_score}|坚持度${metrics.consistency_score}|任务[${tasksList}]|日程[${schedulesList}]${context ? `|背景:${context}` : ""}`;
}

/**
 * 调用 DeepSeek API
 */
async function callDeepSeekAPI(prompt: string): Promise<string> {
  if (!isAIAvailable()) {
    aiLogger.warn("复盘：AI 不可用，使用 Mock 响应");
    return generateMockResponse();
  }

  const result = await sendAIRequest(
    {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT_REVIEW },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    },
    { label: "AI复盘" },
  );

  if (!result.ok) {
    aiLogger.warn("复盘请求失败，降级到 Mock");
    return generateMockResponse();
  }

  return extractContentFromResponse(result.text);
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
  const parsed = parseAIJSON<{ summary: string; insights: string[]; suggestions: string[] }>(content);

  if (parsed) {
    return {
      period,
      summary: parsed.summary || "无法生成总结",
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      metrics,
      generated_at: new Date().toISOString(),
    };
  }

  aiLogger.warn("复盘响应解析失败，返回原始文本");
  return {
    period,
    summary: content,
    insights: [],
    suggestions: [],
    metrics,
    generated_at: new Date().toISOString(),
  };
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

// ============ AI 复盘定时任务服务 ============

/** 缓存的复盘结果 */
let cachedReview: AIReview | null = null;
let lastReviewDate: string | null = null;

/** 定时器ID */
let scheduledTimerId: ReturnType<typeof setTimeout> | null = null;

/** 回调函数类型 */
export type AIReviewCallback = (review: AIReview) => void;

/** 复盘完成回调 */
let onReviewComplete: AIReviewCallback | null = null;

/**
 * 设置复盘完成回调
 */
export function setAIReviewCallback(callback: AIReviewCallback): void {
  onReviewComplete = callback;
}

/**
 * 获取缓存的复盘结果
 */
export function getCachedAIReview(): AIReview | null {
  // 检查缓存是否过期（超过1天）
  if (lastReviewDate) {
    const lastDate = new Date(lastReviewDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      cachedReview = null;
      lastReviewDate = null;
    }
  }
  return cachedReview;
}

/**
 * 计算距离下一个凌晨1点的毫秒数
 */
function getTimeUntilNext1AM(): number {
  const now = new Date();
  const next1AM = new Date(now);
  
  // 设置为凌晨1点
  next1AM.setHours(1, 0, 0, 0);
  
  // 如果已经过了今天的1点，设置为明天1点
  if (now >= next1AM) {
    next1AM.setDate(next1AM.getDate() + 1);
  }
  
  return next1AM.getTime() - now.getTime();
}

/**
 * 执行每日AI复盘
 */
async function executeDailyAIReview(): Promise<void> {
  aiLogger.log("开始执行每日AI复盘...");
  
  try {
    const userId = Number(localStorage.getItem("user_id")) || 1;
    const tasksData = localStorage.getItem("tasks");
    const schedulesData = localStorage.getItem("schedules");
    
    let tasks: Task[] = [];
    let schedules: ScheduleItem[] = [];
    
    if (tasksData) {
      try { tasks = JSON.parse(tasksData); } catch (e) { aiLogger.warn("解析任务数据失败", e); }
    }
    
    if (schedulesData) {
      try { schedules = JSON.parse(schedulesData); } catch (e) { aiLogger.warn("解析日程数据失败", e); }
    }
    
    // 生成复盘
    const review = await generateAIReview({
      userId,
      period: "today",
      tasks,
      schedules,
    });
    
    // 缓存结果
    cachedReview = review;
    lastReviewDate = new Date().toISOString();
    
    // 存储到localStorage
    localStorage.setItem("ai_daily_review", JSON.stringify(review));
    localStorage.setItem("ai_review_date", lastReviewDate);
    
    aiLogger.log("AI复盘完成:", review.summary);
    
    if (onReviewComplete) {
      onReviewComplete(review);
    }
    
  } catch (error) {
    aiLogger.error("执行每日复盘失败:", error);
  }
}

/**
 * 调度下一次复盘任务
 */
function scheduleNextReview(): void {
  // 清除现有的定时器
  if (scheduledTimerId) {
    clearTimeout(scheduledTimerId);
  }
  
  const timeUntilNext = getTimeUntilNext1AM();
  
  aiLogger.log(`下次复盘将在 ${Math.round(timeUntilNext / 1000 / 60)} 分钟后执行`);
  
  scheduledTimerId = setTimeout(() => {
    executeDailyAIReview();
    // 递归调度下一次
    scheduleNextReview();
  }, timeUntilNext);
}

/**
 * 初始化AI复盘定时任务
 * - 检查是否有今日的复盘缓存
 * - 设置每日凌晨1点的定时任务
 */
export function initAIReviewScheduler(): void {
  aiLogger.log("初始化AI复盘定时任务...");
  
  // 检查缓存
  const cachedDate = localStorage.getItem("ai_review_date");
  const cachedData = localStorage.getItem("ai_daily_review");
  
  if (cachedDate && cachedData) {
    const lastDate = new Date(cachedDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
    
    // 如果缓存未超过24小时，使用缓存
    if (hoursDiff < 24) {
      try {
        cachedReview = JSON.parse(cachedData);
        lastReviewDate = cachedDate;
        aiLogger.log("使用缓存的复盘数据");
      } catch (e) {
        aiLogger.warn("解析缓存失败:", e);
      }
    }
  }
  
  // 如果没有有效缓存且当前时间已过今天1点，立即执行一次
  if (!cachedReview) {
    const now = new Date();
    const today1AM = new Date(now);
    today1AM.setHours(1, 0, 0, 0);
    
    if (now > today1AM) {
      aiLogger.log("无缓存，立即执行复盘");
      executeDailyAIReview();
    }
  }
  
  // 设置定时任务
  scheduleNextReview();
}

/**
 * 停止AI复盘定时任务
 */
export function stopAIReviewScheduler(): void {
  if (scheduledTimerId) {
    clearTimeout(scheduledTimerId);
    scheduledTimerId = null;
    aiLogger.log("定时任务已停止");
  }
}

/**
 * 手动触发复盘（用于测试或用户主动请求）
 */
export async function triggerManualReview(
  tasks: Task[],
  schedules: ScheduleItem[],
  period: "today" | "week" | "month" = "today"
): Promise<AIReview> {
  const userId = Number(localStorage.getItem("user_id")) || 1;
  
  const review = await generateAIReview({
    userId,
    period,
    tasks,
    schedules,
  });
  
  // 更新缓存
  cachedReview = review;
  lastReviewDate = new Date().toISOString();
  localStorage.setItem("ai_daily_review", JSON.stringify(review));
  localStorage.setItem("ai_review_date", lastReviewDate);
  
  return review;
}
