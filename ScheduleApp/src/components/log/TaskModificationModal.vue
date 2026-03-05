<template>
  <a-modal
    v-model:visible="modalVisible"
    :title="modalTitle"
    :width="680"
    :footer="false"
    :mask-closable="false"
    class="task-modification-modal"
    @cancel="handleCancel"
  >
    <div class="modal-content">
      <!-- 总体说明 -->
      <div class="modification-summary">
        <div class="summary-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </div>
        <div class="summary-text">
          <p>AI 建议对以下 <strong>{{ modifications.length }}</strong> 个任务进行修改。</p>
          <p class="summary-hint">请仔细检查变更内容，确认后执行修改。</p>
        </div>
      </div>

      <!-- 修改列表 -->
      <div class="modifications-list">
        <div 
          v-for="(item, index) in comparisonItems" 
          :key="index"
          class="modification-card"
          :class="`type-${item.type}`"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="card-type-badge" :class="`badge-${item.type}`">
              {{ getTypeLabel(item.type) }}
            </div>
            <div class="card-reason">{{ item.reason }}</div>
          </div>

          <!-- 对比视图 -->
          <div class="comparison-view">
            <!-- 原任务 -->
            <div class="task-box original" v-if="item.original">
              <div class="box-label">
                <span class="label-dot red"></span>
                原任务
              </div>
              <div class="task-info">
                <div class="task-title">{{ item.original.title }}</div>
                <div class="task-details">
                  <span v-if="item.original.task_date" class="detail-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {{ formatDate(item.original.task_date) }}
                  </span>
                  <span v-if="item.original.start_time" class="detail-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ item.original.start_time }}
                    <template v-if="item.original.end_time"> - {{ item.original.end_time }}</template>
                  </span>
                  <span v-if="item.original.note" class="detail-item note">
                    {{ item.original.note }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 箭头 -->
            <div class="comparison-arrow" v-if="item.original">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>

            <!-- 修改后任务 -->
            <div class="task-box modified">
              <div class="box-label">
                <span class="label-dot green"></span>
                {{ item.original ? '修改后' : '新增任务' }}
              </div>
              <div class="task-info">
                <div class="task-title">{{ item.modified.title || item.original?.title }}</div>
                <div class="task-details">
                  <span 
                    v-for="change in item.fieldChanges" 
                    :key="change.field"
                    class="detail-item"
                    :class="{ changed: change.changed }"
                  >
                    <template v-if="change.field === 'task_date'">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {{ formatDate(change.modifiedValue) }}
                    </template>
                    <template v-else-if="change.field === 'start_time'">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {{ change.modifiedValue }}
                      <template v-if="item.modified.end_time"> - {{ item.modified.end_time }}</template>
                    </template>
                    <template v-else-if="change.field === 'note'">
                      {{ change.modifiedValue }}
                    </template>
                    <template v-else>
                      {{ change.fieldLabel }}: {{ change.modifiedValue }}
                    </template>
                    <span v-if="change.changed" class="change-indicator">已变更</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="modal-footer">
        <a-button @click="handleCancel" :disabled="loading">
          取消
        </a-button>
        <a-button 
          type="primary" 
          :loading="loading"
          @click="handleConfirm"
        >
          <template #icon v-if="!loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </template>
          确认修改
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { 
  Task, 
  TaskModification, 
  TaskModificationType,
  TaskComparisonItem 
} from '@/services/api.types';

// Props
const props = defineProps<{
  visible: boolean;
  modifications: TaskModification[];
  loading?: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

// 双向绑定
const modalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 弹窗标题
const modalTitle = computed(() => {
  const count = props.modifications.length;
  return `确认任务修改 (${count}项)`;
});

// 字段标签映射
const fieldLabels: Record<string, string> = {
  title: '标题',
  task_date: '日期',
  start_time: '开始时间',
  end_time: '结束时间',
  note: '备注',
  status: '状态'
};

// 获取修改类型标签
function getTypeLabel(type: TaskModificationType): string {
  const labels: Record<TaskModificationType, string> = {
    reschedule: '重新安排',
    reduce_priority: '降低优先级',
    split: '拆分任务',
    delete: '删除任务',
    modify: '修改内容'
  };
  return labels[type] || '修改';
}

// 格式化日期
function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateStr === today.toISOString().slice(0, 10)) {
    return '今天';
  } else if (dateStr === tomorrow.toISOString().slice(0, 10)) {
    return '明天';
  } else {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    };
    return date.toLocaleDateString('zh-CN', options);
  }
}

// 生成对比项
const comparisonItems = computed<TaskComparisonItem[]>(() => {
  return props.modifications.map(mod => {
    const original = mod.original;
    const modified = mod.modified;
    
    // 计算字段变更
    const fieldChanges: TaskComparisonItem['fieldChanges'] = [];
    
    const fieldsToCheck = ['task_date', 'start_time', 'end_time', 'note', 'title'] as const;
    
    fieldsToCheck.forEach(field => {
      const originalValue = original?.[field as keyof Task] || '';
      const modifiedValue = modified[field as keyof typeof modified] || '';
      
      if (modifiedValue || originalValue) {
        fieldChanges.push({
          field,
          fieldLabel: fieldLabels[field] || field,
          originalValue: String(originalValue),
          modifiedValue: String(modifiedValue),
          changed: originalValue !== modifiedValue && !!modifiedValue
        });
      }
    });

    return {
      taskId: mod.taskId,
      type: mod.type,
      reason: mod.reason,
      original,
      modified,
      fieldChanges
    };
  });
});

// 处理确认
function handleConfirm() {
  emit('confirm');
}

// 处理取消
function handleCancel() {
  emit('cancel');
  modalVisible.value = false;
}
</script>

<style scoped>
.task-modification-modal :deep(.arco-modal-body) {
  padding: 0;
}

.modal-content {
  padding: 0;
}

.modification-summary {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0.1) 100%);
  border-bottom: 1px solid var(--border-subtle);
}

.summary-icon {
  color: var(--color-brand-500, #2563EB);
}

.summary-text {
  flex: 1;
}

.summary-text p {
  margin: 0;
  color: var(--text-main);
  font-size: 14px;
}

.summary-hint {
  margin-top: 4px !important;
  font-size: 12px !important;
  color: var(--text-secondary);
}

.modifications-list {
  padding: 16px 20px;
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modification-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.2s;
}

.modification-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.modification-card.type-reschedule {
  border-left: 4px solid #3b82f6;
}

.modification-card.type-reduce_priority {
  border-left: 4px solid #f59e0b;
}

.modification-card.type-split {
  border-left: 4px solid #8b5cf6;
}

.modification-card.type-delete {
  border-left: 4px solid #ef4444;
}

.modification-card.type-modify {
  border-left: 4px solid #10b981;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-subtle);
}

.card-type-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-reschedule {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.badge-reduce_priority {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.badge-split {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.badge-delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.badge-modify {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.card-reason {
  flex: 1;
  font-size: 13px;
  color: var(--text-secondary);
}

.comparison-view {
  display: flex;
  align-items: stretch;
  padding: 16px;
  gap: 12px;
}

.task-box {
  flex: 1;
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.task-box.original {
  background: rgba(239, 68, 68, 0.03);
  border-color: rgba(239, 68, 68, 0.2);
}

.task-box.modified {
  background: rgba(16, 185, 129, 0.03);
  border-color: rgba(16, 185, 129, 0.2);
}

.box-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.label-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.label-dot.red {
  background: #ef4444;
}

.label-dot.green {
  background: #10b981;
}

.task-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
}

.task-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 2px 8px;
  background: var(--bg-elevated);
  border-radius: 10px;
}

.detail-item svg {
  flex-shrink: 0;
}

.detail-item.changed {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.change-indicator {
  font-size: 10px;
  padding: 1px 4px;
  background: #10b981;
  color: white;
  border-radius: 4px;
  margin-left: 4px;
}

.comparison-arrow {
  display: flex;
  align-items: center;
  color: var(--text-muted);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .comparison-view {
    flex-direction: column;
  }
  
  .comparison-arrow {
    justify-content: center;
    transform: rotate(90deg);
    padding: 8px 0;
  }
  
  .modifications-list {
    max-height: 50vh;
  }
}
</style>