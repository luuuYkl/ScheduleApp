<!--
  ═══════════════════════════════════════════════════════════════
  专注模式页面 (FocusPage.vue)
  ═══════════════════════════════════════════════════════════════
  
  【页面定位】
  沉浸式专注视图，用于最小干扰下专注于当前时间与当前任务。
  
  【核心功能】
  1. 专注信息区域 - 显示当前任务或无任务状态
  2. 专注计时器 - 显示已专注时长
  3. 时间轴区域 - 今日时间轴，自动定位到当前时间
  4. 退出按钮 - 返回常规视图
  
  【设计原则】
  - 完全脱离常规应用结构，无侧边导航、顶栏等
  - 只显示当前时间、当前任务、专注时长三个核心信息
  - 极简视觉设计，减少信息干扰
  
  【布局结构】
  ┌─────────────────────────────────────────────────────────┐
  │                                      [退出按钮]           │
  ├─────────────────────────────────────────────────────────┤
  │  上半部分（60%）：专注信息区域                           │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │              已专注：01:23:45                      │  │
  │  │                                                   │  │
  │  │  ┌───────────────────────────────────────────┐   │  │
  │  │  │  📋 深度工作                               │   │  │
  │  │  │  09:00 - 11:00                            │   │  │
  │  │  │  剩余：01:15:23                            │   │  │
  │  │  └───────────────────────────────────────────┘   │  │
  │  └───────────────────────────────────────────────────┘  │
  ├─────────────────────────────────────────────────────────┤
  │  下半部分（40%）：时间轴区域                            │
  │  08:00 ─────────────────────────────────               │
  │  09:00 ───┬────────────────────►                      │
  │          │  📋 深度工作                               │
  │  10:00 ───┴────────────────────►                      │
  │         ●━━━━━━━━━━━━━━━━ (当前)                       │
  │  11:00 ─────────────────────────────────               │
  └─────────────────────────────────────────────────────────┘
-->
<template>
  <div class="focus-page">
    <!-- 退出按钮 -->
    <FocusExitButton @exit="handleExit" />

    <!-- 主内容区 -->
    <div class="focus-content">
      <!-- 专注信息区域（上半部分） -->
      <div class="focus-info-section">
        <!-- 专注计时器 -->
        <FocusTimer :duration="focusDuration" />
        
        <!-- 专注任务卡片 -->
        <FocusTaskCard 
          :task="currentTask" 
          :tasks="currentTasks"
          @create-task="handleCreateTask"
          @select-task="handleSelectTask"
          @jump-to-detail="handleJumpToTaskDetail"
        />
      </div>

      <!-- 时间轴区域（下半部分） -->
      <div class="focus-timeline-section">
        <FocusTimeline 
          :events="todayEvents"
          :current-time-position="currentTimePosition"
          :auto-scroll-to-current="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { useScheduleStore } from "@/store/schedules";
import { useFocusStore } from "@/store/focus";

// 组件导入
import FocusTimer from "@/components/focus/FocusTimer.vue";
import FocusTaskCard from "@/components/focus/FocusTaskCard.vue";
import FocusTimeline from "@/components/focus/FocusTimeline.vue";
import FocusExitButton from "@/components/focus/FocusExitButton.vue";

// 类型定义
interface TimelineEvent {
  id: string;
  title: string;
  type: 'task' | 'schedule' | 'focus' | 'meal' | 'break';
  startHour: number;
  endHour: number;
  completed: boolean;
  originalData: any;
}

// ========== 初始化 ==========
const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();
const focusStore = useFocusStore();

// 今日日期字符串
const todayStr = new Date().toISOString().slice(0, 10);

// ========== 专注状态 ==========
const focusStartTime = ref<Date | null>(null);
let timerInterval: number | null = null;

// ========== 时间相关 ==========
const currentMinute = ref(new Date().getHours() * 60 + new Date().getMinutes());
const currentTime = ref(Date.now());  // 当前时间戳（毫秒），用于计算专注时长

// ========== 专注时长计算 ==========
const focusDuration = computed(() => {
  if (!focusStartTime.value) return 0;
  return Math.floor((currentTime.value - focusStartTime.value.getTime()) / 1000);
});

// ========== 今日任务列表 ==========
const todayTasks = computed(() => {
  return taskStore.tasks.filter(
    t => t.start_date <= todayStr && t.end_date >= todayStr
  );
});

// ========== 当前任务计算 ==========
const currentTasks = computed<TimelineEvent[]>(() => {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // 获取今日事件
  const allEvents = getTodayEvents();
  
  // 过滤出当前时间段的任务
  return allEvents.filter(event => 
    currentHour >= event.startHour && currentHour < event.endHour
  );
});

const currentTask = computed<TimelineEvent | null>(() => {
  // 如果有手动选择的任务，优先使用
  if (focusStore.selectedTaskId) {
    const allEvents = getTodayEvents();
    const selectedEvent = allEvents.find(e => {
      const taskId = e.id.replace('t-', '');
      return parseInt(taskId) === focusStore.selectedTaskId;
    });
    if (selectedEvent) return selectedEvent;
  }

  // 否则使用当前时间的任务
  const tasks = currentTasks.value;
  if (tasks.length === 0) return null;
  return tasks[0]; // 返回第一个任务
});

// ========== 今日事件 ==========
const todayEvents = computed<TimelineEvent[]>(() => {
  return getTodayEvents();
});

function getTodayEvents(): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const START_HOUR = 0;
  const END_HOUR = 24;

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
    t => t.start_date <= todayStr && t.end_date >= todayStr
  );
  
  todayTasks.forEach((t) => {
    let startHour = parseTimeToHour(t.start_time);
    let endHour = parseTimeToHour(t.end_time);
    
    if (startHour === 0 && endHour === 0) {
      startHour = 9;
      endHour = 10;
    } else {
      startHour = Math.max(START_HOUR, startHour);
      endHour = Math.min(END_HOUR, Math.max(startHour + 1, endHour));
    }
    
    events.push({
      id: 't-' + t.id,
      title: t.title,
      type: getTaskType(t),
      startHour,
      endHour,
      completed: t.status === 'done',
      originalData: t
    });
  });

  return events;
}

// ========== 当前时间指示器位置 ==========
const currentTimePosition = computed(() => {
  const START_HOUR = 0;
  const END_HOUR = 24;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const currentHour = currentMinute.value / 60;
  return ((currentHour - START_HOUR) / TOTAL_HOURS) * 100;
});

// ========== 辅助函数 ==========
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

// ========== 事件处理 ==========
function handleExit() {
  // 停止计时器
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // 清除选中的任务
  focusStore.clearSelectedTask();
  
  // 返回首页
  router.push('/home');
}

function handleCreateTask() {
  // 跳转到任务创建页
  router.push('/task/create');
}

function handleSelectTask(taskId?: string) {
  // 打开任务选择弹窗
  focusStore.openTaskSelector();
  
  // 设置今日任务列表到 store
  focusStore.setTodayTasks(todayTasks.value);
}

function handleSelectTaskFromSelector(taskId: number) {
  // 设置选中的任务
  focusStore.selectTask(taskId);
}

function handleJumpToTaskDetail(taskId: string) {
  // 跳转到任务详情页
  const numericId = parseInt(taskId.replace('t-', ''));
  router.push(`/task/${numericId}`);
}

// ========== 更新当前时间 ==========
function updateCurrentTime() {
  const now = new Date();
  currentMinute.value = now.getHours() * 60 + now.getMinutes();
}

// ========== 生命周期 ==========
onMounted(async () => {
  // 开始专注计时
  focusStartTime.value = new Date();
  currentTime.value = Date.now();
  
  // 加载数据
  await taskStore.loadTasks();
  await scheduleStore.load(todayStr);
  
  // 如果从任务详情页跳转过来，自动选中对应任务
  const taskId = route.query.taskId;
  if (taskId) {
    focusStore.selectTask(Number(taskId));
  }
  
  // 每秒更新当前时间
  timerInterval = window.setInterval(() => {
    updateCurrentTime();
    currentTime.value = Date.now();  // 每秒更新，触发 focusDuration 重新计算
  }, 1000);
});

onUnmounted(() => {
  // 清理定时器
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>

<style scoped>
.focus-page {
  width: 100vw;
  height: 100vh;
  background: var(--focus-bg, #1a1a1a);
  color: var(--focus-text, #e5e7eb);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.focus-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px;
  gap: 32px;
}

/* 专注信息区域 */
.focus-info-section {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  gap: 24px;
}

/* 时间轴区域 */
.focus-timeline-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 响应式 */
@media (max-width: 768px) {
  .focus-content {
    padding: 24px 16px;
    gap: 24px;
  }
  
  .focus-info-section {
    min-height: 35vh;
    gap: 16px;
  }
}
</style>