<template>
  <PageScaffold
    back-to="/home"
    class="layer-context"
  >
    <template #actions>
      <div class="desktop-plan-selector priority-medium">
        <Button variant="outline" size="sm" @click="showPlanSelector = true">
          {{ selectedPlanTitle || "选择计划" }}
        </Button>
      </div>
    </template>
  </PageScaffold>
  
  <div class="calendar-container">
    <!-- Context Layer: 顶部吸附工具栏 -->
    <div class="sticky-toolbar layer-context priority-high">
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
          
          <!-- Secondary Layer: 当日详情抽屉 -->
          <div 
            v-if="showDayDrawer && selectedDateEvents.length > 0"
            class="day-drawer layer-secondary priority-medium"
            :class="{ 'drawer-open': isDrawerOpen }"
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

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = new Date(firstDay);
  startDay.setDate(firstDay.getDate() - firstDay.getDay());

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
  showDayDrawer.value = true;
  isDrawerOpen.value = true;
}

function closeDayDrawer() {
  isDrawerOpen.value = false;
  setTimeout(() => {
    showDayDrawer.value = false;
  }, 300);
}

function getEventsForDate(date: Date): CalendarEvent[] {
  if (!selectedPlanId.value) return [];

  const dateStr = date.toISOString().split("T")[0];
  const events: CalendarEvent[] = [];

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

  const planIdFromRoute = router.currentRoute.value.query.planId as string;
  if (planIdFromRoute) {
    selectedPlanId.value = planIdFromRoute;
  }
});

// 监听计划选择变化
watch(selectedPlanId, (newPlanId) => {
  if (newPlanId) {
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
  padding: 0 var(--space-6);
}

/* 顶部吸附工具栏 */
.sticky-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  margin: var(--space-5) 0;
  position: sticky;
  top: calc(var(--header-height, 64px) + var(--space-4));
  z-index: var(--z-sticky);
  box-shadow: var(--shadow-md);
  transition: all var(--dur-normal) var(--ease-standard);
  border: 1px solid var(--border-subtle);
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
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 15px;
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
  padding: var(--space-6);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  min-height: 80vh;
}

/* 月视图 */
.month-view {
  padding: var(--space-6);
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
  min-height: 140px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  aspect-ratio: 1/1;
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
  min-height: 680px;
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
  width: 300px;
  position: sticky;
  top: calc(var(--header-height) + var(--space-8));
  height: fit-content;
  max-height: calc(100vh - var(--header-height) - var(--space-12));
  transform: translateX(100%);
}

.day-drawer.drawer-open {
  transform: translateX(0);
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
  min-height: 1440px;
  max-height: 75vh;
  overflow-y: auto;
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

/* 计划选择器按钮 */
.desktop-plan-selector {
  display: block;
}
</style>