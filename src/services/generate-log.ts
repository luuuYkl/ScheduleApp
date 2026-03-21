// src/services/generate-log.ts
// AI 日志生成服务 - 根据任务完成情况自动生成每日总结

import type { Task, ScheduleItem } from "./api.types";

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
  efficiency_periods?: string[]; // 高效时段（如 ['09:00-11:00', '14:00-16:00']）
}

/**
 * 生成每日日志
 * @param userId 用户ID
 * @param tasks 当天的任务列表
 * @param schedules 当天的日程列表
 * @returns 生成的日志条目
 */
export async function generateDailyLog(
  userId: number,
  tasks: Task[],
  schedules: ScheduleItem[] = [],
): Promise<LogEntry> {
  // 统计任务完成情况
  const tasksDone = tasks.filter((t) => t.status === "done").length;
  const tasksTotal = tasks.length;

  // 统计日程完成情况
  const schedulesDone = schedules.filter((s) => s.completed).length;
  const schedulesTotal = schedules.length;

  // 分析情绪
  const mood = analyzeMood(tasks, schedules, tasksDone, tasksTotal);

  // 计算工作时长
  const workHours = calculateWorkHours(tasks, schedules);

  // 提取当日亮点
  const highlight = extractHighlight(tasks, schedules);

  // 识别高效时段
  const efficiencyPeriods = identifyEfficiencyPeriods(tasks, schedules);

  // 调用内容生成函数
  const content = generateLogContent(
    tasks,
    schedules,
    tasksDone,
    tasksTotal,
    schedulesDone,
    schedulesTotal,
    mood,
  );

  const today = new Date().toISOString().slice(0, 10);

  return {
    id: Date.now(), // 使用时间戳作为临时ID
    user_id: userId,
    date: today,
    content,
    tasks_done: tasksDone,
    tasks_total: tasksTotal,
    schedules_done: schedulesDone,
    schedules_total: schedulesTotal,
    created_at: new Date().toISOString(),
    mood,
    work_hours: workHours,
    highlight,
    efficiency_periods: efficiencyPeriods,
  };
}

/**
 * 分析当日情绪
 */
function analyzeMood(
  tasks: Task[],
  schedules: ScheduleItem[],
  tasksDone: number,
  tasksTotal: number
): LogEntry['mood'] {
  const completionRate = tasksTotal > 0 ? tasksDone / tasksTotal : 0;
  const schedulesDone = schedules.filter(s => s.completed).length;

  // 根据完成率和任务数量分析情绪
  if (completionRate >= 0.9) {
    return 'happy'; // 完成率高，心情愉悦
  } else if (completionRate >= 0.7) {
    return 'calm'; // 完成率较高，心情平静
  } else if (completionRate >= 0.5) {
    return 'focused'; // 完成率中等，专注但可能有压力
  } else if (tasksTotal > 10) {
    return 'anxious'; // 任务多且完成率低，焦虑
  } else if (tasksDone === 0) {
    return 'tired'; // 没有完成任务，可能是疲劳
  } else {
    return 'stressed'; // 其他情况，压力
  }
}

/**
 * 计算工作时长
 */
function calculateWorkHours(tasks: Task[], schedules: ScheduleItem[]): number {
  let totalMinutes = 0;

  // 计算任务时长
  for (const task of tasks) {
    if (task.status === 'done' && task.start_time && task.end_time) {
      const [startHour, startMinute] = task.start_time.split(':').map(Number);
      const [endHour, endMinute] = task.end_time.split(':').map(Number);
      const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      totalMinutes += Math.max(0, duration);
    }
  }

  // 计算日程时长
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
 * 提取当日亮点
 */
function extractHighlight(tasks: Task[], schedules: ScheduleItem[]): string | undefined {
  const doneTasks = tasks.filter(t => t.status === 'done');
  const doneSchedules = schedules.filter(s => s.completed);

  // 查找标记为重要或紧急的任务
  const importantTask = doneTasks.find(t => 
    t.title.includes('重要') || 
    t.title.includes('紧急') || 
    t.title.includes('关键') ||
    t.title.toLowerCase().includes('important') ||
    t.title.toLowerCase().includes('urgent')
  );

  if (importantTask) {
    return `完成了重要任务：${importantTask.title}`;
  }

  // 如果没有重要任务，查找时长最长的任务
  const longestTask = doneTasks.reduce((longest, task) => {
    if (!task.start_time || !task.end_time) return longest;
    const [startHour, startMinute] = task.start_time.split(':').map(Number);
    const [endHour, endMinute] = task.end_time.split(':').map(Number);
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    
    if (!longest || duration > longest.duration) {
      return { task, duration };
    }
    return longest;
  }, null as { task: Task; duration: number } | null);

  if (longestTask && longestTask.duration > 60) {
    return `专注完成了${(longestTask.duration / 60).toFixed(1)}小时的任务：${longestTask.task.title}`;
  }

  // 完成了多项任务
  if (doneTasks.length >= 5) {
    return `今天高效完成了${doneTasks.length}项任务`;
  }

  // 完成了所有日程
  if (doneSchedules.length > 0 && doneSchedules.length === schedules.length) {
    return `按时完成了所有日程安排`;
  }

  return undefined;
}

/**
 * 识别高效时段
 */
function identifyEfficiencyPeriods(tasks: Task[], schedules: ScheduleItem[]): string[] {
  const periodCounts = new Map<string, number>();

  // 统计任务完成的时段
  for (const task of tasks) {
    if (task.status === 'done' && task.start_time) {
      const hour = parseInt(task.start_time.split(':')[0]);
      const period = getPeriod(hour);
      periodCounts.set(period, (periodCounts.get(period) || 0) + 1);
    }
  }

  // 统计日程完成的时段
  for (const schedule of schedules) {
    if (schedule.completed && schedule.start_time) {
      const hour = parseInt(schedule.start_time.split(':')[0]);
      const period = getPeriod(hour);
      periodCounts.set(period, (periodCounts.get(period) || 0) + 1);
    }
  }

  // 找出完成最多的前两个时段
  const sortedPeriods = Array.from(periodCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([period]) => period);

  return sortedPeriods.length > 0 ? sortedPeriods : ['09:00-11:00', '14:00-16:00'];
}

/**
 * 根据小时数获取时段
 */
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
 * 生成日志文本内容
 * @param tasks 任务列表
 * @param schedules 日程列表
 * @param tasksDone 已完成任务数量
 * @param tasksTotal 总任务数量
 * @param schedulesDone 已完成日程数量
 * @param schedulesTotal 总日程数量
 * @param mood 当日情绪
 * @returns 格式化的日志内容
 */
function generateLogContent(
  tasks: Task[],
  schedules: ScheduleItem[],
  tasksDone: number,
  tasksTotal: number,
  schedulesDone: number,
  schedulesTotal: number,
  mood?: LogEntry['mood'],
): string {
  const totalDone = tasksDone + schedulesDone;

  // 提取已完成任务的标题
  const doneTasks = tasks.filter((t) => t.status === "done");

  // 提取已完成日程的标题
  const doneSchedules = schedules.filter((s) => s.completed);

  let content = "";

  // 如果没有完成任何事项
  if (totalDone === 0) {
    content = "今天还没有完成任何任务或日程，加油吧！";
    return content;
  }

  content = "今天完成了：\n";

  // 列出已完成的任务
  if (doneTasks.length > 0) {
    doneTasks.forEach((t) => {
      content += `✓ ${t.title}\n`;
    });
  }

  // 列出已完成的日程
  if (doneSchedules.length > 0) {
    doneSchedules.forEach((s) => {
      content += `✓ ${s.title}\n`;
    });
  }

  // 添加鼓励语
  const encouragements = [
    "很棒！继续保持！",
    "做得好！明天也要加油！",
    "真不错！你正在稳步前进！",
    "太棒了！每一步都很重要！",
    "优秀！坚持就是胜利！",
  ];
  const randomEncouragement =
    encouragements[Math.floor(Math.random() * encouragements.length)];
  content += `\n${randomEncouragement}`;

  return content;
}
