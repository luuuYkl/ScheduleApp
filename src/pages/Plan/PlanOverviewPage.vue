<template>
  <PageScaffold
    title="计划"
    subtitle="管理你的所有计划"
    show-back-button
    @back="goBack"
  >
    <template #actions>
      <Button variant="primary" size="sm" @click="goCreatePlan">
        + 新建计划
      </Button>
    </template>

    <div class="plan-overview">
      <!-- 扩展统计卡片 -->
      <div class="enhanced-stats-grid">
        <Card class="stat-card enhanced-card">
          <div class="stat-content">
            <div class="stat-icon">📋</div>
            <div class="stat-number">{{ planStats.total }}</div>
            <div class="stat-label">总计划数</div>
          </div>
        </Card>
        <Card class="stat-card enhanced-card">
          <div class="stat-content">
            <div class="stat-icon">⚡</div>
            <div class="stat-number">{{ planStats.inProgress }}</div>
            <div class="stat-label">进行中</div>
            <div class="stat-subtext" v-if="planStats.riskCount > 0">
              {{ planStats.riskCount }}个风险中
            </div>
          </div>
        </Card>
        <Card class="stat-card enhanced-card">
          <div class="stat-content">
            <div class="stat-icon">⚠️</div>
            <div class="stat-number">{{ planStats.riskCount }}</div>
            <div class="stat-label">风险中</div>
            <div class="risk-indicator" v-if="planStats.riskCount > 0"></div>
          </div>
        </Card>
        <Card class="stat-card enhanced-card">
          <div class="stat-content">
            <div class="stat-icon">✅</div>
            <div class="stat-number">{{ planStats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </Card>
      </div>
      
      <!-- 计划健康度概览 -->
      <Card class="health-overview-card mb-4">
        <div class="health-header">
          <h3>📊 计划健康度</h3>
          <div class="health-score">
            <span class="score-value">{{ healthScore }}%</span>
            <span class="score-label">整体健康度</span>
          </div>
        </div>
        <div class="health-bars">
          <div class="health-bar">
            <span class="bar-label">按时完成率</span>
            <div class="bar-container">
              <div 
                class="bar-fill" 
                :style="{ width: completionRate + '%' }"
                :class="getHealthClass(completionRate)">
              </div>
            </div>
            <span class="bar-value">{{ completionRate }}%</span>
          </div>
          <div class="health-bar">
            <span class="bar-label">任务密度</span>
            <div class="bar-container">
              <div 
                class="bar-fill" 
                :style="{ width: taskDensity + '%' }"
                :class="getHealthClass(taskDensity)">
              </div>
            </div>
            <span class="bar-value">{{ taskDensity }}%</span>
          </div>
        </div>
      </Card>

      <!-- 多维筛选器 -->
      <div class="advanced-filters card mb-4">
        <div class="filters-header">
          <h3>🔍 高级筛选</h3>
        </div>
        <div class="filters-grid">
          <!-- 状态筛选 -->
          <div class="filter-group">
            <label>状态</label>
            <div class="filter-chips">
              <button 
                v-for="status in statusFilters" 
                :key="status.key"
                :class="['chip', { active: activeStatusFilters.includes(status.key) }]"
                @click="toggleStatusFilter(status.key)"
              >
                {{ status.label }}
              </button>
            </div>
          </div>
          
          <!-- 时间窗口筛选 -->
          <div class="filter-group">
            <label>时间窗口</label>
            <select v-model="timeWindowFilter" class="filter-select">
              <option value="all">全部时间</option>
              <option value="this_month">本月</option>
              <option value="next_month">下月</option>
              <option value="this_quarter">本季度</option>
              <option value="next_quarter">下季度</option>
            </select>
          </div>
          
          <!-- 标签筛选 -->
          <div class="filter-group">
            <label>标签</label>
            <div class="filter-chips">
              <button 
                v-for="tag in tagFilters" 
                :key="tag.key"
                :class="['chip', { active: activeTagFilters.includes(tag.key) }]"
                @click="toggleTagFilter(tag.key)"
              >
                {{ tag.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 计划列表 -->
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
  tags?: string[];
  isOverdue?: boolean;
  isAtRisk?: boolean;
  riskReason?: string;
  daysRemaining?: number;
}

const router = useRouter();
const plansStore = usePlanStore();

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
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
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
  ).length / planStats.value.inProgress * 100 || 0;
  
  return Math.round((completedRate * 0.6 + onTrackRate * 0.4));
});

const completionRate = computed(() => {
  if (plans.value.length === 0) return 100;
  return Math.round(planStats.value.completed / planStats.value.total * 100);
});

const taskDensity = computed(() => {
  const totalTasks = plans.value.reduce((sum, p) => sum + p.taskCount, 0);
  return Math.min(100, Math.round(totalTasks / plans.value.length * 10));
});

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

function getFilterLabel(filter: string) {
  const labelMap: Record<string, string> = {
    all: "",
    in_progress: "进行中",
    completed: "已完成",
  };
  return labelMap[filter] || "";
}

function goBack() {
  router.back();
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
}

/* 扩展统计卡片 */
.enhanced-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.enhanced-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.enhanced-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: var(--space-2);
}

.stat-subtext {
  font-size: 12px;
  color: var(--warning);
  font-weight: 500;
  margin-top: var(--space-1);
}

.risk-indicator {
  width: 8px;
  height: 8px;
  background: var(--warning);
  border-radius: 50%;
  margin-top: var(--space-1);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* 健康度概览 */
.health-overview-card {
  background: linear-gradient(135deg, var(--ai-bg) 0%, var(--bg-card) 100%);
  border-left: 4px solid var(--ai-main);
}

.health-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.health-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.health-score {
  text-align: right;
}

.score-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: var(--ai-main);
  font-variant-numeric: tabular-nums;
}

.score-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.health-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.health-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.bar-label {
  font-size: 14px;
  color: var(--text-secondary);
  width: 80px;
  flex-shrink: 0;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: var(--bg-main);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.bar-fill.good {
  background: var(--success);
}

.bar-fill.warning {
  background: var(--warning);
}

.bar-fill.danger {
  background: var(--error);
}

.bar-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  width: 40px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* 高级筛选器 */
.advanced-filters {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.filters-header {
  margin-bottom: var(--space-4);
}

.filters-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-main);
  background: var(--bg-main);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.chip:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.chip.active {
  background: var(--ai-main);
  color: white;
  border-color: var(--ai-main);
}

.filter-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-md);
  background: var(--bg-main);
  color: var(--text-main);
  font-size: 14px;
}

/* 增强的计划卡片 */
.enhanced-plan-card {
  border-left: 4px solid transparent;
  transition: all 0.3s;
}

.enhanced-plan-card:hover {
  border-left-color: var(--ai-main);
}

.plan-title-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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

.risk-indicator-small {
  font-size: 16px;
  animation: pulse 2s infinite;
}

.plan-info-hierarchy {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-3) 0;
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

.plan-list-section {
  margin-top: var(--space-6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.results-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.filter-tabs {
  display: flex;
  gap: var(--space-2);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-1);
}

.filter-tab {
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
}

.filter-tab:hover {
  color: var(--text-main);
  background: var(--bg-card-hover);
}

.filter-tab.active {
  background: var(--ai-main);
  color: white;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.plan-card {
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
}

.plan-card:hover {
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

.plan-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  flex: 1;
  margin-right: var(--space-2);
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

.plan-description {
  margin: 0 0 var(--space-3);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.plan-meta {
  display: flex;
  gap: var(--space-4);
  font-size: 12px;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  gap: var(--space-1);
}

.meta-label {
  font-weight: 500;
}

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
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

@media (max-width: 768px) {
  .enhanced-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .health-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .health-score {
    text-align: left;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
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
    align-self: flex-end;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }
  
  .info-label {
    min-width: auto;
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
