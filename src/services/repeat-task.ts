// src/services/repeat-task.ts
// 重复任务生成工具

import type { Task, CreateTaskPayload, TaskRepeatType } from "./api.types";

/**
 * 根据重复规则生成任务日期列表
 * @param startDate 开始日期 YYYY-MM-DD
 * @param endDate 结束日期 YYYY-MM-DD
 * @param repeatType 重复类型
 * @returns 日期字符串数组
 */
export function generateRepeatDates(
  startDate: string,
  endDate: string,
  repeatType: TaskRepeatType
): string[] {
  if (repeatType === "none") {
    return [startDate];
  }

  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 确保结束日期不早于开始日期
  if (end < start) {
    return [startDate];
  }

  let current = new Date(start);

  while (current <= end) {
    dates.push(formatDate(current));

    if (repeatType === "daily") {
      current.setDate(current.getDate() + 1);
    } else if (repeatType === "monthly") {
      current.setMonth(current.getMonth() + 1);
    } else {
      break;
    }
  }

  return dates;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 根据创建参数生成重复任务的 payload 数组
 * @param basePayload 基础任务创建参数
 * @returns CreateTaskPayload 数组
 */
export function generateRepeatTaskPayloads(
  basePayload: CreateTaskPayload
): CreateTaskPayload[] {
  const { repeat_type, repeat_end_date, task_date } = basePayload;

  // 如果没有重复或缺少结束日期，返回单个任务
  if (!repeat_type || repeat_type === "none" || !repeat_end_date) {
    return [basePayload];
  }

  const dates = generateRepeatDates(task_date, repeat_end_date, repeat_type);

  // 为每个日期创建一个任务 payload
  return dates.map((date) => ({
    ...basePayload,
    task_date: date,
  }));
}
