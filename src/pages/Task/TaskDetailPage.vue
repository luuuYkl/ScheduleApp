<template>
  <div class="page task-detail-page">
    <div class="detail-container">
      <template v-if="task">
        <!-- 右上角操作菜单 -->
        <div class="actions-menu">
          <button class="action-btn" @click="back" title="返回">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5m0 0l7 7m-7-7l7-7"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <button class="action-btn" title="编辑">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <!-- ========== 第一段：任务头部区 ========== -->
        <section class="task-header">
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
        </section>

        <div class="divider"></div>

        <!-- ========== 第二段：任务内容区 ========== -->
        <section class="task-content">
          <!-- 进度条 -->
          <div class="progress-section">
            <TaskProgress
              :value="task.status === 'done' ? 100 : 0"
              label="该任务进度"
            />
            <div v-if="planProgress !== null" class="plan-progress">
              <TaskProgress :value="planProgress" label="所属计划整体进度" />
              <small class="hint">基于该计划下任务的完成比例计算</small>
            </div>
          </div>

          <!-- 快速操作：标记完成 -->
          <div class="quick-action">
            <TaskCheckBox v-model="isTaskDone" :disabled="toggling">
              {{ isTaskDone ? "标记为未完成" : "标记为已完成" }}
            </TaskCheckBox>
          </div>

          <!-- 任务描述 -->
          <div class="task-description" v-if="task.note">
            <h3 class="section-heading">📝 备注</h3>
            <p class="description-text">{{ task.note }}</p>
          </div>
        </section>

        <div class="divider"></div>

        <!-- ========== 第三段：AI 分析区 ========== -->
        <section class="ai-section">
          <button class="ai-toggle" @click="aiExpanded = !aiExpanded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
            <span class="ai-title">🤖 AI 分析与建议</span>
            <svg
              class="chevron"
              :class="{ expanded: aiExpanded }"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <div class="ai-panel" v-show="aiExpanded">
            <div class="ai-content">
              <p class="ai-insight">
                📊 <strong>任务分析：</strong>{{ aiAnalysis }}
              </p>

              <div class="ai-suggestions">
                <p class="suggestion-title">✨ <strong>建议：</strong></p>
                <ul class="suggestion-list">
                  <li v-for="(suggestion, idx) in aiSuggestions" :key="idx">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </template>

      <div v-else class="loading-state">
        <div class="spinner"></div>
        <p>正在加载任务详情…</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { useLogStore } from "@/store/log"; // 新增
import { useUserStore } from "@/store/user"; // 新增
import { usePlanStore } from "@/store/plans"; // 新增
import TaskProgress from "@/components/task/TaskProgress.vue";
import TaskCheckBox from "@/components/task/TaskCheckBox.vue";

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const logStore = useLogStore(); // 新增
const userStore = useUserStore(); // 新增
const planStore = usePlanStore(); // 新增

const id = Number(route.params.id);
const toggling = ref(false);
const aiExpanded = ref(false);

// 当前任务
const task = computed(() => taskStore.tasks.find((t) => t.id === id));

// 使用计算属性处理任务完成状态
const isTaskDone = computed({
  get: () => {
    const isDone = task.value?.status === "done";
    console.log("[Debug] isTaskDone.get:", isDone);
    return isDone;
  },
  set: async (newValue: boolean) => {
    console.log("[Debug] isTaskDone.set 开始, newValue:", newValue);
    if (!task.value) {
      console.error("[Error] task.value 为空");
      return;
    }
    toggling.value = true;
    try {
      await taskStore.toggleTaskStatus(task.value.id);
      // 勾选或取消都应更新当天日志
      const userId = userStore.user?.id;
      if (!userId) {
        console.error("[Error] 用户未登录或ID无效");
        return;
      }
      // 只同步同计划下所有任务（如需全量可改为 taskStore.tasks）
      const planTasks = taskStore.tasks.filter(
        (t) => t.plan_id === task.value!.plan_id,
      );
      await logStore.generateTodayLog(userId, planTasks);
    } catch (err) {
      console.error("[Error] 更新任务状态或生成日志失败:", err);
    } finally {
      toggling.value = false;
    }
  },
});

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
</script>

<style scoped>
.task-detail-page {
  min-height: 100vh;
  background: var(--bg-main);
  padding: 1rem;
  padding-top: calc(var(--header-height, 64px) + 1rem);
  padding-bottom: calc(var(--footer-height, 64px) + 1rem);
}

.detail-container {
  max-width: 720px;
  margin: 0 auto;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  position: relative;
}

/* 右上角操作菜单 */
.actions-menu {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border-main);
  background: var(--bg-card);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-main);
  color: var(--text-main);
}

/* ========== 第一段：任务头部区 ========== */
.task-header {
  margin-bottom: 2rem;
}

.title-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 8px;
  flex-shrink: 0;
}
.status-dot.pending {
  background: var(--color-warning);
}
.status-dot.done {
  background: var(--color-success);
}
.status-dot.missed {
  background: var(--color-danger);
}

.task-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.3;
  margin: 0;
}

.status-label {
  margin-bottom: 16px;
}

.label {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
}
.label.done {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}
.label.pending {
  background: rgba(234, 179, 8, 0.12);
  color: var(--color-warning);
}
.label.missed {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

/* 核心属性条 */
.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-item svg {
  opacity: 0.6;
}

.meta-item.priority {
  color: var(--color-primary);
  font-weight: 500;
}

/* 分割线 */
.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 2rem 0;
}

/* ========== 第二段：任务内容区 ========== */
.task-content {
  margin-bottom: 2rem;
}

.progress-section {
  margin-bottom: 1.5rem;
}

.plan-progress {
  margin-top: 1rem;
}

.hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 12px;
  color: var(--text-muted);
}

.quick-action {
  margin: 1.5rem 0;
}

.section-heading {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 12px 0;
}

.task-description {
  margin-top: 1.5rem;
}

.description-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
  max-width: 65ch;
  margin: 0;
}

/* ========== 第三段：AI 分析区 ========== */
.ai-section {
  margin-top: 2rem;
}

.ai-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-main);
}

.ai-toggle:hover {
  background: var(--bg-main);
}

.ai-title {
  flex: 1;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
}

.chevron {
  transition: transform 0.2s;
}

.chevron.expanded {
  transform: rotate(180deg);
}

.ai-panel {
  margin-top: 16px;
  padding: 16px;
  border-left: 3px solid var(--ai-main, #6366f1);
  background: var(--ai-bg, rgba(99, 102, 241, 0.05));
  border-radius: 0 8px 8px 0;
}

.ai-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-insight {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-main);
  margin: 0;
}

.ai-suggestions {
  font-size: 13px;
}

.suggestion-title {
  margin: 0 0 8px 0;
  color: var(--text-main);
}

.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-list li {
  padding-left: 20px;
  position: relative;
  color: var(--text-secondary);
  line-height: 1.5;
}

.suggestion-list li::before {
  content: "•";
  position: absolute;
  left: 8px;
  color: var(--ai-main, #6366f1);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-main);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .detail-container {
    padding: 1.5rem;
    border-radius: 0;
  }

  .actions-menu {
    top: 1rem;
    right: 1rem;
  }

  .task-title {
    font-size: 20px;
  }

  .task-meta {
    gap: 12px;
  }
}
</style>
