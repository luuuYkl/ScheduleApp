// src/services/ai-log-analysis.ts
// AI日志分析服务 - 基于历史数据生成行为分析和个性化建议
// 已重构：使用 ai-utils 统一客户端和 JSON 解析

import { APP_CONFIG } from "@/config";
import type { LogEntry } from "./generate-log";
import {
  aiLogger,
  parseAIJSON,
  sendAIRequest,
  streamAIRequest,
  extractContentFromResponse,
  isAIAvailable,
} from "./ai-utils";

/**
 * AI日志分析结果
 */
export interface AILogAnalysis {
  /** 效率趋势 */
  trend: {
    direction: 'up' | 'down' | 'stable';
    label: string;
    detail: string;
    /** 趋势数据（最近7天的完成率） */
    data: Array<{ date: string; completionRate: number }>;
  };
  
  /** 拖延风险 */
  risk: {
    level: 'low' | 'medium' | 'high';
    label: string;
    detail: string;
    /** 风险因素 */
    factors: string[];
  };
  
  /** 行为洞察 */
  insights: Array<{
    type: 'pattern' | 'warning' | 'recommendation';
    icon: string;
    title: string;
    content: string;
  }>;
  
  /** 高效时段 */
  efficiencyPeriods: string[];
  
  /** 工作模式 */
  workPattern: 'early_bird' | 'night_owl' | 'balanced' | 'irregular';
  
  /** 个性化建议 */
  personalizedSuggestions: Array<{
    id: number;
    icon: string;
    title: string;
    problem: string;
    advice: string;
    actionLabel: string;
    action: string;
  }>;
}

/**
 * 分析用户历史日志
 * @param logs 日志列表
 * @returns AI分析结果
 */
export async function analyzeLogsWithAI(logs: LogEntry[]): Promise<AILogAnalysis> {
  // 如果日志数据不足，返回基础分析
  if (logs.length < 3) {
    return generateBasicAnalysis(logs);
  }

  // 如果启用了AI，尝试调用AI服务
  if (APP_CONFIG.AI_ENABLED && APP_CONFIG.AI_API_KEY) {
    try {
      return await callAIForAnalysis(logs);
    } catch (error) {
      console.warn('AI分析失败，使用本地分析:', error);
      return generateLocalAnalysis(logs);
    }
  }

  // 否则使用本地分析
  return generateLocalAnalysis(logs);
}

// ────────────────────────────────────────────
// 系统 Prompt（分离配置，便于维护）
// ────────────────────────────────────────────

const SYSTEM_PROMPT_LOG_ANALYSIS = `你是时间管理和行为分析助手。分析用户工作日志数据。
规则：直接输出纯JSON，禁止\`\`\`包裹，禁止额外文字。

格式：{"trend":{"direction":"up|down|stable","label":"标签","detail":"说明","data":[{"date":"YYYY-MM-DD","completionRate":0.85}]},"risk":{"level":"low|medium|high","label":"等级","detail":"说明","factors":["因素"]},"insights":[{"type":"pattern|warning|recommendation","icon":"emoji","title":"标题","content":"内容"}],"efficiencyPeriods":["09:00-11:00"],"workPattern":"early_bird|night_owl|balanced|irregular","personalizedSuggestions":[{"id":1,"icon":"emoji","title":"标题","problem":"问题","advice":"建议","actionLabel":"按钮文字","action":"reduce_tasks|reschedule_tasks|add_reminders|improve_efficiency"}]}`;

/**
 * 调用AI服务进行分析（使用统一 AI 客户端）
 */
async function callAIForAnalysis(logs: LogEntry[]): Promise<AILogAnalysis> {
  const recentLogs = logs.slice(0, 30);

  const logData = recentLogs.map(log =>
    `${log.date} 完成${log.tasks_done}/${log.tasks_total} 日程${log.schedules_done}/${log.schedules_total} ${log.content}`
  ).join('\n');

  const prompt = `分析以下${recentLogs.length}天工作日志：
${logData}
要求：评估效率趋势、拖延风险、行为洞察（含emoji图标）、高效时段、工作模式、个性化建议`;

  const payload = {
    model: APP_CONFIG.AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_LOG_ANALYSIS },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 3000,
    stream: false,
  };

  aiLogger.log("日志分析请求, 日志数量:", recentLogs.length, "Prompt 长度:", prompt.length);

  const result = await sendAIRequest(payload, {
    label: "日志分析",
    retries: 1,
    timeout: 45000,
  });

  if (!result.ok || !result.text) {
    aiLogger.error("日志分析请求失败:", result.status, result.statusText);
    throw new Error(`AI 请求失败: ${result.status} ${result.statusText}`);
  }

  const content = extractContentFromResponse(result.text);
  if (!content) {
    aiLogger.error("日志分析响应内容为空");
    throw new Error("AI 响应内容为空");
  }

  const parsed = parseAIJSON<AILogAnalysis>(content);
  if (parsed) {
    aiLogger.log("日志分析解析成功");
    return parsed;
  }

  aiLogger.error("日志分析解析失败");
  return generateLocalAnalysis(logs);
}

// ────────────────────────────────────────────
// 日志分析（流式）
// ────────────────────────────────────────────

/**
 * 流式 AI 日志分析
 */
export async function* analyzeLogsWithAIStream(
  logs: LogEntry[],
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  if (!isAIAvailable()) {
    const localResult = generateLocalAnalysis(logs);
    const jsonStr = JSON.stringify(localResult);
    for (let i = 0; i < jsonStr.length; i += 20) {
      yield jsonStr.slice(i, i + 20);
      await new Promise((r) => setTimeout(r, 20));
    }
    return;
  }

  const recentLogs = logs.slice(0, 30);
  const logData = recentLogs.map(log =>
    `${log.date} 完成${log.tasks_done}/${log.tasks_total} 日程${log.schedules_done}/${log.schedules_total} ${log.content}`
  ).join('\n');

  const prompt = `分析以下${recentLogs.length}天工作日志：
${logData}
要求：评估效率趋势、拖延风险、行为洞察（含emoji图标）、高效时段、工作模式、个性化建议`;

  const payload = {
    model: APP_CONFIG.AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_LOG_ANALYSIS },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 3000,
  };

  for await (const chunk of streamAIRequest(payload, {
    label: "日志分析-流式",
    signal,
  })) {
    yield chunk;
  }
}

/**
 * 生成本地分析（不依赖AI）
 */
function generateLocalAnalysis(logs: LogEntry[]): AILogAnalysis {
  const recentLogs = logs.slice(0, 30);
  
  // 计算趋势
  const trend = calculateTrend(recentLogs);
  
  // 计算风险
  const risk = calculateRisk(recentLogs);
  
  // 生成洞察
  const insights = generateInsights(recentLogs);
  
  // 识别高效时段
  const efficiencyPeriods = identifyEfficiencyPeriods(recentLogs);
  
  // 识别工作模式
  const workPattern = identifyWorkPattern(recentLogs);
  
  // 生成个性化建议
  const personalizedSuggestions = generatePersonalizedSuggestions(
    trend,
    risk,
    insights,
    efficiencyPeriods,
    workPattern
  );

  return {
    trend,
    risk,
    insights,
    efficiencyPeriods,
    workPattern,
    personalizedSuggestions
  };
}

/**
 * 生成基础分析（数据不足时）
 */
function generateBasicAnalysis(logs: LogEntry[]): AILogAnalysis {
  return {
    trend: {
      direction: 'stable',
      label: '数据不足',
      detail: '日志数据较少，需要至少3天的记录才能进行趋势分析',
      data: []
    },
    risk: {
      level: 'low',
      label: '低风险',
      detail: '数据不足，无法准确评估风险',
      factors: []
    },
    insights: [],
    efficiencyPeriods: ['09:00-11:00', '14:00-16:00'],
    workPattern: 'balanced',
    personalizedSuggestions: [
      {
        id: 1,
        icon: '📝',
        title: '记录每日任务',
        problem: '日志记录较少，无法提供个性化分析',
        advice: '建议每天记录任务完成情况，积累更多数据后AI可以提供更准确的分析和建议',
        actionLabel: '开始记录',
        action: 'improve_efficiency'
      }
    ]
  };
}

/**
 * 计算效率趋势
 */
function calculateTrend(logs: LogEntry[]): AILogAnalysis['trend'] {
  const completionRates = logs.map(log => ({
    date: log.date,
    completionRate: log.tasks_total > 0 ? log.tasks_done / log.tasks_total : 0
  }));

  // 按日期排序
  completionRates.sort((a, b) => a.date.localeCompare(b.date));

  // 计算最近7天的平均完成率
  const recent7Days = completionRates.slice(-7);
  const recentAvg = recent7Days.reduce((sum, item) => sum + item.completionRate, 0) / recent7Days.length;

  // 计算之前7天的平均完成率
  const previous7Days = completionRates.slice(-14, -7);
  const previousAvg = previous7Days.length > 0 
    ? previous7Days.reduce((sum, item) => sum + item.completionRate, 0) / previous7Days.length 
    : recentAvg;

  let direction: 'up' | 'down' | 'stable';
  let label: string;
  let detail: string;

  const diff = recentAvg - previousAvg;

  if (diff > 0.1) {
    direction = 'up';
    label = '上升';
    detail = `您的效率呈上升趋势，最近7天平均完成率达到${(recentAvg * 100).toFixed(1)}%，比之前提高了${(diff * 100).toFixed(1)}个百分点。继续保持！`;
  } else if (diff < -0.1) {
    direction = 'down';
    label = '下降';
    detail = `您的效率有所下降，最近7天平均完成率为${(recentAvg * 100).toFixed(1)}%，比之前下降了${Math.abs(diff * 100).toFixed(1)}个百分点。建议关注任务安排。`;
  } else {
    direction = 'stable';
    label = '稳定';
    detail = `您的效率保持稳定，最近7天平均完成率为${(recentAvg * 100).toFixed(1)}%。继续保持当前的工作节奏。`;
  }

  return {
    direction,
    label,
    detail,
    data: completionRates.slice(-14) // 返回最近14天的数据
  };
}

/**
 * 计算拖延风险
 */
function calculateRisk(logs: LogEntry[]): AILogAnalysis['risk'] {
  const recent7Days = logs.slice(0, 7);
  const avgCompletion = recent7Days.reduce((sum, log) => {
    return sum + (log.tasks_total > 0 ? log.tasks_done / log.tasks_total : 0);
  }, 0) / recent7Days.length;

  const factors: string[] = [];

  // 检查任务数量是否过多
  const avgTasks = recent7Days.reduce((sum, log) => sum + log.tasks_total, 0) / recent7Days.length;
  if (avgTasks > 10) {
    factors.push('每日任务安排过多，容易产生压力');
  }

  // 检查完成率波动
  const completionRates = recent7Days.map(log => 
    log.tasks_total > 0 ? log.tasks_done / log.tasks_total : 0
  );
  const variance = completionRates.reduce((sum, rate) => {
    return sum + Math.pow(rate - avgCompletion, 2);
  }, 0) / completionRates.length;
  
  if (variance > 0.2) {
    factors.push('完成率波动较大，可能存在执行不稳定的情况');
  }

  // 检查连续低完成率
  let lowCompletionStreak = 0;
  for (const log of recent7Days) {
    const rate = log.tasks_total > 0 ? log.tasks_done / log.tasks_total : 0;
    if (rate < 0.5) {
      lowCompletionStreak++;
    } else {
      break;
    }
  }
  if (lowCompletionStreak >= 3) {
    factors.push('连续多天完成率低于50%，可能存在疲劳或动力不足');
  }

  let level: 'low' | 'medium' | 'high';
  let label: string;
  let detail: string;

  if (avgCompletion >= 0.75 && factors.length === 0) {
    level = 'low';
    label = '低风险';
    detail = '您的拖延风险较低，能够按时完成任务，保持良好的执行力。';
  } else if (avgCompletion >= 0.5 && factors.length <= 1) {
    level = 'medium';
    label = '中等风险';
    detail = '您的拖延风险为中等，建议优化时间安排，提高执行效率。';
  } else {
    level = 'high';
    label = '高风险';
    detail = '您的拖延风险较高，建议减少任务数量，专注于核心事项，并找出导致拖延的原因。';
  }

  return {
    level,
    label,
    detail,
    factors
  };
}

/**
 * 生成行为洞察
 */
function generateInsights(logs: LogEntry[]): AILogAnalysis['insights'] {
  const insights: AILogAnalysis['insights'] = [];
  
  // 计算平均值
  const avgTasks = logs.reduce((sum, log) => sum + log.tasks_total, 0) / logs.length;
  const avgCompletion = logs.reduce((sum, log) => {
    return sum + (log.tasks_total > 0 ? log.tasks_done / log.tasks_total : 0);
  }, 0) / logs.length;

  // 洞察1：任务数量
  if (avgTasks > 8) {
    insights.push({
      type: 'warning',
      icon: '📋',
      title: '任务偏多',
      content: `您平均每天安排${avgTasks.toFixed(1)}个任务，建议控制在6-8个以内，避免任务积压`
    });
  } else if (avgTasks < 4) {
    insights.push({
      type: 'recommendation',
      icon: '📈',
      title: '可以挑战更多',
      content: `您平均每天只有${avgTasks.toFixed(1)}个任务，如果感觉轻松，可以适当增加挑战性任务`
    });
  }

  // 洞察2：完成率
  if (avgCompletion >= 0.8) {
    insights.push({
      type: 'pattern',
      icon: '🌟',
      title: '执行力强',
      content: `您的任务完成率平均达到${(avgCompletion * 100).toFixed(1)}%，表现出色！可以尝试更有挑战性的目标`
    });
  } else if (avgCompletion < 0.5) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: '完成率偏低',
      content: `您的任务完成率平均仅为${(avgCompletion * 100).toFixed(1)}%，建议检查任务设定是否合理，或找出拖延的原因`
    });
  }

  // 洞察3：周末表现
  const weekendLogs = logs.filter(log => {
    const date = new Date(log.date);
    const day = date.getDay();
    return day === 0 || day === 6;
  });
  
  if (weekendLogs.length >= 2) {
    const weekendAvg = weekendLogs.reduce((sum, log) => {
      return sum + (log.tasks_total > 0 ? log.tasks_done / log.tasks_total : 0);
    }, 0) / weekendLogs.length;

    const weekdayLogs = logs.filter(log => {
      const date = new Date(log.date);
      const day = date.getDay();
      return day >= 1 && day <= 5;
    });

    const weekdayAvg = weekdayLogs.reduce((sum, log) => {
      return sum + (log.tasks_total > 0 ? log.tasks_done / log.tasks_total : 0);
    }, 0) / weekdayLogs.length;

    if (weekendAvg > weekdayAvg + 0.2) {
      insights.push({
        type: 'pattern',
        icon: '🎯',
        title: '周末更高效',
        content: '您在周末的任务完成率明显高于工作日，可能是因为有更多整块时间专注工作'
      });
    } else if (weekdayAvg > weekendAvg + 0.2) {
      insights.push({
        type: 'pattern',
        icon: '💼',
        title: '工作日更高效',
        content: '您在工作日的任务完成率明显高于周末，可能是因为工作环境更有助于专注'
      });
    }
  }

  return insights;
}

/**
 * 识别高效时段
 */
function identifyEfficiencyPeriods(logs: LogEntry[]): string[] {
  // 由于日志中没有具体时段信息，基于常见高效时段返回默认值
  // 在实际应用中，可以从任务完成时间等数据中分析
  return ['09:00-11:00', '14:00-16:00'];
}

/**
 * 识别工作模式
 */
function identifyWorkPattern(logs: LogEntry[]): 'early_bird' | 'night_owl' | 'balanced' | 'irregular' {
  // 由于日志中没有具体时段信息，默认返回平衡型
  // 在实际应用中，可以根据任务开始时间分析
  return 'balanced';
}

/**
 * 生成个性化建议
 */
function generatePersonalizedSuggestions(
  trend: AILogAnalysis['trend'],
  risk: AILogAnalysis['risk'],
  insights: AILogAnalysis['insights'],
  efficiencyPeriods: string[],
  workPattern: string
): AILogAnalysis['personalizedSuggestions'] {
  const suggestions: AILogAnalysis['personalizedSuggestions'] = [];

  // 基于风险等级生成建议
  if (risk.level === 'high') {
    suggestions.push({
      id: 1,
      icon: '📋',
      title: '优化任务数量',
      problem: risk.detail,
      advice: '建议将每日任务数量减少到6-8个，优先完成核心任务，其他任务可以推迟或取消',
      actionLabel: '一键优化',
      action: 'reduce_tasks'
    });
  }

  // 基于趋势生成建议
  if (trend.direction === 'down') {
    suggestions.push({
      id: 2,
      icon: '⏰',
      title: '调整任务时间',
      problem: trend.detail,
      advice: `建议将重要任务安排在高效时段（${efficiencyPeriods.join('、')}），利用精力最好的时间处理核心工作`,
      actionLabel: '重新安排',
      action: 'reschedule_tasks'
    });
  }

  // 添加休息提醒建议
  if (insights.some(i => i.type === 'warning' && i.icon === '📋')) {
    suggestions.push({
      id: 3,
      icon: '☕',
      title: '增加休息提醒',
      problem: '长时间连续工作可能导致效率下降',
      advice: '建议每工作2小时休息10-15分钟，通过设置提醒来保持良好的工作节奏',
      actionLabel: '设置提醒',
      action: 'add_reminders'
    });
  }

  // 基于洞察生成建议
  const lowCompletionInsight = insights.find(i => 
    i.type === 'warning' && i.title === '完成率偏低'
  );
  if (lowCompletionInsight) {
    suggestions.push({
      id: 4,
      icon: '🎯',
      title: '提升效率',
      problem: lowCompletionInsight.content,
      advice: '建议使用番茄工作法（25分钟专注+5分钟休息），将大任务拆分为小任务，逐步提高完成率',
      actionLabel: '查看方法',
      action: 'improve_efficiency'
    });
  }

  // 如果没有特殊建议，不添加无意义的兜底建议
  // 让 UI 层根据真实任务数据决定是否显示建议

  return suggestions;
}