<template>
  <PageScaffold 
    title="日志记录" 
    subtitle="查看历史日志和AI智能分析"
    class="layer-context"
  >
    <template #actions>
      <div class="desktop-actions">
        <a-button type="outline" size="small" @click="exportLogs">
          <template #icon>📥</template>
          导出
        </a-button>
        <a-button type="primary" size="small" @click="generateReport">
          <template #icon>📊</template>
          生成报告
        </a-button>
      </div>
      <div class="mobile-actions">
        <a-button type="primary" size="small" @click="generateReport">
          <template #icon>📊</template>
          报告
        </a-button>
      </div>
    </template>

    <PullToRefresh @refresh="handleRefresh">
      <div class="log-content">
        <!-- 第一部分：今日概览 -->
        <section class="today-overview">
          <div class="overview-cards">
            <!-- 效率评分 -->
            <div class="overview-card efficiency">
              <div class="card-icon">⚡</div>
              <div class="card-content">
                <span class="card-value">{{ todayStats.efficiencyScore }}</span>
                <span class="card-label">效率评分</span>
              </div>
              <div class="card-trend" :class="todayStats.efficiencyTrend">
                {{ todayStats.efficiencyTrend === 'up' ? '↗' : todayStats.efficiencyTrend === 'down' ? '↘' : '→' }}
              </div>
            </div>
            
            <!-- 完成任务 -->
            <div class="overview-card tasks">
              <div class="card-icon">✅</div>
              <div class="card-content">
                <span class="card-value">{{ todayStats.completedTasks }}/{{ todayStats.totalTasks }}</span>
                <span class="card-label">完成任务</span>
              </div>
            </div>
            
            <!-- 拖延风险 -->
            <div class="overview-card risk" :class="todayStats.procrastinationRisk">
              <div class="card-icon">⚠️</div>
              <div class="card-content">
                <span class="card-value">{{ todayStats.procrastinationRiskLabel }}</span>
                <span class="card-label">拖延风险</span>
              </div>
            </div>
            
            <!-- AI建议 -->
            <div class="overview-card suggestions">
              <div class="card-icon">💡</div>
              <div class="card-content">
                <span class="card-value">{{ aiSuggestionsCount }}</span>
                <span class="card-label">AI建议</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 第二部分：日志记录区域（分组+虚拟滚动） -->
        <section class="log-records-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="title-icon">📋</span>
              日志记录
            </h3>
            <div class="section-actions">
              <div class="group-indicator" v-if="logGroups.length > 1">
                <span class="group-badge" v-for="group in logGroups.slice(0, 3)" :key="group.period">
                  {{ group.title }}
                </span>
                <span class="group-more" v-if="logGroups.length > 3">
                  +{{ logGroups.length - 3 }}
                </span>
              </div>
              <span class="record-count">{{ filteredLogs.length }} 条记录</span>
              <a-button 
                v-if="filteredLogs.length > 0"
                type="text" 
                size="small"
                @click="toggleExpandAllGroups"
              >
                {{ allGroupsExpanded ? '收起全部' : '展开全部' }}
              </a-button>
            </div>
          </div>
          
          <div class="log-records-content">
            <!-- 加载状态 -->
            <div v-if="loading && filteredLogs.length === 0" class="loading-state">
              <div class="loading-spinner">
                <svg class="animate-spin" width="40" height="40" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25"/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
              <p>加载中...</p>
            </div>
            
            <!-- 虚拟滚动日志列表 -->
            <div v-else-if="filteredLogs.length > 0" class="virtual-scroll-container">
              <div 
                ref="virtualContainerRef"
                class="virtual-scroll-wrapper"
              >
                <div 
                  class="virtual-scroll-content"
                  :style="{ height: `${virtualTotalHeight}px` }"
                >
                  <div 
                    v-for="item in virtualVisibleItems"
                    :key="item.id"
                    class="virtual-item"
                    :style="{ 
                      transform: `translateY(${getVirtualItemOffset(item)}px)` 
                    }"
                  >
                    <!-- 分组标题 -->
                    <LogGroupSection
                      v-if="item.type === 'group'"
                      :group="{ ...(item.data as any), expanded: groupExpandedStates[(item.data as any).period] ?? false }"
                      @toggle-group="toggleGroup((item.data as any).period)"
                      @toggle-log="toggleLogInGroup($event, item.data)"
                      @height-change="handleHeightChange"
                    >
                      <!-- 该分组下的日志卡片 -->
                      <LogCard
                        v-for="logItem in (item.data as any).logs"
                        :key="logItem.log.id"
                        :log="logItem.log"
                        :expanded="logExpandedStates[logItem.log.id] ?? false"
                        :efficiency-rating="logItem.efficiencyRating"
                        :summary="logItem.summary"
                        :tasks="getTasksForDate(logItem.log.date)"
                        @toggle="toggleLog(logItem)"
                        @height-change="handleHeightChange"
                      />
                    </LogGroupSection>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 无日志：紧凑提示 -->
            <div v-else class="empty-hint">
              <span class="hint-text">暂无日志记录，完成任务后将自动生成 📝</span>
            </div>
          </div>
        </section>

        <!-- 第三部分：AI 行为分析（可折叠） -->
        <section class="ai-analysis-section">
          <div class="section-header clickable" @click="analysisExpanded = !analysisExpanded">
            <h3 class="section-title">
              <span class="title-icon">🧠</span>
              AI 行为分析
            </h3>
            <div class="section-summary">
              <span class="summary-item">
                <span class="summary-label">效率趋势</span>
                <span class="summary-value" :class="analysisData.trend">{{ analysisData.trendLabel }}</span>
              </span>
              <span class="summary-item">
                <span class="summary-label">拖延风险</span>
                <span class="summary-value" :class="analysisData.riskLevel">{{ analysisData.riskLabel }}</span>
              </span>
              <span class="summary-item">
                <span class="summary-label">洞察</span>
                <span class="summary-value">{{ analysisData.insightsCount }}条</span>
              </span>
              <span class="expand-icon" :class="{ expanded: analysisExpanded }">▼</span>
            </div>
          </div>
          
          <div class="section-content" v-show="analysisExpanded">
            <div class="analysis-details">
              <!-- 效率趋势说明 -->
              <div class="analysis-item">
                <div class="item-header">
                  <span class="item-icon">📈</span>
                  <span class="item-title">效率趋势</span>
                </div>
                <p class="item-content">{{ analysisData.trendDetail }}</p>
              </div>
              
              <!-- 拖延风险提示 -->
              <div class="analysis-item">
                <div class="item-header">
                  <span class="item-icon">⚠️</span>
                  <span class="item-title">拖延风险</span>
                </div>
                <p class="item-content">{{ analysisData.riskDetail }}</p>
              </div>
              
              <!-- 行为洞察列表 -->
              <div class="analysis-item" v-if="analysisData.insights.length > 0">
                <div class="item-header">
                  <span class="item-icon">💡</span>
                  <span class="item-title">行为洞察</span>
                </div>
                <ul class="insights-list">
                  <li v-for="(insight, idx) in analysisData.insights" :key="idx">
                    {{ insight }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- 第四部分：AI 行动建议（可折叠列表） -->
        <section class="ai-suggestions-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="title-icon">💡</span>
              AI 行动建议
            </h3>
            <span class="suggestions-count">{{ aiSuggestions.length }} 条建议</span>
          </div>
          
          <div class="suggestions-list">
            <div 
              v-for="suggestion in aiSuggestions" 
              :key="suggestion.id"
              class="suggestion-item"
            >
              <div class="suggestion-header" @click="toggleSuggestion(suggestion.id)">
                <div class="suggestion-main">
                  <span class="suggestion-icon">{{ suggestion.icon }}</span>
                  <span class="suggestion-title">{{ suggestion.title }}</span>
                </div>
                <div class="suggestion-actions">
                  <a-button 
                    type="primary" 
                    size="mini"
                    :loading="optimizing && optimizingSuggestionId === suggestion.id"
                    :disabled="optimizing"
                    @click.stop="executeAction(suggestion)"
                  >
                    {{ suggestion.actionLabel }}
                  </a-button>
                  <span class="expand-icon" :class="{ expanded: suggestionExpandedStates[suggestion.id] }">▼</span>
                </div>
              </div>
              <div class="suggestion-detail" v-show="suggestionExpandedStates[suggestion.id]">
                <div class="detail-problem">
                  <label>问题</label>
                  <p>{{ suggestion.problem }}</p>
                </div>
                <div class="detail-advice">
                  <label>建议</label>
                  <p>{{ suggestion.advice }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PullToRefresh>

    <!-- 确认对话框 -->
    <a-modal
      v-model:visible="showConfirmModal"
      :title="confirmTitle"
      :mask-closable="false"
      :esc-to-close="true"
      @cancel="cancelConfirm"
      :footer="false"
      class="confirm-modal"
    >
      <div class="confirm-content">
        <p class="confirm-summary">{{ confirmSummary }}</p>
        
        <div class="confirm-changes" v-if="confirmChanges.length > 0">
          <div class="changes-header">变更明细：</div>
          <div class="changes-list">
            <div 
              v-for="(change, idx) in confirmChanges" 
              :key="idx"
              class="change-item"
            >
              <span class="change-name">{{ change.taskName }}</span>
              <span class="change-type" :class="change.changeType === '推迟' ? 'postpone' : change.changeType === '移除' ? 'remove' : 'reschedule'">{{ change.changeType }}</span>
              <span class="change-detail">{{ change.detail }}</span>
            </div>
          </div>
        </div>
        
        <div class="confirm-actions">
          <a-button @click="cancelConfirm">取消</a-button>
          <a-button 
            type="primary" 
            :loading="optimizing"
            @click="confirmExecute"
          >
            确认执行
          </a-button>
        </div>
      </div>
    </a-modal>
  </PageScaffold>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useLogStore } from "@/store/log";
import { useUserStore } from "@/store/user";
import { useTaskStore } from "@/store/tasks";
import type { LogEntry } from "@/services/generate-log";
import type { AILogAnalysis } from "@/services/ai-log-analysis";
import { analyzeLogsWithAI } from "@/services/ai-log-analysis";
import { 
  optimizeTaskQuantity as optimizeTaskQuantityFn, 
  rescheduleTasksByEfficiency, 
  addRestReminders 
} from "@/services/task-optimizer";
import { API } from "@/services/api";
import PageScaffold from "@/components/common/PageScaffold.vue";
import PullToRefresh from "@/components/common/PullToRefresh.vue";
import { Message } from "@arco-design/web-vue";
import LogGroupSection from "@/components/log/LogGroupSection.vue";
import LogCard from "@/components/log/LogCard.vue";
import { 
  filterRecentLogs, 
  groupLogsByPeriod 
} from "@/utils/log-grouping";
import { useVirtualScroll } from "@/composables/useVirtualScroll";

const router = useRouter();
const logStore = useLogStore();
const userStore = useUserStore();
const taskStore = useTaskStore();

const logs = computed(() => logStore.logs);
const loading = ref(false);
const showAllLogs = ref(false);
const analysisExpanded = ref(false);
const aiAnalysis = ref<AILogAnalysis | null>(null);
const loadingAnalysis = ref(false);
const optimizing = ref(false);
const optimizingSuggestionId = ref<number | null>(null);

// 建议展开状态（独立管理，避免 computed 每次重置）
const suggestionExpandedStates = ref<Record<number, boolean>>({});

function toggleSuggestion(id: number) {
  suggestionExpandedStates.value[id] = !suggestionExpandedStates.value[id];
}

// 确认对话框状态
const showConfirmModal = ref(false);
const confirmTitle = ref('');
const confirmSummary = ref('');
const confirmChanges = ref<Array<{ taskName: string; changeType: string; detail: string }>>([]);
const pendingActionFn = ref<(() => Promise<void>) | null>(null);

function cancelConfirm() {
  showConfirmModal.value = false;
  confirmTitle.value = '';
  confirmSummary.value = '';
  confirmChanges.value = [];
  pendingActionFn.value = null;
}

async function confirmExecute() {
  if (pendingActionFn.value) {
    showConfirmModal.value = false;
    optimizing.value = true;
    try {
      await pendingActionFn.value();
    } catch (error) {
      console.error('执行确认操作失败:', error);
      Message.error('操作失败，请稍后重试');
    } finally {
      optimizing.value = false;
      optimizingSuggestionId.value = null;
      pendingActionFn.value = null;
    }
  }
}

// 日志分组
const logGroups = computed(() => {
  const filtered = filterRecentLogs(logs.value);
  return groupLogsByPeriod(filtered);
});

// 响应式展开状态管理
const groupExpandedStates = ref<Record<string, boolean>>({});
const logExpandedStates = ref<Record<number, boolean>>({});

// 使用虚拟滚动 composable
const {
  containerRef: virtualContainerRef,
  virtualList,
  totalHeight: virtualTotalHeight,
  visibleItems: virtualVisibleItems,
  getItemOffset: getVirtualItemOffset,
  updateItemHeight: updateVirtualLogHeight,
  clearItemHeightCache
} = useVirtualScroll(() => {
  // 根据展开状态过滤分组
  return logGroups.value.map(group => ({
    ...group,
    expanded: groupExpandedStates.value[group.period] ?? false,
    logs: group.logs.map(logItem => ({
      ...logItem,
      expanded: logExpandedStates.value[logItem.log.id] ?? false
    }))
  }));
});

const allGroupsExpanded = computed(() => 
  Object.values(groupExpandedStates.value).every(expanded => expanded)
);

// 初始化展开状态
function initializeExpandedStates() {
  const newGroupStates: Record<string, boolean> = {};
  const newLogStates: Record<number, boolean> = {};
  
  for (const group of logGroups.value) {
    newGroupStates[group.period] = group.expanded;
    for (const logItem of group.logs) {
      newLogStates[logItem.log.id] = logItem.expanded;
    }
  }
  
  groupExpandedStates.value = newGroupStates;
  logExpandedStates.value = newLogStates;
}

// 分组控制方法
function toggleGroup(period: string) {
  groupExpandedStates.value[period] = !groupExpandedStates.value[period];
}

function toggleLogInGroup(logItem: any, group: any) {
  const newState = !logExpandedStates.value[logItem.log.id];
  logExpandedStates.value[logItem.log.id] = newState;
  // 清除高度缓存，强制重新计算
  clearItemHeightCache(logItem.log.id);
}

function toggleLog(logItem: any) {
  const newState = !logExpandedStates.value[logItem.log.id];
  logExpandedStates.value[logItem.log.id] = newState;
  // 清除高度缓存，强制重新计算
  clearItemHeightCache(logItem.log.id);
}

function handleHeightChange(data: { type: 'group' | 'log', id: string | number, height: number }) {
  updateVirtualLogHeight(data.id, data.height);
}

function toggleExpandAllGroups() {
  const expand = !allGroupsExpanded.value;
  for (const group of logGroups.value) {
    groupExpandedStates.value[group.period] = expand;
  }
}

// 获取日期的任务列表
function getTasksForDate(dateStr: string): any[] {
  return taskStore.tasks.filter(task => task.start_date === dateStr);
}

// 今日统计数据
const todayStats = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.value.filter(log => log.date === today);
  
  const totalTasks = todayLogs.reduce((sum, log) => sum + log.tasks_total, 0);
  const completedTasks = todayLogs.reduce((sum, log) => sum + log.tasks_done, 0);
  const efficiencyScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // 计算拖延风险
  let procrastinationRisk = 'low';
  let procrastinationRiskLabel = '低';
  if (efficiencyScore < 50) {
    procrastinationRisk = 'high';
    procrastinationRiskLabel = '高';
  } else if (efficiencyScore < 75) {
    procrastinationRisk = 'medium';
    procrastinationRiskLabel = '中';
  }
  
  // 计算趋势（简化：基于最近数据）
  const trend = efficiencyScore >= 70 ? 'up' : efficiencyScore >= 50 ? 'stable' : 'down';
  
  return {
    efficiencyScore,
    completedTasks,
    totalTasks,
    procrastinationRisk,
    procrastinationRiskLabel,
    efficiencyTrend: trend
  };
});

// 筛选后的日志（最近30天）
const filteredLogs = computed(() => {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  return logs.value.filter(log => log.date >= cutoffStr).sort((a, b) => b.date.localeCompare(a.date));
});

// 最近日志（默认显示5条）
const recentLogs = computed(() => {
  return showAllLogs.value ? filteredLogs.value : filteredLogs.value.slice(0, 5);
});

// AI 建议数量
const aiSuggestionsCount = computed(() => aiSuggestions.value.length);

// AI 行为分析数据（使用真实AI分析）
const analysisData = computed(() => {
  if (aiAnalysis.value) {
    return {
      trend: aiAnalysis.value.trend.direction,
      trendLabel: aiAnalysis.value.trend.label,
      trendDetail: aiAnalysis.value.trend.detail,
      riskLevel: aiAnalysis.value.risk.level,
      riskLabel: aiAnalysis.value.risk.label,
      riskDetail: aiAnalysis.value.risk.detail,
      insights: aiAnalysis.value.insights.map(i => i.content),
      insightsCount: aiAnalysis.value.insights.length
    };
  }
  
  // 降级到本地分析
  const totalTasks = filteredLogs.value.reduce((sum, log) => sum + log.tasks_total, 0);
  const doneTasks = filteredLogs.value.reduce((sum, log) => sum + log.tasks_done, 0);
  const avgCompletion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  
  let trend = 'stable';
  let trendLabel = '稳定';
  let trendDetail = '您的效率保持稳定，继续保持当前的工作节奏。';
  
  if (avgCompletion >= 75) {
    trend = 'up';
    trendLabel = '上升';
    trendDetail = `您的效率呈上升趋势，任务完成率达到 ${avgCompletion}%，表现优秀！`;
  } else if (avgCompletion < 50) {
    trend = 'down';
    trendLabel = '下降';
    trendDetail = `您的效率有所下降，任务完成率仅 ${avgCompletion}%，需要关注。`;
  }
  
  let riskLevel = 'low';
  let riskLabel = '低';
  let riskDetail = '您的拖延风险较低，能够按时完成任务。';
  
  if (avgCompletion < 50) {
    riskLevel = 'high';
    riskLabel = '高';
    riskDetail = '您的拖延风险较高，建议减少任务数量，专注于核心事项。';
  } else if (avgCompletion < 75) {
    riskLevel = 'medium';
    riskLabel = '中';
    riskDetail = '您的拖延风险为中等，建议优化时间安排，提高执行效率。';
  }
  
  const insights: string[] = [];
  if (filteredLogs.value.length >= 3) {
    const avgTasksPerDay = totalTasks / filteredLogs.value.length;
    if (avgTasksPerDay > 8) {
      insights.push('每日任务安排偏多，建议控制在6-8项以内');
    }
    if (avgCompletion < 60) {
      insights.push('任务完成率偏低，可能存在目标设定过高的问题');
    }
    if (avgCompletion >= 80) {
      insights.push('任务完成率良好，可以尝试挑战更高目标');
    }
  }
  
  return {
    trend,
    trendLabel,
    trendDetail,
    riskLevel,
    riskLabel,
    riskDetail,
    insights,
    insightsCount: insights.length
  };
});

// AI 行动建议（使用真实AI分析结果）
const aiSuggestions = computed(() => {
  if (aiAnalysis.value && aiAnalysis.value.personalizedSuggestions.length > 0) {
    return aiAnalysis.value.personalizedSuggestions.map(s => ({
      id: s.id,
      icon: s.icon,
      title: s.title,
      problem: s.problem,
      advice: s.advice,
      actionLabel: s.actionLabel,
      action: s.action
    }));
  }
  
  // 降级到本地建议
  const suggestions: Array<{
    id: number;
    icon: string;
    title: string;
    problem: string;
    advice: string;
    actionLabel: string;
    action: string;
  }> = [];
  
  const totalTasks = filteredLogs.value.reduce((sum, log) => sum + log.tasks_total, 0);
  const doneTasks = filteredLogs.value.reduce((sum, log) => sum + log.tasks_done, 0);
  const avgCompletion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  
  if (avgCompletion < 70) {
    suggestions.push({
      id: 1,
      icon: '📋',
      title: '优化任务数量',
      problem: '近期任务完成率低于70%，存在任务积压风险',
      advice: '建议明天减少2-3项非紧急任务，集中精力处理核心事项',
      actionLabel: '一键优化',
      action: 'reduce_tasks'
    });
  }
  
  suggestions.push({
    id: 2,
    icon: '⏰',
    title: '调整任务时间',
    problem: '检测到上午时段效率较高',
    advice: '建议将重要任务安排在上午，下午处理简单事务',
    actionLabel: '重新安排',
    action: 'reschedule_tasks'
  });
  
  if (filteredLogs.value.length >= 3) {
    suggestions.push({
      id: 3,
      icon: '☕',
      title: '增加休息提醒',
      problem: '长时间连续工作可能导致效率下降',
      advice: '建议每工作2小时休息10-15分钟',
      actionLabel: '设置提醒',
      action: 'add_reminders'
    });
  }
  
  return suggestions;
});

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().slice(0, 10)) {
    return "今天";
  } else if (dateStr === yesterday.toISOString().slice(0, 10)) {
    return "昨天";
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 格式化星期
function formatWeekday(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
}

// 截断内容
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

// 获取完成度样式类
function getCompletionClass(log: LogEntry): string {
  const completion = log.tasks_total > 0 ? (log.tasks_done / log.tasks_total) * 100 : 0;
  if (completion >= 80) return "high";
  if (completion >= 50) return "medium";
  return "low";
}

// 获取日志偏差类型
function getLogDeviationTypes(log: LogEntry): Array<{key: string; label: string}> {
  const types: Array<{key: string; label: string}> = [];
  const completionRate = log.tasks_total > 0 ? log.tasks_done / log.tasks_total : 0;
  
  if (completionRate < 0.5 && log.tasks_total > 0) {
    types.push({ key: 'procrastination', label: '拖延' });
  }
  if (log.tasks_total > 8) {
    types.push({ key: 'overcommitment', label: '过度' });
  }
  return types;
}

// 执行AI建议（需要确认的操作先展示预览）
async function executeAction(suggestion: any) {
  const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
  
  // 确保有任务数据
  await taskStore.loadTasks();
  
  switch (suggestion.action) {
    case 'reduce_tasks':
      await previewReduceTasks(userId, suggestion);
      break;
    case 'reschedule_tasks':
      await previewRescheduleTasks(userId, suggestion);
      break;
    case 'add_reminders':
      optimizing.value = true;
      optimizingSuggestionId.value = suggestion.id;
      try {
        await addRestRemindersForTasks(userId);
      } catch (error) {
        console.error('执行建议失败:', error);
        Message.error('操作失败，请稍后重试');
      } finally {
        optimizing.value = false;
        optimizingSuggestionId.value = null;
      }
      break;
    case 'improve_efficiency':
      analysisExpanded.value = true;
      suggestionExpandedStates.value[suggestion.id] = true;
      Message.success('已展开AI行为分析，请查看详细效率提升建议');
      break;
    default:
      Message.warning('功能开发中...');
  }
}

// 预览任务数量优化
async function previewReduceTasks(userId: number, suggestion: any) {
  const result = await optimizeTaskQuantityFn(taskStore.tasks);
  
  // 找出发生变化的任务
  const changes: Array<{ taskName: string; changeType: string; detail: string }> = [];
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  
  for (const original of taskStore.tasks) {
    if (original.start_date <= tomorrowStr && original.end_date >= tomorrowStr && original.status !== 'done') {
      const optimized = result.optimized.find(t => t.id === original.id);
      if (!optimized) {
        changes.push({
          taskName: original.title,
          changeType: '移除',
          detail: '低优先级重复任务已移除'
        });
      } else if (optimized.start_date !== original.start_date) {
        changes.push({
          taskName: original.title,
          changeType: '推迟',
          detail: `${original.start_date} → ${optimized.start_date}`
        });
      }
    }
  }
  
  if (changes.length === 0) {
    Message.info(result.message);
    return;
  }
  
  confirmTitle.value = '📋 确认优化任务数量';
  confirmSummary.value = result.message;
  confirmChanges.value = changes;
  optimizingSuggestionId.value = suggestion.id;
  pendingActionFn.value = async () => {
    for (const task of result.optimized) {
      await taskStore.updateTask(task.id, {
        start_date: task.start_date,
        end_date: task.end_date
      });
    }
    Message.success(result.message);
    await refreshData(userId);
  };
  showConfirmModal.value = true;
}

// 预览任务时间调整
async function previewRescheduleTasks(userId: number, suggestion: any) {
  const efficiencyPeriods = aiAnalysis.value?.efficiencyPeriods || ['09:00-11:00', '14:00-16:00'];
  const result = await rescheduleTasksByEfficiency(taskStore.tasks, efficiencyPeriods);
  
  // 找出时间发生变化的任务
  const changes: Array<{ taskName: string; changeType: string; detail: string }> = [];
  
  for (const original of taskStore.tasks) {
    if (original.start_time && original.end_time) {
      const optimized = result.optimized.find(t => t.id === original.id);
      if (optimized && optimized.start_time && optimized.end_time && 
          (optimized.start_time !== original.start_time || optimized.end_time !== original.end_time)) {
        changes.push({
          taskName: original.title,
          changeType: '调整时间',
          detail: `${original.start_time}-${original.end_time} → ${optimized.start_time}-${optimized.end_time}`
        });
      }
    }
  }
  
  if (changes.length === 0) {
    Message.info(result.message);
    return;
  }
  
  confirmTitle.value = '⏰ 确认调整任务时间';
  confirmSummary.value = result.message;
  confirmChanges.value = changes;
  optimizingSuggestionId.value = suggestion.id;
  pendingActionFn.value = async () => {
    for (const task of result.optimized) {
      if (task.start_time && task.end_time) {
        await taskStore.updateTask(task.id, {
          start_time: task.start_time,
          end_time: task.end_time
        });
      }
    }
    Message.success(result.message);
    await refreshData(userId);
  };
  showConfirmModal.value = true;
}

// 添加休息提醒
async function addRestRemindersForTasks(userId: number) {
  const result = await addRestReminders(taskStore.tasks);
  
  if (result.added > 0) {
    // 创建日程提醒（如果API支持）
    for (const schedule of result.schedules) {
      try {
        await API.createSchedule(schedule);
      } catch (error) {
        console.warn('创建日程失败:', error);
      }
    }
    
    Message.success(result.message);
  } else {
    Message.info(result.message);
  }
}

// 刷新数据
async function refreshData(userId: number) {
  await logStore.loadLogs(userId);
  await taskStore.loadTasks();
}

// 执行AI分析
async function performAIAnalysis() {
  if (filteredLogs.value.length < 3) {
    Message.warning('需要至少3天的日志记录才能进行AI分析');
    return;
  }
  
  loadingAnalysis.value = true;
  try {
    const analysis = await analyzeLogsWithAI(filteredLogs.value);
    aiAnalysis.value = analysis;
    Message.success('AI分析完成');
  } catch (error) {
    console.error('AI分析失败:', error);
    Message.warning('AI分析失败，使用本地分析');
  } finally {
    loadingAnalysis.value = false;
  }
}

// 导航函数
function goToHome() {
  router.push('/home');
}

function goToCreateTask() {
  router.push('/task/create');
}

// 导出日志
function exportLogs() {
  const data = filteredLogs.value.map(log => ({
    日期: log.date,
    内容: log.content,
    完成任务: log.tasks_done,
    总任务: log.tasks_total,
    情绪: log.mood || '-',
    工作时长: log.work_hours ? `${log.work_hours}小时` : '-',
    亮点: log.highlight || '-',
    高效时段: log.efficiency_periods?.join(', ') || '-'
  }));
  
  const csv = [
    Object.keys(data[0] || {}).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `日志记录_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  
  Message.success('日志已导出');
}

// 生成报告
function generateReport() {
  if (!aiAnalysis.value) {
    Message.warning('请先进行AI分析');
    return;
  }
  
  const report = `
# 行为分析报告
生成时间：${new Date().toLocaleString()}

## 效率趋势
${aiAnalysis.value.trend.label} - ${aiAnalysis.value.trend.detail}

## 拖延风险
${aiAnalysis.value.risk.label} - ${aiAnalysis.value.risk.detail}

## 行为洞察
${aiAnalysis.value.insights.map(i => `- ${i.title}: ${i.content}`).join('\n')}

## 高效时段
${aiAnalysis.value.efficiencyPeriods.join('、')}

## 个性化建议
${aiAnalysis.value.personalizedSuggestions.map(s => `- ${s.title}: ${s.advice}`).join('\n')}
  `;
  
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `行为分析报告_${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  
  Message.success('报告已生成');
}

// 下拉刷新
async function handleRefresh() {
  const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
  await logStore.loadLogs(userId);
  await taskStore.loadTasks();
  
  // 刷新后自动执行AI分析
  if (filteredLogs.value.length >= 3) {
    await performAIAnalysis();
  }
}

// 监听日志分组变化，自动初始化展开状态
watch(
  () => logGroups.value,
  () => {
    initializeExpandedStates();
  },
  { immediate: true, deep: true }
);

onMounted(async () => {
  loading.value = true;
  try {
    const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
    await logStore.loadLogs(userId);
    await taskStore.loadTasks();
    
    // 如果有足够的日志数据，自动执行AI分析
    if (filteredLogs.value.length >= 3) {
      await performAIAnalysis();
    }
  } catch (e) {
    console.error("加载日志失败:", e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* ============ 页面布局 ============ */
.log-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}

/* ============ 第一部分：今日概览 ============ */
.today-overview {
  margin-bottom: var(--space-2);
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.overview-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  transition: all var(--dur-fast) var(--ease-standard);
  position: relative;
}

.overview-card:hover {
  border-color: var(--ai-main);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-elevated), var(--bg-card-hover));
  border-radius: var(--radius-md);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.2;
}

.card-label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.card-trend {
  font-size: 20px;
  font-weight: 700;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-main);
  box-shadow: var(--shadow-sm);
}

.card-trend.up { 
  color: var(--success); 
  background: rgba(34, 197, 94, 0.1);
}

.card-trend.down { 
  color: var(--error); 
  background: rgba(239, 68, 68, 0.1);
}

.card-trend.stable { 
  color: var(--text-muted); 
  background: rgba(156, 163, 175, 0.1);
}

/* 拖延风险卡片状态 */
.overview-card.risk.low .card-value { color: var(--success); }
.overview-card.risk.medium .card-value { color: var(--warning); }
.overview-card.risk.high .card-value { color: var(--error); }

/* ============ 通用 Section 样式 ============ */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  border: 1px solid var(--border-main);
  border-bottom: none;
}

.section-header.clickable {
  cursor: pointer;
}

.section-header.clickable:hover {
  background: var(--bg-card-hover);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.title-icon {
  font-size: 18px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.group-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.group-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.group-badge:nth-child(1) {
  border-color: rgba(99, 102, 241, 0.3);
  color: var(--ai-main);
}

.group-badge:nth-child(2) {
  border-color: rgba(34, 197, 94, 0.3);
  color: var(--success);
}

.group-badge:nth-child(3) {
  border-color: rgba(251, 146, 60, 0.3);
  color: var(--warning);
}

.group-more {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 6px;
  background: var(--bg-elevated);
  border-radius: 6px;
  color: var(--text-muted);
}

.record-count {
  font-size: 13px;
  color: var(--text-muted);
}

.section-summary {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.summary-label {
  font-size: 12px;
  color: var(--text-muted);
}

.summary-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.summary-value.up { color: var(--success); }
.summary-value.down { color: var(--error); }
.summary-value.stable { color: var(--text-muted); }
.summary-value.low { color: var(--success); }
.summary-value.medium { color: var(--warning); }
.summary-value.high { color: var(--error); }

.expand-icon {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform var(--dur-fast) var(--ease-standard);
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* ============ 第二部分：日志记录区域 ============ */
.log-records-section {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.log-records-content {
  padding: 0;
  border: none;
}

/* 虚拟滚动容器 */
.virtual-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-scroll-wrapper {
  height: 100%;
  width: 100%;
}

.virtual-scroll-content {
  position: relative;
  width: 100%;
}

.virtual-item {
  position: absolute;
  left: 0;
  right: 0;
  will-change: transform;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-8);
  gap: var(--space-3);
  color: var(--text-muted);
}

.loading-spinner {
  color: var(--ai-main);
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.log-card {
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  animation: fadeInUp 0.3s ease-out;
  animation-fill-mode: both;
  transition: all var(--dur-fast) var(--ease-standard);
}

.log-card:hover {
  border-color: var(--border-main);
  box-shadow: var(--shadow-sm);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.log-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.log-date {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.date-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.date-weekday {
  font-size: 12px;
  color: var(--text-muted);
}

.log-completion {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.completion-bar {
  width: 60px;
  height: 4px;
  background: var(--border-main);
  border-radius: 2px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: var(--ai-main);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.log-completion.high .completion-fill { background: var(--success); }
.log-completion.medium .completion-fill { background: var(--warning); }
.log-completion.low .completion-fill { background: var(--error); }

.completion-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.log-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.log-content {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.log-tags {
  display: flex;
  gap: var(--space-1);
}

.log-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.log-tag.procrastination {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.log-tag.overcommitment {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
}

.view-more {
  text-align: center;
  padding-top: var(--space-2);
}

/* 紧凑提示（无日志时） */
.empty-hint {
  padding: var(--space-3) var(--space-4);
  text-align: center;
  border: 1px solid var(--border-main);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.hint-text {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* ============ 第三部分：AI 行为分析 ============ */
.ai-analysis-section {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.section-content {
  padding: var(--space-3);
  border: 1px solid var(--border-main);
  border-top: none;
}

.analysis-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.analysis-item {
  padding: var(--space-3);
  background: var(--bg-main);
  border-radius: var(--radius-sm);
}

.item-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.item-icon {
  font-size: 16px;
}

.item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.item-content {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.insights-list {
  margin: 0;
  padding-left: var(--space-4);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.insights-list li {
  margin-bottom: var(--space-1);
}

/* ============ 第四部分：AI 行动建议 ============ */
.ai-suggestions-section {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.suggestions-count {
  font-size: 13px;
  color: var(--text-muted);
}

.suggestions-list {
  padding: var(--space-3);
  border: 1px solid var(--border-main);
  border-top: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.suggestion-item {
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-standard);
}

.suggestion-header:hover {
  background: var(--bg-elevated);
}

.suggestion-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.suggestion-icon {
  font-size: 18px;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.suggestion-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.suggestion-detail {
  padding: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
}

.detail-problem,
.detail-advice {
  margin-bottom: var(--space-2);
}

.detail-problem:last-child,
.detail-advice:last-child {
  margin-bottom: 0;
}

.detail-problem label,
.detail-advice label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: var(--space-1);
}

.detail-problem p,
.detail-advice p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ============ 确认对话框 ============ */
.confirm-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.confirm-summary {
  margin: 0;
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.6;
  padding: var(--space-3);
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
}

.changes-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 240px;
  overflow-y: auto;
}

.change-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.change-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.change-type {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.change-type.postpone {
  background: rgba(251, 146, 60, 0.1);
  color: var(--warning);
}

.change-type.remove {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.change-type.reschedule {
  background: rgba(99, 102, 241, 0.1);
  color: var(--ai-main);
}

.change-detail {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--border-subtle);
}

/* ============ 按钮动画 ============ */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ============ 响应式 ============ */
@media (max-width: 1024px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
  }
  
  .overview-card {
    padding: var(--space-2) var(--space-3);
  }
  
  .card-icon {
    font-size: 20px;
    width: 36px;
    height: 36px;
  }
  
  .card-value {
    font-size: 18px;
  }
  
  .section-summary {
    display: none;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .desktop-actions {
    display: none !important;
  }
  
  .mobile-actions {
    display: flex !important;
  }
  
  .empty-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .empty-actions :deep(.arco-btn) {
    width: 100%;
  }
}

@media (min-width: 769px) {
  .mobile-actions {
    display: none !important;
  }
  
  .desktop-actions {
    display: flex !important;
    gap: var(--space-2);
  }
}

@media (max-width: 480px) {
  .overview-cards {
    grid-template-columns: 1fr 1fr;
  }
  
  .suggestion-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .suggestion-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
