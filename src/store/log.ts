// src/store/log.ts
// 日志状态管理 - 处理AI生成的每日任务总结日志

import { defineStore } from "pinia";
import { ref } from "vue";
import type { LogEntry } from "@/services/generate-log";
import { generateDailyLog } from "@/services/generate-log";
import type { Task, ScheduleItem } from "@/services/api.types";
import { APP_CONFIG } from "@/config";
import {
  getStorageSync,
  setStorageSync,
  STORAGE_KEYS,
} from "@/services/local-storage";

/** 获取认证 token */
function getAuthHeaders(): Record<string, string> {
  const token = getStorageSync<string>("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 日志 Store
 * 管理用户的每日任务日志记录
 */
export const useLogStore = defineStore("log", () => {
  // ========== 状态 ==========

  /** 日志列表 */
  const logs = ref<LogEntry[]>([]);

  /** 加载状态 */
  const loading = ref(false);

  // ========== 辅助方法 ==========

  /**
   * 获取用户日志的存储键
   */
  function getLogStorageKey(userId: number): string {
    return `${STORAGE_KEYS.LOGS_PREFIX}${userId}`;
  }

  // ========== 公共方法 ==========

  /**
   * 加载用户的历史日志
   * @param userId 用户ID
   * @param startDate 起始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 日志列表
   */
  async function loadLogs(userId: number, startDate?: string, endDate?: string) {
    loading.value = true;
    try {
      if (!APP_CONFIG.USE_MOCK) {
        // 后端模式：调用 /logs API
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        const qs = params.toString() ? `?${params.toString()}` : "";

        const response = await fetch(`${APP_CONFIG.API_BASE_URL}/logs${qs}`, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          logs.value = await response.json();
        } else {
          console.warn("加载日志失败，使用本地缓存");
          const key = getLogStorageKey(userId);
          logs.value = getStorageSync<LogEntry[]>(key) ?? [];
        }
      } else {
        // Mock 模式：从本地存储读取
        const key = getLogStorageKey(userId);
        logs.value = getStorageSync<LogEntry[]>(key) ?? [];
      }
      return logs.value;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取指定日期的日志
   */
  async function getLogByDate(date: string): Promise<LogEntry | null> {
    if (!APP_CONFIG.USE_MOCK) {
      try {
        const response = await fetch(`${APP_CONFIG.API_BASE_URL}/logs/${date}`, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          return await response.json();
        }
      } catch {
        // 忽略错误
      }
    }

    // 降级：从本地缓存查找
    return logs.value.find((log) => log.date === date) ?? null;
  }

  /**
   * 生成或更新今日日志
   * 每天只保留一条日志，多次调用会覆盖更新当天内容
   * @param userId 用户ID
   * @param tasks 今日任务列表
   * @param schedules 今日日程列表
   * @returns 生成的日志对象
   */
  async function generateTodayLog(
    userId: number,
    tasks: Task[],
    schedules: ScheduleItem[] = [],
  ) {
    const today = new Date().toISOString().slice(0, 10);

    // 生成新的日志内容（客户端 AI 生成）
    const newLog = await generateDailyLog(userId, tasks, schedules);

    if (!APP_CONFIG.USE_MOCK) {
      // 后端模式：调用 /logs/generate 触发服务端保存
      try {
        const response = await fetch(`${APP_CONFIG.API_BASE_URL}/logs/generate`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ date: today }),
        });

        if (response.ok) {
          const serverLog = await response.json();
          // 合并客户端 AI 生成的内容（如果服务端没有 AI 能力）
          const mergedLog = serverLog.content ? serverLog : { ...serverLog, ...newLog };
          // 更新本地列表
          const idx = logs.value.findIndex((l) => l.date === today);
          if (idx !== -1) {
            logs.value[idx] = mergedLog;
          } else {
            logs.value.unshift(mergedLog);
          }
          return mergedLog;
        }
      } catch (error) {
        console.warn("服务端日志保存失败，使用本地存储", error);
      }
    }

    // Mock 模式 / 降级：保存到本地存储
    const key = getLogStorageKey(userId);
    let existingLogs: LogEntry[] = getStorageSync<LogEntry[]>(key) ?? [];
    const todayLogIndex = existingLogs.findIndex((log) => log.date === today);

    if (todayLogIndex !== -1) {
      newLog.id = existingLogs[todayLogIndex].id;
      existingLogs[todayLogIndex] = newLog;
    } else {
      existingLogs = existingLogs.filter((log) => log.date !== today);
      existingLogs.unshift(newLog);
    }

    setStorageSync(key, existingLogs);
    logs.value = [...existingLogs];
    return newLog;
  }

  // ========== 导出 ==========

  return {
    logs,
    loading,
    loadLogs,
    getLogByDate,
    generateTodayLog,
  };
});
