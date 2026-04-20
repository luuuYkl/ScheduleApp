<template>
  <transition name="tooltip-fade">
    <div 
      v-if="visible && event"
      class="event-tooltip-global"
      :style="{ 
        left: (position.x + 15) + 'px',
        top: (position.y + 10) + 'px'
      }"
    >
      <div class="tooltip-content">
        <!-- 头部：标题 + 类型标签 -->
        <div class="tooltip-header">
          <div class="tooltip-title">{{ event.title }}</div>
          <div class="tooltip-type-badge">
            {{ typeLabel }}
          </div>
        </div>
        
        <!-- 时间信息 -->
        <div class="tooltip-row">
          <span class="tooltip-icon">🕐</span>
          <span class="tooltip-label">时间</span>
          <span class="tooltip-value">{{ timeText }}</span>
        </div>
        
        <!-- 描述（如果有）-->
        <div v-if="event.originalData?.description" class="tooltip-description">
          {{ event.originalData.description }}
        </div>
        
        <!-- 任务特有信息 -->
        <template v-if="event.type === 'task'">
          <!-- 优先级 -->
          <div class="tooltip-row" v-if="event.originalData?.priority">
            <span class="tooltip-icon">⚡</span>
            <span class="tooltip-label">优先级</span>
            <span class="tooltip-value">{{ priorityLabel }}</span>
          </div>
          
          <!-- 进度 -->
          <div class="tooltip-progress" v-if="event.originalData?.progress !== undefined">
            <div class="tooltip-row">
              <span class="tooltip-icon">📊</span>
              <span class="tooltip-label">进度</span>
              <span class="tooltip-value">{{ event.originalData.progress }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: event.originalData.progress + '%' }"></div>
            </div>
          </div>
          
          <!-- 状态 -->
          <div class="tooltip-row">
            <span class="tooltip-icon">✅</span>
            <span class="tooltip-label">状态</span>
            <span class="tooltip-value">{{ statusLabel }}</span>
          </div>
        </template>
        
        <!-- 日程特有信息 -->
        <template v-if="event.type === 'schedule'">
          <div class="tooltip-row">
            <span class="tooltip-icon">✅</span>
            <span class="tooltip-label">状态</span>
            <span class="tooltip-value">{{ event.completed ? '已完成' : '未完成' }}</span>
          </div>
        </template>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface TimelineEvent {
  id: string | number
  title: string
  type: 'task' | 'schedule' | 'focus' | 'meal' | 'break'
  startHour: number
  endHour: number
  completed: boolean
  originalData: any
  columnIndex?: number
  totalColumns?: number
}

const props = defineProps<{
  visible: boolean
  event: TimelineEvent | null
  position: { x: number; y: number }
  formatEventTimeDetailed: (event: TimelineEvent) => string
}>()

const typeLabels: Record<string, string> = {
  task: '任务',
  schedule: '日程',
  focus: '专注',
  meal: '用餐',
  break: '休息',
}

const typeLabel = computed(() => {
  if (!props.event) return ''
  return typeLabels[props.event.type] || props.event.type
})

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const priorityLabel = computed(() => {
  if (!props.event?.originalData?.priority) return ''
  return priorityLabels[props.event.originalData.priority] || props.event.originalData.priority
})

const statusLabels: Record<string, string> = {
  pending: '待办',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
}

const statusLabel = computed(() => {
  if (!props.event?.originalData?.status) return '待办'
  return statusLabels[props.event.originalData.status] || props.event.originalData.status
})

const timeText = computed(() => {
  if (!props.event) return ''
  return props.formatEventTimeDetailed(props.event)
})
</script>

<style scoped>
/* Tooltip 样式 */
.event-tooltip-global {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  max-width: 320px;
  min-width: 200px;
}

.tooltip-content {
  background: var(--bg-elevated);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--space-1);
}

.tooltip-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-emphasis);
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tooltip-type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--ai-bg);
  color: var(--ai-main);
  flex-shrink: 0;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
  color: var(--text-main);
}

.tooltip-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.tooltip-label {
  color: var(--text-secondary);
  min-width: 36px;
}

.tooltip-value {
  color: var(--text-main);
  font-weight: 500;
}

.tooltip-description {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  padding: var(--space-1) var(--space-2);
  background: var(--bg-card-hover);
  border-radius: var(--radius-sm);
}

.tooltip-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.progress-bar {
  height: 4px;
  background: var(--bg-card-hover);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--ai-main);
  border-radius: var(--radius-full);
  transition: width 0.3s var(--ease-standard);
}

/* Tooltip 过渡动画 */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 150ms var(--ease-standard);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}
</style>
