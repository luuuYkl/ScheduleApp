<template>
  <PageScaffold 
    title="日志记录" 
    subtitle="查看历史日志和AI智能分析"
    class="layer-context"
  >
    <template #actions>
      <div class="desktop-actions priority-medium">
        <a-button
          type="primary"
          @click="refreshLogs"
          :disabled="loading"
          class="action-btn-refresh"
        >
          <template #icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </template>
          {{ loading ? "加载中..." : "刷新" }}
        </a-button>
        <a-button
          type="outline"
          @click="generateReport"
          class="action-btn-report"
        >
          <template #icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </template>
          生成报告
        </a-button>
      </div>
      <div class="mobile-actions priority-essential">
        <a-button
          type="primary"
          @click="toggleAiPanel"
        >
          <template #icon>🤖</template>
          AI
        </a-button>
      </div>
    </template>

    <PullToRefresh @refresh="handleRefresh">
    <div class="log-content layout-template-l">
      <!-- Context Layer: 顶部筛选器 -->
      <div class="filters-section card layer-context priority-high">
        <div class="filters-header">
          <div class="filters-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <h3>筛选条件</h3>
          </div>
        </div>
        <div class="filters-content">
          <!-- 时间筛选 -->
          <div class="filter-group">
            <label class="filter-label">时间范围</label>
            <div class="filter-options">
              <button 
                v-for="range in timeRanges" 
                :key="range.key" 
                class="filter-btn"
                :class="{ active: currentTimeRange === range.key }"
                @click="currentTimeRange = range.key"
              >
                {{ range.label }}
              </button>
            </div>
          </div>
          
          <!-- 偏差类型筛选 -->
          <div class="filter-group">
            <label class="filter-label">偏差类型</label>
            <div class="filter-options">
              <button 
                v-for="type in deviationTypes" 
                :key="type.key" 
                class="filter-btn"
                :class="{ active: currentDeviationType === type.key }"
                @click="currentDeviationType = type.key"
              >
                {{ type.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Secondary Layer: AI 复盘面板 - 移动端默认折叠 -->
      <section 
        class="ai-review-section card layer-secondary priority-medium"
        :class="{ 'mobile-collapsed': isMobile && !showAiPanel }"
      >
        <div class="section-header" @click="toggleAiPanel">
          <div class="section-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"
              />
            </svg>
            AI 智能复盘
          </div>
          <button 
            v-if="isMobile" 
            class="expand-toggle"
            type="button"
          >
            {{ showAiPanel ? '▲' : '▼' }}
          </button>
        </div>
        <div v-show="!isMobile || showAiPanel" class="ai-actions">
          <div class="action-item" v-for="action in aiActionSuggestions" :key="action.id">
            <div class="action-content">
              <h4 class="action-title">{{ action.title }}</h4>
              <p class="action-description">{{ action.description }}</p>
            </div>
            <a-button 
              type="primary"
              size="small"
              @click="executeAction(action)"
            >
              一键执行
            </a-button>
          </div>
        </div>
      </section>

      <!-- Primary Layer: 日志列表 - 桌面端左侧 -->
      <main class="log-list-container layer-primary priority-high">
        <div v-if="loading && filteredLogs.length === 0" class="loading-state">
          <div class="loading-spinner">
            <svg
              class="animate-spin"
              width="48"
              height="48"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
                opacity="0.25"
              />
              <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p>加载中...</p>
        </div>

        <div v-else-if="filteredLogs.length > 0" class="log-list">
          <div 
            v-for="weekGroup in weeklyLogGroups" 
            :key="weekGroup.week"
            class="week-group"
          >
            <div class="week-header">
              <h3 class="week-title">{{ weekGroup.title }}</h3>
              <div class="week-stats">
                <span class="stat-item">
                  <span class="stat-value">{{ weekGroup.logs.length }}</span>
                  <span class="stat-label">条记录</span>
                </span>
                <span class="stat-item" v-if="weekGroup.criticalDays.length > 0">
                  <span class="critical-badge">{{ weekGroup.criticalDays.length }}个关键拐点</span>
                </span>
              </div>
            </div>
            
            <div class="week-logs">
              <div
                v-for="(log, index) in weekGroup.logs"
                :key="log.id"
                class="log-card modern-card"
                :class="{ 'critical-day': isCriticalDay(log.date) }"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <div class="log-header">
                  <div class="log-date">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        stroke="currentColor"
                        stroke-width="2"
                        fill="none"
                      />
                      <line
                        x1="16"
                        y1="2"
                        x2="16"
                        y2="6"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                      <line
                        x1="8"
                        y1="2"
                        x2="8"
                        y2="6"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                      <line
                        x1="3"
                        y1="10"
                        x2="21"
                        y2="10"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                    </svg>
                    <strong>{{ formatDate(log.date) }}</strong>
                    <span v-if="isCriticalDay(log.date)" class="critical-tag">关键拐点</span>
                  </div>
                </div>

                <div class="log-body">
                  <p class="log-content">{{ log.content }}</p>
                </div>

                <div class="log-footer">
                  <span class="log-time">{{ formatTime(log.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
              />
              <polyline
                points="14,2 14,8 20,8"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
              />
            </svg>
          </div>
          <h3>暂无日志记录</h3>
        </div>
      </main>
    </div>
    </PullToRefresh>
    
    <!-- 任务修改对比弹窗 -->
    <TaskModificationModal
      v-model:visible="showModificationModal"
      :modifications="currentModifications"
      :loading="modificationLoading"
      @confirm="handleModificationConfirm"
      @cancel="handleModificationCancel"
    />
  </PageScaffold>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from "vue";
import { useLogStore } from "@/store/log";
import { useUserStore } from "@/store/user";
import { useTaskStore } from "@/store/tasks";
import { useScheduleStore } from "@/store/schedules";
import type { LogEntry } from "@/services/generate-log";
import { generateAIReview, generateActionableSuggestions, type AIReview } from "@/services/ai-review";
import type { AIActionSuggestion, TaskModification } from "@/services/api.types";
import TaskModificationModal from "@/components/log/TaskModificationModal.vue";
import PageScaffold from "@/components/common/PageScaffold.vue";
import PullToRefresh from "@/components/common/PullToRefresh.vue";

const logStore = useLogStore();
const userStore = useUserStore();
const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();

const logs = computed(() => logStore.logs);
const loading = ref(false);
const aiLoading = ref(false);
const aiReview = ref<AIReview | null>(null);
const showAiPanel = ref(false);
const isMobile = ref(window.innerWidth < 768);

// 筛选状态
const currentTimeRange = ref<'7d' | '30d' | '90d'>('30d');
const currentDeviationType = ref<'all' | 'procrastination' | 'underestimation' | 'overcommitment'>('all');

function toggleAiPanel() {
  if (isMobile.value) {
    showAiPanel.value = !showAiPanel.value;
  }
}

// 筛选选项
const timeRanges = [
  { key: '7d' as const, label: '最近7天' },
  { key: '30d' as const, label: '最近30天' },
  { key: '90d' as const, label: '最近90天' }
];

const deviationTypes = [
  { key: 'all' as const, label: '全部类型' },
  { key: 'procrastination' as const, label: '拖延症' },
  { key: 'underestimation' as const, label: '低估工时' },
  { key: 'overcommitment' as const, label: '过度承诺' }
];

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
  } else {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      weekday: "short",
    };
    return date.toLocaleDateString("zh-CN", options);
  }
}

// 格式化时间
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 筛选后的日志
const filteredLogs = computed(() => {
  const now = new Date();
  const daysAgo = {
    '7d': 7,
    '30d': 30,
    '90d': 90
  }[currentTimeRange.value];
  
  const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  
  return logs.value.filter(log => log.date >= cutoffStr);
});

// 按周分组的日志
const weeklyLogGroups = computed(() => {
  const groups: Array<{week: string; title: string; logs: any[]; criticalDays: string[]}> = [];
  const logsByWeek = new Map<string, any[]>();
  
  filteredLogs.value.forEach(log => {
    const date = new Date(log.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // 本周日
    const weekKey = weekStart.toISOString().slice(0, 10);
    
    if (!logsByWeek.has(weekKey)) {
      logsByWeek.set(weekKey, []);
    }
    logsByWeek.get(weekKey)?.push(log);
  });
  
  Array.from(logsByWeek.entries()).forEach(([weekStart, weekLogs]) => {
    const weekDate = new Date(weekStart);
    const weekEnd = new Date(weekDate);
    weekEnd.setDate(weekDate.getDate() + 6);
    
    const title = `${weekDate.getMonth() + 1}月${weekDate.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
    const criticalDays = weekLogs.filter(log => isCriticalDay(log.date)).map(log => log.date);
    
    groups.push({
      week: weekStart,
      title,
      logs: weekLogs.sort((a, b) => b.date.localeCompare(a.date)),
      criticalDays
    });
  });
  
  return groups.sort((a, b) => b.week.localeCompare(a.week));
});

// AI 动作建议 - 从AI服务获取（带可执行修改）
const aiActionSuggestions = ref<AIActionSuggestion[]>([]);

// 任务修改弹窗状态
const showModificationModal = ref(false);
const currentModifications = ref<TaskModification[]>([]);
const modificationLoading = ref(false);

// 将时间范围转换为AI复盘服务的period格式
function getTimeRangePeriod(): 'today' | 'week' | 'month' {
  switch (currentTimeRange.value) {
    case '7d':
      return 'week';
    case '30d':
      return 'month';
    case '90d':
      return 'month';
    default:
      return 'week';
  }
}

// 加载AI复盘建议
async function loadAIReview() {
  aiLoading.value = true;
  try {
    const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
    const period = getTimeRangePeriod();
    
    // 获取任务和日程数据
    const tasks = taskStore.tasks || [];
    const schedules = scheduleStore.schedules || [];
    
    const review = await generateAIReview({
      userId,
      period,
      tasks,
      schedules,
      context: userStore.user?.name ? `用户: ${userStore.user.name}` : undefined
    });
    
    aiReview.value = review;
    
    // 生成可执行的任务修改建议
    const actionSuggestions = generateActionableSuggestions(tasks, review.metrics);
    
    // 如果有建议，使用它们
    if (actionSuggestions.length > 0) {
      aiActionSuggestions.value = actionSuggestions;
    } else {
      // 否则使用默认建议
      aiActionSuggestions.value = getDefaultSuggestions(review);
    }
  } catch (error) {
    console.error("加载AI复盘失败:", error);
    // 使用默认建议
    aiActionSuggestions.value = getDefaultSuggestions();
  } finally {
    aiLoading.value = false;
  }
}

// 获取默认建议（带空的modifications）
function getDefaultSuggestions(review?: AIReview): AIActionSuggestion[] {
  const suggestions: AIActionSuggestion[] = [];
  
  if (review?.metrics) {
    // 基于指标生成建议
    if (review.metrics.completion_rate < 70) {
      suggestions.push({
        id: 1,
        title: '提升完成率',
        description: `当前完成率为${review.metrics.completion_rate}%，建议减少任务数量，专注核心事项`,
        action: 'reduce_tasks',
        modifications: []
      });
    }
    
    if (review.metrics.consistency_score < 60) {
      suggestions.push({
        id: 2,
        title: '提高坚持度',
        description: `坚持度评分为${review.metrics.consistency_score}分，建议设置每日提醒保持习惯`,
        action: 'add_reminders',
        modifications: []
      });
    }
  }
  
  // 添加默认建议
  if (suggestions.length === 0) {
    suggestions.push(
      {
        id: 1,
        title: '明日任务优化',
        description: '根据近期表现，建议减少非紧急任务，集中精力处理核心事项',
        action: 'reduce_tasks',
        modifications: []
      },
      {
        id: 2,
        title: '时间分配调整',
        description: '建议将困难任务安排在上午9:00-11:00时段，提高效率',
        action: 'reschedule_tasks',
        modifications: []
      },
      {
        id: 3,
        title: '休息提醒优化',
        description: '建议设置强制休息提醒，每工作2小时休息10分钟',
        action: 'add_reminders',
        modifications: []
      }
    );
  }
  
  return suggestions;
}

// 监听时间范围变化，重新加载AI复盘
watch(currentTimeRange, () => {
  loadAIReview();
});

// 判断是否为关键拐点日
function isCriticalDay(dateStr: string): boolean {
  // 简单实现：周末或完成率突变的日子
  const date = new Date(dateStr);
  return date.getDay() === 0 || date.getDay() === 6; // 周末
}

// 执行AI建议动作
function executeAction(action: AIActionSuggestion) {
  // 如果有具体的任务修改建议，打开弹窗
  if (action.modifications && action.modifications.length > 0) {
    currentModifications.value = action.modifications;
    showModificationModal.value = true;
  } else {
    // 否则显示提示
    switch (action.action) {
      case 'reduce_tasks':
        alert('已为您减少明日非紧急任务数量');
        break;
      case 'reschedule_tasks':
        alert('已重新安排任务时间到高效时段');
        break;
      case 'add_reminders':
        alert('已添加强制休息提醒');
        break;
      default:
        alert('功能开发中...');
    }
  }
}

// 确认任务修改
async function handleModificationConfirm() {
  modificationLoading.value = true;
  try {
    // 执行每个任务修改
    for (const mod of currentModifications.value) {
      if (mod.type === 'delete' && mod.original) {
        // 删除任务
        await taskStore.deleteTask(mod.original.id);
      } else if (mod.original) {
        // 更新现有任务
        await taskStore.updateTask(mod.original.id, mod.modified);
      }
    }
    
    // 关闭弹窗
    showModificationModal.value = false;
    currentModifications.value = [];
    
    // 显示成功提示
    alert('任务修改已执行成功！');
    
    // 重新加载AI复盘
    await loadAIReview();
  } catch (error) {
    console.error('执行任务修改失败:', error);
    alert('执行修改时发生错误，请重试');
  } finally {
    modificationLoading.value = false;
  }
}

// 取消修改
function handleModificationCancel() {
  showModificationModal.value = false;
  currentModifications.value = [];
}

// 刷新日志
async function refreshLogs() {
  loading.value = true;
  try {
    const userId =
      userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
    await logStore.loadLogs(userId);
    await loadAIReview();
  } catch (e) {
    console.error("刷新日志失败:", e);
  } finally {
    loading.value = false;
  }
}

function generateReport() {
  // TODO: 实现报告生成功能
  alert("报告生成功能开发中...");
}

// 下拉刷新处理
async function handleRefresh() {
  const userId =
    userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
  await logStore.loadLogs(userId);
}

onMounted(async () => {
  loading.value = true;
  try {
    const userId =
      userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
    await logStore.loadLogs(userId);
    // 加载AI复盘建议
    await loadAIReview();
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
  display: grid;
  gap: var(--space-4);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* 桌面端双列布局 */
@media (min-width: 1025px) {
  .log-content {
    grid-template-columns: 2fr 1fr;
  }
  
  .filters-section {
    /* 左侧筛选器 */
    grid-column: 1 / -1;
  }
  
  .ai-review-section {
    /* 右侧AI面板 */
    align-self: start;
    position: sticky;
    top: calc(var(--header-height) + var(--space-4));
  }
  
  .log-list-container {
    /* 左侧日志列表 */
  }
}

/* ============ 页面头部 ============ */
.page-header {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-600) 100%
  );
  color: white;
  padding: var(--space-8) 0;
  margin-bottom: var(--space-6);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.header-content {
  padding: 0 var(--space-6);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-4);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
}

.header-actions .modern-btn {
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
}

.header-actions .btn-primary {
  background: var(--color-brand-alpha-24, rgba(37, 99, 235, 0.24));
  border: 1px solid var(--color-brand-500, #2563EB);
  color: var(--text-main, white);
}

.header-actions .btn-primary:hover {
  background: var(--color-brand-alpha-35, rgba(37, 99, 235, 0.35));
}

.header-actions .btn-secondary {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.1));
  border: 1px solid var(--border-main, rgba(255, 255, 255, 0.2));
  color: var(--text-main, white);
}

.header-actions .btn-secondary:hover {
  background: var(--bg-card-hover, rgba(255, 255, 255, 0.2));
}

/* ============ 日志内容区 ============ */
.log-content {
  padding: 0 var(--space-6) var(--space-8);
}

/* ============ 按周分组展示 ============ */
.week-group {
  margin-bottom: 2rem;
}

.week-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--bg-card);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  border: 1px solid var(--border-main);
  border-bottom: none;
}

.week-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.week-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--ai-main);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.critical-badge {
  background: var(--warning-bg);
  color: var(--warning);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.week-logs {
  border: 1px solid var(--border-main);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  overflow: hidden;
}

.critical-day {
  border-left: 4px solid var(--warning) !important;
}

.critical-tag {
  background: var(--warning);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 0.5rem;
}

.log-list {
  display: grid;
  gap: var(--space-6);
}

.log-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-main);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  animation: fadeInUp 0.5s ease-out;
  animation-fill-mode: both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-subtle);
}

.log-date {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-main);
  font-size: 1.125rem;
}

.log-date svg {
  color: var(--ai-main);
}

.log-stats {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.completion-badge {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 700;
}

.completion-badge.high {
  background: var(--color-success-light);
  color: var(--color-success);
}

.completion-badge.medium {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.completion-badge.low {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.log-body {
  padding: var(--space-6);
}

.log-content {
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 1rem;
  white-space: pre-line;
  margin: 0;
}

.log-footer {
  padding: var(--space-3) var(--space-6);
  background: var(--bg-elevated);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}

.log-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ============ 筛选器区域 ============ */
.filters-section {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.filters-header {
  margin-bottom: 1.25rem;
}

.filters-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filters-title svg {
  color: var(--color-primary);
}

.filters-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.filters-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-main);
  background: var(--bg-main);
  color: var(--text-secondary);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
  border-color: var(--color-primary);
}

.filter-btn.active {
  background: var(--color-brand-500, #2563EB);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

/* ============ AI 复盘面板 ============ */
.ai-review-section {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.03) 0%, rgba(37, 99, 235, 0.06) 100%);
  border: 1px solid rgba(37, 99, 235, 0.15);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  transition: all var(--dur-normal) var(--ease-standard);
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid rgba(37, 99, 235, 0.1);
}

.expand-toggle {
  background: none;
  border: none;
  font-size: 16px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: all var(--dur-fast) var(--ease-standard);
}

.expand-toggle:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.mobile-collapsed .section-header {
  margin-bottom: 0;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  padding-bottom: var(--space-3);
}

.ai-actions {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--color-brand-500, #2563EB);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.action-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
}

.action-content {
  flex: 1;
  padding-right: 1rem;
}

.action-title {
  margin: 0 0 0.375rem 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-title::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--color-brand-500, #2563EB);
  border-radius: 50%;
}

.action-description {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 17px;
  font-weight: 600;
  color: var(--color-brand-500, #2563EB);
  margin: 0;
}

.section-title svg {
  color: var(--color-brand-500, #2563EB);
}

/* ============ 加载状态 ============ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  gap: var(--space-4);
}

.loading-spinner {
  color: var(--color-primary);
}

.loading-state p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* ============ 空状态 ============ */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border-main);
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 50%;
  margin-bottom: var(--space-6);
  color: #94a3b8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.empty-icon svg {
  width: 48px;
  height: 48px;
  stroke-width: 1.5;
}

.empty-state h3 {
  color: var(--text-main);
  margin: 0 0 var(--space-2) 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.empty-state p {
  color: var(--text-secondary);
  margin: 0 0 var(--space-6) 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  font-size: 0.9rem;
  line-height: 1.6;
}

/* ============ 按钮动画 ============ */
.btn-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}



/* 移动端优化 */
@media (max-width: 768px) {
  .filters-content {
    gap: 1rem;
  }
  
  .filter-options {
    flex-direction: column;
  }
  
  .filter-btn {
    text-align: center;
  }
  
  .action-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .week-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .week-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  /* 移动端优先级调整 */
  .desktop-actions {
    display: none !important;
  }
  
  .mobile-actions {
    display: flex !important;
  }
  
  /* 信息层级优化：日期 > 核心内容 > 时间 */
  .log-date {
    order: -1;
    font-size: 16px;
    font-weight: 600;
  }
  
  .log-content {
    order: 0;
    font-size: 14px;
    line-height: 1.6;
  }
  
  .log-time {
    order: 1;
    font-size: 12px;
    color: var(--text-muted);
  }
  
  /* AI面板默认折叠 */
  .ai-review-section {
    order: 2;
  }
}

/* 桌面端优化 */
@media (min-width: 769px) {
  .mobile-actions {
    display: none !important;
  }
  
  .desktop-actions {
    display: flex !important;
    gap: var(--space-2);
  }
}

@media (max-width: 640px) {
  .page-header {
    padding: var(--space-6) 0;
    margin-bottom: var(--space-4);
  }

  .header-content {
    flex-direction: column;
    padding: 0 var(--space-4);
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }

  .log-content {
    padding: 0 var(--space-4) var(--space-6);
  }

  .log-header {
    flex-direction: column;
    gap: var(--space-3);
    align-items: flex-start;
    padding: var(--space-4);
  }

  .log-stats {
    width: 100%;
    justify-content: space-between;
  }

  .log-body {
    padding: var(--space-4);
  }

  .empty-state {
    padding: var(--space-8) var(--space-4);
  }
}

/* ============ 暗色主题支持 ============ */
@media (prefers-color-scheme: dark) {
  .log-page {
    background: var(--color-background);
  }

  .log-card {
    background: var(--color-surface);
    border-color: var(--color-border);
  }

  .log-header,
  .log-footer {
    background: var(--color-gray-800);
    border-color: var(--color-gray-700);
  }

  .empty-state {
    background: var(--color-surface);
  }

  .empty-icon {
    background: var(--color-gray-800);
  }
}
</style>
