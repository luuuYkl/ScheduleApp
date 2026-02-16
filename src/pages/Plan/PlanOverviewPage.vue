<template>
  <PageScaffold 
    title="计划"
    subtitle="管理你的所有计划"
    show-back-button
    @back="goBack"
  >
    <template #actions>
      <Button 
        variant="primary" 
        size="sm"
        @click="goCreatePlan"
      >
        + 新建计划
      </Button>
    </template>

    <div class="plan-overview">
      <!-- 计划统计卡片 -->
      <div class="stats-grid">
        <Card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ planStats.total }}</div>
            <div class="stat-label">总计划数</div>
          </div>
        </Card>
        <Card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ planStats.inProgress }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </Card>
        <Card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ planStats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </Card>
      </div>

      <!-- 计划列表 -->
      <div class="plan-list-section">
        <div class="section-header">
          <h3>我的计划</h3>
          <div class="filter-tabs">
            <button 
              v-for="filter in planFilters" 
              :key="filter.key"
              :class="['filter-tab', { active: currentFilter === filter.key }]"
              @click="currentFilter = filter.key"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>

        <div class="plan-list">
          <Card 
            v-for="plan in filteredPlans" 
            :key="plan.id"
            class="plan-card"
            @click="goToPlanDetail(plan.id)"
          >
            <div class="plan-card-content">
              <div class="plan-header">
                <h4 class="plan-title">{{ plan.title }}</h4>
                <span :class="['plan-status', `status-${plan.status.toLowerCase()}`]">
                  {{ getStatusText(plan.status) }}
                </span>
              </div>
              <p class="plan-description">{{ plan.description || '暂无描述' }}</p>
              <div class="plan-meta">
                <span class="meta-item">
                  <span class="meta-label">开始:</span>
                  {{ formatDate(plan.startDate) }}
                </span>
                <span class="meta-item">
                  <span class="meta-label">结束:</span>
                  {{ formatDate(plan.endDate) }}
                </span>
                <span class="meta-item">
                  <span class="meta-label">任务:</span>
                  {{ plan.taskCount }}个
                </span>
              </div>
            </div>
          </Card>

          <div v-if="filteredPlans.length === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <p>暂无{{ getFilterLabel(currentFilter) }}计划</p>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanStore } from '@/store/plans'
import PageScaffold from '@/components/common/PageScaffold.vue'
import Button from '@/components/common/Button.vue'
import Card from '@/components/common/Card.vue'

interface Plan {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  taskCount: number
}

const router = useRouter()
const plansStore = usePlanStore()

const currentFilter = ref<'all' | 'in_progress' | 'completed'>('all')

const planFilters = [
  { key: 'all' as const, label: '全部' },
  { key: 'in_progress' as const, label: '进行中' },
  { key: 'completed' as const, label: '已完成' }
]

const plans = computed<Plan[]>(() => {
  return plansStore.plans.map((plan: any) => ({
    id: plan.id,
    title: plan.title,
    description: plan.description,
    startDate: plan.startDate,
    endDate: plan.endDate,
    status: plan.status,
    taskCount: plan.tasks?.length || 0
  }))
})

const filteredPlans = computed(() => {
  if (currentFilter.value === 'all') return plans.value
  if (currentFilter.value === 'in_progress') {
    return plans.value.filter(p => p.status === 'IN_PROGRESS')
  }
  return plans.value.filter(p => p.status === 'COMPLETED')
})

const planStats = computed(() => {
  return {
    total: plans.value.length,
    inProgress: plans.value.filter(p => p.status === 'IN_PROGRESS').length,
    completed: plans.value.filter(p => p.status === 'COMPLETED').length
  }
})

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    'NOT_STARTED': '未开始',
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成'
  }
  return statusMap[status] || status
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

function getFilterLabel(filter: string) {
  const labelMap: Record<string, string> = {
    'all': '',
    'in_progress': '进行中',
    'completed': '已完成'
  }
  return labelMap[filter] || ''
}

function goBack() {
  router.back()
}

function goCreatePlan() {
  router.push('/plan/create')
}

function goToPlanDetail(planId: string) {
  router.push(`/plan/${planId}/tasks`)
}

onMounted(() => {
  plansStore.loadPlans()
})
</script>

<style scoped>
.plan-overview {
  max-width: 800px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  text-align: center;
  padding: var(--space-4);
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: var(--ai-main);
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.plan-list-section {
  margin-top: var(--space-6);
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
  margin: 0 0 var(--space-4);
  font-size: 16px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
  
  .filter-tabs {
    width: 100%;
    justify-content: stretch;
  }
  
  .filter-tab {
    flex: 1;
    text-align: center;
  }
  
  .plan-meta {
    flex-wrap: wrap;
    gap: var(--space-3);
  }
}
</style>