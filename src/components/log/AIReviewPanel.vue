<!-- src/components/log/AIReviewPanel.vue -->
<template>
  <div class="ai-review-panel">
    <!-- 时间维度选择 -->
    <div class="review-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-btn', { active: selectedPeriod === tab.value }]"
        @click="selectedPeriod = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 任务预览与错误提示 -->
    <div class="preview-panel">
      <div v-if="errorMessage" class="error-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
          <line x1="12" y1="7" x2="12" y2="13" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="17" r="1.5" fill="currentColor"/>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <div class="preview-header">
        <strong>将用于 {{ periodLabel }} 复盘的任务</strong>
        <span class="count">（{{ tasksForPeriod.length }} 项）</span>
      </div>

      <ul class="preview-list" v-if="tasksForPeriod.length > 0">
        <li v-for="t in tasksForPeriod" :key="t.id" class="preview-item">
          <!-- 左列：时间 -->
          <div class="time">
            <span v-if="t.start_time && t.end_time">{{ formatTimeRange(t) }}</span>
            <span v-else>{{ t.task_date }}</span>
          </div>

          <!-- 右列：内容 -->
          <div class="content">
            <!-- 第一行：状态圆点 + 标题 -->
            <div class="row title-row">
              <span class="status-dot" :class="t.status"></span>
              <span class="preview-title">{{ t.title }}</span>
            </div>

            <!-- 第二行：副信息（影响决策） -->
            <div class="row meta">
              <span v-if="t.start_time && t.end_time">⏱ {{ calcDurationMinutes(t) }} 分钟</span>
              <span v-else>📅 {{ t.task_date }}</span>
              <span v-if="t.note && t.note.length <= 24">· {{ t.note }}</span>
            </div>

            <!-- 第三行：AI / 标签（辅助感知） -->
            <div class="row tags">
              <span class="tag" v-if="isTodayTask(t)">今日任务</span>
              <span class="tag" :class="t.status">{{ statusLabel(t.status) }}</span>
            </div>
          </div>
        </li>
      </ul>

      <div v-else class="preview-empty">
        <span>当前周期没有可用任务，AI 无法生成复盘。</span>
      </div>
    </div>

    <!-- 复盘内容 -->
    <div class="review-content">
      <div v-if="loading" class="review-loading">
        <div class="spinner">
          <svg class="animate-spin" width="40" height="40" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
        <p>AI 正在分析数据...</p>
      </div>

      <div v-else-if="currentReview" class="review-body modern-card">
        <!-- 总结部分 -->
        <div class="review-section">
          <h3 class="section-title">📊 复盘总结</h3>
          <p class="summary-text">{{ currentReview.summary }}</p>
        </div>

        <!-- 指标展示 -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">完成率</div>
            <div class="metric-value">
              <span class="number">{{ currentReview.metrics.completion_rate }}%</span>
            </div>
            <div class="metric-bar">
              <div class="metric-progress" :style="{ width: `${currentReview.metrics.completion_rate}%` }"></div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">生产力评分</div>
            <div class="metric-value">
              <span class="number">{{ currentReview.metrics.productivity_score }}</span>
              <span class="unit">/100</span>
            </div>
            <div class="metric-bar">
              <div class="metric-progress" :style="{ width: `${currentReview.metrics.productivity_score}%` }"></div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">坚持度评分</div>
            <div class="metric-value">
              <span class="number">{{ currentReview.metrics.consistency_score }}</span>
              <span class="unit">/100</span>
            </div>
            <div class="metric-bar">
              <div class="metric-progress" :style="{ width: `${currentReview.metrics.consistency_score}%` }"></div>
            </div>
          </div>
        </div>

        <!-- 关键洞察 -->
        <div class="review-section" v-if="currentReview.insights.length > 0">
          <h3 class="section-title">💡 关键洞察</h3>
          <ul class="insights-list">
            <li v-for="(insight, idx) in currentReview.insights" :key="idx" class="insight-item">
              {{ insight }}
            </li>
          </ul>
        </div>

        <!-- 改进建议 -->
        <div class="review-section" v-if="currentReview.suggestions.length > 0">
          <h3 class="section-title">🎯 改进建议</h3>
          <ul class="suggestions-list">
            <li v-for="(suggestion, idx) in currentReview.suggestions" :key="idx" class="suggestion-item">
              {{ suggestion }}
            </li>
          </ul>
        </div>

        <!-- 生成时间 -->
        <div class="review-footer">
          <small>生成时间: {{ formatTime(currentReview.generated_at) }}</small>
        </div>
      </div>

      <div v-else class="review-empty">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" fill="currentColor"/>
          </svg>
        </div>
        <p>暂无{{ periodLabel }}的复盘数据</p>
        <button class="modern-btn btn-primary btn-sm" @click="generateCurrentReview">
          生成复盘
        </button>
      </div>
    </div>

    <!-- 生成按钮 -->
    <div v-if="!loading && currentReview" class="review-actions">
      <button class="modern-btn btn-secondary" @click="generateCurrentReview" :disabled="loading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 12a8 8 0 0 0 8 8c.28 0 .56 0 .83-.02M4 12a8 8 0 0 1 15.73-.5M4 12H2.5M21.5 12a8.973 8.973 0 0 0-1.67-4.73M12 2v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        重新生成
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAIReviewStore } from '@/store/ai-review';
import { useUserStore } from '@/store/user';
import { useTaskStore } from '@/store/tasks';
import type { ReviewRequest } from '@/services/ai-review';

const reviewStore = useAIReviewStore();
const userStore = useUserStore();
const taskStore = useTaskStore();

// 时间维度选项
const tabs = [
  { label: '今天', value: 'today' as const },
  { label: '本周', value: 'week' as const },
  { label: '本月', value: 'month' as const },
];

const selectedPeriod = ref<'today' | 'week' | 'month'>('today');
const loading = computed(() => reviewStore.loading);
const errorMessage = ref<string>('');

// 本地日期工具（避免 UTC 偏移导致今天匹配失败）
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// 辅助：时间范围、时长、标签、今日判断
function formatTimeRange(t: { start_time?: string; end_time?: string }): string {
  if (!t.start_time || !t.end_time) return '';
  return `${t.start_time} – ${t.end_time}`;
}
function calcDurationMinutes(t: { start_time?: string; end_time?: string }): number {
  if (!t.start_time || !t.end_time) return 0;
  const [sh, sm] = t.start_time.split(':').map(Number);
  const [eh, em] = t.end_time.split(':').map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}
function isTodayTask(t: { task_date: string }): boolean {
  return t.task_date === toLocalDateString(new Date());
}
function statusLabel(status: 'pending' | 'done' | 'missed'): string {
  if (status === 'done') return '✔ 已完成';
  if (status === 'missed') return '⚠ 逾期';
  return '○ 未开始';
}

// 获取当前选择的复盘
const currentReview = computed(() => {
  return reviewStore.getReview(selectedPeriod.value);
});

// 时间维度标签
const periodLabel = computed(() => {
  const labels = {
    today: '今天',
    week: '本周',
    month: '本月',
  };
  return labels[selectedPeriod.value];
});

// 根据周期过滤任务
const tasksForPeriod = computed(() => {
  const all = taskStore.tasks;
  const now = new Date();
  const todayStr = toLocalDateString(now);

  if (selectedPeriod.value === 'today') {
    const filtered = all.filter(t => t.task_date === todayStr);
    return filtered;
  }

  if (selectedPeriod.value === 'week') {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end);
    start.setDate(end.getDate() - 6); // 最近7天（含今日）
    return all.filter(t => {
      const d = parseLocalDate(t.task_date);
      return d >= start && d <= end;
    });
  }

  // 本月
  const month = now.getMonth();
  const year = now.getFullYear();
  return all.filter(t => {
    const d = parseLocalDate(t.task_date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
});

// 格式化时间
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 生成当前维度的复盘
async function generateCurrentReview() {
  // 确保任务已加载
  if (taskStore.tasks.length === 0) {
    try {
      await taskStore.loadTasks();
      console.log('[AIReviewPanel] 任务已加载，总数:', taskStore.tasks.length);
    } catch (err) {
      console.error('[AIReviewPanel] 加载任务失败:', err);
    }
  }

  const userId = userStore.user?.id ?? 1;
  const tasks = tasksForPeriod.value;

  // 生成前校验与预览输出
  if (tasks.length === 0) {
    const todayStr = toLocalDateString(new Date());
    const allDates = taskStore.tasks.map(t => t.task_date);
    const todayMatches = taskStore.tasks.filter(t => t.task_date === todayStr).length;
    errorMessage.value = `未找到${periodLabel.value}的任务。当前任务总数: ${taskStore.tasks.length}，今天(${todayStr})匹配数: ${todayMatches}。`;
    console.warn('[AIReviewPanel] 无任务可用于生成复盘', { todayStr, allDates });
    return;
  }

  // 清空错误提示
  errorMessage.value = '';

  const request: ReviewRequest = {
    userId,
    period: selectedPeriod.value,
    tasks,
    schedules: [],
    context: '我是一个工作效率爱好者，希望通过数据驱动的方式不断提升自己的生产力。',
  };

  console.log('[AIReviewPanel] 生成复盘请求:', {
    period: selectedPeriod.value,
    tasks_total: tasks.length,
    tasks_done: tasks.filter(t => t.status === 'done').length,
    tasks_detail: tasks.map(t => ({ id: t.id, title: t.title, date: t.task_date, status: t.status }))
  });

  await reviewStore.generateReview(request);
}

// 组件挂载时加载任务和复盘
onMounted(async () => {
  const userId = userStore.user?.id;
  if (userId) {
    // 加载已保存的复盘
    reviewStore.loadReviewsFromStorage(userId);
    
    // 加载任务列表
    try {
      await taskStore.loadTasks();
      console.log('[AIReviewPanel] 组件挂载 - 任务已加载，总数:', taskStore.tasks.length);
    } catch (err) {
      console.error('[AIReviewPanel] 组件挂载 - 加载任务失败:', err);
    }
  }
});

// 监听用户变化
watch(
  () => userStore.user?.id,
  async (userId) => {
    if (userId) {
      reviewStore.loadReviewsFromStorage(userId);
      try {
        await taskStore.loadTasks();
        console.log('[AIReviewPanel] 用户变化 - 任务已加载，总数:', taskStore.tasks.length);
      } catch (err) {
        console.error('[AIReviewPanel] 用户变化 - 加载任务失败:', err);
      }
    }
  }
);
</script>

<style scoped>
.ai-review-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--bg-main);
}

/* 预览面板 */
.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-sm);
}

.preview-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  color: var(--text-main);
}

.preview-header .count {
  color: var(--text-muted);
  font-size: 12px;
}

.preview-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

/* 列表项两列网格：左时间（固定宽），右内容 */
.preview-item {
  display: grid;
  grid-template-columns: 56px 1fr;
  column-gap: 12px;
  padding: 12px 0;
}

.preview-item + .preview-item {
  border-top: 1px solid var(--border-soft, var(--border-subtle));
}

/* 时间列：左对齐，等宽数字，弱颜色 */
.time {
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

/* 内容列 */
.content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-row {
  gap: 8px;
}

/* 状态圆点 */
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
}
.status-dot.pending { background: var(--color-warning); }
.status-dot.done { background: var(--color-success); }
.status-dot.missed { background: var(--color-danger); }

/* 标题：视觉中心 */
.preview-title {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 2; /* 标准属性，兼容性更好 */
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 副信息：影响决策的内容 */
.meta {
  font-size: 12px;
  color: var(--text-secondary);
  gap: 6px;
}

/* 标签：辅助感知 */
.tags {
  display: flex;
  gap: 6px;
}

.tag {
  background: rgba(99,102,241,0.08);
  color: #6366F1;
  font-size: 11px;
  border-radius: 6px;
  padding: 2px 6px;
}
.tag.done { background: rgba(16,185,129,0.10); color: var(--color-success); }
.tag.pending { background: rgba(234,179,8,0.12); color: var(--color-warning); }
.tag.missed { background: rgba(239,68,68,0.10); color: var(--color-danger); }

.preview-empty {
  color: var(--color-danger);
  font-size: 13px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--danger-bg, rgba(220, 38, 38, 38, 0.1));
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.75rem;
}

/* 选项卡 */
.review-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-main);
  padding-bottom: 1rem;
}

.tab-btn {
  padding: 0.5rem 1.25rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  position: relative;
}

.tab-btn:hover {
  color: var(--text-main);
  background: var(--bg-card);
}

.tab-btn.active {
  color: var(--ai-main);
  background: var(--ai-bg);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1rem;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--ai-main);
}

/* 复盘内容 */
.review-content {
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

/* 加载状态 */
.review-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--text-secondary);
}

.spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 复盘主体 */
.review-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
}

/* 复盘分节 */
.review-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

/* 指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.metric-card {
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.metric-value .number {
  font-size: 24px;
  font-weight: 700;
  color: var(--ai-main);
}

.metric-value .unit {
  font-size: 12px;
  color: var(--text-muted);
}

.metric-bar {
  height: 6px;
  background: var(--border-main);
  border-radius: 3px;
  overflow: hidden;
}

.metric-progress {
  height: 100%;
  background: linear-gradient(90deg, var(--ai-main), var(--ai-light));
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 列表 */
.insights-list,
.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.insight-item,
.suggestion-item {
  padding: 0.75rem;
  background: var(--bg-card);
  border-left: 3px solid var(--ai-main);
  border-radius: var(--radius-sm);
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
}

/* 空状态 */
.review-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--text-muted);
  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

/* 底部 */
.review-footer {
  text-align: right;
  font-size: 12px;
  color: var(--text-muted);
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.review-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 13px;
}

/* 响应式 */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .review-body {
    padding: 1rem;
  }
}
</style>
