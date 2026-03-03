<template>
  <PageScaffold
    :title="pageTitle"
    :subtitle="pageSubtitle"
    show-back-button
    @back="back"
    class="layer-context"
  >
    <template #actions>
      <div class="desktop-actions priority-medium">
        <Button variant="outline" @click="editTask">
          ✏️ 编辑
        </Button>
        <Button variant="primary" @click="duplicateTask">
          📋 复制
        </Button>
      </div>
      <div class="mobile-actions priority-essential">
        <Button 
          :variant="isTaskDone ? 'secondary' : 'primary'" 
          size="small"
          :loading="toggling"
          @click="toggleTaskStatus"
          class="mobile-complete-btn"
        >
          {{ isTaskDone ? '撤销' : '完成' }}
        </Button>
      </div>
    </template>
    
    <div class="task-detail-container layout-template-l">
      <template v-if="task">
        <!-- Context Layer: 强化的计划贡献展示 -->
        <Card class="plan-contribution-card layer-context priority-high">
          <div class="contribution-header">
            <h2>🎯 对计划的贡献</h2>
            <div class="contribution-score" :class="getContributionClass(contributionScore)">
              <span class="score-value">{{ contributionScore }}</span>
              <span class="score-label">贡献度</span>
            </div>
          </div>
          
          <div class="contribution-content">
            <div class="plan-info">
              <div class="plan-avatar">{{ planEmoji }}</div>
              <div class="plan-details">
                <h3 class="plan-title">{{ planTitle }}</h3>
                <p class="plan-period">{{ planPeriod }}</p>
              </div>
            </div>
            
            <div class="contribution-stats">
              <div class="stat-item">
                <span class="stat-label">计划进度</span>
                <div class="stat-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: (planProgress || 0) + '%' }"
                      :class="getProgressClass(planProgress || 0)">
                    </div>
                  </div>
                  <span class="progress-text">{{ planProgress }}%</span>
                </div>
              </div>
              <div class="stat-item">
                <span class="stat-label">任务权重</span>
                <span class="stat-value">{{ taskWeight }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">关键节点</span>
                <span class="stat-value" :class="milestoneClass">{{ milestoneText }}</span>
              </div>
            </div>
          </div>
        </Card>

        <!-- Primary Layer: 任务核心信息 -->
        <Card class="task-core-card layer-primary priority-high">
          <div class="task-header">
            <!-- 标题 + 状态 -->
            <div class="title-row">
              <span class="status-dot" :class="task.status"></span>
              <h1 class="task-title">{{ task.title }}</h1>
            </div>
            <div class="status-label">
              <span class="label" :class="task.status">{{ statusText }}</span>
            </div>

            <!-- 核心属性条 -->
            <div class="task-meta">
              <span class="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
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
                {{ formatDateReadable(task.task_date) }}
              </span>
              <span class="meta-item" v-if="task.start_time && task.end_time">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <path
                    d="M12 6v6l4 2"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                {{ task.start_time }} – {{ task.end_time }}
              </span>
              <span class="meta-item" v-if="durationMinutes > 0">
                ⏱ {{ durationMinutes }}分钟
              </span>
              <span
                class="meta-item priority"
                v-if="task.repeat_type && task.repeat_type !== 'none'"
              >
                🔁 {{ repeatTypeLabel }}
              </span>
            </div>
          </div>
        </Card>

        <!-- Primary Layer: 任务内容区 -->
        <div class="task-content-section layer-primary priority-high">
          <!-- 双进度展示 -->
          <Card class="progress-card">
            <h3>📊 进度追踪</h3>
            <div class="dual-progress">
              <div class="progress-item">
                <TaskProgress
                  :value="task.status === 'done' ? 100 : 0"
                  label="任务完成度"
                />
              </div>
              <div v-if="planProgress !== null" class="progress-item">
                <TaskProgress :value="planProgress" label="计划整体进度" />
                <small class="progress-hint">基于该计划下所有任务的完成比例计算</small>
              </div>
            </div>
          </Card>

          <!-- 主要操作按钮 -->
          <Card class="actions-card">
            <div class="main-actions">
              <Button 
                :variant="isTaskDone ? 'secondary' : 'primary'" 
                size="large"
                :loading="toggling"
                @click="toggleTaskStatus"
                class="complete-btn desktop-complete priority-essential"
              >
                {{ isTaskDone ? '撤销完成' : '✅ 标记完成' }}
              </Button>
              <div class="action-buttons">
                <Button variant="outline" @click="rescheduleTask" class="priority-medium">
                  📅 改期
                </Button>
                <Button variant="outline" @click="setReminder" class="priority-medium">
                  ⏰ 提醒
                </Button>
              </div>
            </div>
          </Card>

          <!-- 任务详情 -->
          <Card class="details-card" v-if="task.note">
            <h3>📝 任务详情</h3>
            <div class="note-content">
              <p class="note-text">{{ task.note }}</p>
            </div>
          </Card>
        </div>

        <!-- Secondary Layer: AI 分析区 - 移动端默认折叠 -->
        <Card 
          class="ai-analysis-card layer-secondary priority-medium"
          :class="{ 'mobile-collapsed': isMobile && !showAiPanel }"
        >
          <div class="ai-header" @click="toggleAiPanel">
            <h3>🤖 AI 智能分析</h3>
            <button 
              v-if="isMobile" 
              class="expand-toggle"
              type="button"
            >
              {{ showAiPanel ? '▲' : '▼' }}
            </button>
          </div>
          <div v-show="!isMobile || showAiPanel" class="ai-content">
            <p class="ai-insight">
              📊 <strong>任务分析：</strong>{{ aiAnalysis }}
            </p>
            <div class="ai-suggestions">
              <p class="suggestion-title">✨ <strong>优化建议：</strong></p>
              <ul class="suggestion-list">
                <li v-for="(suggestion, idx) in aiSuggestions" :key="idx">
                  {{ suggestion }}
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </template>

      <div v-else class="loading-state">
        <div class="spinner"></div>
        <p>正在加载任务详情…</p>
      </div>
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { useLogStore } from "@/store/log";
import { useUserStore } from "@/store/user";
import { usePlanStore } from "@/store/plans";
import PageScaffold from "@/components/common/PageScaffold.vue";
import Button from "@/components/common/Button.vue";
import Card from "@/components/common/Card.vue";
import TaskProgress from "@/components/task/TaskProgress.vue";

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const logStore = useLogStore();
const userStore = useUserStore();
const planStore = usePlanStore();

const id = Number(route.params.id);
const toggling = ref(false);
const showAiPanel = ref(false);
const isMobile = ref(window.innerWidth < 768);

// 当前任务
const task = computed(() => taskStore.tasks.find((t) => t.id === id));

function toggleAiPanel() {
  if (isMobile.value) {
    showAiPanel.value = !showAiPanel.value;
  }
}

// 页面标题数据
const pageTitle = computed(() => {
  return task.value ? task.value.title : '任务详情';
});

const pageSubtitle = computed(() => {
  const plan = planStore.plans.find((p: any) => p.id === task.value?.plan_id);
  return plan ? `来自计划：${plan.title}` : '查看任务详细信息';
});

// 计划相关信息
const planInfo = computed(() => {
  return planStore.plans.find((p: any) => p.id === task.value?.plan_id);
});

const planTitle = computed(() => {
  return planInfo.value?.title || '未关联计划';
});

const planPeriod = computed(() => {
  if (!planInfo.value) return '';
  return `${formatDate(planInfo.value.start_date)} - ${formatDate(planInfo.value.end_date)}`;
});

const planEmoji = computed(() => {
  const emojis = ['🎯', '🚀', '📚', '💪', '💰', '🎨'];
  const index = planInfo.value?.id ? planInfo.value.id % emojis.length : 0;
  return emojis[index];
});

// 贡献度相关
const contributionScore = computed(() => {
  if (!task.value || !planInfo.value) return 0;
  
  // 基于任务权重和计划进度计算贡献度
  const weight = taskWeight.value;
  const progress = planProgress.value || 0;
  const progressFactor = progress / 100;
  return Math.round(weight * progressFactor * 100);
});

const taskWeight = computed(() => {
  // 简化计算：根据任务日期在计划周期中的位置
  if (!task.value || !planInfo.value) return 0;
  
  const taskDate = new Date(task.value.task_date);
  const startDate = new Date(planInfo.value.start_date);
  const endDate = new Date(planInfo.value.end_date);
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((taskDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 关键节点权重更高
  if (elapsedDays <= 3 || elapsedDays >= totalDays - 3) {
    return 25;
  } else if (elapsedDays <= 7 || elapsedDays >= totalDays - 7) {
    return 15;
  } else {
    return 10;
  }
});

const milestoneText = computed(() => {
  if (taskWeight.value >= 25) return '关键节点';
  if (taskWeight.value >= 15) return '重要任务';
  return '普通任务';
});

const milestoneClass = computed(() => {
  if (taskWeight.value >= 25) return 'critical';
  if (taskWeight.value >= 15) return 'important';
  return 'normal';
});

// 任务完成状态
const isTaskDone = computed(() => {
  return task.value?.status === "done";
});

// 方法函数
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
}

function getContributionClass(score: number): string {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function getProgressClass(progress: number): string {
  if (progress >= 80) return 'good';
  if (progress >= 60) return 'warning';
  return 'danger';
}

// 操作函数
async function toggleTaskStatus() {
  if (!task.value) return;
  
  toggling.value = true;
  try {
    await taskStore.toggleTaskStatus(task.value.id);
    const userId = userStore.user?.id;
    if (userId) {
      const planTasks = taskStore.tasks.filter(t => t.plan_id === task.value!.plan_id);
      await logStore.generateTodayLog(userId, planTasks);
    }
  } catch (err) {
    console.error("更新任务状态失败:", err);
  } finally {
    toggling.value = false;
  }
}

function editTask() {
  if (task.value) {
    router.push(`/task/edit/${task.value.id}`);
  }
}

function duplicateTask() {
  console.log('复制任务功能待实现');
}

function rescheduleTask() {
  console.log('改期功能待实现');
}

function setReminder() {
  console.log('设置提醒功能待实现');
}

// 辅助：日期格式化、时长、重复类型、状态文案
function formatDateReadable(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return "今天";
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date(today + "T00:00:00");
  const diff = Math.floor((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 1) return "明天";
  if (diff === -1) return "昨天";
  return dateStr;
}

const statusText = computed(() => {
  if (!task.value) return "";
  if (task.value.status === "done") return "✔ 已完成";
  if (task.value.status === "missed") return "⚠ 逾期";
  return "● 进行中";
});

const durationMinutes = computed(() => {
  if (!task.value?.start_time || !task.value?.end_time) return 0;
  const [sh, sm] = task.value.start_time.split(":").map(Number);
  const [eh, em] = task.value.end_time.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
});

const repeatTypeLabel = computed(() => {
  if (!task.value?.repeat_type) return "";
  const labels: Record<string, string> = {
    daily: "每日重复",
    weekly: "每周重复",
    monthly: "每月重复",
    none: "",
  };
  return labels[task.value.repeat_type] || "";
});

const aiAnalysis = computed(() => {
  if (!task.value) return "";
  const duration = durationMinutes.value;
  if (duration > 120) {
    return "当前任务预计耗时较长（>2小时），建议分解为多个子任务以便跟踪进度。";
  }
  if (
    task.value.status === "pending" &&
    task.value.task_date < new Date().toISOString().slice(0, 10)
  ) {
    return "该任务已逾期，建议尽快完成或调整日期。";
  }
  return "任务安排合理，按计划执行即可。";
});

const aiSuggestions = computed(() => {
  if (!task.value) return [];
  const suggestions = [];
  if (durationMinutes.value > 90) {
    suggestions.push("将任务拆分为45-60分钟的小块，提升专注度");
  }
  if (!task.value.note || task.value.note.length < 10) {
    suggestions.push("添加更详细的备注，便于后续回顾与复盘");
  }
  if (
    task.value.repeat_type === "none" &&
    task.value.task_date === new Date().toISOString().slice(0, 10)
  ) {
    suggestions.push("如果这是常规任务，考虑设置为重复任务");
  }
  return suggestions.length > 0 ? suggestions : ["继续保持当前节奏！"];
});

// 计划层面的整体进度（同 plan_id 的所有任务在计划时间范围内计算）
const planProgress = computed(() => {
  if (!task.value) return null;

  // 获取当前任务所属的计划
  const plan = planStore.plans.find((p: any) => p.id === task.value!.plan_id);
  if (!plan) return 0;

  const startDate = new Date(plan.start_date);
  const endDate = new Date(plan.end_date);

  // 筛选属于该计划且在计划日期范围内的所有任务
  const tasksInRange = taskStore.tasks.filter((t: any) => {
    if (t.plan_id !== task.value!.plan_id) return false;
    const taskDate = new Date(t.task_date);
    return taskDate >= startDate && taskDate <= endDate;
  });

  if (tasksInRange.length === 0) return 0;
  const done = tasksInRange.filter((t: any) => t.status === "done").length;
  return Math.round((done / tasksInRange.length) * 100);
});

onMounted(async () => {
  // 若刷新后 store 为空，加载一次任务和计划数据
  if (!task.value) {
    await taskStore.loadTasks();
  }
  // 加载计划数据以便计算进度
  await planStore.loadPlans();
});

function back() {
  router.back();
}

// 生命周期
onMounted(async () => {
  if (!task.value) {
    await taskStore.loadTasks();
  }
  await planStore.loadPlans();
});
</script>

<style scoped>
.task-detail-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 响应式布局 */
.task-detail-container {
  display: grid;
  gap: var(--space-4);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* 桌面端双列布局 */
@media (min-width: 1025px) {
  .task-detail-container {
    grid-template-columns: 2fr 1fr;
  }
  
  .plan-contribution-card {
    /* 左侧：计划贡献 */
    grid-column: 1 / -1;
  }
  
  .task-core-card {
    /* 左侧：任务核心 */
  }
  
  .task-content-section {
    /* 左侧：任务内容 */
  }
  
  .ai-analysis-card {
    /* 右侧：AI分析 */
    align-self: start;
    position: sticky;
    top: calc(var(--header-height) + var(--space-4));
  }
}

/* 计划贡献卡片 */
.plan-contribution-card {
  background: linear-gradient(135deg, var(--ai-bg) 0%, var(--bg-card) 100%);
  border-left: 4px solid var(--ai-main);
  padding: var(--space-5);
}

.contribution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.contribution-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-main);
}

.contribution-score {
  text-align: right;
}

.contribution-score.high {
  color: var(--success);
}

.contribution-score.medium {
  color: var(--warning);
}

.contribution-score.low {
  color: var(--text-secondary);
}

.score-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.score-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.contribution-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.plan-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-main);
  border-radius: var(--radius-md);
}

.plan-avatar {
  font-size: 32px;
  flex-shrink: 0;
}

.plan-details {
  flex: 1;
}

.plan-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 var(--space-1) 0;
}

.plan-period {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.contribution-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-3);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-main);
  border-radius: var(--radius-md);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-card);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-fill.good {
  background: var(--success);
}

.progress-fill.warning {
  background: var(--warning);
}

.progress-fill.danger {
  background: var(--error);
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.stat-value.critical {
  color: var(--error);
}

.stat-value.important {
  color: var(--warning);
}

.stat-value.normal {
  color: var(--text-secondary);
}

/* 任务核心卡片 */
.task-core-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.task-header {
  margin-bottom: 0;
}

/* 任务内容区 */
.task-content-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.progress-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.progress-card h3 {
  margin: 0 0 var(--space-4) 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.dual-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.progress-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.actions-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.main-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.complete-btn {
  width: 100%;
  padding: var(--space-4);
  font-size: 16px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: var(--space-3);
}

.details-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.details-card h3 {
  margin: 0 0 var(--space-3) 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.note-content {
  padding: var(--space-4);
  background: var(--bg-main);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--ai-main);
}

.note-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-main);
}

/* AI 分析卡片 */
.ai-analysis-card {
  background: linear-gradient(135deg, var(--ai-bg) 0%, var(--bg-card) 100%);
  border-left: 4px solid var(--ai-main);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition: all var(--dur-normal) var(--ease-standard);
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
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

.mobile-collapsed .ai-header {
  margin-bottom: 0;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-3);
}

.ai-header {
  margin-bottom: var(--space-4);
}

.ai-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.ai-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ai-insight {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-main);
  margin: 0;
  padding: var(--space-4);
  background: var(--bg-main);
  border-radius: var(--radius-md);
}

.ai-suggestions {
  font-size: 13px;
}

.suggestion-title {
  margin: 0 0 var(--space-2) 0;
  color: var(--text-main);
}

.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.suggestion-list li {
  padding: var(--space-3) var(--space-4);
  background: var(--ai-bg);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  border-left: 3px solid var(--ai-main);
  line-height: 1.5;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: var(--space-3);
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-main);
  border-top-color: var(--ai-main);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .task-detail-container {
    padding: var(--space-4);
  }
  
  .contribution-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .contribution-score {
    text-align: left;
  }
  
  .plan-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .contribution-stats {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons Button {
    width: 100%;
  }
  
  /* 移动端优先级调整 */
  .desktop-actions {
    display: none !important;
  }
  
  .mobile-actions {
    display: flex !important;
  }
  
  .mobile-complete-btn {
    min-width: 80px;
    padding: var(--space-2) var(--space-3);
  }
  
  /* 桌面端完成按钮在移动端隐藏 */
  .desktop-complete {
    display: none !important;
  }
  
  /* AI面板默认折叠 */
  .ai-analysis-card {
    order: 3;
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
  
  /* 移动端完成按钮在桌面端隐藏 */
  .mobile-complete-btn {
    display: none !important;
  }
  
  .desktop-complete {
    display: block !important;
  }
}
</style>