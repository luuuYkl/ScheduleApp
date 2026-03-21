// src/services/ai-log-analysis.ts
// AI日志分析服务 - 基于历史数据生成行为分析和个性化建议

import { APP_CONFIG } from "@/config";
import type { LogEntry } from "./generate-log";

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

/**
 * 调用AI服务进行分析
 */
async function callAIForAnalysis(logs: LogEntry[]): Promise<AILogAnalysis> {
  const recentLogs = logs.slice(0, 30); // 分析最近30天的日志
  
  const prompt = `
请分析以下用户的工作日志数据，提供行为分析和优化建议：

日志数据（共${recentLogs.length}条）：
${recentLogs.map(log => `
日期: ${log.date}
完成任务: ${log.tasks_done}/${log.tasks_total}
完成日程: ${log.schedules_done}/${log.schedules_total}
内容: ${log.content}
`).join('\n')}

请以JSON格式返回分析结果，包含以下字段：
{
  "trend": {
    "direction": "up|down|stable",
    "label": "趋势标签",
    "detail": "详细说明",
    "data": [{"date": "YYYY-MM-DD", "completionRate": 0.85}]
  },
  "risk": {
    "level": "low|medium|high",
    "label": "风险等级",
    "detail": "风险说明",
    "factors": ["风险因素1", "风险因素2"]
  },
  "insights": [
    {
      "type": "pattern|warning|recommendation",
      "icon": "图标emoji",
      "title": "洞察标题",
      "content": "详细内容"
    }
  ],
  "efficiencyPeriods": ["09:00-11:00", "14:00-16:00"],
  "workPattern": "early_bird|night_owl|balanced|irregular",
  "personalizedSuggestions": [
    {
      "id": 1,
      "icon": "图标emoji",
      "title": "建议标题",
      "problem": "问题描述",
      "advice": "建议内容",
      "actionLabel": "操作按钮文字",
      "action": "reduce_tasks|reschedule_tasks|add_reminders|improve_efficiency"
    }
  ]
}

分析要点：
1. 效率趋势：基于任务完成率的变化趋势
2. 拖延风险：识别导致拖延的模式和原因
3. 行为洞察：发现工作模式、高效时段、任务偏好等
4. 高效时段：根据完成率最高的时间段
5. 工作模式：早起型、夜猫型、平衡型、不规律
6. 个性化建议：针对发现的问题提供具体可执行的建议
`;

  const response = await fetch(`${APP_CONFIG.AI_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${APP_CONFIG.AI_API_KEY}`
    },
    body: JSON.stringify({
      model: APP_CONFIG.AI_MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的时间管理和行为分析助手。请严格按照JSON格式返回分析结果，不要添加任何额外的文字说明。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })
  });

  if (!response.ok) {
    throw new Error(`AI请求失败: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('AI响应内容为空');
  }

  // 解析AI返回的JSON
  const parsed = parseAIResponse(content);
  if (parsed) {
    return parsed;
  }

  // 解析失败，使用本地分析
  return generateLocalAnalysis(logs);
}

/**
 * 解析AI响应
 */
function parseAIResponse(content: string): AILogAnalysis | null {
  try {
    // 尝试直接解析
    return JSON.parse(content);
  } catch {
    // 尝试提取JSON部分
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
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

  // 如果没有特殊建议，添加通用建议
  if (suggestions.length === 0) {
    suggestions.push({
      id: 5,
      icon: '📊',
      title: '保持良好习惯',
      problem: '当前表现良好',
      advice: '继续保持当前的工作节奏，可以尝试逐步增加任务难度或设定更高的目标',
      actionLabel: '查看详情',
      action: 'improve_efficiency'
    });
  }

  return suggestions;
}