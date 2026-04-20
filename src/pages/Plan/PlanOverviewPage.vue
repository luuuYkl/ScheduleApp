<!--
  ═══════════════════════════════════════════════════════════════
  计划概览页面 (PlanOverviewPage.vue) - 紧凑型高信息密度版本
  ═══════════════════════════════════════════════════════════════
  
  【设计理念】
  - 高信息密度：一屏可浏览多个计划
  - 紧凑布局：单行或低高度行展示
  - 操作收敛：下拉菜单统一入口
  
  【单行结构】
  ┌────────────────────────────────────────────────────────────────────┐
  │ 计划名称 │ ████████░░ 65% │ 进行中 │ 3.1-3.31(剩11天) │ 5/8 │ ⋮ │
  └────────────────────────────────────────────────────────────────────┘
-->
<template>
  <PageScaffold>
    <template #actions>
      <Button variant="primary" size="sm" @click="goCreatePlan">
        + 新建计划
      </Button>
    </template>

    <div class="plan-overview">
      <!-- ========== 统计概览区域 ========== -->
      <div class="stats-section">
        <div class="mini-stat-card">
          <div class="mini-stat-icon gray">📋</div>
          <div class="mini-stat-number">{{ planStats.total }}</div>
          <div class="mini-stat-label">总计划数</div>
        </div>
        <div class="mini-stat-card">
          <div class="mini-stat-icon orange">⚡</div>
          <div class="mini-stat-number">{{ planStats.inProgress }}</div>
          <div class="mini-stat-label">进行中</div>
        </div>
        <div class="mini-stat-card">
          <div class="mini-stat-icon yellow">⚠️</div>
          <div class="mini-stat-number">{{ planStats.riskCount }}</div>
          <div class="mini-stat-label">风险中</div>
        </div>
        <div class="mini-stat-card">
          <div class="mini-stat-icon green">✅</div>
          <div class="mini-stat-number">{{ planStats.completed }}</div>
          <div class="mini-stat-label">已完成</div>
        </div>
      </div>

      <!-- ========== 筛选区域 ========== -->
      <div class="filter-section">
        <div class="filter-row">
          <!-- 状态筛选 -->
          <div class="filter-item">
            <span class="filter-label">状态</span>
            <div class="compact-chips">
              <button
                v-for="status in statusFilters"
                :key="status.key"
                :class="['compact-chip', { active: activeStatusFilters.includes(status.key) }]"
                @click="toggleStatusFilter(status.key)"
              >
                {{ status.label }}
              </button>
            </div>
          </div>

          <!-- 时间窗口筛选 -->
          <div class="filter-item">
            <span class="filter-label">时间</span>
            <select v-model="timeWindowFilter" class="compact-select">
              <option value="all">全部时间</option>
              <option value="this_month">本月</option>
              <option value="next_month">下月</option>
              <option value="this_quarter">本季度</option>
              <option value="next_quarter">下季度</option>
            </select>
          </div>

          <!-- 标签筛选 -->
          <div class="filter-item">
            <span class="filter-label">标签</span>
            <div class="compact-chips">
              <button
                v-for="tag in tagFilters"
                :key="tag.key"
                :class="['compact-chip', { active: activeTagFilters.includes(tag.key) }]"
                @click="toggleTagFilter(tag.key)"
              >
                {{ tag.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 紧凑型计划列表区域 ========== -->
      <div class="plan-list-section">
        <div class="section-header">
          <h3>我的计划</h3>
          <span class="results-info">{{ filteredPlans.length }} 个计划</span>
        </div>

        <!-- 表头 -->
        <div class="plan-table-header">
          <div class="col-name">计划名称</div>
          <div class="col-progress">进度</div>
          <div class="col-status">状态</div>
          <div class="col-time">时间范围</div>
          <div class="col-tasks">任务</div>
          <div class="col-actions">操作</div>
        </div>

        <!-- 计划列表 -->
        <div class="plan-table-body">
          <div
            v-for="plan in filteredPlans"
            :key="plan.id"
            class="plan-row"
            :class="{ 'has-risk': plan.isOverdue || plan.isAtRisk }"
            @click="goToPlanDetail(plan.id)"
          >
            <!-- 计划名称 -->
            <div class="col-name">
              <span class="plan-name-text">{{ plan.title }}</span>
              <span v-if="plan.tags && plan.tags.length > 0" class="plan-tag">
                {{ plan.tags[0] }}
              </span>
            </div>

            <!-- 进度条 -->
            <div class="col-progress">
              <div class="progress-bar-wrapper">
                <div class="progress-bar-bg">
                  <div
                    class="progress-bar-fill"
                    :style="{ width: plan.progress + '%' }"
                    :class="getProgressClass(plan.progress)"
                  ></div>
                </div>
                <span class="progress-percent">{{ plan.progress }}%</span>
              </div>
            </div>

            <!-- 状态 -->
            <div class="col-status">
              <span :class="['status-badge', `status-${plan.status.toLowerCase()}`]">
                {{ getStatusText(plan.status) }}
              </span>
              <span v-if="plan.isOverdue || plan.isAtRisk" class="risk-icon" :title="plan.riskReason">
                ⚠️
              </span>
            </div>

            <!-- 时间范围 -->
            <div class="col-time">
              <span class="time-range">
                {{ formatDateShort(plan.startDate) }} - {{ formatDateShort(plan.endDate) }}
              </span>
              <span
                v-if="plan.daysRemaining !== undefined"
                class="days-badge"
                :class="getDaysRemainingClass(plan.daysRemaining)"
              >
                剩{{ plan.daysRemaining }}天
              </span>
            </div>

            <!-- 任务数量 -->
            <div class="col-tasks">
              <span class="task-count">
                <span class="completed">{{ plan.completedTasks || 0 }}</span>
                <span class="separator">/</span>
                <span class="total">{{ plan.taskCount }}</span>
              </span>
            </div>

            <!-- 操作按钮：下拉菜单 -->
            <div class="col-actions">
              <a-dropdown trigger="click" @select="(key: string) => handleAction(key, plan.id)">
                <button class="more-btn" @click.stop>
                  <span>⋮</span>
                </button>
                <template #content>
                  <a-doption value="tasks">
                    <span class="dropdown-icon">📋</span>
                    <span>管理任务</span>
                  </a-doption>
                  <a-doption value="edit">
                    <span class="dropdown-icon">✏️</span>
                    <span>编辑</span>
                  </a-doption>
                  <a-doption value="delete">
                    <span class="dropdown-icon">🗑️</span>
                    <span>删除</span>
                  </a-doption>
                </template>
              </a-dropdown>
            </div>
          </div>

          <!-- 空状态 -->
          <EmptyState
            v-if="filteredPlans.length === 0"
            icon="📋"
            title="暂无符合条件的计划"
            description="尝试调整筛选条件或创建新计划"
            action="创建第一个计划"
            @action-click="goCreatePlan"
          />
        </div>
      </div>

      <!-- ========== 可折叠的计划分析区域 ========== -->
      <div class="analysis-section">
        <div class="analysis-header" @click="toggleAnalysis">
          <div class="analysis-title">
            <span class="analysis-icon">📊</span>
            <span>计划分析</span>
          </div>
          <div class="analysis-summary">
            <span class="summary-item">
              <span class="summary-label">健康度</span>
              <span class="summary-value" :class="getHealthClass(healthScore)">{{ healthScore }}%</span>
            </span>
            <span class="summary-item">
              <span class="summary-label">任务密度</span>
              <span class="summary-value">{{ taskDensityLevel }}</span>
            </span>
            <span class="summary-item">
              <span class="summary-label">风险趋势</span>
              <span class="summary-value" :class="riskTrendClass">{{ riskTrendText }}</span>
            </span>
          </div>
          <button class="expand-btn" :class="{ expanded: isAnalysisExpanded }">
            <span>▼</span>
          </button>
        </div>

        <!-- 展开的详细分析内容 -->
        <div v-if="isAnalysisExpanded" class="analysis-content">
          <!-- 执行健康度详情 -->
          <div class="analysis-card">
            <h4 class="analysis-card-title">执行健康度</h4>
            <div class="health-detail">
              <div class="health-score-circle" :class="getHealthClass(healthScore)">
                <span class="score-number">{{ healthScore }}</span>
                <span class="score-unit">分</span>
              </div>
              <div class="health-metrics-detail">
                <div class="metric-item">
                  <span class="metric-label">按时完成率</span>
                  <div class="metric-bar-container">
                    <div class="metric-bar-fill green" :style="{ width: completionRate + '%' }"></div>
                  </div>
                  <span class="metric-value">{{ completionRate }}%</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">进度达成率</span>
                  <div class="metric-bar-container">
                    <div class="metric-bar-fill blue" :style="{ width: progressAchievementRate + '%' }"></div>
                  </div>
                  <span class="metric-value">{{ progressAchievementRate }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 任务密度详情 -->
          <div class="analysis-card">
            <h4 class="analysis-card-title">任务密度</h4>
            <div class="density-detail">
              <div class="density-chart">
                <div class="density-bar">
                  <div
                    class="density-fill"
                    :style="{ width: taskDensity + '%' }"
                    :class="getDensityClass(taskDensity)"
                  ></div>
                </div>
                <div class="density-labels">
                  <span>低</span>
                  <span>中</span>
                  <span>高</span>
                </div>
              </div>
              <div class="density-info">
                <span class="density-value">{{ taskDensityLevel }}</span>
                <span class="density-desc">{{ taskDensityDesc }}</span>
              </div>
            </div>
          </div>

          <!-- 风险趋势详情 -->
          <div class="analysis-card">
            <h4 class="analysis-card-title">风险趋势</h4>
            <div class="trend-detail">
              <div class="trend-chart">
                <div v-for="(item, index) in riskTrendData" :key="index" class="trend-bar-item">
                  <div class="trend-bar" :style="{ height: Math.max(10, item.value * 5) + 'px' }">
                    <span class="trend-value">{{ item.value }}</span>
                  </div>
                  <span class="trend-label">{{ item.label }}</span>
                </div>
              </div>
              <div class="trend-summary">
                <span class="trend-indicator" :class="riskTrendClass">
                  {{ riskTrendIcon }} {{ riskTrendText }}
                </span>
                <span class="trend-desc">{{ riskTrendDesc }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import PageScaffold from "@/components/common/PageScaffold.vue";
import Button from "@/components/common/Button.vue";
import EmptyState from "@/components/common/EmptyState.vue";

interface Plan {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  taskCount: number;
  completedTasks?: number;
  progress: number;
  tags?: string[];
  isOverdue?: boolean;
  isAtRisk?: boolean;
  riskReason?: string;
  daysRemaining?: number;
}

const router = useRouter();
const plansStore = usePlanStore();

// 分析区域展开状态
const isAnalysisExpanded = ref(false);

// 高级筛选状态
const activeStatusFilters = ref<string[]>(["all"]);
const timeWindowFilter = ref<string>("all");
const activeTagFilters = ref<string[]>([]);

// 筛选选项
const statusFilters = [
  { key: "all", label: "全部" },
  { key: "NOT_STARTED", label: "未开始" },
  { key: "IN_PROGRESS", label: "进行中" },
  { key: "COMPLETED", label: "已完成" },
];

const tagFilters = [
  { key: "work", label: "工作" },
  { key: "study", label: "学习" },
  { key: "personal", label: "个人" },
  { key: "health", label: "健康" },
];

const plans = computed<Plan[]>(() => {
  return plansStore.plans.map((plan: any) => {
    const today = new Date();
    const endDate = new Date(plan.end_date);
    const startDate = new Date(plan.start_date);
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 计算进度
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const passedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progress =
      plan.status === "COMPLETED"
        ? 100
        : Math.min(100, Math.max(0, Math.round((passedDays / totalDays) * 100)));

    // 计算风险状态
    const isOverdue = daysRemaining < 0 && plan.status !== "COMPLETED";
    const isAtRisk = daysRemaining < 7 && plan.status === "IN_PROGRESS";

    let riskReason = "";
    if (isOverdue) {
      riskReason = `已逾期${Math.abs(daysRemaining)}天`;
    } else if (isAtRisk) {
      riskReason = `剩余${daysRemaining}天，进度需加快`;
    }

    return {
      id: plan.id,
      title: plan.title,
      description: plan.description,
      startDate: plan.start_date,
      endDate: plan.end_date,
      status: plan.status || "NOT_STARTED",
      taskCount: plan.tasks?.length || 0,
      completedTasks: plan.tasks?.filter((t: any) => t.status === "done").length || 0,
      progress,
      tags: plan.tags || [],
      isOverdue,
      isAtRisk,
      riskReason,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    };
  });
});

const filteredPlans = computed(() => {
  let result = [...plans.value];

  // 状态筛选
  if (!activeStatusFilters.value.includes("all")) {
    result = result.filter((p) => activeStatusFilters.value.includes(p.status));
  }

  // 时间窗口筛选
  if (timeWindowFilter.value !== "all") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    result = result.filter((p) => {
      const planStart = new Date(p.startDate);
      const planEnd = new Date(p.endDate);

      switch (timeWindowFilter.value) {
        case "this_month":
          return planStart <= endOfMonth && planEnd >= startOfMonth;
        case "next_month":
          const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
          return planStart <= nextMonthEnd && planEnd >= nextMonthStart;
        default:
          return true;
      }
    });
  }

  // 标签筛选
  if (activeTagFilters.value.length > 0) {
    result = result.filter((p) => p.tags?.some((tag) => activeTagFilters.value.includes(tag)));
  }

  return result;
});

const planStats = computed(() => {
  const inProgressPlans = plans.value.filter((p) => p.status === "IN_PROGRESS");
  const riskCount = inProgressPlans.filter((p) => p.isAtRisk || p.isOverdue).length;

  return {
    total: plans.value.length,
    inProgress: inProgressPlans.length,
    completed: plans.value.filter((p) => p.status === "COMPLETED").length,
    riskCount,
  };
});

// 健康度相关计算
const healthScore = computed(() => {
  if (plans.value.length === 0) return 100;

  const completedRate = (planStats.value.completed / planStats.value.total) * 100;
  const onTrackRate =
    (plans.value.filter(
      (p) => p.status === "IN_PROGRESS" && !p.isOverdue && !p.isAtRisk
    ).length /
      Math.max(1, planStats.value.inProgress)) *
      100 || 0;

  return Math.round(completedRate * 0.6 + onTrackRate * 0.4);
});

const completionRate = computed(() => {
  if (plans.value.length === 0) return 100;
  return Math.round((planStats.value.completed / planStats.value.total) * 100);
});

const progressAchievementRate = computed(() => {
  const inProgressPlans = plans.value.filter((p) => p.status === "IN_PROGRESS");
  if (inProgressPlans.length === 0) return 100;

  const avgProgress =
    inProgressPlans.reduce((sum, p) => sum + p.progress, 0) / inProgressPlans.length;
  return Math.round(avgProgress);
});

const taskDensity = computed(() => {
  if (plans.value.length === 0) return 0;
  const totalTasks = plans.value.reduce((sum, p) => sum + p.taskCount, 0);
  const avgTasks = totalTasks / plans.value.length;
  return Math.min(100, Math.round(avgTasks * 10));
});

const taskDensityLevel = computed(() => {
  if (taskDensity.value < 30) return "低";
  if (taskDensity.value < 70) return "中";
  return "高";
});

const taskDensityDesc = computed(() => {
  if (taskDensity.value < 30) return "任务安排较轻松，可考虑增加任务量";
  if (taskDensity.value < 70) return "任务安排适中，保持当前节奏";
  return "任务安排较紧凑，注意合理分配精力";
});

// 风险趋势数据（模拟最近7天数据）
const riskTrendData = computed(() => {
  const days = ["一", "二", "三", "四", "五", "六", "日"];
  return days.map((day) => ({
    label: day,
    value: Math.max(0, planStats.value.riskCount + Math.floor(Math.random() * 3) - 1),
  }));
});

const riskTrendClass = computed(() => {
  const trend = riskTrendData.value;
  const firstHalf = trend.slice(0, 3).reduce((sum, item) => sum + item.value, 0);
  const secondHalf = trend.slice(4).reduce((sum, item) => sum + item.value, 0);

  if (secondHalf < firstHalf) return "trend-down";
  if (secondHalf > firstHalf) return "trend-up";
  return "trend-stable";
});

const riskTrendText = computed(() => {
  if (riskTrendClass.value === "trend-down") return "下降";
  if (riskTrendClass.value === "trend-up") return "上升";
  return "稳定";
});

const riskTrendIcon = computed(() => {
  if (riskTrendClass.value === "trend-down") return "↓";
  if (riskTrendClass.value === "trend-up") return "↑";
  return "→";
});

const riskTrendDesc = computed(() => {
  if (riskTrendClass.value === "trend-down") return "风险计划数量正在减少，继续保持";
  if (riskTrendClass.value === "trend-up") return "风险计划数量有所增加，需要关注";
  return "风险计划数量保持稳定";
});

function toggleAnalysis() {
  isAnalysisExpanded.value = !isAnalysisExpanded.value;
}

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    NOT_STARTED: "未开始",
    IN_PROGRESS: "进行中",
    COMPLETED: "已完成",
  };
  return statusMap[status] || status;
}

// 筛选操作方法
function toggleStatusFilter(key: string) {
  if (key === "all") {
    activeStatusFilters.value = ["all"];
    return;
  }

  const index = activeStatusFilters.value.indexOf(key);
  if (index > -1) {
    activeStatusFilters.value.splice(index, 1);
  } else {
    activeStatusFilters.value = activeStatusFilters.value.filter((f) => f !== "all");
    activeStatusFilters.value.push(key);
  }

  if (activeStatusFilters.value.length === 0) {
    activeStatusFilters.value = ["all"];
  }
}

function toggleTagFilter(key: string) {
  const index = activeTagFilters.value.indexOf(key);
  if (index > -1) {
    activeTagFilters.value.splice(index, 1);
  } else {
    activeTagFilters.value.push(key);
  }
}

function getHealthClass(value: number): string {
  if (value >= 80) return "good";
  if (value >= 60) return "warning";
  return "danger";
}

function getProgressClass(progress: number): string {
  if (progress >= 80) return "high";
  if (progress >= 50) return "medium";
  return "low";
}

function getDensityClass(value: number): string {
  if (value < 30) return "low";
  if (value < 70) return "medium";
  return "high";
}

function getDaysRemainingClass(days: number): string {
  if (days > 30) return "safe";
  if (days > 7) return "warning";
  return "danger";
}

// 处理下拉菜单操作
function handleAction(action: string, planId: string) {
  switch (action) {
    case "tasks":
      goToPlanDetail(planId);
      break;
    case "edit":
      editPlan(planId);
      break;
    case "delete":
      deletePlan(planId);
      break;
  }
}

function editPlan(planId: string) {
  router.push({ path: "/plan/create", query: { edit: planId } });
}

function deletePlan(planId: string) {
  if (confirm("确定删除该计划吗？相关任务也会一并删除。")) {
    plansStore.removePlan(Number(planId));
  }
}

function formatDateShort(dateString: string) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function goCreatePlan() {
  router.push("/plan/create");
}

function goToPlanDetail(planId: string) {
  router.push(`/plan/${planId}/tasks`);
}

onMounted(() => {
  plansStore.loadPlans();
});
</script>

<style scoped>
.plan-overview {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ========== 统计卡片区域 ========== */
.stats-section {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-main);
}

.mini-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 80px;
  padding: var(--space-3);
}

.mini-stat-icon {
  font-size: 24px;
  margin-bottom: var(--space-2);
}

.mini-stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.mini-stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  margin-top: var(--space-1);
}

/* ========== 筛选区域 ========== */
.filter-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-main);
  padding: var(--space-3) var(--space-4);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.compact-chips {
  display: flex;
  gap: 6px;
}

.compact-chip {
  padding: 6px 12px;
  border: 1px solid var(--border-main);
  background: var(--bg-main);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.compact-chip:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.compact-chip.active {
  background: var(--ai-main);
  color: white;
  border-color: var(--ai-main);
}

.compact-select {
  padding: 6px 12px;
  border: 1px solid var(--border-main);
  border-radius: var(--radius-sm);
  background: var(--bg-main);
  color: var(--text-main);
  font-size: 13px;
  min-width: 120px;
  cursor: pointer;
}

.compact-select:focus {
  outline: none;
  border-color: var(--ai-main);
}

/* ========== 紧凑型计划列表区域 ========== */
.plan-list-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-main);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.results-info {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 表格头部 */
.plan-table-header {
  display: grid;
  grid-template-columns: 1fr 140px 90px 160px 70px 60px;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-main);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

/* 表格主体 */
.plan-table-body {
  max-height: 400px;
  overflow-y: auto;
}

/* 单行计划 */
.plan-row {
  display: grid;
  grid-template-columns: 1fr 140px 90px 160px 70px 60px;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.2s;
}

.plan-row:hover {
  background: var(--bg-card-hover);
}

.plan-row.has-risk {
  background: var(--warning-bg);
}

.plan-row.has-risk:hover {
  background: var(--warning-bg);
}

/* 各列样式 */
.col-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.plan-name-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-tag {
  flex-shrink: 0;
  background: var(--ai-bg);
  color: var(--ai-main);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.col-progress {
  display: flex;
  align-items: center;
}

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
}

.progress-bar-bg {
  flex: 1;
  height: 6px;
  background: var(--bg-main);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-bar-fill.high {
  background: var(--success);
}

.progress-bar-fill.medium {
  background: var(--warning);
}

.progress-bar-fill.low {
  background: var(--error);
}

.progress-percent {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
}

.col-status {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.status-not_started {
  background: var(--bg-warning);
  color: var(--text-warning);
}

.status-in_progress {
  background: var(--ai-bg);
  color: var(--ai-main);
}

.status-completed {
  background: var(--bg-success);
  color: var(--text-success);
}

.risk-icon {
  font-size: 14px;
}

.col-time {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.time-range {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.days-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.days-badge.safe {
  background: var(--bg-success);
  color: var(--text-success);
}

.days-badge.warning {
  background: var(--bg-warning);
  color: var(--text-warning);
}

.days-badge.danger {
  background: var(--bg-error);
  color: var(--error);
}

.col-tasks {
  text-align: center;
}

.task-count {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.task-count .completed {
  font-weight: 600;
  color: var(--text-main);
}

.task-count .separator {
  color: var(--text-muted);
  margin: 0 2px;
}

.task-count .total {
  color: var(--text-secondary);
}

.col-actions {
  display: flex;
  justify-content: center;
}

.more-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 18px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.more-btn:hover {
  background: var(--bg-main);
  color: var(--text-main);
}

/* 下拉菜单样式 */
:deep(.arco-dropdown-option) {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 12px;
}

.dropdown-icon {
  font-size: 14px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--space-8) var(--space-4);
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-3);
}

.empty-state p {
  margin: 0 0 var(--space-2);
  font-size: 16px;
}

.empty-hint {
  font-size: 14px;
  margin-bottom: var(--space-4);
}

/* ========== 计划分析区域 ========== */
.analysis-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-main);
  overflow: hidden;
}

.analysis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  cursor: pointer;
  transition: background 0.2s;
}

.analysis-header:hover {
  background: var(--bg-card-hover);
}

.analysis-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.analysis-icon {
  font-size: 20px;
}

.analysis-summary {
  display: flex;
  gap: var(--space-6);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.summary-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.summary-value.good {
  color: var(--success);
}

.summary-value.warning {
  color: var(--warning);
}

.summary-value.danger {
  color: var(--error);
}

.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: var(--bg-main);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.expand-btn span {
  font-size: 12px;
  color: var(--text-secondary);
  transition: transform 0.3s;
}

.expand-btn.expanded span {
  transform: rotate(180deg);
}

/* 分析内容区域 */
.analysis-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  padding: var(--space-4);
  border-top: 1px solid var(--border-subtle);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.analysis-card {
  background: var(--bg-main);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.analysis-card-title {
  margin: 0 0 var(--space-3);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

/* 健康度详情 */
.health-detail {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.health-score-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid var(--border-main);
}

.health-score-circle.good {
  border-color: var(--success);
  background: var(--bg-success);
}

.health-score-circle.warning {
  border-color: var(--warning);
  background: var(--bg-warning);
}

.health-score-circle.danger {
  border-color: var(--error);
  background: var(--bg-error);
}

.score-number {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
}

.score-unit {
  font-size: 10px;
  color: var(--text-secondary);
}

.health-metrics-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.metric-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.metric-item .metric-label {
  font-size: 12px;
  color: var(--text-secondary);
  width: 70px;
  flex-shrink: 0;
}

.metric-bar-container {
  flex: 1;
  height: 8px;
  background: var(--bg-card);
  border-radius: 4px;
  overflow: hidden;
}

.metric-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.metric-bar-fill.green {
  background: var(--success);
}

.metric-bar-fill.blue {
  background: var(--ai-main);
}

.metric-item .metric-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-main);
  width: 36px;
  text-align: right;
}

/* 任务密度详情 */
.density-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.density-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.density-bar {
  height: 12px;
  background: var(--bg-card);
  border-radius: 6px;
  overflow: hidden;
}

.density-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.density-fill.low {
  background: var(--success);
}

.density-fill.medium {
  background: var(--warning);
}

.density-fill.high {
  background: var(--error);
}

.density-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.density-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.density-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.density-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* 风险趋势详情 */
.trend-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 60px;
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.trend-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
}

.trend-bar {
  width: 20px;
  min-height: 10px;
  background: var(--ai-main);
  border-radius: 3px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  transition: height 0.3s ease;
}

.trend-value {
  font-size: 10px;
  font-weight: 600;
  color: white;
  padding-top: 2px;
}

.trend-label {
  font-size: 10px;
  color: var(--text-secondary);
}

.trend-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.trend-indicator {
  font-size: 14px;
  font-weight: 600;
}

.trend-indicator.trend-down {
  color: var(--success);
}

.trend-indicator.trend-up {
  color: var(--error);
}

.trend-indicator.trend-stable {
  color: var(--text-secondary);
}

.trend-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* ========== 响应式调整 ========== */
@media (max-width: 1024px) {
  .plan-table-header,
  .plan-row {
    grid-template-columns: 1fr 120px 80px 140px 60px 50px;
  }

  .analysis-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-section {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .mini-stat-card {
    min-width: calc(50% - var(--space-2));
  }

  .filter-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .filter-item {
    width: 100%;
  }

  .compact-chips {
    flex-wrap: wrap;
  }

  .analysis-summary {
    display: none;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  /* 移动端：改为垂直列表 */
  .plan-table-header {
    display: none;
  }

  .plan-row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
    padding: var(--space-3);
  }

  .col-name {
    order: 1;
  }

  .col-progress {
    order: 2;
  }

  .col-status,
  .col-time,
  .col-tasks {
    order: 3;
    display: inline-flex;
  }

  .col-actions {
    order: 4;
    justify-content: flex-end;
  }
}
</style>