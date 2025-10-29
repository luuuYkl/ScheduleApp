// src/services/generate-log.ts
// AI 日志生成服务 - 根据任务完成情况自动生成每日总结

import type { Task } from "./api.types";

/** 日志条目数据模型 */
export interface LogEntry {
  id: number;
  user_id: number; 
  date: string;           // 日志日期 YYYY-MM-DD
  content: string;        // AI 生成的日志内容
  tasks_done: number;     // 已完成任务数
  tasks_total: number;    // 总任务数
  created_at: string;     // 创建时间戳
}

/**
 * 生成每日日志
 * @param userId 用户ID
 * @param tasks 当天的任务列表
 * @returns 生成的日志条目
 */
export async function generateDailyLog(userId: number, tasks: Task[]): Promise<LogEntry> {
  // 统计任务完成情况
  const done = tasks.filter(t => t.status === "done").length;
  const total = tasks.length;
  
  // 调用内容生成函数
  const content = generateLogContent(tasks, done, total);
  
  const today = new Date().toISOString().slice(0, 10);
  
  return {
    id: Date.now(), // 使用时间戳作为临时ID
    user_id: userId,
    date: today,
    content,
    tasks_done: done,
    tasks_total: total,
    created_at: new Date().toISOString()
  };
}

/**
 * 生成日志文本内容
 * @param tasks 任务列表
 * @param done 已完成数量
 * @param total 总任务数量
 * @returns 格式化的日志内容
 */
function generateLogContent(tasks: Task[], done: number, total: number): string {
  const completion = Math.round((done / total) * 100);
  
  // 提取已完成任务的标题
  const doneTaskTitles = tasks
    .filter(t => t.status === "done")
    .map(t => t.title)
    .join("、");
    
  return `今日完成度 ${completion}%。
已完成的任务：${doneTaskTitles || "暂无"}。
继续加油!`;
}