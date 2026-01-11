// ...existing code...
<template>
  <div class="plan-overview-section">
    <div class="section-header">
      <h2 class="section-title">📈 我的计划</h2>
      <button class="btn-new-plan" @click="goCreate">
        <span class="icon">➕</span>
        <span class="text">新建</span>
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="sortedPlans.length === 0" class="empty-state">
      <p class="empty-icon">📋</p>
      <p class="empty-text">暂无长期计划</p>
      <p class="empty-hint">点击右上角创建你的第一个计划吧</p>
    </div>

    <!-- 计划卡片列表 -->
    <div v-else class="plans-container">
      <div class="plans-scroll-wrapper">
        <div :class="['plans-grid', { 'show-all': showAll }]">
          <div
            v-for="plan in displayedPlans"
            :key="plan.id"
            class="plan-card"
          >
            <!-- 1. 计划名称 -->
            <h3 class="plan-title">🎯 {{ plan.title }}</h3>

            <!-- 2. 进度表达 -->
            <div class="plan-progress">
              <div class="progress-visual">
                <div class="progress-segments">
                  <span
                    v-for="i in 5"
                    :key="i"
                    :class="['segment', { filled: i <= Math.ceil(progressFor(plan.id) / 20) }]"
                  >
                    {{ i <= Math.ceil(progressFor(plan.id) / 20) ? '█' : '▒' }}
                  </span>
                </div>
                <span class="progress-percent">{{ progressFor(plan.id) }}%</span>
              </div>
            </div>

            <!-- 3. 当前状态 -->
            <div class="plan-status">
              <span class="status-label">当前阶段：</span>
              <span class="status-text">{{ getStageText(plan) }}</span>
            </div>

            <!-- 4. AI 洞察（可选） -->
            <details class="ai-insight" v-if="getAIInsight(plan)">
              <summary>🤖 AI 洞察</summary>
              <p>{{ getAIInsight(plan) }}</p>
            </details>

            <!-- 操作按钮 -->
            <div class="plan-actions">
              <button class="btn-action btn-manage" @click="goPlanTasks(plan.id)">
                管理任务
              </button>
              <button class="btn-action btn-edit" @click="editPlan(plan.id)">
                修改
              </button>
              <button class="btn-action btn-delete" @click="removePlan(plan.id)" :disabled="loading">
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 查看全部按钮 -->
      <button
        v-if="sortedPlans.length > 6"
        class="btn-show-all"
        @click="showAll = !showAll"
      >
        {{ showAll ? '收起' : `查看全部 (${sortedPlans.length})` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";

const router = useRouter();
const planStore = usePlanStore();
const taskStore = useTaskStore();

const loading = ref(false);
const showAll = ref(false);

// 排序后的计划列表（按重要性排序）
const sortedPlans = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return [...planStore.plans].sort((a: any, b: any) => {
    // 1. 当前正在进行的计划（开始日期 <= 今天 <= 结束日期）
    const aActive = a.start_date <= today && a.end_date >= today;
    const bActive = b.start_date <= today && b.end_date >= today;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;

    // 2. 按进度排序（有推进的优先）
    const aProgress = progressFor(a.id);
    const bProgress = progressFor(b.id);
    if (aProgress > 0 && bProgress === 0) return -1;
    if (aProgress === 0 && bProgress > 0) return 1;

    // 3. 按创建时间倒序
    return (b.id || 0) - (a.id || 0);
  });
});

// 显示的计划列表（前6个或全部）
const displayedPlans = computed(() => {
  return showAll.value ? sortedPlans.value : sortedPlans.value.slice(0, 6);
});

onMounted(async () => {
  await planStore.loadPlans();
  await taskStore.loadTasks();
});

function progressFor(planId: number) {
  const plan = planStore.plans.find((p: any) => p.id === planId);
  if (!plan) return 0;

  const startDate = new Date(plan.start_date);
  const endDate = new Date(plan.end_date);

  const tasksInRange = taskStore.tasks.filter((t: any) => {
    if (t.plan_id !== planId) return false;
    const taskDate = new Date(t.task_date);
    return taskDate >= startDate && taskDate <= endDate;
  });

  if (tasksInRange.length === 0) return 0;

  const done = tasksInRange.filter((t: any) => t.status === "done").length;
  return Math.round((done / tasksInRange.length) * 100);
}

function getStageText(plan: any): string {
  const progress = progressFor(plan.id);
  const today = new Date().toISOString().slice(0, 10);
  
  // 检查最近7天是否有推进
  const recentTasks = taskStore.tasks.filter((t: any) => {
    if (t.plan_id !== plan.id) return false;
    const taskDate = new Date(t.task_date);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return taskDate >= sevenDaysAgo && t.status === 'done';
  });

  if (plan.start_date > today) return '未开始';
  if (plan.end_date < today) return '已结束';
  if (recentTasks.length === 0) return '最近 7 天无推进';
  if (progress < 30) return '初期积累';
  if (progress < 70) return '稳步推进';
  return '即将完成';
}

function getAIInsight(plan: any): string {
  const progress = progressFor(plan.id);
  const today = new Date().toISOString().slice(0, 10);
  
  const recentTasks = taskStore.tasks.filter((t: any) => {
    if (t.plan_id !== plan.id) return false;
    const taskDate = new Date(t.task_date);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return taskDate >= sevenDaysAgo && t.status === 'done';
  });

  if (plan.end_date < today) return '';
  if (recentTasks.length === 0) return '建议重新审视目标，或降低任务频率';
  if (recentTasks.length >= 3) return '最近推进稳定，建议下周保持节奏';
  if (progress > 80) return '即将完成，注意冲刺阶段不要松懈';
  return '推进平稳，可适当增加任务密度';
}

function goCreate() {
  router.push("/plan/create");
}

function editPlan(id: number | string) {
  router.push({ path: "/plan/create", query: { edit: String(id) } });
}

async function removePlan(id: number) {
  if (!confirm("确定删除该计划吗？相关任务也会一并删除。")) return;
  loading.value = true;
  try {
    await planStore.removePlan(id);
    await Promise.all([planStore.loadPlans(), taskStore.loadTasks()]);
  } catch (e: any) {
    alert(e?.message || "删除失败");
  } finally {
    loading.value = false;
  }
}

function goPlanTasks(id: number | string) {
  if (router.hasRoute("plan-tasks")) {
    router.push({ name: "plan-tasks", params: { id: String(id) } });
  } else {
    router.push(`/plan/${id}/tasks`);
  }
}
</script>

<style scoped>
.plan-overview-section {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 1.5rem;
  border: 1px solid var(--border-subtle);
}

/* 区块标题 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.btn-new-plan {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--ai-main);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-new-plan:hover {
  background: var(--ai-light);
  transform: translateY(-1px);
}

.btn-new-plan .icon {
  font-size: 14px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
}

/* 计划容器 */
.plans-container {
  position: relative;
}

/* 滚动包装器（移动端） */
.plans-scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.plans-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

/* 计划网格 */
.plans-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

/* 桌面端：2-3列网格 */
@media (min-width: 768px) {
  .plans-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .plans-grid:not(.show-all) {
    max-height: none;
    grid-template-rows: auto auto auto;
  }
}

@media (min-width: 1024px) {
  .plans-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 移动端：横向滑动 */
@media (max-width: 767px) {
  .plans-grid {
    display: flex;
    gap: 1rem;
    padding-bottom: 0.5rem;
  }
  
  .plans-grid:not(.show-all) .plan-card:nth-child(n+4) {
    display: none;
  }
}

/* 单个计划卡片 */
.plan-card {
  background: var(--bg-elevated);
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid var(--border-main);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s;
  min-height: 240px;
}

@media (max-width: 767px) {
  .plan-card {
    min-width: 280px;
    flex-shrink: 0;
  }
  
  .plan-card:last-child {
    margin-right: 0.5rem;
  }
}

.plan-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 1. 计划名称 */
.plan-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-main);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 2.8em;
}

/* 2. 进度表达 */
.plan-progress {
  opacity: 0.9;
}

.progress-visual {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.progress-segments {
  display: flex;
  gap: 0.25rem;
  font-size: 16px;
  line-height: 1;
  letter-spacing: 0.1em;
}

.segment {
  color: var(--text-muted);
  transition: color 0.3s;
}

.segment.filled {
  color: var(--ai-main);
}

.progress-percent {
  font-size: 20px;
  font-weight: 600;
  color: var(--ai-main);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* 3. 当前状态 */
.plan-status {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 0.5rem 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.status-label {
  opacity: 0.7;
}

.status-text {
  font-weight: 500;
}

/* 4. AI 洞察 */
.ai-insight {
  font-size: 11px;
  background: var(--ai-bg);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ai-border);
  margin-top: auto;
}

.ai-insight summary {
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  color: var(--ai-main);
  list-style: none;
}

.ai-insight summary::-webkit-details-marker {
  display: none;
}

.ai-insight p {
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
  color: var(--text-secondary);
}

/* 操作按钮 */
.plan-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-action {
  flex: 1;
  min-width: 70px;
  padding: 0.5rem 0.75rem;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-main);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-action:hover:not(:disabled) {
  background: var(--bg-card-hover);
  border-color: var(--border-emphasis);
  color: var(--text-main);
}

.btn-manage:hover {
  border-color: var(--ai-main);
  color: var(--ai-main);
}

.btn-delete:hover:not(:disabled) {
  border-color: var(--error);
  color: var(--error);
  background: var(--error-bg);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 查看全部按钮 */
.btn-show-all {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  background: transparent;
  border: 1px dashed var(--border-main);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-show-all:hover {
  background: var(--bg-elevated);
  border-color: var(--border-emphasis);
  color: var(--text-main);
}

/* 响应式优化 */
@media (max-width: 767px) {
  .plan-overview-section {
    padding: 1rem;
  }
  
  .section-header {
    margin-bottom: 1rem;
  }
  
  .section-title {
    font-size: 16px;
  }
  
  .btn-new-plan {
    padding: 0.4rem 0.75rem;
    font-size: 12px;
  }
  
  .plan-card {
    padding: 1rem;
    min-height: 220px;
  }
  
  .plan-title {
    font-size: 14px;
  }
}
</style>
// ...existing code...