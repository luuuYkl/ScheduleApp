<!--
  ═══════════════════════════════════════════════════════════════
  专注任务卡片组件 (FocusTaskCard.vue)
  ═══════════════════════════════════════════════════════════════
  
  【组件定位】
  专注模式页面的任务卡片组件，显示当前任务或无任务状态。
  
  【核心功能】
  1. 显示当前任务信息（名称、时间、剩余时间）
  2. 无任务时显示最小化操作入口
  3. 处理多个冲突任务的情况
  
  【Props】
  - task: 当前任务对象
  - tasks: 当前时间段的所有任务（用于冲突检测）
  
  【Events】
  - create-task: 点击创建任务
  - select-task: 选择任务
-->
<template>
  <div class="focus-task-card">
    <!-- 有任务时显示 -->
    <template v-if="task">
      <!-- 多个冲突任务提示 -->
      <div v-if="tasks.length > 1" class="conflict-hint">
        当前有 {{ tasks.length }} 个任务
      </div>
      
      <!-- 任务卡片 -->
      <div class="task-card">
        <div class="task-header">
          <span class="task-icon">{{ getTaskIcon(task) }}</span>
          <span class="task-title">{{ task.title }}</span>
        </div>
        
        <div class="task-time">
          <span class="time-start">{{ formatTime(task.startHour) }}</span>
          <span class="time-separator">—</span>
          <span class="time-end">{{ formatTime(task.endHour) }}</span>
        </div>
        
        <div v-if="remainingTime" class="task-remaining">
          <span class="remaining-label">剩余</span>
          <span class="remaining-value">{{ remainingTime }}</span>
        </div>
      </div>
    </template>
    
    <!-- 无任务时显示 -->
    <template v-else>
      <div class="no-task-state">
        <div class="no-task-text">当前无任务</div>
        <div class="no-task-actions">
          <button class="action-btn" @click="$emit('create-task')">
            <span class="action-icon">+</span>
            <span class="action-text">快速创建</span>
          </button>
          <button class="action-btn" @click="$emit('select-task')">
            <span class="action-icon">📋</span>
            <span class="action-text">选择任务</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface TimelineEvent {
  id: string;
  title: string;
  type: 'task' | 'schedule' | 'focus' | 'meal' | 'break';
  startHour: number;
  endHour: number;
  completed: boolean;
  originalData: any;
}

const props = defineProps<{
  task: TimelineEvent | null;
  tasks: TimelineEvent[];
}>();

const emit = defineEmits<{
  'create-task': [];
  'select-task': [taskId?: string];
}>();

// 剩余时间计算
const remainingTime = computed(() => {
  if (!props.task) return null;
  
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const remainingHours = props.task.endHour - currentHour;
  
  if (remainingHours <= 0) return null;
  
  const hours = Math.floor(remainingHours);
  const minutes = Math.round((remainingHours - hours) * 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
});

// 格式化时间
function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// 获取任务图标
function getTaskIcon(event: TimelineEvent): string {
  switch (event.type) {
    case 'focus': return '🎯';
    case 'meal': return '🍽️';
    case 'break': return '☕';
    case 'schedule': return '📌';
    case 'task': 
    default: return '📋';
  }
}
</script>

<style scoped>
.focus-task-card {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* 冲突任务提示 */
.conflict-hint {
  font-size: 12px;
  color: var(--focus-text-secondary);
  padding: 6px 12px;
  background: var(--focus-accent-bg);
  border-radius: var(--radius-full);
  border: 1px solid var(--focus-button-border);
}

/* 任务卡片 */
.task-card {
  width: 100%;
  padding: 32px;
  background: var(--focus-card);
  border: 1px solid var(--focus-card-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 40px rgba(96, 165, 250, 0.03);
}

.task-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.task-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.task-title {
  font-size: 26px;
  font-weight: 600;
  color: var(--focus-text);
  line-height: 1.3;
  flex: 1;
  word-break: break-word;
}

.task-time {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-variant-numeric: tabular-nums;
  color: var(--focus-text-secondary);
}

.time-start,
.time-end {
  font-weight: 500;
}

.time-separator {
  color: var(--focus-text-muted);
}

.task-remaining {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--focus-card-border);
}

.remaining-label {
  font-size: 14px;
  color: var(--focus-text-secondary);
}

.remaining-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--focus-accent);
  font-variant-numeric: tabular-nums;
}

/* 无任务状态 */
.no-task-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px;
  background: var(--focus-card);
  border: 1px solid var(--focus-card-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
}

.no-task-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--focus-text-secondary);
}

.no-task-actions {
  display: flex;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--focus-button-bg);
  border: 1px solid var(--focus-button-border);
  border-radius: var(--radius-md);
  color: var(--focus-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.action-btn:hover {
  background: var(--focus-button-hover-bg);
  border-color: var(--focus-button-hover-border);
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0);
}

.action-icon {
  font-size: 16px;
}

.action-text {
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .task-card {
    padding: 24px;
  }
  
  .task-icon {
    font-size: 24px;
  }
  
  .task-title {
    font-size: 20px;
  }
  
  .task-time {
    font-size: 14px;
  }
  
  .no-task-state {
    padding: 24px;
  }
  
  .no-task-text {
    font-size: 16px;
  }
  
  .action-btn {
    padding: 10px 20px;
  }
}
</style>
