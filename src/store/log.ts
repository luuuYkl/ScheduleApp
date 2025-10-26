import { defineStore } from "pinia";
import { ref } from "vue";
import type { LogEntry } from "@/services/generate-log";
import { generateDailyLog } from "@/services/generate-log";
import type { Task } from "@/services/api.types"; // 新增：导入 Task 类型
import * as API from "@/services/api";

const APIAny = API as any;

export const useLogStore = defineStore("log", () => {
  const logs = ref<LogEntry[]>([]);
  
  // 加载用户日志
  async function loadLogs(userId: number) {
    if (APIAny.fetchLogs) {
      logs.value = await APIAny.fetchLogs(userId);
    } else {
      // Mock: 从 localStorage 读取
      const stored = localStorage.getItem(`logs_${userId}`);
      logs.value = stored ? JSON.parse(stored) : [];
    }
    return logs.value;
  }
  
  // 生成今日日志
  async function generateTodayLog(userId: number, tasks: Task[]) {
    console.log('[LogStore] 开始生成日志:', {
      userId,
      tasksCount: tasks.length,
      tasks: tasks.map(t => ({
        id: t.id,
        status: t.status,
        title: t.title
      }))
    });

    try {
      const newLog = await generateDailyLog(userId, tasks);
      console.log('[LogStore] 生成日志结果:', newLog);

      // 保存日志
      if (APIAny.saveLog) {
        console.log('[LogStore] 使用API保存日志');
        await APIAny.saveLog(newLog);
      } else {
        console.log('[LogStore] 使用localStorage保存日志');
        logs.value.unshift(newLog);
        
        const key = `logs_${userId}`;
        const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
        console.log('[LogStore] 现有日志数:', existingLogs.length);
        
        existingLogs.unshift(newLog);
        localStorage.setItem(key, JSON.stringify(existingLogs));
        console.log('[LogStore] 日志保存完成');
      }

      return newLog;
    } catch (err) {
      console.error('[LogStore] 错误:', err);
      throw err;
    }
  }
  
  return {
    logs,
    loadLogs,
    generateTodayLog
  };
});