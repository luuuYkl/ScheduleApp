<!--
  ═══════════════════════════════════════════════════════════════
  专注时间轴组件 (FocusTimeline.vue)
  ═══════════════════════════════════════════════════════════════
  
  【组件定位】
  专注模式页面的时间轴组件，展示今日任务的时间分布。
  
  【核心功能】
  1. 显示今日时间轴（0:00 - 24:00）
  2. 当前时间指示器
  3. 自动滚动到当前时间位置
  4. 当前时间段任务高亮，其他任务降低透明度
  
  【Props】
  - events: 今日事件列表
  - currentTimePosition: 当前时间位置（百分比）
  - autoScrollToCurrent: 是否自动滚动到当前时间
  
  【设计原则】
  - 极简设计，只保留时间刻度和事件块
  - 当前任务高亮，其他任务降低透明度
  - 自动定位到当前时间
-->
<template>
  <div class="focus-timeline" ref="timelineRef">
    <!-- 时间轴容器 -->
    <div class="timeline-container">
      <!-- 左侧：时间刻度 -->
      <div class="time-axis">
        <div 
          v-for="hour in hours" 
          :key="hour" 
          class="hour-mark"
          :class="{ 'current-hour': isCurrentHour(hour) }"
          :style="{ top: ((hour - START_HOUR) / TOTAL_HOURS * 100) + '%' }"
        >
          <span class="hour-label">{{ formatHour(hour) }}</span>
          <div class="hour-line"></div>
        </div>
      </div>

      <!-- 右侧：事件区域 -->
      <div class="events-area" ref="eventsAreaRef">
        <!-- 当前时间指示器 -->
        <div 
          class="current-time-indicator" 
          :style="{ top: currentTimePosition + '%' }"
        >
          <div class="indicator-dot"></div>
          <div class="indicator-line"></div>
        </div>

        <!-- 事件块 -->
        <div 
          v-for="event in events" 
          :key="event.id"
          class="event-block"
          :class="[event.type, { 
            completed: event.completed,
            'is-current': isCurrentEvent(event),
            'not-current': !isCurrentEvent(event)
          }]"
          :style="getEventStyle(event)"
        >
          <div class="event-icon">{{ getEventIcon(event) }}</div>
          <div class="event-title">{{ event.title }}</div>
        </div>

        <!-- 空状态 -->
        <div v-if="events.length === 0" class="empty-state">
          <span class="empty-icon">📅</span>
          <span class="empty-text">今日暂无安排</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

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
  events: TimelineEvent[];
  currentTimePosition: number;
  autoScrollToCurrent?: boolean;
}>();

// 时间轴配置
const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const hours = Array.from({ length: 25 }, (_, i) => i);

// 引用
const timelineRef = ref<HTMLElement | null>(null);
const eventsAreaRef = ref<HTMLElement | null>(null);

// 判断是否为当前小时
function isCurrentHour(hour: number): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  return hour === currentHour;
}

// 判断是否为当前事件
function isCurrentEvent(event: TimelineEvent): boolean {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  return currentHour >= event.startHour && currentHour < event.endHour;
}

// 格式化时间
function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

// 获取事件图标
function getEventIcon(event: TimelineEvent): string {
  if (event.completed) return '✓';
  
  switch (event.type) {
    case 'focus': return '🎯';
    case 'meal': return '🍽️';
    case 'break': return '☕';
    case 'schedule': return '📌';
    case 'task': 
    default: return '📋';
  }
}

// 获取事件样式
function getEventStyle(event: TimelineEvent): Record<string, string> {
  const top = ((event.startHour - START_HOUR) / TOTAL_HOURS) * 100;
  const height = ((event.endHour - event.startHour) / TOTAL_HOURS) * 100;
  
  return {
    top: `${top}%`,
    height: `${Math.max(height, 3)}%` // 最小高度
  };
}

// 自动滚动到当前时间
function scrollToCurrentTime() {
  if (!props.autoScrollToCurrent || !eventsAreaRef.value) return;
  
  // 延迟执行，确保DOM已渲染
  setTimeout(() => {
    if (!eventsAreaRef.value) return;
    
    const containerHeight = eventsAreaRef.value.clientHeight;
    const scrollPosition = (props.currentTimePosition / 100) * containerHeight - (containerHeight / 2);
    
    eventsAreaRef.value.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });
  }, 300);
}

// 监听事件变化，自动滚动
watch(() => props.events, () => {
  scrollToCurrentTime();
}, { immediate: true });

onMounted(() => {
  scrollToCurrentTime();
});
</script>

<style scoped>
.focus-timeline {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.timeline-container {
  flex: 1;
  display: flex;
  position: relative;
  min-height: 500px;
  padding: var(--space-2);
  gap: var(--space-3);
}

/* 时间刻度列 */
.time-axis {
  width: 40px;
  flex-shrink: 0;
  position: relative;
}

.hour-mark {
  position: absolute;
  width: 100%;
  display: flex;
  align-items: center;
  height: 0;
}

.hour-label {
  font-size: 10px;
  color: var(--focus-text-muted);
  font-variant-numeric: tabular-nums;
  width: 32px;
  text-align: right;
  padding-right: var(--space-2);
}

.hour-line {
  flex: 1;
  height: 1px;
  background: var(--focus-border);
}

.hour-mark.current-hour .hour-label {
  color: var(--focus-accent);
  font-weight: 600;
}

.hour-mark.current-hour .hour-line {
  background: var(--focus-accent);
  height: 1px;
}

/* 事件区域 */
.events-area {
  flex: 1;
  position: relative;
  background: var(--focus-events-bg);
  border-radius: var(--radius-sm);
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 100%;
  height: 100%;
  padding: var(--space-2);
  /* 自定义滚动条 */
  scrollbar-width: thin;
  scrollbar-color: var(--focus-scrollbar) transparent;
}

.events-area::-webkit-scrollbar {
  width: 6px;
}

.events-area::-webkit-scrollbar-track {
  background: transparent;
}

.events-area::-webkit-scrollbar-thumb {
  background: var(--focus-scrollbar);
  border-radius: var(--radius-xs);
}

.events-area::-webkit-scrollbar-thumb:hover {
  background: var(--focus-scrollbar-hover);
}

/* 当前时间指示器 */
.current-time-indicator {
  position: absolute;
  left: var(--space-2);
  right: var(--space-2);
  display: flex;
  align-items: center;
  z-index: 10;
  transform: translateY(-50%);
  pointer-events: none;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--focus-current-time);
  box-shadow: 0 0 6px var(--focus-current-time-glow);
  flex-shrink: 0;
}

.indicator-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, var(--focus-current-time), transparent);
}

/* 事件块 */
.event-block {
  position: absolute;
  left: var(--space-2);
  right: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-2xs);
  min-height: 24px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

/* 事件类型颜色 */
.event-block.task {
  background: var(--focus-event-task-bg);
  border-left: 2px solid var(--focus-event-task-border);
}

.event-block.schedule {
  background: var(--focus-event-schedule-bg);
  border-left: 2px solid var(--focus-event-schedule-border);
}

.event-block.focus {
  background: var(--focus-event-focus-bg);
  border-left: 2px solid var(--focus-event-focus-border);
}

.event-block.meal {
  background: var(--focus-event-meal-bg);
  border-left: 2px solid var(--focus-event-meal-border);
}

.event-block.break {
  background: var(--focus-event-break-bg);
  border-left: 2px solid var(--focus-event-break-border);
}

/* 当前事件高亮 */
.event-block.is-current {
  opacity: 1;
  transform: scale(1.02);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
}

/* 非当前事件降低透明度 */
.event-block.not-current {
  opacity: 0.5;
}

/* 已完成任务 */
.event-block.completed {
  opacity: 0.3;
}

.event-block.completed .event-title {
  text-decoration: line-through;
}

.event-icon {
  font-size: 12px;
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.event-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--focus-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* 空状态 */
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  opacity: 0.4;
}

.empty-icon {
  font-size: 24px;
}

.empty-text {
  font-size: 12px;
  color: var(--focus-text-muted);
}

/* 响应式 */
@media (max-width: 768px) {
  .timeline-container {
    min-height: 400px;
  }
  
  .time-axis {
    width: 32px;
  }
  
  .hour-label {
    font-size: 9px;
    width: 24px;
  }
  
  .event-block {
    padding: var(--space-1) var(--space-2);
    min-height: 20px;
  }
  
  .event-icon {
    font-size: 10px;
    width: 14px;
  }
  
  .event-title {
    font-size: 10px;
  }
}
</style>
