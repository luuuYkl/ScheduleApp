// src/services/ai-review.ts
// AI 复盘服务 - 调用 DeepSeek API 生成时间维度的复盘总结

import type { Task, ScheduleItem } from "./api.types";
import { APP_CONFIG } from "@/config";
import { useNotification, NotificationOptions } from "./notification";

import type { TaskModification, AIActionSuggestion } from "./api.types";

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
  /** 可执行的任务修改建议 */
  actionSuggestions?: AIActionSuggestion[];
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
  console.log("[AI Review Scheduler] 开始执行每日AI复盘...");
  
  try {
    // 从localStorage获取用户数据
    const userId = Number(localStorage.getItem("user_id")) || 1;
    const tasksData = localStorage.getItem("tasks");
    const schedulesData = localStorage.getItem("schedules");
    
    let tasks: Task[] = [];
    let schedules: ScheduleItem[] = [];
    
    if (tasksData) {
      try {
        tasks = JSON.parse(tasksData);
      } catch (e) {
        console.error("[AI Review Scheduler] 解析任务数据失败:", e);
      }
    }
    
    if (schedulesData) {
      try {
        schedules = JSON.parse(schedulesData);
      } catch (e) {
        console.error("[AI Review Scheduler] 解析日程数据失败:", e);
      }
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
    
    console.log("[AI Review Scheduler] AI复盘完成:", review.summary);
    
    // 调用回调
    if (onReviewComplete) {
      onReviewComplete(review);
    }
    
    // 发送通知
    const notificationService = useNotification();
    notificationService.showNotification({
      title: "📊 每日复盘已完成",
      body: review.summary,
      tag: "ai_daily_review",
    });
    
  } catch (error) {
    console.error("[AI Review Scheduler] 执行每日复盘失败:", error);
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
  
  console.log(`[AI Review Scheduler] 下次复盘将在 ${Math.round(timeUntilNext / 1000 / 60)} 分钟后执行`);
  
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
  console.log("[AI Review Scheduler] 初始化AI复盘定时任务...");
  
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
        console.log("[AI Review Scheduler] 使用缓存的复盘数据");
      } catch (e) {
        console.error("[AI Review Scheduler] 解析缓存失败:", e);
      }
    }
  }
  
  // 如果没有有效缓存且当前时间已过今天1点，立即执行一次
  if (!cachedReview) {
    const now = new Date();
    const today1AM = new Date(now);
    today1AM.setHours(1, 0, 0, 0);
    
    if (now > today1AM) {
      console.log("[AI Review Scheduler] 无缓存，立即执行复盘");
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
    console.log("[AI Review Scheduler] 定时任务已停止");
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

/**
 * 根据任务和指标生成可执行的任务修改建议
 * @param tasks 当前任务列表
 * @param metrics 复盘指标
 * @returns AI建议动作列表
 */
export function generateActionableSuggestions(
  tasks: Task[],
  metrics: AIReview["metrics"]
): AIActionSuggestion[] {
  const suggestions: AIActionSuggestion[] = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  
  // 获取未完成的任务
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  // 获取今天的任务
  const todayTasks = tasks.filter(t => {
    const today = new Date().toISOString().slice(0, 10);
    return t.task_date === today;
  });
  
  // 建议1: 如果完成率低于70%，建议减少任务
  if (metrics.completion_rate < 70 && pendingTasks.length > 3) {
    const tasksToReschedule = pendingTasks.slice(0, Math.ceil(pendingTasks.length * 0.3));
    
    if (tasksToReschedule.length > 0) {
      suggestions.push({
        id: 1,
        title: '优化任务安排',
        description: `当前完成率为${metrics.completion_rate}%，建议将${tasksToReschedule.length}个非紧急任务推迟到明天`,
        action: 'reduce_tasks',
        modifications: tasksToReschedule.map(task => ({
          taskId: task.id,
          type: 'reschedule' as const,
          reason: '降低当日任务负担，提高完成率',
          original: task,
          modified: {
            title: task.title,
            task_date: tomorrowStr,
            start_time: task.start_time,
            end_time: task.end_time,
            note: task.note
          }
        }))
      });
    }
  }
  
  // 建议2: 如果有多个任务时间冲突，建议重新安排
  const tasksWithTime = pendingTasks.filter(t => t.start_time);
  if (tasksWithTime.length >= 2) {
    // 检查时间重叠
    const overlappingTasks = findOverlappingTasks(tasksWithTime);
    if (overlappingTasks.length > 0) {
      suggestions.push({
        id: suggestions.length + 1,
        title: '解决时间冲突',
        description: `发现${overlappingTasks.length}个任务存在时间重叠，建议调整时间`,
        action: 'reschedule_tasks',
        modifications: overlappingTasks.map((item, index) => ({
          taskId: item.task.id,
          type: 'reschedule' as const,
          reason: '避免时间冲突，提高执行效率',
          original: item.task,
          modified: {
            title: item.task.title,
            task_date: item.task.task_date,
            start_time: item.suggestedStart,
            end_time: item.suggestedEnd,
            note: item.task.note
          }
        }))
      });
    }
  }
  
  // 建议3: 如果坚持度低，建议将大任务拆分
  if (metrics.consistency_score < 60 && pendingTasks.length > 0) {
    const longTasks = pendingTasks.filter(t => {
      if (!t.start_time || !t.end_time) return false;
      const duration = calculateTaskDuration(t.start_time, t.end_time);
      return duration > 120; // 超过2小时的任务
    });
    
    if (longTasks.length > 0) {
      const task = longTasks[0];
      suggestions.push({
        id: suggestions.length + 1,
        title: '拆分长任务',
        description: `任务"${task.title}"时间较长，建议拆分为多个小任务提高完成率`,
        action: 'split_task',
        modifications: [
          {
            taskId: task.id,
            type: 'modify' as const,
            reason: '缩短单个任务时长，提高完成可能性',
            original: task,
            modified: {
              title: task.title + ' (第1部分)',
              task_date: task.task_date,
              start_time: task.start_time || '09:00',
              end_time: task.start_time ? addHours(task.start_time, 1) : '10:00',
              note: task.note
            }
          }
        ]
      });
    }
  }
  
  // 如果没有生成任何建议，添加默认建议
  if (suggestions.length === 0) {
    // 找一个今天的任务，建议调整时间
    if (todayTasks.length > 0) {
      const task = todayTasks[0];
      suggestions.push({
        id: 1,
        title: '优化任务时间',
        description: '建议将重要任务安排在上午高效时段',
        action: 'reschedule_tasks',
        modifications: [{
          taskId: task.id,
          type: 'reschedule' as const,
          reason: '上午9:00-11:00是高效时段，适合处理重要任务',
          original: task,
          modified: {
            title: task.title,
            task_date: task.task_date,
            start_time: '09:00',
            end_time: '10:00',
            note: task.note
          }
        }]
      });
    }
  }
  
  return suggestions;
}

/**
 * 查找时间重叠的任务
 */
function findOverlappingTasks(tasks: Task[]): Array<{
  task: Task;
  suggestedStart: string;
  suggestedEnd: string;
}> {
  const result: Array<{
    task: Task;
    suggestedStart: string;
    suggestedEnd: string;
  }> = [];
  
  // 按开始时间排序
  const sorted = [...tasks].sort((a, b) => 
    (a.start_time || '').localeCompare(b.start_time || '')
  );
  
  let lastEndTime = '00:00';
  
  for (const task of sorted) {
    if (task.start_time && task.end_time) {
      // 如果任务开始时间早于上一个任务的结束时间，说明有重叠
      if (task.start_time < lastEndTime) {
        // 建议调整到上一个任务结束后
        const newStart = lastEndTime;
        const duration = calculateTaskDuration(task.start_time, task.end_time);
        const newEnd = addMinutes(newStart, duration);
        
        result.push({
          task,
          suggestedStart: newStart,
          suggestedEnd: newEnd
        });
      }
      lastEndTime = task.end_time;
    }
  }
  
  return result;
}

/**
 * 计算任务时长（分钟）
 */
function calculateTaskDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

/**
 * 给时间添加小时
 */
function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const newH = (h + hours) % 24;
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 给时间添加分钟
 */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}
