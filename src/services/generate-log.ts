import type { Task } from "./api.types";

export interface LogEntry {
  id: number;
  user_id: number; 
  date: string;
  content: string;
  tasks_done: number;
  tasks_total: number;
  created_at: string;
}

// AI 生成日志的函数
export async function generateDailyLog(userId: number, tasks: Task[]): Promise<LogEntry> {
  // 统计任务完成情况
  const done = tasks.filter(t => t.status === "done").length;
  const total = tasks.length;
  
  // 生成日志内容(这里用模板,实际项目中可替换为 AI API)
  const content = generateLogContent(tasks, done, total);
  
  // 构造日志条目
  return {
    id: Date.now(),
    user_id: userId,
    date: new Date().toISOString().slice(0, 10),
    content,
    tasks_done: done,
    tasks_total: total,
    created_at: new Date().toISOString()
  };
}

// 根据任务情况生成日志内容 
function generateLogContent(tasks: Task[], done: number, total: number): string {
  const completion = Math.round((done / total) * 100);
  const doneTaskTitles = tasks
    .filter(t => t.status === "done")
    .map(t => t.title)
    .join("、");
    
  return `今日完成度 ${completion}%。
已完成的任务：${doneTaskTitles || "暂无"}。
继续加油!`;
}