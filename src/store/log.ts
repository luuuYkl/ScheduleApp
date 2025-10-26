import { defineStore } from "pinia";
import { ref } from "vue";
import type { LogEntry } from "@/services/generate-log";
import { generateDailyLog } from "@/services/generate-log";
import * as API from "@/services/api";

const APIAny = API as any;

export const useLogStore = defineStore("log", () => {
  // 日志列表
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
  async function generateTodayLog(userId: number, tasks: any[]) {
    // 调用 AI 生成日志
    const newLog = await generateDailyLog(userId, tasks);
    
    // 保存日志
    if (APIAny.saveLog) {
      await APIAny.saveLog(newLog);
    } else {
      // Mock: 保存到 localStorage
      logs.value.unshift(newLog);
      localStorage.setItem(
        `logs_${userId}`, 
        JSON.stringify(logs.value)
      );
    }
    
    return newLog;
  }
  
  return {
    logs,
    loadLogs,
    generateTodayLog
  };
});