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
  repeatType: TaskRepeatType,
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

  // 确保所有日期都从午夜开始比较
  const normalizedEnd = new Date(end);
  normalizedEnd.setHours(0, 0, 0, 0);

  let current = new Date(start);
  current.setHours(0, 0, 0, 0); // 确保起始日期也是午夜
  const anchorDay = start.getDate(); // 固定锚点日，贯穿整个循环

  // 先添加起始日期
  dates.push(formatDate(current));

  if (repeatType === "daily") {
    current.setDate(current.getDate() + 1);
    while (current <= normalizedEnd) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + 1);
    }
  } else if (repeatType === "monthly") {
    // 使用固定锚点日的月度重复算法
    while (true) {
      // 移动到下一个月的月初，避免 setMonth 在 31 号溢出
      const year = current.getFullYear();
      let month = current.getMonth() + 1;

      // 处理年份进位
      const targetYear = month > 11 ? year + Math.floor(month / 12) : year;
      const targetMonth = month % 12;

      // 获取该月最后一天
      const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

      // 计算目标日期：取锚点日和月末的较小值
      const targetDay = Math.min(anchorDay, lastDayOfMonth);

      // 设置到目标日期
      current = new Date(targetYear, targetMonth, targetDay);
      current.setHours(0, 0, 0, 0);

      // 如果新日期超过了结束日期，则停止
      if (current > normalizedEnd) {
        break;
      }

      dates.push(formatDate(current));
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
  basePayload: CreateTaskPayload,
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
