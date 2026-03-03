<template>
  <div class="timeline-container card">
    <div class="header">
      <h2>今日日程</h2>
      <span class="date-label">{{ formatDateLabel(todayStr) }}</span>
    </div>

    <div class="timeline-wrapper">
      <!-- 时间轴左侧刻度 -->
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

      <!-- 事件区域 -->
      <div class="events-area">
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
          v-for="event in sortedEvents" 
          :key="event.id"
          class="event-block"
          :class="[event.type, { completed: event.completed }]"
          :style="getEventStyle(event)"
          @click="handleEventClick(event)"
        >
          <div class="event-icon">{{ getEventIcon(event) }}</div>
          <div class="event-content">
            <span class="event-title">{{ event.title }}</span>
            <span class="event-time">{{ formatEventTime(event) }}</span>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="sortedEvents.length === 0" class="empty-state">
          <span class="empty-icon">📅</span>
          <span class="empty-text">今天暂无日程安排</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useTaskStore } from "@/store/tasks";
import { useScheduleStore } from "@/store/schedules";
import { useRouter } from "vue-router";

interface TimelineEvent {
  id: string | number;
  title: string;
  type: 'task' | 'schedule' | 'focus' | 'meal' | 'break';
  startHour: number;
  endHour: number;
  completed: boolean;
  originalData: any;
}

const props = defineProps<{ planId?: number }>();

const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();
const router = useRouter();

const todayStr = new Date().toISOString().slice(0, 10);
const hours = Array.from({ length: 19 }, (_, i) => i + 5); // 5:00 - 23:00

// 当前时间相关
const currentMinute = ref(new Date().getHours() * 60 + new Date().getMinutes());
let timeUpdateInterval: number | null = null;

// 时间轴配置
const START_HOUR = 5;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;

// 合并任务和日程为时间轴事件
const sortedEvents = computed<TimelineEvent[]>(() => {
  const events: TimelineEvent[] = [];

  // 处理日程
  scheduleStore.schedules
    .filter(s => s.date === todayStr)
    .forEach(s => {
      const startHour = parseTimeToHour(s.start_time);
      const endHour = parseTimeToHour(s.end_time);
      
      events.push({
        id: 's-' + s.id,
        title: s.title,
        type: getScheduleType(s.title),
        startHour: Math.max(START_HOUR, startHour),
        endHour: Math.min(END_HOUR, endHour),
        completed: s.completed || false,
        originalData: s
      });
    });

  // 处理任务
  const todayTasks = taskStore.tasks.filter(
    t => t.task_date === todayStr && (!props.planId || t.plan_id === props.planId)
  );
  
  todayTasks.forEach(t => {
    const startHour = parseTimeToHour(t.start_time);
    const endHour = parseTimeToHour(t.end_time);
    
    if (startHour > 0 || endHour > 0) {
      events.push({
        id: 't-' + t.id,
        title: t.title,
        type: getTaskType(t),
        startHour: Math.max(START_HOUR, startHour),
        endHour: Math.min(END_HOUR, Math.max(startHour + 1, endHour)),
        completed: t.status === 'done',
        originalData: t
      });
    }
  });

  // 按开始时间排序
  return events.sort((a, b) => a.startHour - b.startHour);
});

// 当前时间指示器位置
const currentTimePosition = computed(() => {
  const currentHour = currentMinute.value / 60;
  return ((currentHour - START_HOUR) / TOTAL_HOURS) * 100;
});

// 辅助函数
function parseTimeToHour(timeStr?: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m || 0) / 60;
}

function getScheduleType(title: string): TimelineEvent['type'] {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('lunch') || lowerTitle.includes('午餐') || lowerTitle.includes('饭')) {
    return 'meal';
  }
  if (lowerTitle.includes('break') || lowerTitle.includes('休息')) {
    return 'break';
  }
  return 'schedule';
}

function getTaskType(task: any): TimelineEvent['type'] {
  const title = (task.title || '').toLowerCase();
  if (title.includes('focus') || title.includes('专注')) {
    return 'focus';
  }
  return 'task';
}

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

function getEventStyle(event: TimelineEvent): Record<string, string> {
  const top = ((event.startHour - START_HOUR) / TOTAL_HOURS) * 100;
  const height = ((event.endHour - event.startHour) / TOTAL_HOURS) * 100;
  
  return {
    top: `${top}%`,
    height: `${Math.max(height, 4)}%` // 最小高度
  };
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function formatEventTime(event: TimelineEvent): string {
  const startH = Math.floor(event.startHour);
  const endH = Math.floor(event.endHour);
  return `${startH} - ${endH}`;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

function isCurrentHour(hour: number): boolean {
  const currentHour = Math.floor(currentMinute.value / 60);
  return hour === currentHour;
}

function handleEventClick(event: TimelineEvent) {
  if (event.id.toString().startsWith('t-')) {
    const taskId = event.originalData.id;
    router.push(`/task/${taskId}`);
  }
}

// 更新当前时间
function updateCurrentTime() {
  const now = new Date();
  currentMinute.value = now.getHours() * 60 + now.getMinutes();
}

onMounted(async () => {
  await taskStore.loadTasks(props.planId);
  await scheduleStore.load(todayStr);
  
  // 每分钟更新当前时间
  timeUpdateInterval = window.setInterval(updateCurrentTime, 60000);
});

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }
});
</script>

<style scoped>
.timeline-container {
  padding: var(--space-4);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.date-label {
  font-size: 13px;
  color: var(--text-muted);
}

.timeline-wrapper {
  display: flex;
  position: relative;
  min-height: 400px;
}

/* 时间轴刻度 */
.time-axis {
  width: 48px;
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
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  width: 40px;
  text-align: right;
  padding-right: var(--space-2);
}

.hour-line {
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
}

.hour-mark.current-hour .hour-label {
  color: var(--ai-main);
  font-weight: 600;
}

.hour-mark.current-hour .hour-line {
  background: var(--ai-main);
}

/* 事件区域 */
.events-area {
  flex: 1;
  position: relative;
  margin-left: var(--space-2);
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  min-height: 400px;
}

/* 当前时间指示器 */
.current-time-indicator {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  z-index: 10;
  transform: translateY(-50%);
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--error);
  box-shadow: 0 0 4px var(--error);
}

.indicator-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, var(--error), transparent);
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
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
  min-height: 32px;
  overflow: hidden;
}

.event-block:hover {
  transform: translateX(2px);
  box-shadow: var(--shadow-sm);
}

/* 事件类型颜色 */
.event-block.task {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%);
  border-left: 3px solid var(--color-brand-500);
}

.event-block.schedule {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%);
  border-left: 3px solid #A855F7;
}

.event-block.focus {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%);
  border-left: 3px solid #EF4444;
}

.event-block.meal {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%);
  border-left: 3px solid #F59E0B;
}

.event-block.break {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.08) 100%);
  border-left: 3px solid #22C55E;
}

.event-block.completed {
  opacity: 0.6;
}

.event-block.completed .event-title {
  text-decoration: line-through;
}

.event-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.event-block.completed .event-icon {
  color: var(--success);
}

.event-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.event-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-time {
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
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
}

.empty-icon {
  font-size: 32px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: var(--text-muted);
}

/* 响应式 */
@media (max-width: 768px) {
  .timeline-wrapper {
    min-height: 350px;
  }
  
  .events-area {
    min-height: 350px;
  }
  
  .time-axis {
    width: 40px;
  }
  
  .hour-label {
    font-size: 10px;
    width: 32px;
  }
  
  .event-block {
    padding: var(--space-1) var(--space-2);
    min-height: 28px;
  }
  
  .event-title {
    font-size: 12px;
  }
  
  .event-time {
    font-size: 10px;
  }
}
</style>