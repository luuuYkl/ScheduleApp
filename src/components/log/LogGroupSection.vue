<!-- src/components/log/LogGroupSection.vue -->
<!-- 日志分组组件 -->

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import type { LogGroup } from '@/utils/log-grouping';

interface Props {
  group: LogGroup;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'toggle-group': [];
  'toggle-log': [logItem: any];
  'height-change': [data: { type: 'group' | 'log', id: string | number, height: number }];
}>();

const groupHeaderRef = ref<HTMLElement | null>(null);

const allExpanded = computed(() => 
  props.group.logs.every(l => l.expanded)
);

function toggleGroup() {
  emit('toggle-group');
}

function toggleLog(logItem: any) {
  emit('toggle-log', logItem);
}

function toggleExpandAll() {
  const expand = !allExpanded.value;
  for (const logItem of props.group.logs) {
    logItem.expanded = expand;
  }
}

// 报告分组标题高度
function reportGroupHeight() {
  if (groupHeaderRef.value) {
    const height = groupHeaderRef.value.offsetHeight;
    emit('height-change', { type: 'group', id: props.group.period, height });
  }
}

// 更新日志卡片高度
function updateLogHeight(logItem: any, height: number) {
  emit('height-change', { type: 'log', id: logItem.log.id, height });
}

// 组件挂载后报告高度
onMounted(() => {
  reportGroupHeight();
});

// 监听分组展开状态变化，重新报告高度
watch(() => props.group.expanded, () => {
  // 等待 DOM 更新后测量高度
  setTimeout(() => {
    reportGroupHeight();
  }, 50);
});
</script>

<template>
  <div class="log-group-section">
    <!-- 分组标题 -->
    <div 
      ref="groupHeaderRef"
      class="group-header"
      :class="{ expanded: group.expanded }"
      @click="toggleGroup"
    >
      <div class="group-title">
        <span class="group-icon">📁</span>
        <span class="group-name">{{ group.title }}</span>
        <span class="group-count">({{ group.count }})</span>
      </div>
      <div class="group-actions">
        <a-button 
          v-if="group.expanded && group.logs.length > 2"
          type="text" 
          size="mini"
          @click.stop="toggleExpandAll"
        >
          {{ allExpanded ? '收起全部' : '展开全部' }}
        </a-button>
        <span class="expand-arrow">▼</span>
      </div>
    </div>
    
    <!-- 日志列表 -->
    <div v-if="group.expanded" class="group-logs">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.log-group-section {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-2);
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.log-group-section:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 14px 20px;
  background: var(--bg-elevated);
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border-subtle);
  border-left: 3px solid var(--ai-main);
  min-height: 60px;
  position: relative;
  z-index: 10;
}

.group-header:hover {
  background: var(--bg-card-hover);
  border-bottom-color: var(--border-main);
  border-left-color: var(--ai-main-hover);
}

.group-header.expanded {
  background: var(--bg-elevated);
  border-bottom-color: var(--border-main);
  border-left-color: var(--success);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  flex: 1;
}

.group-icon {
  font-size: 18px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.group-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.group-count {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  background: var(--bg-main);
  padding: 4px 10px;
  border-radius: 12px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-left: 8px;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 8px;
  position: relative;
  z-index: 20;
}

.expand-arrow {
  font-size: 12px;
  color: var(--text-muted);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  background: var(--bg-main);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.group-header.expanded .expand-arrow {
  transform: rotate(180deg);
  background: var(--ai-main);
  color: white;
}

.group-logs {
  display: flex;
  flex-direction: column;
  animation: slideDown 0.3s ease-out;
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
</style>