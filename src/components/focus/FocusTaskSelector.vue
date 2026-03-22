<!--
  ═══════════════════════════════════════════════════════════════
  专注模式任务选择弹窗 (FocusTaskSelector.vue)
  ═══════════════════════════════════════════════════════════════
  
  【组件定位】
  专注模式下的任务选择弹窗，用于从今日任务列表中选择要专注的任务。
  
  【核心功能】
  1. 显示今日任务列表（只显示标题和时间）
  2. 点击任务项后触发选择事件
  3. 支持关闭按钮和点击遮罩层关闭
  
  【Props】
  - visible: 是否显示弹窗
  - tasks: 任务列表数组
  
  【Events】
  - update:visible: 更新弹窗显示状态
  - select: 选择任务时触发，参数为任务ID
  
  【设计原则】
- 简洁清晰，只显示必要信息
- 符合专注模式的深色主题
-->
<template>
  <Modal
    :visible="visible"
    @update:visible="handleVisibleChange"
    title="今日任务"
    width="500px"
  >
    <div class="task-selector">
      <div v-if="tasks.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>暂无今日任务</p>
      </div>
      
      <div v-else class="task-list">
        <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="task-item"
          @click="handleSelectTask(task.id)"
        >
          <div class="task-info">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-time">{{ formatTaskTime(task) }}</div>
          </div>
          <div class="task-arrow">→</div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Modal from "@/components/common/Modal.vue";
import { computed } from "vue";
import type { Task } from "@/services/api.types";

const props = defineProps<{
  visible: boolean;
  tasks: Task[];
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  select: [taskId: number];
}>();

// 按时间排序的任务列表
const sortedTasks = computed(() => {
  return [...props.tasks].sort((a, b) => {
    const timeA = a.start_time || '00:00';
    const timeB = b.start_time || '00:00';
    return timeA.localeCompare(timeB);
  });
});

function handleVisibleChange(visible: boolean) {
  emit('update:visible', visible);
}

function handleSelectTask(taskId: number) {
  emit('select', taskId);
  emit('update:visible', false);
}

function formatTaskTime(task: Task): string {
  if (task.start_time && task.end_time) {
    return `${task.start_time} - ${task.end_time}`;
  }
  if (task.start_time) {
    return task.start_time;
  }
  return '全天';
}
</script>

<style scoped>
.task-selector {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary, rgba(229, 231, 235, 0.6));
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary, #e5e7eb);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-time {
  font-size: 13px;
  color: var(--text-secondary, rgba(229, 231, 235, 0.6));
}

.task-arrow {
  font-size: 18px;
  color: var(--text-secondary, rgba(229, 231, 235, 0.4));
  margin-left: 12px;
  transition: transform 0.2s ease;
}

.task-item:hover .task-arrow {
  transform: translateX(4px);
  color: var(--text-primary, #e5e7eb);
}

/* 滚动条样式 */
.task-selector::-webkit-scrollbar {
  width: 6px;
}

.task-selector::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 3px;
}

.task-selector::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.task-selector::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 响应式 */
@media (max-width: 768px) {
  .task-selector {
    max-height: 300px;
  }
  
  .task-item {
    padding: 10px 12px;
  }
  
  .task-title {
    font-size: 14px;
  }
  
  .task-time {
    font-size: 12px;
  }
}
</style>