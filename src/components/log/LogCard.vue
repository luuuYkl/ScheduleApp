<!-- src/components/log/LogCard.vue -->
<!-- 日志卡片组件 -->

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { LogEntry } from '@/services/generate-log';
import { formatDateDisplay, formatWeekdayDisplay } from '@/utils/log-grouping';

interface Props {
  log: LogEntry;
  expanded: boolean;
  efficiencyRating: 1 | 2 | 3 | 4;
  summary: string;
  tasks?: any[]; // 任务列表
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

const riskLevel = computed(() => {
  if (completionRate.value >= 75) return 'low-risk';
  if (completionRate.value >= 50) return 'medium-risk';
  return 'high-risk';
});

const riskLabel = computed(() => {
  if (completionRate.value >= 75) return '低风险';
  if (completionRate.value >= 50) return '中等风险';
  return '高风险';
});

const moodEmoji = computed(() => {
  const emojis: Record<string, string> = {
    happy: '😊',
    calm: '😌',
    anxious: '😰',
    tired: '😴',
    focused: '🎯',
    stressed: '😫'
  };
  return emojis[props.log.mood || ''] || '';
});

const moodLabel = computed(() => {
  const labels: Record<string, string> = {
    happy: '开心',
    calm: '平静',
    anxious: '焦虑',
    tired: '疲劳',
    focused: '专注',
    stressed: '压力'
  };
  return labels[props.log.mood || ''] || '';
});

// 格式化日期
const formattedDate = computed(() => formatDateDisplay(props.log.date));
const formattedWeekday = computed(() => formatWeekdayDisplay(props.log.date));

// 报告高度变化
function reportHeight() {
  if (cardRef.value) {
    const height = cardRef.value.offsetHeight;
    emit('height-change', { type: 'log', id: props.log.id, height });
  }
}

// 监听展开状态变化
watch(() => props.expanded, (newVal) => {
  // 等待过渡动画完成后报告高度
  setTimeout(() => {
    reportHeight();
  }, 350); // grid动画时间300ms + 缓冲50ms
});

// 初始高度报告
onMounted(() => {
  reportHeight();
});
</script>

<template>
  <!-- ========== 整体容器：日志卡片 ========== -->
  <div 
    ref="cardRef"
    class="log-card"
    :class="{ expanded }"
  >
    <!-- ========== 摘要区域：折叠状态可见 ========== -->
    <div class="log-summary" @click="$emit('toggle')">
      <!-- 左侧信息区：日期和完成进度 -->
      <div class="summary-left">
        <!-- 日期信息 -->
        <div class="log-date-info">
          <span class="date-text">{{ formattedDate }}</span> <!-- 日期：3月23日 -->
          <span class="date-weekday">{{ formattedWeekday }}</span> <!-- 星期：周日 -->
        </div>
        <!-- 任务完成进度条 -->
        <div class="log-completion" :class="completionClass">
          <div class="completion-bar"> <!-- 进度条背景 -->
            <!-- 进度条填充（动态宽度） -->
            <div 
              class="completion-fill"
              :style="{ width: `${completionRate}%` }"
            ></div>
          </div>
          <span class="completion-text"> <!-- 完成数量：5/8 -->
            {{ log.tasks_done }}/{{ log.tasks_total }}
          </span>
        </div>
      </div>
      
      <!-- 右侧信息区：效率评分和摘要 -->
      <div class="summary-right">
        <!-- 效率评分：⚡星星 -->
        <div class="efficiency-rating">
          <span v-for="i in 4" :key="i" class="star">
            {{ i <= efficiencyRating ? '⚡' : '⚪' }}
          </span>
        </div>
        <!-- 日志摘要文本 -->
        <div class="log-summary-text">{{ summary }}</div>
      </div>
      
      <!-- 展开/收起指示器：▼箭头 -->
      <span class="expand-indicator" :class="{ rotated: expanded }">▼</span>
    </div>
    
    <!-- ========== 详细区域：展开后可见 ========== -->
    <div class="log-details-wrapper" :class="{ expanded }">
      <div class="log-details">
        <div class="log-details-inner">
          <!-- 任务列表部分 -->
          <div class="detail-section" v-if="tasks && tasks.length > 0">
            <h4 class="detail-title">📋 完成情况</h4>
            <div class="task-list">
              <div 
                v-for="task in tasks" 
                :key="task.id"
                class="task-item"
                :class="{ done: task.status === 'done' }"
              >
                <span class="task-icon"> <!-- 任务状态图标 -->
                  {{ task.status === 'done' ? '✅' : '❌' }}
                </span>
                <span class="task-title">{{ task.title }}</span> <!-- 任务标题 -->
              </div>
            </div>
          </div>
          
          <!-- 日志内容部分 -->
          <div class="detail-section" v-if="log.content">
            <h4 class="detail-title">📝 日志内容</h4>
            <p class="detail-content">{{ log.content }}</p>
          </div>
          
          <!-- AI分析部分 -->
          <div class="detail-section">
            <h4 class="detail-title">🧠 行为分析</h4>
            <div class="analysis-grid"> <!-- 2x2网格布局 -->
              <div class="analysis-item">
                <label>拖延风险</label>
                <span :class="riskLevel">{{ riskLabel }}</span> <!-- 低/中/高风险 -->
              </div>
              <div class="analysis-item" v-if="log.mood">
                <label>情绪状态</label>
                <span>{{ moodEmoji }} {{ moodLabel }}</span> <!-- 😊 开心 -->
              </div>
              <div class="analysis-item" v-if="log.work_hours">
                <label>工作时长</label>
                <span>{{ log.work_hours }} 小时</span>
              </div>
              <div class="analysis-item" v-if="log.efficiency_periods?.length">
                <label>高效时段</label>
                <span>{{ log.efficiency_periods.join('、') }}</span>
              </div>
            </div>
          </div>
          
          <!-- 当日亮点部分 -->
          <div class="detail-section" v-if="log.highlight">
            <h4 class="detail-title">🌟 当日亮点</h4>
            <p class="detail-content highlight">{{ log.highlight }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 卡片基础样式 ========== */
/* 日志卡片整体容器：背景、边框、悬停效果 */
.log-card {
  background: var(--bg-main);
  border-bottom: 1px solid var(--border-subtle);
  transition: all 0.2s;
}

/* 最后一个卡片移除底部边框 */
.log-card:last-child {
  border-bottom: none;
}

/* 卡片悬停效果：背景变亮 */
.log-card:hover {
  background: var(--bg-card-hover);
}

/* ========== 摘要区域样式 ========== */
/* 摘要容器：flex布局、内边距、可点击区域 */
.log-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  box-sizing: border-box;
  transition: background-color 0.2s ease;
}

/* 摘要容器悬停效果 */
.log-summary:hover {
  background-color: var(--bg-card-hover);
}

/* 左右信息区的通用样式：垂直flex布局，间距6px */
.summary-left,
.summary-right {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 左侧区域：固定宽度，包含日期和进度 */
.summary-left {
  flex: 0 0 auto;
}

/* 右侧区域：弹性宽度，包含评分和摘要 */
.summary-right {
  flex: 1;
  align-items: flex-end;
  margin-right: 12px;
}

/* 日期信息布局：日期和星期并排显示 */
.log-date-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

/* 日期文本：14px，加粗，主要颜色 */
.date-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

/* 星期文本：12px，灰色 */
.date-weekday {
  font-size: 12px;
  color: var(--text-muted);
}

/* 完成进度布局：进度条+文本 */
.log-completion {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 进度条背景：灰色轨道 */
.completion-bar {
  width: 80px;
  height: 6px;
  background: var(--border-main);
  border-radius: 3px;
  overflow: hidden;
}

/* 进度条填充：动态宽度，过渡动画 */
.completion-fill {
  height: 100%;
  transition: width 0.3s;
}

/* 进度条颜色：高完成率绿色，中等黄色，低红色 */
.log-completion.high .completion-fill { background: var(--success); }
.log-completion.medium .completion-fill { background: var(--warning); }
.log-completion.low .completion-fill { background: var(--error); }

/* 完成率文本：12px，加粗，如"5/8" */
.completion-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* 效率评分样式：星星排列 */
.efficiency-rating {
  display: flex;
  gap: 2px;
  font-size: 12px;
  margin-bottom: 4px;
}

/* 单个星星样式 */
.star {
  color: var(--text-muted);
}

/* 摘要文本：单行显示，超出省略 */
.log-summary-text {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 展开/收起箭头指示器 */
.expand-indicator {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform 0.3s;
}

/* 箭头旋转180度（展开状态） */
.expand-indicator.rotated {
  transform: rotate(180deg);
}

/* ========== 详细区域样式 ========== */
/* 详细区域容器：使用grid动画实现自适应高度 */
.log-details-wrapper {
  display: grid;
  grid-template-rows: 0fr; /* 默认折叠：0fr */
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* 展开状态：grid-template-rows: 1fr */
.log-details-wrapper.expanded {
  grid-template-rows: 1fr;
}

/* 详细内容包装器：处理overflow */
.log-details {
  overflow: hidden;
  min-height: 0;
}

/* 详细内容内层：内边距 */
.log-details-inner {
  padding: 0 16px 16px;
}

/* ========== 详细内容通用样式 ========== */
/* 每个详细部分：底部间距 */
.detail-section {
  margin-bottom: 16px;
}

/* 最后一个部分移除底部间距 */
.detail-section:last-child {
  margin-bottom: 0;
}

/* 部分标题：如"📋 完成情况" */
.detail-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

/* 内容文本：13px，行高1.6 */
.detail-content {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
}

/* 亮点文本：AI主题色，加粗 */
.detail-content.highlight {
  color: var(--ai-main);
  font-weight: 500;
}

/* ========== 任务列表样式 ========== */
/* 任务列表容器：垂直排列，间距8px */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 单个任务卡片：灰色背景，圆角 */
.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bg-elevated);
  border-radius: 4px;
}

/* 已完成任务：绿色背景 */
.task-item.done {
  background: rgba(16, 185, 129, 0.1);
}

/* 任务图标：✅/❌ */
.task-icon {
  font-size: 14px;
  flex-shrink: 0;
}

/* 任务标题 */
.task-title {
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 已完成任务标题：删除线 */
.task-item.done .task-title {
  color: var(--text-muted);
  text-decoration: line-through;
}

/* ========== 分析网格样式 ========== */
/* 2x2网格布局 */
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* 单个分析卡片：标签+值 */
.analysis-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--bg-elevated);
  border-radius: 4px;
}

/* 分析项标签：小标签，灰色 */
.analysis-item label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

/* 分析项值：13px */
.analysis-item span {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 风险等级颜色：低风险绿色，中等黄色，高风险红色 */
.low-risk { color: var(--success); }
.medium-risk { color: var(--warning); }
.high-risk { color: var(--error); }
</style>
