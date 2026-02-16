<template>
  <Modal 
    :visible="visible" 
    @close="handleClose"
    title="选择计划"
    width="400px"
  >
    <div class="plan-selector">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索计划..."
          class="search-input"
          ref="searchInput"
        />
      </div>

      <div class="plan-list">
        <div 
          v-for="plan in filteredPlans" 
          :key="plan.id"
          class="plan-item"
          :class="{ active: selectedPlanId === plan.id }"
          @click="selectPlan(plan)"
          @keydown.enter="selectPlan(plan)"
          @keydown.space.prevent="selectPlan(plan)"
          tabindex="0"
          role="option"
          :aria-selected="selectedPlanId === plan.id"
        >
          <div class="plan-info">
            <h4 class="plan-title">{{ plan.title }}</h4>
            <p class="plan-desc">{{ plan.description || '暂无描述' }}</p>
          </div>
          <div class="plan-meta">
            <span :class="['status-badge', `status-${plan.status.toLowerCase()}`]">
              {{ getStatusText(plan.status) }}
            </span>
          </div>
        </div>

        <div v-if="filteredPlans.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>{{ searchQuery ? '未找到匹配的计划' : '暂无计划' }}</p>
          <Button @click="goCreatePlan" variant="outline" size="sm">
            创建计划
          </Button>
        </div>
      </div>

      <div class="modal-actions">
        <Button @click="handleClose" variant="outline">
          取消
        </Button>
        <Button 
          @click="confirmSelection" 
          variant="primary"
          :disabled="!selectedPlanId"
        >
          确认选择
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanStore } from '@/store/plans'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

interface Plan {
  id: string
  title: string
  description: string
  status: string
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'select', planId: string): void
  (e: 'close'): void
}>()

const router = useRouter()
const planStore = usePlanStore()

const searchQuery = ref('')
const selectedPlanId = ref<string | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

const plans = computed<Plan[]>(() => {
  return planStore.plans.map((plan: any) => ({
    id: plan.id,
    title: plan.title,
    description: plan.description,
    status: plan.status
  }))
})

const filteredPlans = computed(() => {
  if (!searchQuery.value) return plans.value
  const query = searchQuery.value.toLowerCase()
  return plans.value.filter(plan => 
    plan.title.toLowerCase().includes(query) ||
    (plan.description && plan.description.toLowerCase().includes(query))
  )
})

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    'NOT_STARTED': '未开始',
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成'
  }
  return statusMap[status] || status
}

function selectPlan(plan: Plan) {
  selectedPlanId.value = plan.id
}

function confirmSelection() {
  if (selectedPlanId.value) {
    emit('select', selectedPlanId.value)
    handleClose()
  }
}

function handleClose() {
  searchQuery.value = ''
  selectedPlanId.value = null
  emit('close')
}

function goCreatePlan() {
  handleClose()
  router.push('/plan/create')
}

// 当模态框打开时自动聚焦搜索框
watch(() => props.visible, async (visible) => {
  if (visible) {
    await nextTick()
    if (searchInput.value) {
      searchInput.value.focus()
    }
    // 加载计划数据
    planStore.loadPlans()
  }
})
</script>

<style scoped>
.plan-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--bg-input);
  color: var(--text-main);
  transition: all var(--dur-fast) var(--ease-standard);
}

.search-input:focus {
  outline: none;
  border-color: var(--ai-main);
  box-shadow: 0 0 0 2px var(--ai-bg);
}

.plan-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-main);
  border-radius: var(--radius-md);
  background: var(--bg-card);
}

.plan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
}

.plan-item:last-child {
  border-bottom: none;
}

.plan-item:hover,
.plan-item:focus {
  background: var(--bg-card-hover);
  outline: none;
}

.plan-item:focus-visible {
  box-shadow: inset 0 0 0 2px var(--focus-ring);
}

.plan-item.active {
  background: var(--ai-bg);
}

.plan-info {
  flex: 1;
  min-width: 0;
}

.plan-title {
  margin: 0 0 var(--space-1);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-meta {
  flex-shrink: 0;
  margin-left: var(--space-3);
}

.status-badge {
  font-size: 11px;
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

.empty-state {
  text-align: center;
  padding: var(--space-6) var(--space-4);
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 32px;
  margin-bottom: var(--space-2);
}

.empty-state p {
  margin: 0 0 var(--space-3);
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-2);
}

@media (max-width: 480px) {
  .plan-selector {
    gap: var(--space-3);
  }
  
  .plan-item {
    padding: var(--space-2) var(--space-3);
  }
  
  .plan-title {
    font-size: 13px;
  }
  
  .plan-desc {
    font-size: 11px;
  }
}
</style>