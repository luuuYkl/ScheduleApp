// src/utils/log-grouping.ts
// 日志分组和虚拟滚动辅助函数

import type { LogEntry } from "@/services/generate-log";

/** 日志分组类型 */
export interface LogGroup {
  period: 'recent' | 'thisWeek' | 'older';
  title: string;
  expanded: boolean;
  count: number;
  logs: LogEntryUI[];
}

/** 日志条目UI类型 */
export interface LogEntryUI {
  log: LogEntry;
  expanded: boolean;
  efficiencyRating: 1 | 2 | 3 | 4;
  summary: string;
  detailsHeight?: number;
}

/** 虚拟滚动项类型 */
export interface VirtualItem {
  type: 'group' | 'log';
  id: string | number;
  data: LogGroup | LogEntryUI;
}

/**
 * 获取效率评价（1-4星）
 */
export function getEfficiencyRating(log: LogEntry): 1 | 2 | 3 | 4 {
  const completionRate = log.tasks_total > 0 
    ? log.tasks_done / log.tasks_total 
    : 0;
  
  if (completionRate >= 0.9) return 4; // 优秀 ⚡⚡⚡⚡
  if (completionRate >= 0.75) return 3; // 良好 ⚡⚡⚡
  if (completionRate >= 0.5) return 2; // 一般 ⚡⚡
  return 1; // 较低 ⚡
}

/**
 * 生成日志摘要文本
 */
export function generateLogSummary(log: LogEntry): string {
  const parts: string[] = [];
  
  // 情绪
  if (log.mood) {
    const moodEmoji: Record<string, string> = {
      happy: '😊',
      calm: '😌',
      anxious: '😰',
      tired: '😴',
      focused: '🎯',
      stressed: '😫'
    };
    parts.push(moodEmoji[log.mood] || '');
  }
  
  // 亮点
  if (log.highlight) {
    parts.push(log.highlight);
  }
  
  // 内容摘要
  const content = log.content.replace(/\n/g, ' ').trim();
  if (content.length > 30) {
    parts.push(content.slice(0, 30) + '...');
  } else if (content.length > 0) {
    parts.push(content);
  }
  
  return parts.filter(Boolean).join(' ');
}

/**
 * 格式化日期显示
 */
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateStr === today.toISOString().slice(0, 10)) {
    return '今天';
  }
  if (dateStr === yesterday.toISOString().slice(0, 10)) {
    return '昨天';
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 格式化星期显示
 */
export function formatWeekdayDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
}

/**
 * 获取本周的日期范围（自然周）
 */
export function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay() || 7; // 将周日从0改为7
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10)
  };
}

/**
 * 判断日志是否应该默认展开
 */
export function shouldExpandByDefault(dateStr: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  
  return dateStr === today || dateStr === yesterday;
}

/**
 * 筛选最近30天的日志
 */
export function filterRecentLogs(logs: LogEntry[]): LogEntry[] {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  
  return logs
    .filter(log => log.date >= cutoffStr)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 按时间范围分组日志
 */
export function groupLogsByPeriod(logs: LogEntry[]): LogGroup[] {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dayBeforeYesterday = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  
  const recentDates = [today, yesterday, dayBeforeYesterday];
  const weekRange = getWeekRange();
  
  const groups: LogGroup[] = [];
  
  // 最近3天分组
  const recentLogs = logs
    .filter(log => recentDates.includes(log.date))
    .map(log => ({
      log,
      expanded: shouldExpandByDefault(log.date),
      efficiencyRating: getEfficiencyRating(log),
      summary: generateLogSummary(log),
      detailsHeight: 0
    }));
  
  if (recentLogs.length > 0) {
    groups.push({
      period: 'recent',
      title: '最近 3 天',
      expanded: true,
      count: recentLogs.length,
      logs: recentLogs
    });
  }
  
  // 本周其他日期
  const thisWeekLogs = logs
    .filter(log =>
      log.date >= weekRange.start &&
      log.date <= weekRange.end &&
      !recentDates.includes(log.date)
    )
    .map(log => ({
      log,
      expanded: false,
      efficiencyRating: getEfficiencyRating(log),
      summary: generateLogSummary(log),
      detailsHeight: 0
    }));
  
  if (thisWeekLogs.length > 0) {
    groups.push({
      period: 'thisWeek',
      title: '本周其他',
      expanded: false,
      count: thisWeekLogs.length,
      logs: thisWeekLogs
    });
  }
  
  // 更早日期
  const olderLogs = logs
    .filter(log => log.date < weekRange.start)
    .map(log => ({
      log,
      expanded: false,
      efficiencyRating: getEfficiencyRating(log),
      summary: generateLogSummary(log),
      detailsHeight: 0
    }));
  
  if (olderLogs.length > 0) {
    groups.push({
      period: 'older',
      title: '更早',
      expanded: false,
      count: olderLogs.length,
      logs: olderLogs
    });
  }
  
  return groups;
}

/**
 * 构建虚拟滚动列表
 */
export function buildVirtualList(groups: LogGroup[]): VirtualItem[] {
  const items: VirtualItem[] = [];
  
  for (const group of groups) {
    // 添加分组标题
    items.push({
      type: 'group',
      id: group.period,
      data: group
    });
    
    // 如果分组展开，添加日志项
    if (group.expanded) {
      for (const logItem of group.logs) {
        items.push({
          type: 'log',
          id: logItem.log.id,
          data: logItem
        });
      }
    }
  }
  
  return items;
}