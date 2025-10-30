// src/services/generate-log.ts
// AI 日志生成服务 - 根据任务完成情况自动生成每日总结

import type { Task, ScheduleItem } from "./api.types";

/** 日志条目数据模型 */
export interface LogEntry {
  id: number;
  user_id: number; 
  date: string;           // 日志日期 YYYY-MM-DD
  content: string;        // AI 生成的日志内容
  tasks_done: number;     // 已完成任务数
  tasks_total: number;    // 总任务数
  schedules_done: number; // 已完成日程数
  schedules_total: number;// 总日程数
  created_at: string;     // 创建时间戳
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
  schedules: ScheduleItem[] = []
): Promise<LogEntry> {
  // 统计任务完成情况
  const tasksDone = tasks.filter(t => t.status === "done").length;
  const tasksTotal = tasks.length;
  
  // 统计日程完成情况
  const schedulesDone = schedules.filter(s => s.completed).length;
  const schedulesTotal = schedules.length;
  
  // 调用内容生成函数
  const content = generateLogContent(tasks, schedules, tasksDone, tasksTotal, schedulesDone, schedulesTotal);
  
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
    created_at: new Date().toISOString()
  };
}

/**
 * 生成日志文本内容
 * @param tasks 任务列表
 * @param schedules 日程列表
 * @param tasksDone 已完成任务数量
 * @param tasksTotal 总任务数量
 * @param schedulesDone 已完成日程数量
 * @param schedulesTotal 总日程数量
 * @returns 格式化的日志内容
 */
function generateLogContent(
  tasks: Task[], 
  schedules: ScheduleItem[],
  tasksDone: number, 
  tasksTotal: number,
  schedulesDone: number,
  schedulesTotal: number
): string {
  const totalDone = tasksDone + schedulesDone;
  
  // 提取已完成任务的标题
  const doneTasks = tasks.filter(t => t.status === "done");
  
  // 提取已完成日程的标题
  const doneSchedules = schedules.filter(s => s.completed);
  
  let content = "";
  
  // 如果没有完成任何事项
  if (totalDone === 0) {
    content = "今天还没有完成任何任务或日程，加油吧！";
    return content;
  }
  
  content = "今天完成了：\n";
  
  // 列出已完成的任务
  if (doneTasks.length > 0) {
    doneTasks.forEach(t => {
      content += `✓ ${t.title}\n`;
    });
  }
  
  // 列出已完成的日程
  if (doneSchedules.length > 0) {
    doneSchedules.forEach(s => {
      content += `✓ ${s.title}\n`;
    });
  }
  
  // 添加鼓励语
  const encouragements = [
    "很棒！继续保持！",
    "做得好！明天也要加油！",
    "真不错！你正在稳步前进！",
    "太棒了！每一步都很重要！",
    "优秀！坚持就是胜利！"
  ];
  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
  content += `\n${randomEncouragement}`;
  
  return content;
}