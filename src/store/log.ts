// src/store/log.ts
// 日志状态管理 - 处理AI生成的每日任务总结日志

import { defineStore } from "pinia";
import { ref } from "vue";
import type { LogEntry } from "@/services/generate-log";
import { generateDailyLog } from "@/services/generate-log";
import type { Task, ScheduleItem } from "@/services/api.types";
import * as API from "@/services/api";

const APIAny = API as any;

/**
 * 日志 Store
 * 管理用户的每日任务日志记录
 */
export const useLogStore = defineStore("log", () => {
  // ========== 状态 ==========
  
  /** 日志列表 */
  const logs = ref<LogEntry[]>([]);
  
  // ========== 方法 ==========
  
  /**
   * 加载用户的历史日志
   * @param userId 用户ID
   * @returns 日志列表
   */
  async function loadLogs(userId: number) {
    if (APIAny.fetchLogs) {
      // 有后端接口，调用后端
      logs.value = await APIAny.fetchLogs(userId);
    } else {
      // Mock 模式：从 localStorage 读取
      const stored = localStorage.getItem(`logs_${userId}`);
      logs.value = stored ? JSON.parse(stored) : [];
    }
    return logs.value;
  }
  
  /**
   * 生成或更新今日日志
   * 每天只保留一条日志，多次调用会覆盖更新当天内容
   * @param userId 用户ID
   * @param tasks 今日任务列表
   * @param schedules 今日日程列表
   * @returns 生成的日志对象
   */
  async function generateTodayLog(userId: number, tasks: Task[], schedules: ScheduleItem[] = []) {
    const today = new Date().toISOString().slice(0, 10);
    const key = `logs_${userId}`;
    
    // 从 localStorage 读取现有日志（确保唯一性）
    let existingLogs: LogEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    const todayLogIndex = existingLogs.findIndex(log => log.date === today);
    
    // 生成新的日志内容（包含任务和日程）
    const newLog = await generateDailyLog(userId, tasks, schedules);

    if (todayLogIndex !== -1) {
      // 当天已有日志，覆盖更新（保持ID）
      newLog.id = existingLogs[todayLogIndex].id;
      existingLogs[todayLogIndex] = newLog;
    } else {
      // 新增当天日志（移除可能的同日旧记录）
      existingLogs = existingLogs.filter(log => log.date !== today);
      existingLogs.unshift(newLog); // 插入到最前面
    }

    // 保存日志
    if (APIAny.saveLog) {
      // 有后端接口，调用后端保存
      await APIAny.saveLog(newLog);
    } else {
      // Mock 模式：保存到 localStorage
      localStorage.setItem(key, JSON.stringify(existingLogs));
    }
    
    // 更新内存中的日志列表
    logs.value = [...existingLogs];
    return newLog;
  }
  
  // ========== 导出 ==========
  
  return {
    logs,
    loadLogs,
    generateTodayLog
  };
});