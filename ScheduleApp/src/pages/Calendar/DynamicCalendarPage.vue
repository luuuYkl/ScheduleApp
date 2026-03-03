<template>
  <PageScaffold
    title="日历"
    :subtitle="selectedPlanTitle || '选择计划查看日历'"
    show-back-button
    @back="goBack"
    class="layer-context"
  >
    <template #actions>
      <div class="desktop-plan-selector priority-medium">
        <Button variant="outline" size="sm" @click="showPlanSelector = true">
          {{ selectedPlanTitle || "选择计划" }}
        </Button>
      </div>
      <div class="mobile-calendar-actions priority-essential">
        <Button 
          variant="outline" 
          size="sm" 
          @click="showPlanSelector = true"
          class="plan-select-btn"
        >
          {{ selectedPlanTitleShort || "计划" }}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          @click="goToToday"
          class="today-btn"
        >
          今天
        </Button>
      </div>
    </template>
  </PageScaffold>
  
  <div class="calendar-container">
    <!-- Context Layer: 顶部吸附工具栏 - 移动端分行显示 -->
    <div 
      class="sticky-toolbar layer-context priority-high"
      :class="{ 'mobile-split': isMobile }"
    >
      <!-- 时间导航 -->
      <div class="toolbar-section nav-controls priority-essential">
        <Button
          variant="outline"
          size="sm"
          @click="prevPeriod"
          :disabled="!canNavigatePrev"
        >
          ←
        </Button>

        <div class="period-display">
          <h3>{{ periodDisplay }}</h3>
        </div>

        <Button
          variant="outline"
          size="sm"
          @click="nextPeriod"
          :disabled="!canNavigateNext"
        >
          →
        </Button>
      </div>
      
      <!-- 今天按钮 - 移动端独立一行 -->
      <div v-if="isMobile" class="toolbar-section today-controls priority-medium">
        <Button 
          variant="outline" 
          size="sm" 
          @click="goToToday"
          class="today-btn-mobile"
        >
          今天
        </Button>
      </div>
      
      <!-- 视图切换 -->
      <div class="toolbar-section view-controls priority-medium">
        <div class="view-toggle">
          <button
            v-for="view in calendarViews"
            :key="view.key"
            :class="['view-btn', { active: currentView === view.key }]"
            @click="currentView = view.key"
          >
            {{ view.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Primary Layer: 主要内容区域 -->
    <div class="main-content layer-primary priority-high">
      <!-- 日历视图 -->
      <div class="calendar-view">
        <!-- 月视图 -->
        <div v-if="currentView === 'month'" class="month-view">
          <div class="weekdays">
            <div v-for="day in weekdays" :key="day" class="weekday-header">
              {{ day }}
            </div>
          </div>

          <div class="calendar-grid">
            <div
              v-for="date in calendarDays"
              :key="date.date"
              class="calendar-day"
              :class="{
                'is-current-month': date.isCurrentMonth,
                'is-today': date.isToday,
                'has-events': date.events.length > 0,
              }"
              @click="selectDate(date)"
            >
              <div class="day-number">{{ date.day }}</div>
              <div class="day-events">
                <div
                  v-for="event in date.events.slice(0, 2)"
                  :key="event.id"
                  class="event-indicator"
                  :style="{ backgroundColor: event.color }"
                  :title="event.title"
                ></div>
                <div v-if="date.events.length > 2" class="more-events">
                  +{{ date.events.length - 2 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 周视图 -->
        <div v-else-if="currentView === 'week'" class="week-view">
          <div class="week-header">
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="week-day-header"
              :class="{ 'is-today': day.isToday }"
            >
              <div class="day-name">{{ day.name }}</div>
              <div class="day-date">{{ day.dateObj.getDate() }}</div>
            </div>
          </div>

          <div class="week-content">
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="week-day-column"
            >
              <div
                v-for="event in day.events"
                :key="event.id"
                class="week-event"
                :style="{
                  borderColor: event.color,
                  top: `${event.top}px`,
                  height: `${event.height}px`,
                }"
              >
                <div class="event-time">{{ event.time }}</div>
                <div class="event-title">{{ event.title }}</div>
              </div>

              <div v-if="day.events.length === 0" class="no-events">无安排</div>
            </div>
          </div>
        </div>

        <!-- 日视图 -->
        <div v-else-if="currentView === 'day'" class="day-view">
          <div class="day-header">
            <h3>
              {{
                selectedDate.toLocaleDateString("zh-CN", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              }}
            </h3>
          </div>

          <div class="day-content">
            <div class="time-column">
              <div v-for="hour in 24" :key="hour" class="time-slot">
                {{ hour - 1 }}:00
              </div>
            </div>

            <div class="events-column">
              <div
                v-for="event in dayEvents"
                :key="event.id"
                class="day-event"
                :style="{
                  borderColor: event.color,
                  top: `${event.top}px`,
                  height: `${event.height}px`,
                }"
              >
                <div class="event-time">{{ event.time }}</div>
                <div class="event-title">{{ event.title }}</div>
                <div class="event-description">{{ event.description }}</div>
              </div>

              <div v-if="dayEvents.length === 0" class="no-events">
                今日无安排
              </div>
            </div>
          </div>
          
          <!-- Secondary Layer: 当日详情抽屉 (桌面端右侧/移动端底部) -->
          <div 
            v-if="showDayDrawer && selectedDateEvents.length > 0"
            class="day-drawer layer-secondary priority-medium"
            :class="{ 
              'drawer-open': isDrawerOpen,
              'desktop-drawer': !isMobile,
              'mobile-drawer': isMobile 
            }"
          >
            <div class="drawer-header">
              <h3>{{ selectedDateDisplay }}</h3>
              <Button variant="ghost" size="sm" @click="closeDayDrawer">×</Button>
            </div>
            <div class="drawer-content">
              <div 
                v-for="event in selectedDateEvents" 
                :key="event.id"
                class="event-card"
                :class="`event-${event.type}`"
              >
                <div class="event-time">{{ event.time }}</div>
                <div class="event-title">{{ event.title }}</div>
                <div class="event-description" v-if="event.description">
                  {{ event.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 计划选择器 -->
    <PlanSelector
      :visible="showPlanSelector"
      @select="handlePlanSelect"
      @close="showPlanSelector = false"
    />
    
    <!-- Utility Layer: 移动端浮动操作按钮 -->
    <div v-if="isMobile" class="mobile-fab layer-utility priority-low">
      <Button 
        variant="primary" 
        size="lg" 
        circle
        @click="toggleDayDrawer"
      >
        📅
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import PageScaffold from "@/components/common/PageScaffold.vue";
import Button from "@/components/common/Button.vue";
import PlanSelector from "@/components/common/PlanSelector.vue";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color: string;
  type: "task" | "schedule";
  top?: number;
  height?: number;
  time?: string;
}

const router = useRouter();
const planStore = usePlanStore();

// 状态管理
const currentView = ref<"month" | "week" | "day">("month");
const currentDate = ref(new Date());
const selectedDate = ref(new Date());
const selectedPlanId = ref<string | null>(null);
const showPlanSelector = ref(false);
const showDayDrawer = ref(false);
const isDrawerOpen = ref(false);
const isMobile = ref(window.innerWidth < 768);

const calendarViews = [
  { key: "month" as const, label: "月" },
  { key: "week" as const, label: "周" },
  { key: "day" as const, label: "日" },
];

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

// 计算属性
const selectedPlanTitle = computed(() => {
  if (!selectedPlanId.value) return null;
  const plan = planStore.plans.find((p: any) => p.id === selectedPlanId.value);
  return plan?.title || null;
});

const selectedPlanTitleShort = computed(() => {
  const fullTitle = selectedPlanTitle.value;
  if (!fullTitle) return null;
  return fullTitle.length > 6 ? fullTitle.substring(0, 6) + '...' : fullTitle;
});

const periodDisplay = computed(() => {
  const date = currentDate.value;
  switch (currentView.value) {
    case "month":
      return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    case "week":
      const weekStart = getWeekStart(date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
    case "day":
      return date.toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    default:
      return "";
  }
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 获取需要显示的第一天（上个月的最后一周）
  const startDay = new Date(firstDay);
  startDay.setDate(firstDay.getDate() - firstDay.getDay());

  // 获取需要显示的最后一天（下个月的第一周）
  const endDay = new Date(lastDay);
  endDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  const days = [];
  const current = new Date(startDay);

  while (current <= endDay) {
    const dateStr = current.toISOString().split("T")[0];
    const events = getEventsForDate(current);

    days.push({
      date: dateStr,
      day: current.getDate(),
      isCurrentMonth: current.getMonth() === month,
      isToday: isSameDate(current, new Date()),
      events,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
});

const weekDays = computed(() => {
  const weekStart = getWeekStart(currentDate.value);
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const events = getEventsForDate(date);

    days.push({
      date: date.toISOString().split("T")[0],
      dateObj: date,
      name: weekdays[date.getDay()],
      isToday: isSameDate(date, new Date()),
      events,
    });
  }

  return days;
});

const dayEvents = computed(() => {
  return getEventsForDate(selectedDate.value);
});

const selectedDateEvents = computed(() => {
  return getEventsForDate(selectedDate.value);
});

const selectedDateDisplay = computed(() => {
  return selectedDate.value.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
});

// 导航控制
const canNavigatePrev = computed(() => true);
const canNavigateNext = computed(() => true);

// 方法
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function isSameDate(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

function prevPeriod() {
  const date = new Date(currentDate.value);
  switch (currentView.value) {
    case "month":
      date.setMonth(date.getMonth() - 1);
      break;
    case "week":
      date.setDate(date.getDate() - 7);
      break;
    case "day":
      date.setDate(date.getDate() - 1);
      break;
  }
  currentDate.value = date;
}

function nextPeriod() {
  const date = new Date(currentDate.value);
  switch (currentView.value) {
    case "month":
      date.setMonth(date.getMonth() + 1);
      break;
    case "week":
      date.setDate(date.getDate() + 7);
      break;
    case "day":
      date.setDate(date.getDate() + 1);
      break;
  }
  currentDate.value = date;
}

function goToToday() {
  currentDate.value = new Date();
  selectedDate.value = new Date();
}

function selectDate(dateInfo: any) {
  selectedDate.value = new Date(dateInfo.date);
  if (currentView.value !== "day") {
    currentView.value = "day";
  }
  // 显示当日详情
  showDayDrawer.value = true;
  isDrawerOpen.value = true;
}

function toggleDayDrawer() {
  isDrawerOpen.value = !isDrawerOpen.value;
  showDayDrawer.value = isDrawerOpen.value;
}

function closeDayDrawer() {
  isDrawerOpen.value = false;
  setTimeout(() => {
    showDayDrawer.value = false;
  }, 300); // 等待动画完成
}

function getEventsForDate(date: Date): CalendarEvent[] {
  if (!selectedPlanId.value) return [];

  const dateStr = date.toISOString().split("T")[0];
  const events: CalendarEvent[] = [];

  // 从计划中获取任务事件
  const plan: any = planStore.plans.find(
    (p: any) => p.id === selectedPlanId.value,
  );
  if (plan?.tasks) {
    plan.tasks.forEach((task: any) => {
      if (task.dueDate === dateStr) {
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          description: task.description || "",
          date: new Date(dateStr),
          color: "#4F46E5",
          type: "task",
          time: task.startTime || "全天",
        });
      }
    });
  }

  return events;
}

function handlePlanSelect(planId: string) {
  selectedPlanId.value = planId;
}

function goBack() {
  router.back();
}

// 初始化
onMounted(() => {
  planStore.loadPlans();

  // 如果URL中有计划ID，使用它
  const planIdFromRoute = router.currentRoute.value.query.planId as string;
  if (planIdFromRoute) {
    selectedPlanId.value = planIdFromRoute;
  }
  
  // 监听窗口大小变化
  const handleResize = () => {
    isMobile.value = window.innerWidth < 768;
  };
  
  window.addEventListener('resize', handleResize);
  
  // 组件卸载时清理
  // onUnmounted(() => {
  //   window.removeEventListener('resize', handleResize);
  // });
});

// 监听计划选择变化
watch(selectedPlanId, (newPlanId) => {
  if (newPlanId) {
    // 更新URL参数
    router.replace({
      query: { ...router.currentRoute.value.query, planId: newPlanId },
    });
  }
});
</script>

<style scoped>
.calendar-container {
  width: 100%;
  max-width: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height, 64px));
  padding: 0 var(--space-5);
}

/* 顶部吸附工具栏 */
.sticky-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  margin: var(--space-4) 0;
  position: sticky;
  top: calc(var(--header-height, 64px) + var(--space-4));
  z-index: var(--z-sticky);
  box-shadow: var(--shadow-md);
  transition: all var(--dur-normal) var(--ease-standard);
  border: 1px solid var(--border-subtle);
}

/* 移动端工具栏分行显示 - 优化布局 */
.mobile-split {
  flex-direction: column;
  gap: var(--space-2);
  align-items: stretch;
}

.mobile-split .toolbar-section {
  width: 100%;
  justify-content: center;
}

/* 导航控制区：左右箭头同行 */
.mobile-split .nav-controls {
  order: -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--space-4);
}

/* 今天按钮独立一行 */
.mobile-split .today-controls {
  order: 0;
  display: flex;
  justify-content: center;
  padding: var(--space-2) 0;
}

.mobile-split .view-controls {
  order: 1;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nav-controls {
  flex: 1;
  justify-content: center;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.period-display {
  text-align: center;
}

.period-display h3 {
  margin: 0 0 var(--space-1);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.view-toggle {
  display: flex;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-1);
  margin-bottom: var(--space-4);
}

.view-btn {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
}

.view-btn:hover {
  color: var(--text-main);
  background: var(--bg-card-hover);
}

.view-btn.active {
  background: var(--ai-main);
  color: white;
}

.main-content {
  display: flex;
  flex: 1;
  gap: var(--space-4);
  overflow: hidden;
}

.calendar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.calendar-view {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  min-height: 70vh; /* 确保内容区有足够的视觉占位 */
}

/* 月视图 */
.month-view {
  padding: var(--space-5);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: var(--space-2);
}

.weekday-header {
  text-align: center;
  padding: var(--space-2);
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 14px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
}

.calendar-day {
  min-height: 140px; /* 桌面端提升一档 */
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  aspect-ratio: 1/1; /* 保持正方形单元格 */
}

.calendar-day:hover {
  background: var(--bg-card-hover);
}

.calendar-day.is-current-month {
  background: var(--bg-main);
}

.calendar-day.is-today {
  background: var(--ai-bg);
  border-color: var(--ai-main);
}

.calendar-day.has-events {
  background: var(--bg-card-hover);
}

.day-number {
  font-weight: 500;
  margin-bottom: var(--space-1);
  color: var(--text-main);
}

.day-events {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.event-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.more-events {
  font-size: 10px;
  color: var(--text-secondary);
}

/* 周视图 */
.week-view {
  padding: var(--space-4);
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-2);
}

.week-day-header {
  text-align: center;
  padding: var(--space-2);
}

.week-day-header.is-today .day-date {
  background: var(--ai-main);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.day-name {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.day-date {
  font-weight: 500;
  color: var(--text-main);
}

.week-content {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-3);
  min-height: 600px; /* 统一高度标准 */
}

.week-day-column {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  position: relative;
  background: var(--bg-main);
}

.week-event {
  position: absolute;
  left: var(--space-2);
  right: var(--space-2);
  border-left: 3px solid;
  padding: var(--space-2);
  background: var(--bg-main);
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.event-time {
  font-weight: 500;
  margin-bottom: var(--space-1);
}

.event-title {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-events {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  padding: var(--space-4) var(--space-2);
}

/* 当日详情抽屉 */
.day-drawer {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  transition: transform var(--dur-normal) var(--ease-standard);
}

/* 桌面端右侧抽屉 */
.desktop-drawer {
  width: 300px;
  position: sticky;
  top: calc(var(--header-height) + var(--space-8));
  height: fit-content;
  max-height: calc(100vh - var(--header-height) - var(--space-12));
  transform: translateX(100%);
}

.desktop-drawer.drawer-open {
  transform: translateX(0);
}

/* 移动端底部抽屉 */
.mobile-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 70vh;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  transform: translateY(100%);
}

.mobile-drawer.drawer-open {
  transform: translateY(0);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.drawer-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.drawer-content {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
}

.event-card {
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-3);
  border-left: 3px solid;
}

.event-card.event-task {
  border-left-color: var(--ai-main);
  background: var(--ai-bg);
}

.event-card.event-schedule {
  border-left-color: var(--warning);
  background: var(--warning-bg);
}

.event-time {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.event-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: var(--space-1);
}

.event-description {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* 移动端浮动操作按钮 */
.mobile-fab {
  position: absolute;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: var(--z-fixed);
}

/* 日视图 */
.day-view {
  padding: var(--space-5);
}

.day-header {
  text-align: center;
  margin-bottom: var(--space-4);
}

.day-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-main);
}

.day-content {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: var(--space-4);
}

.time-column {
  border-right: 1px solid var(--border-subtle);
}

.time-slot {
  height: 80px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: var(--space-2) var(--space-3);
  font-size: 14px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  font-weight: 500;
}

.events-column {
  position: relative;
  min-height: 1200px; /* 优化高度，避免大屏幕下内容溢出 */
  max-height: 70vh; /* 限制最大高度，确保内容在视窗内 */
  overflow-y: auto; /* 超出时可滚动 */
  background: var(--bg-main);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  padding: var(--space-2);
}

.day-event {
  position: absolute;
  left: 0;
  right: 0;
  border-left: 4px solid;
  padding: var(--space-2);
  background: var(--bg-main);
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.event-description {
  margin-top: var(--space-1);
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .calendar-container {
    padding: 0 var(--space-3);
    height: calc(100vh - var(--header-height));
    width: 100vw;
    max-width: none;
  }
  
  .calendar-day {
    min-height: 110px; /* 移动端提升到更可读区间 */
    aspect-ratio: 1/1;
  }
  
  .sticky-toolbar {
    position: sticky;
    top: var(--header-height);
    box-shadow: var(--shadow-md);
    padding: var(--space-3);
    margin: var(--space-3) 0;
  }
  
  .toolbar-section {
    width: 100%;
    justify-content: center;
    gap: var(--space-2);
  }
  
  .nav-controls {
    order: -1;
  }
  
  .view-toggle {
    width: 100%;
    padding: var(--space-2);
  }
  
  .view-btn {
    flex: 1;
    text-align: center;
    padding: var(--space-2);
    font-size: 16px;
  }

  .main-content {
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .calendar-view {
    padding: var(--space-3);
    min-height: 65vh; /* 移动端增加视口占比 */
  }
  
  .drawer-header {
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .period-display h3 {
    font-size: 18px;
  }

  .calendar-day {
    min-height: 100px; /* 提升移动端单元格高度 */
    padding: var(--space-2);
    aspect-ratio: 1/1;
  }
  
  .day-number {
    font-size: 16px;
  }

  .day-content {
    grid-template-columns: 70px 1fr;
    gap: var(--space-3);
  }

  .time-slot {
    font-size: 12px;
    height: 60px;
    padding: var(--space-1) var(--space-2);
  }
  
  .events-column {
    min-height: 960px; /* 移动端优化高度 */
    max-height: 60vh; /* 移动端最大高度限制 */
    padding: var(--space-1);
  }
  
  .week-content {
    min-height: 550px; /* 统一移动端周视图高度 */
  }
  
  /* 移动端隐藏桌面计划选择器 */
  .desktop-plan-selector {
    display: none !important;
  }
  
  .mobile-calendar-actions {
    display: flex !important;
    gap: var(--space-2);
    align-items: center;
  }
  
  .plan-select-btn {
    flex: 1;
    text-align: center;
    font-size: 14px;
  }
  
  .today-btn {
    min-width: 70px;
    font-size: 14px;
  }
}

/* 桌面端优化 */
@media (min-width: 769px) {
  .calendar-container {
    padding: 0 var(--space-6);
    width: 100%;
    max-width: none;
  }
  
  .calendar-day {
    min-height: 160px; /* 桌面端进一步提升 */
    aspect-ratio: 1/1;
  }
  
  .sticky-toolbar {
    padding: var(--space-5);
    margin: var(--space-5) 0;
  }
  
  .calendar-view {
    padding: var(--space-6);
    min-height: 80vh; /* 桌面端更大的视觉占位 */
  }
  
  .month-view, .week-view, .day-view {
    padding: var(--space-6);
  }
  
  .calendar-day {
    min-height: 140px; /* 桌面端更大单元格 */
    aspect-ratio: 1/1;
  }
  
  .week-content {
    min-height: 680px; /* 统一桌面端高度 */
  }
  
  .events-column {
    min-height: 1440px; /* 桌面端优化高度 */
    max-height: 75vh; /* 桌面端最大高度限制 */
  }
  
  .mobile-calendar-actions {
    display: none !important;
  }
  
  .desktop-plan-selector {
    display: block !important;
  }
  
  .view-btn {
    padding: var(--space-3) var(--space-4);
    font-size: 15px;
  }
}

/* 移动端浮动操作按钮 */
.mobile-fab {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: var(--z-fixed);
}
</style>
