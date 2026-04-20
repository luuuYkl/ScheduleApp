<!-- src/components/log/LogGroupSection.vue -->
<!-- 日志分组组件 - 标准卡片风格 -->

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import type { LogGroup } from '@/utils/log-grouping';

interface Props {
  group: LogGroup;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'toggle-group': [];
  'toggle-expand-all': [];
  'height-change': [data: { type: 'group' | 'log', id: string | number, height: number }];
}>();

const groupHeaderRef = ref<HTMLElement | null>(null);

const allExpanded = computed(() => 
  props.group.logs.every(l => l.expanded)
);

// 计算分组统计
const groupStats = computed(() => {
  const logs = props.group.logs;
  if (logs.length === 0) return { avgCompletion: 0, totalTasks: 0, doneTasks: 0 };
  
  const totalTasks = logs.reduce((sum, l) => sum + l.log.tasks_total, 0);
  const doneTasks = logs.reduce((sum, l) => sum + l.log.tasks_done, 0);
  const avgCompletion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  
  return { avgCompletion, totalTasks, doneTasks };
});

function toggleGroup() {
  emit('toggle-group');
}

function toggleExpandAll() {
  emit('toggle-expand-all');
}

// 报告分组标题高度
function reportGroupHeight() {
  if (groupHeaderRef.value) {
    const height = groupHeaderRef.value.offsetHeight;
    emit('height-change', { type: 'group', id: props.group.period, height });
  }
}

// 组件挂载后报告高度
onMounted(() => {
  reportGroupHeight();
});

// 监听分组展开状态变化，重新报告高度
watch(() => props.group.expanded, () => {
  setTimeout(() => {
    reportGroupHeight();
  }, 50);
});
</script>

<template>
  <div class="log-group-section">
    <!-- 分组标题 - 类似 suggestion-header 风格 -->
    <div 
      ref="groupHeaderRef"
      class="group-header"
      :class="{ expanded: group.expanded }"
      @click="toggleGroup"
    >
      <div class="group-main">
        <span class="group-icon">
          {{ group.period === 'recent' ? '📌' : group.period === 'thisWeek' ? '📅' : '📂' }}
        </span>
        <span class="group-title">{{ group.title }}</span>
        <span class="group-count">{{ group.count }}</span>
      </div>
      
      <div class="group-right">
        <!-- 统计信息 -->
        <div class="group-stats" v-if="group.expanded">
          <span class="stat-item">
            <span class="stat-value">{{ groupStats.avgCompletion }}%</span>
            <span class="stat-label">完成率</span>
          </span>
          <span class="stat-item">
            <span class="stat-value">{{ groupStats.doneTasks }}/{{ groupStats.totalTasks }}</span>
            <span class="stat-label">任务</span>
          </span>
        </div>
        
        <a-button 
          v-if="group.expanded && group.logs.length > 2"
          type="text" 
          size="mini"
          class="expand-all-btn"
          @click.stop="toggleExpandAll"
        >
          {{ allExpanded ? '收起全部' : '展开全部' }}
        </a-button>
        
        <span class="expand-icon" :class="{ expanded: group.expanded }">▼</span>
      </div>
    </div>
    
    <!-- 日志列表 -->
    <div v-if="group.expanded" class="group-logs">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
/* ========== 分组整体 ========== */
.log-group-section {
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
  transition: all var(--dur-fast) var(--ease-standard);
}

.log-group-section:hover {
  border-color: var(--border-main);
}

/* ========== 分组标题 ========== */
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-standard);
}

.group-header:hover {
  background: var(--bg-elevated);
}

.group-header.expanded {
  border-bottom: 1px solid var(--border-subtle);
}

.group-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.group-icon {
  font-size: 16px;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.group-count {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  background: var(--bg-elevated);
  border-radius: 6px;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* ========== 右侧区域 ========== */
.group-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.group-stats {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
}

.expand-all-btn {
  font-size: 12px;
  color: var(--text-muted) !important;
}

.expand-icon {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform var(--dur-fast) var(--ease-standard);
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* ========== 日志列表 ========== */
.group-logs {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-elevated);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .group-stats {
    display: none;
  }
  
  .group-header {
    padding: var(--space-2) var(--space-3);
  }
}

@media (max-width: 480px) {
  .group-logs {
    padding: var(--space-2);
    gap: var(--space-2);
  }
}
</style>
