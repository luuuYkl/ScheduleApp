<!-- src/components/log/LogCard.vue -->
<!-- 日志卡片组件 - 标准卡片风格 -->

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { LogEntry } from '@/services/generate-log';

interface Props {
  log: LogEntry;
  expanded: boolean;
  efficiencyRating: 1 | 2 | 3 | 4;
  summary: string;
  tasks?: any[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'toggle': [];
  'height-change': [data: { type: 'group' | 'log', id: string | number, height: number }];
}>();

const cardRef = ref<HTMLElement | null>(null);

// 计算属性
const completionRate = computed(() => 
  props.log.tasks_total > 0 
    ? Math.round((props.log.tasks_done / props.log.tasks_total) * 100)
    : 0
);

const completionClass = computed(() => {
  if (completionRate.value >= 80) return 'high';
  if (completionRate.value >= 50) return 'medium';
  return 'low';
});

const moodLabel = computed(() => {
  const labels: Record<string, string> = {
    happy: '良好', calm: '平静', anxious: '焦虑',
    tired: '疲惫', focused: '专注', stressed: '紧张'
  };
  return labels[props.log.mood || ''] || '';
});

// 日期格式化
const formattedDate = computed(() => {
  const date = new Date(props.log.date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateStr = props.log.date;
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  
  if (dateStr === todayStr) return '今天';
  if (dateStr === yesterdayStr) return '昨天';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
});

const formattedWeekday = computed(() => {
  const date = new Date(props.log.date);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
});

// 报告高度变化
function reportHeight() {
  if (cardRef.value) {
    const height = cardRef.value.offsetHeight;
    emit('height-change', { type: 'log', id: props.log.id, height });
  }
}

watch(() => props.expanded, () => {
  setTimeout(() => {
    reportHeight();
  }, 350);
});

onMounted(() => {
  reportHeight();
});
</script>

<template>
  <div 
    ref="cardRef"
    class="log-card"
    :class="[completionClass, { expanded }]"
  >
    <!-- ====== 卡片头部（摘要） ====== -->
    <div class="log-card-header" @click="$emit('toggle')">
      <div class="header-left">
        <span class="log-date">
          <span class="date-text">{{ formattedDate }}</span>
          <span class="date-weekday">{{ formattedWeekday }}</span>
        </span>
      </div>
      
      <div class="log-completion" :class="completionClass">
        <div class="completion-bar">
          <div class="completion-fill" :style="{ width: completionRate + '%' }"></div>
        </div>
        <span class="completion-text">{{ log.tasks_done }}/{{ log.tasks_total }}</span>
      </div>
      
      <span class="expand-icon" :class="{ expanded }">▼</span>
    </div>
    
    <!-- ====== 卡片摘要体（展开时隐藏） ====== -->
    <div class="log-card-body" :class="{ collapsed: expanded }" @click="$emit('toggle')" style="cursor: pointer;">
      <div class="log-card-body-inner">
        <p class="log-content">{{ summary }}</p>
        <div class="log-tags">
          <span 
            class="log-tag completion" 
            :class="completionClass"
          >
            {{ completionRate }}% 完成
          </span>
          <span class="log-tag mood" v-if="moodLabel">
            {{ moodLabel }}
          </span>
          <span class="log-tag" :class="completionClass === 'high' ? 'low-risk' : completionClass === 'medium' ? 'med-risk' : 'high-risk'">
            {{ completionClass === 'high' ? '低风险' : completionClass === 'medium' ? '中等' : '高风险' }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- ====== 详细区域 ====== -->
    <div class="log-details-wrapper" :class="{ expanded }">
      <div class="log-details">
        <div class="log-details-inner">
          <!-- 任务完成情况 -->
          <div class="detail-section" v-if="tasks && tasks.length > 0">
            <div class="item-header">
              <span class="item-title">完成情况</span>
              <span class="detail-count">{{ log.tasks_done }}/{{ log.tasks_total }}</span>
            </div>
            <div class="task-list">
              <div 
                v-for="task in tasks" 
                :key="task.id"
                class="task-item"
                :class="{ done: task.status === 'done' }"
              >
                <span class="task-dot" :class="task.status === 'done' ? 'dot-done' : 'dot-pending'"></span>
                <span class="task-title">{{ task.title }}</span>
              </div>
            </div>
          </div>
          
          <!-- 日志内容 -->
          <div class="detail-section" v-if="log.content">
            <div class="item-header">
              <span class="item-title">日志</span>
            </div>
            <p class="item-content">{{ log.content }}</p>
          </div>
          
          <!-- 行为标签 -->
          <div class="detail-section">
            <div class="item-header">
              <span class="item-title">分析</span>
            </div>
            <div class="detail-tags">
              <span class="log-tag" :class="completionClass === 'high' ? 'low-risk' : completionClass === 'medium' ? 'med-risk' : 'high-risk'">
                {{ completionClass === 'high' ? '低风险' : completionClass === 'medium' ? '中风险' : '高风险' }}
              </span>
              <span class="log-tag mood" v-if="moodLabel">
                {{ moodLabel }}
              </span>
              <span class="log-tag info" v-if="log.work_hours">
                {{ log.work_hours }}h
              </span>
              <span class="log-tag info" v-if="log.efficiency_periods?.length">
                高效 {{ log.efficiency_periods.join('、') }}
              </span>
            </div>
          </div>
          
          <!-- 当日亮点 -->
          <div class="detail-section highlight" v-if="log.highlight">
            <div class="item-header">
              <span class="item-title">亮点</span>
            </div>
            <p class="item-content highlight-text">{{ log.highlight }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 卡片基础 ========== */
.log-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
  animation: fadeInUp 0.3s ease-out;
  animation-fill-mode: both;
  transition: all var(--dur-fast) var(--ease-standard);
}

.log-card:hover {
  border-color: var(--border-main);
  box-shadow: var(--shadow-sm);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== 卡片头部 ========== */
.log-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  cursor: pointer;
}

.header-left {
  display: flex;
  align-items: center;
}

.log-date {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.date-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.date-weekday {
  font-size: 12px;
  color: var(--text-muted);
}

/* ========== 完成度 ========== */
.log-completion {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.completion-bar {
  width: 60px;
  height: 4px;
  background: var(--border-main);
  border-radius: 2px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: var(--ai-main);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.log-completion.high .completion-fill { background: var(--success); }
.log-completion.medium .completion-fill { background: var(--warning); }
.log-completion.low .completion-fill { background: var(--error); }

.completion-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.expand-icon {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform var(--dur-fast) var(--ease-standard);
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* ========== 卡片摘要体（展开时收起） ========== */
.log-card-body {
  display: grid;
  grid-template-rows: 1fr;
  overflow: hidden;
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.25s ease;
  opacity: 1;
}

.log-card-body.collapsed {
  grid-template-rows: 0fr;
  opacity: 0;
}

.log-card-body-inner {
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0 var(--space-3) var(--space-3);
}

.log-content {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.log-tags {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.log-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.log-tag.completion.high {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
}

.log-tag.completion.medium {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.log-tag.completion.low {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.log-tag.mood {
  background: rgba(99, 102, 241, 0.1);
  color: var(--ai-main);
}

.log-tag.low-risk {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
}

.log-tag.med-risk {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.log-tag.high-risk {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.log-tag.info {
  background: rgba(107, 114, 128, 0.1);
  color: var(--text-secondary);
}

/* ========== 详细区域 ========== */
.log-details-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.log-details-wrapper.expanded {
  grid-template-rows: 1fr;
}

.log-details {
  overflow: hidden;
  min-height: 0;
}

.log-details-inner {
  padding: 0 var(--space-3) var(--space-3);
  border-top: 1px solid var(--border-subtle);
  margin-top: var(--space-2);
  padding-top: var(--space-3);
}

/* ========== 详情部分 ========== */
.detail-section {
  margin-bottom: var(--space-3);
}

.detail-section:last-child {
  margin-bottom: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.item-icon {
  font-size: 14px;
}

.item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.detail-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  margin-left: auto;
  padding: 1px 6px;
  background: var(--bg-elevated);
  border-radius: 6px;
}

.item-content {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ========== 任务列表 ========== */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px 8px;
  background: var(--bg-main);
  border-radius: 4px;
  font-size: 13px;
}

.task-item.done {
  color: var(--text-muted);
}

.task-item.done .task-title {
  text-decoration: line-through;
}

.task-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.task-dot.dot-done {
  background: var(--success);
}
.task-dot.dot-pending {
  background: var(--text-muted);
}

.task-title {
  color: var(--text-secondary);
}

.task-item.done .task-title {
  color: var(--text-muted);
}

/* ========== 详情标签 ========== */
.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

/* ========== 亮点 ========== */
.highlight-text {
  background: var(--bg-main);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--ai-main);
}

/* ========== 响应式 ========== */
@media (max-width: 480px) {
  .log-card-header {
    padding: var(--space-2) var(--space-3);
  }
  
  .log-card-body-inner {
    padding: 0 var(--space-2) var(--space-2);
  }
  
  .log-details-inner {
    padding: 0 var(--space-2) var(--space-2);
    padding-top: var(--space-2);
  }
  
  .completion-bar {
    width: 40px;
  }
}
</style>
