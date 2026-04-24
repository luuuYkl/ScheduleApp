// src/services/generate-log.ts
// AI 日志生成服务 - 根据任务完成情况由 AI 自动生成每日总结

import type { Task, ScheduleItem } from "./api.types";
import { sendAIRequest, parseAIJSON, extractContentFromResponse, aiLogger, isAIAvailable } from "./ai-utils";

/** 日志条目数据模型 */
export interface LogEntry {
  id: number;
  user_id: number;
  date: string; // 日志日期 YYYY-MM-DD
  content: string; // AI 生成的日志内容
  tasks_done: number; // 已完成任务数
  tasks_total: number; // 总任务数
  schedules_done: number; // 已完成日程数
  schedules_total: number; // 总日程数
  created_at: string; // 创建时间戳
  
  // 新增字段
  mood?: 'happy' | 'calm' | 'anxious' | 'tired' | 'focused' | 'stressed'; // 当日情绪
  work_hours?: number; // 工作时长（小时）
  highlight?: string; // 当日亮点
  efficiency_periods?: string[]; // 高效时段
}

/** AI 日志响应格式 */
interface AILogResponse {
  summary: string;
  mood: 'happy' | 'calm' | 'anxious' | 'tired' | 'focused' | 'stressed';
  highlight: string;
  suggestions: string[];
}

/**
 * 计算工作时长（小时）
 */
function calculateWorkHours(tasks: Task[], schedules: ScheduleItem[]): number {
  let totalMinutes = 0;

  for (const task of tasks) {
    if (task.status === 'done' && task.start_time && task.end_time) {
      const [startHour, startMinute] = task.start_time.split(':').map(Number);
      const [endHour, endMinute] = task.end_time.split(':').map(Number);
      const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      totalMinutes += Math.max(0, duration);
    }
  }

  for (const schedule of schedules) {
    if (schedule.completed && schedule.start_time && schedule.end_time) {
      const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
      const [endHour, endMinute] = schedule.end_time.split(':').map(Number);
      const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      totalMinutes += Math.max(0, duration);
    }
  }

  return Number((totalMinutes / 60).toFixed(1));
}

/**
 * 识别高效时段
 */
function identifyEfficiencyPeriods(tasks: Task[], schedules: ScheduleItem[]): string[] {
  const periodCounts = new Map<string, number>();

  for (const task of tasks) {
    if (task.status === 'done' && task.start_time) {
      const hour = parseInt(task.start_time.split(':')[0]);
      const period = getPeriod(hour);
      periodCounts.set(period, (periodCounts.get(period) || 0) + 1);
    }
  }

  for (const schedule of schedules) {
    if (schedule.completed && schedule.start_time) {
      const hour = parseInt(schedule.start_time.split(':')[0]);
      const period = getPeriod(hour);
      periodCounts.set(period, (periodCounts.get(period) || 0) + 1);
    }
  }

  const sortedPeriods = Array.from(periodCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([period]) => period);

  return sortedPeriods.length > 0 ? sortedPeriods : ['09:00-12:00', '14:00-17:00'];
}

function getPeriod(hour: number): string {
  if (hour >= 6 && hour < 9) return '06:00-09:00';
  if (hour >= 9 && hour < 12) return '09:00-12:00';
  if (hour >= 12 && hour < 14) return '12:00-14:00';
  if (hour >= 14 && hour < 17) return '14:00-17:00';
  if (hour >= 17 && hour < 20) return '17:00-20:00';
  if (hour >= 20 && hour < 23) return '20:00-23:00';
  return '23:00-06:00';
}

/**
 * 生成任务数据摘要（供 AI Prompt 使用）
 */
function buildTaskSummary(tasks: Task[], schedules: ScheduleItem[]): string {
  const tasksDone = tasks.filter(t => t.status === 'done');
  const tasksPending = tasks.filter(t => t.status === 'pending');
  const tasksMissed = tasks.filter(t => t.status === 'missed');
  const schedulesDone = schedules.filter(s => s.completed);
  
  const lines: string[] = [];
  
  // 任务统计
  lines.push(`总任务: ${tasks.length}, 完成: ${tasksDone.length}, 待办: ${tasksPending.length}, 未完成: ${tasksMissed.length}`);
  lines.push(`总日程: ${schedules.length}, 完成: ${schedulesDone.length}`);
  
  // 已完成任务列表
  if (tasksDone.length > 0) {
    lines.push('已完成任务:');
    for (const t of tasksDone) {
      const time = t.start_time && t.end_time ? ` (${t.start_time}-${t.end_time})` : '';
      lines.push(`  ✓ ${t.title}${time}`);
    }
  }
  
  // 已完成日程列表
  if (schedulesDone.length > 0) {
    lines.push('已完成日程:');
    for (const s of schedulesDone) {
      const time = s.start_time && s.end_time ? ` (${s.start_time}-${s.end_time})` : '';
      lines.push(`  ✓ ${s.title}${time}`);
    }
  }
  
  // 未完成任务
  if (tasksPending.length > 0 || tasksMissed.length > 0) {
    lines.push('未完成任务:');
    for (const t of [...tasksPending, ...tasksMissed]) {
      const status = t.status === 'missed' ? '✗' : '○';
      lines.push(`  ${status} ${t.title}`);
    }
  }
  
  // 辅助统计
  const workHours = calculateWorkHours(tasks, schedules);
  const efficiencyPeriods = identifyEfficiencyPeriods(tasks, schedules);
  
  if (workHours > 0) {
    lines.push(`工作时长: ${workHours}小时`);
  }
  if (efficiencyPeriods.length > 0) {
    lines.push(`高效时段: ${efficiencyPeriods.join(', ')}`);
  }
  
  return lines.join('\n');
}

/**
 * 生成降级日志内容（AI 不可用时的规则模板）
 */
function generateFallbackLog(
  tasks: Task[],
  schedules: ScheduleItem[],
  tasksDone: number,
  tasksTotal: number,
): string {
  const doneTasks = tasks.filter(t => t.status === 'done');
  const doneSchedules = schedules.filter(s => s.completed);
  const totalDone = tasksDone + schedules.filter(s => s.completed).length;

  if (totalDone === 0) {
    return '今天还没有完成任何任务或日程，明天继续加油！';
  }

  let content = '今天完成了：\n';
  
  for (const t of doneTasks) {
    content += `✓ ${t.title}\n`;
  }
  for (const s of doneSchedules) {
    content += `✓ ${s.title}\n`;
  }

  const completionRate = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  if (completionRate >= 80) {
    content += `\n完成率 ${completionRate}%，表现出色！`;
  } else if (completionRate >= 50) {
    content += `\n完成率 ${completionRate}%，继续努力！`;
  } else {
    content += `\n完成率 ${completionRate}%，明天可以尝试减少任务数量。`;
  }

  return content;
}

/**
 * 根据 AI 分析结果判断情绪
 */
function inferMoodFromAI(
  aiResult: AILogResponse | null,
  tasksDone: number,
  tasksTotal: number,
): LogEntry['mood'] {
  if (aiResult?.mood) return aiResult.mood;
  
  const rate = tasksTotal > 0 ? tasksDone / tasksTotal : 0;
  if (rate >= 0.9) return 'happy';
  if (rate >= 0.7) return 'calm';
  if (rate >= 0.5) return 'focused';
  if (tasksTotal > 10) return 'anxious';
  if (tasksDone === 0) return 'tired';
  return 'stressed';
}

/**
 * 生成每日日志（AI 驱动）
 * @param userId 用户ID
 * @param tasks 当天的任务列表
 * @param schedules 当天的日程列表
 * @param targetDate 目标日期（默认今天）
 * @returns 生成的日志条目
 */
export async function generateDailyLog(
  userId: number,
  tasks: Task[],
  schedules: ScheduleItem[] = [],
  targetDate?: string,
): Promise<LogEntry> {
  // 统计任务完成情况
  const tasksDone = tasks.filter(t => t.status === 'done').length;
  const tasksTotal = tasks.length;
  const schedulesDone = schedules.filter(s => s.completed).length;
  const schedulesTotal = schedules.length;

  const date = targetDate || new Date().toISOString().slice(0, 10);
  const workHours = calculateWorkHours(tasks, schedules);
  const efficiencyPeriods = identifyEfficiencyPeriods(tasks, schedules);

  let content = '';
  let mood: LogEntry['mood'] = 'calm';
  let highlight: string | undefined;

  // 尝试 AI 生成
  if (isAIAvailable()) {
    try {
      const taskSummary = buildTaskSummary(tasks, schedules);
      
      const systemPrompt = `你是日程管理助手，根据用户每日任务和日程完成情况，生成简洁的日志总结。
返回JSON：{"summary":"2-3句话总结当日表现","mood":"happy|calm|anxious|tired|focused|stressed","highlight":"当日最值得记录的一件事","suggestions":["1-2条改进建议"]}`;

      const userPrompt = `日期：${date}\n${taskSummary}\n\n请生成日志总结。`;

      const result = await sendAIRequest(
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
        },
        { label: '日志生成' },
      );
      
      if (result.ok && result.text) {
        const aiContent = extractContentFromResponse(result.text);
        if (aiContent) {
          const aiResult = parseAIJSON<AILogResponse>(aiContent);
          if (aiResult) {
            const parts: string[] = [];
            if (aiResult.summary) parts.push(aiResult.summary);
            if (aiResult.highlight) {
              parts.push(`\n🌟 亮点：${aiResult.highlight}`);
              highlight = aiResult.highlight;
            }
            if (aiResult.suggestions?.length > 0) {
              parts.push(`\n💡 建议：${aiResult.suggestions.join('；')}`);
            }
            content = parts.join('\n');
            mood = aiResult.mood || 'calm';
          }
        }
      }
    } catch (error) {
      aiLogger.warn('AI 日志生成失败，使用降级模板', error);
    }
  }

  // 降级到规则生成
  if (!content) {
    content = generateFallbackLog(tasks, schedules, tasksDone, tasksTotal);
    mood = inferMoodFromAI(null, tasksDone, tasksTotal);
  }

  return {
    id: Date.now(),
    user_id: userId,
    date,
    content,
    tasks_done: tasksDone,
    tasks_total: tasksTotal,
    schedules_done: schedulesDone,
    schedules_total: schedulesTotal,
    created_at: new Date().toISOString(),
    mood,
    work_hours: workHours > 0 ? workHours : undefined,
    highlight,
    efficiency_periods: efficiencyPeriods,
  };
}