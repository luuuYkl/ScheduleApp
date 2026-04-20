<template>
  <PageScaffold
    class="layer-context"
  >
    <template #actions>
      <div class="header-actions">
        <Button variant="ghost" size="small" @click="goBack" class="back-btn">
          ← 返回
        </Button>
        <Button variant="outline" size="small" @click="editTask">
          ✏️ 编辑
        </Button>
        <Button
          variant="danger"
          size="small"
          @click="confirmDelete"
          :loading="deleting"
        >
          🗑 删除
        </Button>
      </div>
    </template>

    <div class="task-detail-container" v-if="task">
      <!-- 🎯 任务核心卡片 -->
      <Card class="task-core-card">
        <div class="task-header">
          <div class="title-row">
            <span class="status-dot" :class="task.status"></span>
            <h1 class="task-title" :class="{ 'task-done': isTaskDone }">
              {{ task.title }}
            </h1>
          </div>
          <span class="status-tag" :class="task.status">{{ statusText }}</span>
        </div>

        <div class="task-meta-grid">
          <div class="meta-item" v-if="task.start_date">
            <span class="meta-icon">📅</span>
            <div class="meta-content">
              <span class="meta-label">日期</span>
              <span class="meta-value">{{ dateRangeText }}</span>
            </div>
          </div>
          <div class="meta-item" v-if="task.start_time && task.end_time">
            <span class="meta-icon">🕐</span>
            <div class="meta-content">
              <span class="meta-label">时间</span>
              <span class="meta-value">{{ task.start_time }} – {{ task.end_time }}</span>
            </div>
          </div>
          <div class="meta-item" v-if="durationMinutes > 0">
            <span class="meta-icon">⏱</span>
            <div class="meta-content">
              <span class="meta-label">时长</span>
              <span class="meta-value">{{ durationText }}</span>
            </div>
          </div>
          <div
            class="meta-item"
            v-if="task.repeat_type && task.repeat_type !== 'none'"
          >
            <span class="meta-icon">🔁</span>
            <div class="meta-content">
              <span class="meta-label">重复</span>
              <span class="meta-value">{{ repeatTypeLabel }}</span>
            </div>
          </div>
        </div>
      </Card>

      <!-- 📝 任务备注 -->
      <Card class="note-card" v-if="task.note">
        <h3 class="section-title">📝 备注</h3>
        <div class="note-content">
          <p>{{ task.note }}</p>
        </div>
      </Card>

      <!-- 📋 计划关联 -->
      <Card class="plan-card" v-if="planInfo">
        <h3 class="section-title">📋 所属计划</h3>
        <div class="plan-info">
          <div class="plan-main">
            <span class="plan-emoji">{{ planEmoji }}</span>
            <div class="plan-details">
              <span class="plan-title">{{ planInfo.title }}</span>
              <span class="plan-period">
                {{ formatDate(planInfo.start_date) }} – {{ formatDate(planInfo.end_date) }}
              </span>
            </div>
          </div>
          <div class="plan-progress" v-if="planProgress !== null">
            <div class="progress-row">
              <span class="progress-label">完成进度</span>
              <span class="progress-pct">{{ planProgress }}%</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: (planProgress || 0) + '%' }"
                :class="getProgressClass(planProgress || 0)"
              ></div>
            </div>
            <small class="progress-hint">
              {{ planDoneCount }}/{{ planTotalCount }} 个任务已完成
            </small>
          </div>
        </div>
      </Card>

      <!-- 🚀 操作区 -->
      <Card class="actions-card">
        <div class="main-actions">
          <Button
            :variant="isTaskDone ? 'secondary' : 'primary'"
            size="large"
            :loading="toggling"
            @click="toggleTaskStatus"
            class="complete-btn"
          >
            {{ isTaskDone ? '↩ 撤销完成' : '✅ 标记完成' }}
          </Button>
          <div class="secondary-actions">
            <Button variant="outline" @click="startFocus" :disabled="isTaskDone">
              🎯 专注模式
            </Button>
            <Button variant="outline" @click="editTask">
              ✏️ 编辑
            </Button>
          </div>
        </div>
      </Card>

      <!-- 🤖 智能建议 -->
      <Card class="ai-card" :ai="true">
        <div class="ai-header" @click="toggleAiPanel">
          <h3 class="section-title">🤖 智能建议</h3>
          <button v-if="isMobile" class="expand-toggle" type="button">
            {{ showAiPanel ? '收起 ▲' : '展开 ▼' }}
          </button>
        </div>
        <div v-show="!isMobile || showAiPanel" class="ai-content">
          <p class="ai-insight">{{ aiAnalysis }}</p>
          <ul class="ai-suggestions" v-if="aiSuggestions.length > 0">
            <li v-for="(s, idx) in aiSuggestions" :key="idx">{{ s }}</li>
          </ul>
        </div>
      </Card>
    </div>

    <!-- 加载状态 -->
    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>正在加载任务详情…</p>
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { usePlanStore } from "@/store/plans";
import PageScaffold from "@/components/common/PageScaffold.vue";
import Button from "@/components/common/Button.vue";
import Card from "@/components/common/Card.vue";

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const planStore = usePlanStore();

const id = Number(route.params.id);
const toggling = ref(false);
const deleting = ref(false);
const showAiPanel = ref(false);
const isMobile = ref(window.innerWidth < 768);

// 响应式监听
function handleResize() {
  isMobile.value = window.innerWidth < 768;
}
window.addEventListener("resize", handleResize);
onUnmounted(() => window.removeEventListener("resize", handleResize));

// 当前任务
const task = computed(() => taskStore.tasks.find((t) => t.id === id));

// 页面标题
const pageTitle = computed(() => task.value?.title ?? "任务详情");
const pageSubtitle = computed(() => {
  if (!task.value) return "";
  const plan = planStore.plans.find((p: any) => p.id === task.value!.plan_id);
  return plan ? `来自计划：${plan.title}` : "查看任务详细信息";
});

// 计划信息
const planInfo = computed(() => {
  return planStore.plans.find((p: any) => p.id === task.value?.plan_id);
});

const planEmoji = computed(() => {
  const emojis = ["🎯", "🚀", "📚", "💪", "💰", "🎨"];
  const index = planInfo.value?.id ? planInfo.value.id % emojis.length : 0;
  return emojis[index];
});

// 任务状态
const isTaskDone = computed(() => task.value?.status === "done");

const statusText = computed(() => {
  if (!task.value) return "";
  const map: Record<string, string> = {
    done: "✔ 已完成",
    missed: "⚠ 已逾期",
    pending: "● 进行中",
  };
  return map[task.value.status] || "● 进行中";
});

// 日期范围
const dateRangeText = computed(() => {
  if (!task.value) return "";
  const { start_date, end_date } = task.value;
  if (start_date === end_date) {
    return formatDateReadable(start_date);
  }
  return `${formatDateReadable(start_date)} ~ ${formatDateReadable(end_date)}`;
});

// 时长
const durationMinutes = computed(() => {
  if (!task.value?.start_time || !task.value?.end_time) return 0;
  const [sh, sm] = task.value.start_time.split(":").map(Number);
  const [eh, em] = task.value.end_time.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
});

const durationText = computed(() => {
  const m = durationMinutes.value;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}小时${r}分钟` : `${h}小时`;
  }
  return `${m}分钟`;
});

// 重复类型
const repeatTypeLabel = computed(() => {
  if (!task.value?.repeat_type) return "";
  const labels: Record<string, string> = {
    daily: "每日重复",
    weekly: "每周重复",
    monthly: "每月重复",
  };
  return labels[task.value.repeat_type] || "";
});

// 计划进度
const planProgressData = computed(() => {
  if (!task.value || !planInfo.value) return null;
  const planId = task.value.plan_id;
  const planTasks = taskStore.tasks.filter((t: any) => t.plan_id === planId);
  const done = planTasks.filter((t: any) => t.status === "done").length;
  const total = planTasks.length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
});

const planProgress = computed(() => planProgressData.value?.pct ?? null);
const planDoneCount = computed(() => planProgressData.value?.done ?? 0);
const planTotalCount = computed(() => planProgressData.value?.total ?? 0);

// AI 分析
const aiAnalysis = computed(() => {
  if (!task.value) return "";
  const duration = durationMinutes.value;
  const today = new Date().toISOString().slice(0, 10);
  const { start_date, end_date, status } = task.value;

  if (status === "done") return "任务已完成，做得好！继续保持高效节奏。";
  if (status === "missed") return "该任务已逾期，建议尽快调整日期或完成它。";
  if (duration > 120) return "任务预计耗时较长（>2小时），建议分解为多个子任务。";
  if (end_date < today) return "任务截止日期已过，建议尽快处理或重新安排。";
  if (start_date > today) return "任务尚未开始，提前做好规划准备。";
  return "任务安排合理，按计划执行即可。";
});

const aiSuggestions = computed(() => {
  if (!task.value) return [];
  const suggestions: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  if (durationMinutes.value > 90) {
    suggestions.push("将任务拆分为 45-60 分钟的小块，提升专注度");
  }
  if (!task.value.note || task.value.note.length < 10) {
    suggestions.push("添加更详细的备注，便于后续回顾与复盘");
  }
  if (task.value.repeat_type === "none" && task.value.start_date === today) {
    suggestions.push("如果这是常规任务，考虑设置为重复任务");
  }
  if (task.value.status === "pending" && task.value.end_date < today) {
    suggestions.push("调整截止日期或分解为更小的步骤");
  }
  return suggestions;
});

function toggleAiPanel() {
  if (isMobile.value) showAiPanel.value = !showAiPanel.value;
}

// 操作函数
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/home");
  }
}

async function toggleTaskStatus() {
  if (!task.value) return;
  toggling.value = true;
  try {
    await taskStore.toggleTaskStatus(task.value.id);
  } catch (err) {
    console.error("更新任务状态失败:", err);
  } finally {
    toggling.value = false;
  }
}

function editTask() {
  if (task.value) {
    router.push(`/task/${task.value.id}/edit`);
  }
}

async function confirmDelete() {
  if (!task.value) return;
  if (!confirm(`确定要删除任务「${task.value.title}」吗？此操作不可撤销。`)) return;

  deleting.value = true;
  try {
    await taskStore.deleteTask(task.value.id);
    router.replace("/home");
  } catch (err) {
    console.error("删除任务失败:", err);
  } finally {
    deleting.value = false;
  }
}

function startFocus() {
  if (task.value) {
    router.push({ path: "/focus", query: { taskId: String(task.value.id) } });
  }
}

// 辅助函数
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

function formatDateReadable(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return "今天";
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date(today + "T00:00:00");
  const diff = Math.floor(
    (d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 1) return "明天";
  if (diff === -1) return "昨天";
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function getProgressClass(progress: number): string {
  if (progress >= 80) return "good";
  if (progress >= 50) return "warning";
  return "danger";
}

// 初始化
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

/* 头部操作栏 */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.back-btn {
  color: var(--text-secondary) !important;
}

/* ========== 任务核心卡片 ========== */
.task-core-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.task-header {
  margin-bottom: var(--space-5);
}

.title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.done {
  background: var(--success);
}
.status-dot.pending {
  background: var(--color-brand-500);
}
.status-dot.missed {
  background: var(--error);
}

.task-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-emphasis);
  margin: 0;
  line-height: 1.4;
}
.task-title.task-done {
  text-decoration: line-through;
  color: var(--text-muted);
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 500;
}
.status-tag.done {
  background: var(--success-bg);
  color: var(--success);
}
.status-tag.pending {
  background: var(--info-bg);
  color: var(--info);
}
.status-tag.missed {
  background: var(--error-bg);
  color: var(--error);
}

/* 元信息网格 */
.task-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-3);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
}

.meta-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.meta-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.meta-label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.meta-value {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== 备注卡片 ========== */
.note-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.section-title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-main);
}

.note-content {
  padding: var(--space-4);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--ai-main);
}

.note-content p {
  margin: 0;
  font-size: var(--font-size-base);
  line-height: 1.7;
  color: var(--text-main);
}

/* ========== 计划关联卡片 ========== */
.plan-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.plan-main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--ai-bg);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--ai-main);
}

.plan-emoji {
  font-size: 28px;
  flex-shrink: 0;
}

.plan-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.plan-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-main);
}

.plan-period {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.plan-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.progress-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.progress-pct {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  height: 6px;
  background: var(--bg-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s var(--ease-standard);
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

.progress-hint {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* ========== 操作卡片 ========== */
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
}

.secondary-actions {
  display: flex;
  gap: var(--space-3);
}
.secondary-actions > * {
  flex: 1;
}

/* ========== AI 智能建议卡片 ========== */
.ai-card {
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.ai-header .section-title {
  margin: 0;
}

.expand-toggle {
  background: none;
  border: none;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: background var(--dur-fast) var(--ease-standard);
}
.expand-toggle:hover {
  background: var(--bg-elevated);
}

.ai-content {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.ai-insight {
  margin: 0;
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: var(--text-main);
  padding: var(--space-3);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
}

.ai-suggestions {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ai-suggestions li {
  padding: var(--space-3) var(--space-4);
  background: var(--ai-bg);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--ai-main);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ========== 加载状态 ========== */
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
  width: 36px;
  height: 36px;
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

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .task-detail-container {
    gap: var(--space-3);
  }

  .task-core-card {
    padding: var(--space-4);
  }

  .task-title {
    font-size: 18px;
  }

  .task-meta-grid {
    grid-template-columns: 1fr 1fr;
  }

  .secondary-actions {
    flex-direction: column;
  }

  .header-actions .back-btn {
    display: none;
  }

  .note-card,
  .plan-card,
  .actions-card,
  .ai-card {
    padding: var(--space-4);
  }
}

@media (max-width: 480px) {
  .task-meta-grid {
    grid-template-columns: 1fr;
  }

  .task-title {
    font-size: 16px;
  }
}
</style>