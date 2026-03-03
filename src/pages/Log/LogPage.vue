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
        >
          <template #icon>🔄</template>
          {{ loading ? "加载中..." : "刷新" }}
        </a-button>
        <a-button
          type="outline"
          @click="generateReport"
        >
          <template #icon>📊</template>
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
          <h3>🔍 筛选条件</h3>
        </div>
        <div class="filters-content">
          <!-- 时间筛选 -->
          <div class="filter-group">
            <label class="filter-label">时间范围</label>
            <a-radio-group v-model="currentTimeRange" type="button" size="small">
              <a-radio v-for="range in timeRanges" :key="range.key" :value="range.key">
                {{ range.label }}
              </a-radio>
            </a-radio-group>
          </div>
          
          <!-- 偏差类型筛选 -->
          <div class="filter-group">
            <label class="filter-label">偏差类型</label>
            <a-radio-group v-model="currentDeviationType" type="button" size="small">
              <a-radio v-for="type in deviationTypes" :key="type.key" :value="type.key">
                {{ type.label }}
              </a-radio>
            </a-radio-group>
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
  </PageScaffold>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useLogStore } from "@/store/log";
import { useUserStore } from "@/store/user";
import type { LogEntry } from "@/services/generate-log";
import AIReviewPanel from "@/components/log/AIReviewPanel.vue";
import PageScaffold from "@/components/common/PageScaffold.vue";
import PullToRefresh from "@/components/common/PullToRefresh.vue";

const logStore = useLogStore();
const userStore = useUserStore();

const logs = computed(() => logStore.logs);
const loading = ref(false);
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

// AI 动作建议
const aiActionSuggestions = ref([
  {
    id: 1,
    title: '明日任务优化',
    description: '根据今日表现，建议明天减少2项非紧急任务，集中精力处理核心事项',
    action: 'reduce_tasks'
  },
  {
    id: 2,
    title: '时间分配调整',
    description: '检测到上午效率较高，建议将困难任务安排在9:00-11:00时段',
    action: 'reschedule_tasks'
  },
  {
    id: 3,
    title: '休息提醒优化',
    description: '连续3天未按时休息，建议设置强制休息提醒每2小时一次',
    action: 'add_reminders'
  }
]);

// 获取完成度样式类
function getCompletionClass(log: LogEntry): string {
  const completion = Math.round((log.tasks_done / log.tasks_total) * 100);
  if (completion >= 80) return "high";
  if (completion >= 50) return "medium";
  return "low";
}

// 判断是否为关键拐点日
function isCriticalDay(dateStr: string): boolean {
  // 简单实现：周末或完成率突变的日子
  const date = new Date(dateStr);
  return date.getDay() === 0 || date.getDay() === 6; // 周末
}

// 执行AI建议动作
function executeAction(action: any) {
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

// 移除手动生成与刷新操作，保留自动加载

function refreshLogs() {
  onMounted(async () => {
    loading.value = true;
    try {
      const userId =
        userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
      await logStore.loadLogs(userId);
    } catch (e) {
      console.error("加载日志失败:", e);
    } finally {
      loading.value = false;
    }
  });
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
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.header-actions .btn-primary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header-actions .btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.header-actions .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
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
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
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
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-border);
}

.log-date {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-gray-900);
  font-size: 1.125rem;
}

.log-date svg {
  color: var(--color-primary);
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
  color: var(--color-gray-700);
  line-height: 1.8;
  font-size: 1rem;
  white-space: pre-line;
  margin: 0;
}

.log-footer {
  padding: var(--space-3) var(--space-6);
  background: var(--color-gray-50);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: flex-end;
}

.log-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ============ 筛选器区域 ============ */
.filters-section {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.filters-header {
  margin-bottom: 1.5rem;
}

.filters-header h3 {
  margin: 0;
  font-size: 18px;
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
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.filter-btn.active {
  background: var(--ai-main);
  color: white;
  border-color: var(--ai-main);
}

/* ============ AI 复盘面板 ============ */
.ai-review-section {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: all var(--dur-normal) var(--ease-standard);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
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
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-3);
}

.ai-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--ai-bg);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--ai-main);
}

.action-content {
  flex: 1;
}

.action-title {
  margin: 0 0 0.5rem 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.action-description {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
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
  background: var(--ai-main);
  color: white;
}

.action-btn.primary:hover {
  background: var(--ai-light);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 1.25rem 0;
}

.section-title svg {
  color: var(--ai-main);
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
  padding: var(--space-12);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--color-gray-100);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-6);
  color: var(--color-text-muted);
}

.empty-state h3 {
  color: var(--color-gray-900);
  margin: 0 0 var(--space-3) 0;
  font-size: 1.5rem;
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-6) 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
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
