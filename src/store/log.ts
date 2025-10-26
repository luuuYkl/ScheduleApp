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
  
  // 生成或更新今日日志（每天只保留一条日志，反复勾选只更新内容）
  async function generateTodayLog(userId: number, tasks: Task[]) {
    const today = new Date().toISOString().slice(0, 10);
    const key = `logs_${userId}`;
    // 每次都直接从 localStorage 读取，保证唯一性
    let existingLogs: LogEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    let todayLogIndex = existingLogs.findIndex(log => log.date === today);
    let newLog = await generateDailyLog(userId, tasks);

    if (todayLogIndex !== -1) {
      // 覆盖当天日志内容
      newLog.id = existingLogs[todayLogIndex].id;
      existingLogs[todayLogIndex] = newLog;
    } else {
      // 只保留一条当天日志，移除所有同日旧日志
      existingLogs = existingLogs.filter(log => log.date !== today);
      existingLogs.unshift(newLog);
    }

    // 保存
    if (APIAny.saveLog) {
      await APIAny.saveLog(newLog);
    } else {
      localStorage.setItem(key, JSON.stringify(existingLogs));
    }
    // 只同步当天日志和历史日志
    logs.value = [...existingLogs];
    return newLog;
  }
  
  return {
    logs,
    loadLogs,
    generateTodayLog
  };
});