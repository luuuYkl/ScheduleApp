// src/utils/test-helpers.ts
// 测试辅助工具函数

/**
 * 创建相对时间窗口用于测试
 * @param daysFromToday 距离今天的天数（负数表示过去，正数表示未来）
 * @returns ISO格式的日期字符串
 */
export function getDateRelativeToToday(daysFromToday: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
}

/**
 * 创建测试用的计划数据模板
 * @param options 配置选项
 */
export function createTestPlan(options: {
  userId?: number;
  title?: string;
  startDateOffset?: number; // 距离今天的天数
  endDateOffset?: number;   // 距离开始日期的天数
  frequency?: 'daily' | 'weekly' | 'monthly';
} = {}) {
  const {
    userId = 1,
    title = '测试计划',
    startDateOffset = 0,
    endDateOffset = 30,
    frequency = 'daily'
  } = options;

  const startDate = getDateRelativeToToday(startDateOffset);
  const endDate = getDateRelativeToToday(startDateOffset + endDateOffset);

  return {
    user_id: userId,
    title,
    start_date: startDate,
    end_date: endDate,
    frequency
  };
}

/**
 * 创建测试用的任务数据模板
 * @param options 配置选项
 */
export function createTestTask(options: {
  planId?: number;
  userId?: number;
  title?: string;
  dateOffset?: number; // 距离今天的天数
} = {}) {
  const {
    planId = 1,
    userId = 1,
    title = '测试任务',
    dateOffset = 0
  } = options;

  const taskDate = getDateRelativeToToday(dateOffset);

  return {
    plan_id: planId,
    user_id: userId,
    title,
    task_date: taskDate
  };
}

/**
 * 创建测试用的日期范围
 * @param startOffset 开始日期距离今天的天数
 * @param endOffset 结束日期距离今天的天数
 */
export function createDateRange(startOffset: number, endOffset: number) {
  return {
    start: getDateRelativeToToday(startOffset),
    end: getDateRelativeToToday(endOffset)
  };
}