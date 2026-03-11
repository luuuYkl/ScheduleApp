<!--
  ═══════════════════════════════════════════════════════════════
  计划概览组件 (PlanOverview.vue)
  ═══════════════════════════════════════════════════════════════
  
  【组件定位】
  今日页面的右侧面板，展示用户的长期计划列表及其进度状态。
  
  【核心功能】
  1. 计划列表 - 显示所有长期计划，按重要性智能排序
  2. 进度追踪 - 可视化展示每个计划的完成百分比
  3. 状态判断 - 根据时间和进度判断当前阶段
  4. AI洞察 - 提供智能建议（可展开/收起）
  5. 快捷操作 - 管理任务、编辑、删除
  
  【卡片结构】
  ┌─────────────────────────────────────┐
  │  计划标题                           │
  │  ████████░░░░░░░░  65%             │  ← 进度条
  │  ───────────────────────────────    │
  │  当前阶段：稳步推进                  │  ← 状态
  │  ┌─────────────────────────────┐    │
  │  │ ▸ AI 洞察                   │    │  ← 可展开
  │  │   最近推进稳定，建议保持节奏  │    │
  │  └─────────────────────────────┘    │
  │  [管理任务] [修改] [删除]           │  ← 操作按钮
  └─────────────────────────────────────┘
  
  【排序规则】
  1. 进行中的计划优先（开始日期 ≤ 今天 ≤ 结束日期）
  2. 有进度的计划优先
  3. 按创建时间倒序
  
  【状态判断逻辑】
  - 未开始：开始日期 > 今天
  - 已结束：结束日期 < 今天
  - 最近7天无推进：有任务但最近无完成
  - 初期积累：进度 < 30%
  - 稳步推进：30% ≤ 进度 < 70%
  - 即将完成：进度 ≥ 70%
  
  【响应式适配】
  - 桌面端：2-3列网格布局
  - 移动端：单行横向滑动卡片
  
  【数据来源】
  - planStore: 计划数据仓库
  - taskStore: 任务数据仓库（用于计算进度）
-->
<template>
  <div class="plan-overview-section">
    <!-- ========== 标题栏 ========== -->
    <div class="section-header">
      <h2 class="section-title">我的计划</h2>
      <!-- 创建计划按钮已移除，使用悬浮按钮替代 -->
    </div>

    <!-- ========== 骨架屏加载状态 ========== -->
    <div v-if="loading" class="skeleton-container">
      <div class="skeleton-grid">
        <div v-for="i in 3" :key="i" class="skeleton-card">
          <div class="skeleton-header">
            <div class="skeleton-title"></div>
            <div class="skeleton-actions">
              <div class="skeleton-action-btn"></div>
              <div class="skeleton-action-btn"></div>
              <div class="skeleton-action-btn"></div>
            </div>
          </div>
          <div class="skeleton-progress">
            <div class="skeleton-progress-bar"></div>
            <div class="skeleton-percent"></div>
          </div>
          <div class="skeleton-footer">
            <div class="skeleton-status"></div>
            <div class="skeleton-hint"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 空状态提示（优化版） ========== -->
    <div v-else-if="sortedPlans.length === 0" class="empty-state-enhanced">
      <div class="empty-illustration">
        <div class="empty-decoration">
          <span class="deco-circle deco-1"></span>
          <span class="deco-circle deco-2"></span>
          <span class="deco-circle deco-3"></span>
        </div>
        <span class="empty-icon-animated">📋</span>
      </div>
      <p class="empty-text">暂无长期计划</p>
      <p class="empty-hint">点击下方按钮开始规划你的目标</p>
    </div>

    <!-- ========== 计划卡片列表 ========== -->
    <div v-else class="plans-container">
      <!-- 滚动容器 (移动端支持横向滑动) -->
      <div class="plans-scroll-wrapper">
        <div :class="['plans-grid', { 'show-all': showAll }]">
          <!-- 单个计划卡片 - 横向布局 -->
          <div v-for="plan in displayedPlans" :key="plan.id" class="plan-card">
            <!-- 第一行：标题 + 操作按钮 -->
            <div class="card-header">
              <h3 class="plan-title">{{ plan.title }}</h3>
              <div class="card-actions">
                <button class="action-btn" @click="goPlanTasks(plan.id)" title="管理任务">
                  <span class="action-icon">📋</span>
                </button>
                <button class="action-btn" @click="editPlan(plan.id)" title="修改">
                  <span class="action-icon">✏️</span>
                </button>
                <button class="action-btn action-danger" @click="removePlan(plan.id)" :disabled="loading" title="删除">
                  <span class="action-icon">🗑️</span>
                </button>
              </div>
            </div>

            <!-- 第二行：进度条 -->
            <div class="plan-progress">
              <div class="progress-bar">
                <a-progress
                  :percent="progressFor(plan.id) / 100"
                  :show-text="false"
                  size="small"
                />
              </div>
              <span class="progress-percent">{{ progressFor(plan.id) }}%</span>
            </div>

            <!-- 第三行：状态 + AI洞察 -->
            <div class="card-footer">
              <span class="plan-status">
                <span class="status-dot" :class="getStatusClass(plan)"></span>
                {{ getStageText(plan) }}
              </span>
              <span class="ai-hint" v-if="getAIInsight(plan)" :title="getAIInsight(plan)">
                💡 {{ getAIInsight(plan).slice(0, 15) }}...
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 查看全部按钮 -->
      <a-button
        v-if="sortedPlans.length > 6"
        long
        type="dashed"
        @click="showAll = !showAll"
      >
        {{ showAll ? "收起" : `查看全部 (${sortedPlans.length})` }}
      </a-button>
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

const loading = ref(true); // 初始为加载状态，用于显示骨架屏
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
  try {
    await planStore.loadPlans();
    await taskStore.loadTasks();
  } finally {
    loading.value = false;
  }
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
    return taskDate >= sevenDaysAgo && t.status === "done";
  });

  if (plan.start_date > today) return "未开始";
  if (plan.end_date < today) return "已结束";
  if (recentTasks.length === 0) return "最近 7 天无推进";
  if (progress < 30) return "初期积累";
  if (progress < 70) return "稳步推进";
  return "即将完成";
}

function getAIInsight(plan: any): string {
  const progress = progressFor(plan.id);
  const today = new Date().toISOString().slice(0, 10);

  const recentTasks = taskStore.tasks.filter((t: any) => {
    if (t.plan_id !== plan.id) return false;
    const taskDate = new Date(t.task_date);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return taskDate >= sevenDaysAgo && t.status === "done";
  });

  if (plan.end_date < today) return "";
  if (recentTasks.length === 0) return "建议重新审视目标，或降低任务频率";
  if (recentTasks.length >= 3) return "最近推进稳定，建议下周保持节奏";
  if (progress > 80) return "即将完成，注意冲刺阶段不要松懈";
  return "推进平稳，可适当增加任务密度";
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

// 获取状态样式类
function getStatusClass(plan: any): string {
  const progress = progressFor(plan.id);
  const today = new Date().toISOString().slice(0, 10);
  
  if (plan.start_date > today) return "status-pending";
  if (plan.end_date < today) return "status-ended";
  if (progress >= 70) return "status-success";
  if (progress >= 30) return "status-progress";
  return "status-early";
}
</script>

<style scoped>
.plan-overview-section {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: var(--space-5);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 650px;
  overflow: hidden;
  width: 100%;
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

/* 创建计划按钮样式已移除 */

/* ========================================
   骨架屏样式
   ======================================== */
.skeleton-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.skeleton-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .skeleton-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 767px) {
  .skeleton-grid {
    display: flex;
    gap: 1rem;
  }

  .skeleton-card {
    min-width: 260px;
    flex-shrink: 0;
  }
}

.skeleton-card {
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-main);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.skeleton-title {
  width: 60%;
  height: 18px;
  background: linear-gradient(
    90deg,
    var(--border-subtle) 25%,
    var(--border-main) 50%,
    var(--border-subtle) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-actions {
  display: flex;
  gap: 0.25rem;
}

.skeleton-action-btn {
  width: 28px;
  height: 28px;
  background: linear-gradient(
    90deg,
    var(--border-subtle) 25%,
    var(--border-main) 50%,
    var(--border-subtle) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 6px;
}

.skeleton-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.skeleton-progress-bar {
  flex: 1;
  height: 8px;
  background: linear-gradient(
    90deg,
    var(--border-subtle) 25%,
    var(--border-main) 50%,
    var(--border-subtle) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-percent {
  width: 36px;
  height: 18px;
  background: linear-gradient(
    90deg,
    var(--border-subtle) 25%,
    var(--border-main) 50%,
    var(--border-subtle) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.skeleton-status {
  width: 80px;
  height: 14px;
  background: linear-gradient(
    90deg,
    var(--border-subtle) 25%,
    var(--border-main) 50%,
    var(--border-subtle) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-hint {
  width: 100px;
  height: 14px;
  background: linear-gradient(
    90deg,
    var(--border-subtle) 25%,
    var(--border-main) 50%,
    var(--border-subtle) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ========================================
   优化版空状态样式
   ======================================== */
.empty-state-enhanced {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-illustration {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.empty-decoration {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: var(--ai-bg);
  opacity: 0.6;
}

.deco-1 {
  width: 100px;
  height: 100px;
  animation: deco-pulse 3s ease-in-out infinite;
}

.deco-2 {
  width: 70px;
  height: 70px;
  background: var(--ai-main);
  opacity: 0.15;
  animation: deco-pulse 3s ease-in-out infinite 0.5s;
}

.deco-3 {
  width: 40px;
  height: 40px;
  background: var(--ai-light);
  opacity: 0.25;
  animation: deco-pulse 3s ease-in-out infinite 1s;
}

@keyframes deco-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.15;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.25;
  }
}

.empty-icon-animated {
  font-size: 3rem;
  position: relative;
  z-index: 1;
  animation: icon-float 3s ease-in-out infinite;
}

@keyframes icon-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.empty-state-enhanced .empty-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 0.5rem;
}

.empty-state-enhanced .empty-hint {
  font-size: 13px;
  color: var(--text-muted);
  max-width: 200px;
}

/* 保留原空状态样式以防其他地方使用 */
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
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 滚动包装器（移动端） */
.plans-scroll-wrapper {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
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

  .plans-grid:not(.show-all) .plan-card:nth-child(n + 4) {
    display: none;
  }
}

/* 单个计划卡片 - 紧凑横向布局 */
.plan-card {
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-main);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s;
  min-height: auto;
  flex: 1;
}

@media (max-width: 767px) {
  .plan-card {
    min-width: 260px;
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

/* 卡片头部：标题 + 操作按钮 */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.plan-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  line-height: 1.4;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 操作按钮组 */
.card-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--bg-card-hover);
}

.action-btn .action-icon {
  font-size: 14px;
}

.action-btn.action-danger:hover {
  background: var(--error-bg);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 进度条区域 */
.plan-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
}

.progress-percent {
  font-size: 14px;
  font-weight: 600;
  color: var(--ai-main);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 36px;
  text-align: right;
}

/* 卡片底部：状态 + AI提示 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 11px;
}

.plan-status {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-secondary);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
}

.status-dot.status-pending {
  background: var(--text-muted);
}

.status-dot.status-ended {
  background: var(--error);
}

.status-dot.status-early {
  background: var(--warning);
}

.status-dot.status-progress {
  background: var(--ai-main);
}

.status-dot.status-success {
  background: var(--success);
}

.ai-hint {
  color: var(--text-muted);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
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

  /* 创建计划按钮样式已移除 */

  .plan-card {
    padding: 1rem;
    min-height: 220px;
  }

  .plan-title {
    font-size: 14px;
  }
}
</style>
