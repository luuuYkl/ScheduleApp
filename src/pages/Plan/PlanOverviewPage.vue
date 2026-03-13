<template>
  <PageScaffold
    title="计划"
    subtitle="管理你的所有计划"
  >
    <template #actions>
      <Button variant="primary" size="sm" @click="goCreatePlan">
        + 新建计划
      </Button>
    </template>

    <div class="plan-overview">
      <!-- 计划概览区域：统计卡片 -->
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

      <!-- 筛选区域 -->
      <Card class="filter-card">
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
      </Card>

      <!-- 计划列表区域 -->
      <div class="plan-list-section">
        <div class="section-header">
          <h3>我的计划</h3>
          <div class="results-info">
            共找到 {{ filteredPlans.length }} 个计划
          </div>
        </div>

        <div class="plan-list">
          <Card
            v-for="plan in filteredPlans"
            :key="plan.id"
            class="plan-card enhanced-plan-card"
            @click="goToPlanDetail(plan.id)"
          >
            <div class="plan-card-content">
              <!-- 计划头部：标题 + 状态 + 风险提示 -->
              <div class="plan-header">
                <div class="plan-title-section">
                  <h4 class="plan-title">{{ plan.title }}</h4>
                  <div class="plan-tags">
                    <span 
                      v-for="tag in plan.tags" 
                      :key="tag" 
                      class="tag-badge"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <div class="plan-status-section">
                  <span
                    :class="[
                      'plan-status',
                      `status-${plan.status.toLowerCase()}`,
                    ]"
                  >
                    {{ getStatusText(plan.status) }}
                  </span>
                  <div 
                    v-if="plan.isOverdue || plan.isAtRisk" 
                    class="risk-indicator-small"
                    :title="plan.riskReason"
                  >
                    ⚠️
                  </div>
                </div>
              </div>
              
              <!-- 计划描述 -->
              <p class="plan-description">
                {{ plan.description || "暂无描述" }}
              </p>
              
              <!-- 执行进度条 -->
              <div class="progress-section">
                <div class="progress-header">
                  <span class="progress-label">执行进度</span>
                  <span class="progress-value">{{ plan.progress }}%</span>
                </div>
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar-fill"
                    :style="{ width: plan.progress + '%' }"
                    :class="getProgressClass(plan.progress)"
                  ></div>
                </div>
              </div>
              
              <!-- 标准化信息层级 -->
              <div class="plan-info-hierarchy">
                <!-- 时间区间 -->
                <div class="info-row time-range">
                  <span class="info-label">📅 时间</span>
                  <span class="info-value">
                    {{ formatDate(plan.startDate) }} - {{ formatDate(plan.endDate) }}
                    <span 
                      v-if="plan.daysRemaining !== undefined" 
                      class="days-remaining"
                      :class="getDaysRemainingClass(plan.daysRemaining)">
                      (剩{{ plan.daysRemaining }}天)
                    </span>
                  </span>
                </div>
                
                <!-- 任务数量 -->
                <div class="info-row task-count">
                  <span class="info-label">✅ 任务</span>
                  <span class="info-value">
                    {{ plan.taskCount }}个任务
                    <span 
                      v-if="plan.completedTasks !== undefined" 
                      class="completion-rate-small">
                      (已完成{{ plan.completedTasks }}个)
                    </span>
                  </span>
                </div>
                
                <!-- 风险提示 -->
                <div v-if="plan.isOverdue || plan.isAtRisk" class="info-row risk-alert">
                  <span class="info-label">⚠️ 风险</span>
                  <span class="info-value risk-message">{{ plan.riskReason }}</span>
                </div>
              </div>
              
              <!-- 快捷操作 -->
              <div class="plan-actions">
                <Button 
                  variant="outline" 
                  size="sm" 
                  @click.stop="goToPlanDetail(plan.id)"
                >
                  管理任务
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  @click.stop="editPlan(plan.id)"
                >
                  编辑
                </Button>
              </div>
            </div>
          </Card>

          <div v-if="filteredPlans.length === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <p>暂无符合条件的计划</p>
            <p class="empty-hint">尝试调整筛选条件或创建新计划</p>
            <Button @click="goCreatePlan" variant="outline">
              创建第一个计划
            </Button>
          </div>
        </div>
      </div>

      <!-- 可展开的计划分析区域 -->
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
                    <div 
                      class="metric-bar-fill green" 
                      :style="{ width: completionRate + '%' }">
                    </div>
                  </div>
                  <span class="metric-value">{{ completionRate }}%</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">进度达成率</span>
                  <div class="metric-bar-container">
                    <div 
                      class="metric-bar-fill blue" 
                      :style="{ width: progressAchievementRate + '%' }">
                    </div>
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
                <div 
                  v-for="(item, index) in riskTrendData" 
                  :key="index"
                  class="trend-bar-item"
                >
                  <div class="trend-bar" :style="{ height: item.value + '%' }">
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
import Card from "@/components/common/Card.vue";

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
const activeStatusFilters = ref<string[]>(['all']);
const timeWindowFilter = ref<string>('all');
const activeTagFilters = ref<string[]>([]);

// 筛选选项
const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'NOT_STARTED', label: '未开始' },
  { key: 'IN_PROGRESS', label: '进行中' },
  { key: 'COMPLETED', label: '已完成' }
];

const tagFilters = [
  { key: 'work', label: '工作' },
  { key: 'study', label: '学习' },
  { key: 'personal', label: '个人' },
  { key: 'health', label: '健康' }
];

const plans = computed<Plan[]>(() => {
  return plansStore.plans.map((plan: any) => {
    const today = new Date();
    const endDate = new Date(plan.endDate);
    const startDate = new Date(plan.startDate);
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // 计算进度
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const passedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progress = plan.status === 'COMPLETED' ? 100 : 
                     Math.min(100, Math.max(0, Math.round((passedDays / totalDays) * 100)));
    
    // 计算风险状态
    const isOverdue = daysRemaining < 0 && plan.status !== 'COMPLETED';
    const isAtRisk = daysRemaining < 7 && plan.status === 'IN_PROGRESS';
    
    let riskReason = '';
    if (isOverdue) {
      riskReason = `已逾期${Math.abs(daysRemaining)}天`;
    } else if (isAtRisk) {
      riskReason = `剩余${daysRemaining}天，进度需加快`;
    }
    
    return {
      id: plan.id,
      title: plan.title,
      description: plan.description,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status,
      taskCount: plan.tasks?.length || 0,
      completedTasks: plan.tasks?.filter((t: any) => t.status === 'done').length || 0,
      progress,
      tags: plan.tags || [],
      isOverdue,
      isAtRisk,
      riskReason,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0
    };
  });
});

const filteredPlans = computed(() => {
  let result = [...plans.value];
  
  // 状态筛选
  if (!activeStatusFilters.value.includes('all')) {
    result = result.filter(p => activeStatusFilters.value.includes(p.status));
  }
  
  // 时间窗口筛选
  if (timeWindowFilter.value !== 'all') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    result = result.filter(p => {
      const planStart = new Date(p.startDate);
      const planEnd = new Date(p.endDate);
      
      switch (timeWindowFilter.value) {
        case 'this_month':
          return planStart <= endOfMonth && planEnd >= startOfMonth;
        case 'next_month':
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
    result = result.filter(p => 
      p.tags?.some(tag => activeTagFilters.value.includes(tag))
    );
  }
  
  return result;
});

const planStats = computed(() => {
  const inProgressPlans = plans.value.filter(p => p.status === "IN_PROGRESS");
  const riskCount = inProgressPlans.filter(p => p.isAtRisk || p.isOverdue).length;
  
  return {
    total: plans.value.length,
    inProgress: inProgressPlans.length,
    completed: plans.value.filter((p) => p.status === "COMPLETED").length,
    riskCount
  };
});

// 健康度相关计算
const healthScore = computed(() => {
  if (plans.value.length === 0) return 100;
  
  const completedRate = planStats.value.completed / planStats.value.total * 100;
  const onTrackRate = plans.value.filter(p => 
    p.status === 'IN_PROGRESS' && !p.isOverdue && !p.isAtRisk
  ).length / Math.max(1, planStats.value.inProgress) * 100 || 0;
  
  return Math.round((completedRate * 0.6 + onTrackRate * 0.4));
});

const completionRate = computed(() => {
  if (plans.value.length === 0) return 100;
  return Math.round(planStats.value.completed / planStats.value.total * 100);
});

const progressAchievementRate = computed(() => {
  const inProgressPlans = plans.value.filter(p => p.status === 'IN_PROGRESS');
  if (inProgressPlans.length === 0) return 100;
  
  const avgProgress = inProgressPlans.reduce((sum, p) => sum + p.progress, 0) / inProgressPlans.length;
  return Math.round(avgProgress);
});

const taskDensity = computed(() => {
  if (plans.value.length === 0) return 0;
  const totalTasks = plans.value.reduce((sum, p) => sum + p.taskCount, 0);
  const avgTasks = totalTasks / plans.value.length;
  return Math.min(100, Math.round(avgTasks * 10));
});

const taskDensityLevel = computed(() => {
  if (taskDensity.value < 30) return '低';
  if (taskDensity.value < 70) return '中';
  return '高';
});

const taskDensityDesc = computed(() => {
  if (taskDensity.value < 30) return '任务安排较轻松，可考虑增加任务量';
  if (taskDensity.value < 70) return '任务安排适中，保持当前节奏';
  return '任务安排较紧凑，注意合理分配精力';
});

// 风险趋势数据（模拟最近7天数据）
const riskTrendData = computed(() => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return days.map((day, index) => ({
    label: day,
    value: Math.max(0, planStats.value.riskCount + Math.floor(Math.random() * 3) - 1)
  }));
});

const riskTrendClass = computed(() => {
  const trend = riskTrendData.value;
  const firstHalf = trend.slice(0, 3).reduce((sum, item) => sum + item.value, 0);
  const secondHalf = trend.slice(4).reduce((sum, item) => sum + item.value, 0);
  
  if (secondHalf < firstHalf) return 'trend-down';
  if (secondHalf > firstHalf) return 'trend-up';
  return 'trend-stable';
});

const riskTrendText = computed(() => {
  if (riskTrendClass.value === 'trend-down') return '下降';
  if (riskTrendClass.value === 'trend-up') return '上升';
  return '稳定';
});

const riskTrendIcon = computed(() => {
  if (riskTrendClass.value === 'trend-down') return '↓';
  if (riskTrendClass.value === 'trend-up') return '↑';
  return '→';
});

const riskTrendDesc = computed(() => {
  if (riskTrendClass.value === 'trend-down') return '风险计划数量正在减少，继续保持';
  if (riskTrendClass.value === 'trend-up') return '风险计划数量有所增加，需要关注';
  return '风险计划数量保持稳定';
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
  if (key === 'all') {
    activeStatusFilters.value = ['all'];
    return;
  }
  
  const index = activeStatusFilters.value.indexOf(key);
  if (index > -1) {
    activeStatusFilters.value.splice(index, 1);
  } else {
    activeStatusFilters.value = activeStatusFilters.value.filter(f => f !== 'all');
    activeStatusFilters.value.push(key);
  }
  
  if (activeStatusFilters.value.length === 0) {
    activeStatusFilters.value = ['all'];
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
  if (value >= 80) return 'good';
  if (value >= 60) return 'warning';
  return 'danger';
}

function getProgressClass(progress: number): string {
  if (progress >= 80) return 'high';
  if (progress >= 50) return 'medium';
  return 'low';
}

function getDensityClass(value: number): string {
  if (value < 30) return 'low';
  if (value < 70) return 'medium';
  return 'high';
}

function getDaysRemainingClass(days: number): string {
  if (days > 30) return 'safe';
  if (days > 7) return 'warning';
  return 'danger';
}

function editPlan(planId: string) {
  router.push({ path: '/plan/create', query: { edit: planId } });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("zh-CN");
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
  max-width: 1000px;
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
.filter-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
}

.filter-card :deep(.card-content) {
  padding: var(--space-3) var(--space-4);
}

.filter-section {
  width: 100%;
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

/* ========== 计划列表区域 ========== */
.plan-list-section {
  margin-top: var(--space-2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.results-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* 计划卡片 */
.enhanced-plan-card {
  border-left: 4px solid transparent;
  transition: all 0.3s;
  cursor: pointer;
}

.enhanced-plan-card:hover {
  border-left-color: var(--ai-main);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.plan-card-content {
  padding: var(--space-4);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-2);
}

.plan-title-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.plan-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.plan-tags {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.tag-badge {
  background: var(--ai-bg);
  color: var(--ai-main);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.plan-status-section {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.plan-status {
  font-size: 12px;
  padding: var(--space-1) var(--space-2);
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

.risk-indicator-small {
  font-size: 16px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.plan-description {
  margin: 0 0 var(--space-3);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 执行进度条 */
.progress-section {
  margin-bottom: var(--space-3);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
}

.progress-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.progress-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.progress-bar-container {
  height: 6px;
  background: var(--bg-main);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
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

/* 信息层级 */
.plan-info-hierarchy {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-main);
  border-radius: var(--radius-md);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 60px;
}

.info-value {
  font-size: 13px;
  color: var(--text-main);
  text-align: right;
  flex: 1;
}

.days-remaining {
  font-weight: 500;
  margin-left: var(--space-1);
}

.days-remaining.safe {
  color: var(--success);
}

.days-remaining.warning {
  color: var(--warning);
}

.days-remaining.danger {
  color: var(--error);
}

.completion-rate-small {
  color: var(--text-secondary);
  font-size: 12px;
}

.risk-alert {
  background: var(--warning-bg);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--warning);
}

.risk-message {
  color: var(--warning);
  font-weight: 500;
}

.plan-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
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
  margin-top: var(--space-4);
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
  height: 80px;
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
  
  .analysis-content {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .plan-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .plan-title-section {
    width: 100%;
  }
  
  .plan-status-section {
    margin-top: var(--space-1);
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }
  
  .info-value {
    text-align: left;
    width: 100%;
  }
  
  .plan-actions {
    flex-direction: column;
  }
  
  .plan-actions Button {
    width: 100%;
  }
}
</style>