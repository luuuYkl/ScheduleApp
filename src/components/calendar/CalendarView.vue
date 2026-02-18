<template>
  <div class="calendar">
    <!-- 视图切换与导航 -->
    <header class="calendar-header">
      <div class="nav">
        <button @click="goPrev">上一{{ navUnitLabel }}</button>
        <span class="label">{{ headerLabel }}</span>
        <button @click="goNext">下一{{ navUnitLabel }}</button>
      </div>
      <div class="view-toggle">
        <button
          :class="{ active: viewMode === 'week' }"
          @click="setView('week')"
        >
          周
        </button>
        <button
          :class="{ active: viewMode === 'month' }"
          @click="setView('month')"
        >
          月
        </button>
        <button
          :class="{ active: viewMode === 'year' }"
          @click="setView('year')"
        >
          年
        </button>
      </div>
    </header>

    <!-- 周视图 -->
    <div v-if="viewMode === 'week'" class="week-view">
      <div class="days week-grid">
        <div class="day-name" v-for="d in weekDays" :key="d">{{ d }}</div>
        <div
          v-for="day in daysInWeek"
          :key="day.date"
          class="day"
          :class="{ 'has-tasks': day.tasks.length, done: isAllTasksDone(day) }"
          @click="showTasks(day)"
        >
          <span class="date">{{ formatDay(day.date) }}</span>
          <div v-if="day.tasks.length" class="task-count">
            {{ day.tasks.length }} 任务
          </div>
        </div>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-if="viewMode === 'month'" class="month-view">
      <div class="days month-grid">
        <div class="day-name" v-for="d in weekDays" :key="d">{{ d }}</div>
        <div
          v-for="blank in leadingBlanks"
          :key="'b' + blank"
          class="blank"
        ></div>
        <div
          v-for="day in daysInMonth"
          :key="day.date"
          class="day"
          :class="{ 'has-tasks': day.tasks.length, done: isAllTasksDone(day) }"
          @click="showTasks(day)"
        >
          <span class="date">{{ day.date.split("-")[2] }}</span>
          <div v-if="day.tasks.length" class="task-count">
            {{ day.tasks.length }}
          </div>
        </div>
      </div>
    </div>

    <!-- 年视图 -->
    <div v-if="viewMode === 'year'" class="year-view">
      <div class="months-grid">
        <div
          v-for="m in monthsInYear"
          :key="m.month"
          class="month-box"
          @click="openMonth(m.month)"
        >
          <div class="month-name">{{ monthNames[m.month] }}</div>
          <div class="month-meta">任务: {{ m.taskCount }}</div>
        </div>
      </div>
    </div>

    <!-- 任务列表：点击日期后显示该日期的任务 -->
    <div v-if="selectedDay" class="task-list">
      <h3>任务列表 - {{ selectedDay.date }}</h3>
      <ul>
        <li v-for="task in selectedDay.tasks" :key="task.id">
          <span>{{ task.title }}</span>
          <span>{{ task.status === "done" ? "✅ 完成" : "❌ 未完成" }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useTaskStore } from "@/store/tasks";

const taskStore = useTaskStore();
// 视图模式 week | month | year
const viewMode = ref<"week" | "month" | "year">("month");
const today = new Date();
const currentDate = ref<Date>(
  new Date(today.getFullYear(), today.getMonth(), today.getDate()),
);
const selectedDay = ref<{ date: string; tasks: any[] } | null>(null);
const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
const monthNames = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

// 月视图：当月所有天
const daysInMonth = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const arr: any[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const tasks = taskStore.tasks.filter((t) => t.task_date === dateStr);
    arr.push({ date: dateStr, tasks });
  }
  return arr;
});

// 月视图：首日星期几用于前置空格
const leadingBlanks = computed(() => {
  const first = new Date(currentYear.value, currentMonth.value, 1).getDay();
  return Array.from({ length: first }, (_, i) => i);
});

// 周视图：计算当前周 7 天（以周日开始）
const daysInWeek = computed(() => {
  const base = new Date(currentDate.value);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay()); // 周日
  const arr: any[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const tasks = taskStore.tasks.filter((t) => t.task_date === dateStr);
    arr.push({ date: dateStr, tasks });
  }
  return arr;
});

// 年视图：12个月任务统计
const monthsInYear = computed(() => {
  const y = currentYear.value;
  return monthNames.map((_, idx) => {
    const prefix = `${y}-${String(idx + 1).padStart(2, "0")}-`;
    const taskCount = taskStore.tasks.filter((t) =>
      t.task_date.startsWith(prefix),
    ).length;
    return { month: idx, taskCount };
  });
});

// 头部标签与导航单位
const headerLabel = computed(() => {
  if (viewMode.value === "week") {
    const w = daysInWeek.value;
    return `第 ${getWeekNumber(currentDate.value)} 周 (${w[0].date} ~ ${w[6].date})`;
  } else if (viewMode.value === "month") {
    return `${monthNames[currentMonth.value]} ${currentYear.value}`;
  } else {
    return `${currentYear.value} 年`;
  }
});
const navUnitLabel = computed(() =>
  viewMode.value === "week" ? "周" : viewMode.value === "month" ? "月" : "年",
);

function getWeekNumber(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function setView(v: "week" | "month" | "year") {
  viewMode.value = v;
  selectedDay.value = null;
}

function goPrev() {
  if (viewMode.value === "week") {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() - 7,
    );
  } else if (viewMode.value === "month") {
    currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
  } else {
    currentDate.value = new Date(currentYear.value - 1, currentMonth.value, 1);
  }
}
function goNext() {
  if (viewMode.value === "week") {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() + 7,
    );
  } else if (viewMode.value === "month") {
    currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
  } else {
    currentDate.value = new Date(currentYear.value + 1, currentMonth.value, 1);
  }
}

function openMonth(mIndex: number) {
  currentDate.value = new Date(currentYear.value, mIndex, 1);
  viewMode.value = "month";
}

function showTasks(day: any) {
  selectedDay.value = day;
}
function isAllTasksDone(day: any) {
  return (
    day.tasks.length > 0 && day.tasks.every((t: any) => t.status === "done")
  );
}
function formatDay(dateStr: string) {
  return dateStr.split("-").slice(1).join("-");
}

onMounted(async () => {
  await taskStore.loadTasks();
});
</script>

<style scoped>
.calendar {
  padding: 1rem;
  background: var(--bg-main, #0e1117); /* 深蓝灰背景 */
  border-radius: 12px;
  box-shadow: var(--shadow-soft);
  border: 1px solid var(--border-subtle);
}

.calendar-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.calendar-header .nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-header .nav button {
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-sm);
  font-size: 14px;
  transition: all 0.2s;
}

.calendar-header .nav button:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
  border-color: var(--border-emphasis);
}

.calendar-header .label {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-main);
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.view-toggle button {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 13px;
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1px solid var(--border-main);
  transition: all 0.2s;
}

.view-toggle button.active {
  background: var(--ai-main);
  color: var(--text-emphasis);
  border-color: var(--ai-main);
}

.view-toggle button:hover:not(.active) {
  background: var(--bg-card-hover);
  color: var(--text-main);
  border-color: var(--border-emphasis);
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.day-name {
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  padding: 0.5rem 0;
}

.day {
  padding: 0.5rem 0.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-height: 70px;
  transition: all 0.2s;
}

.day:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-main);
  transform: translateY(-1px);
}

.day .date {
  color: var(--text-main);
  font-weight: 500;
}

.day.has-tasks {
  border: 1px solid var(--ai-main);
  background: var(--ai-bg);
}

.day.done {
  background: var(--success-bg);
  border-color: var(--success);
}

.day.done .date {
  color: var(--success);
}

.blank {
  background: transparent;
}

.task-count {
  font-size: 11px;
  color: var(--ai-soft);
  font-weight: 500;
}

.week-grid .day {
  min-height: 90px;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.month-box {
  background: var(--bg-card);
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid var(--border-main);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: all 0.2s;
}

.month-box:hover {
  background: var(--bg-card-hover);
  border-color: var(--ai-main);
  transform: translateY(-1px);
}

.month-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-main);
}

.month-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.task-list {
  margin-top: var(--spacing-section);
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius);
}

.task-list h3 {
  margin-bottom: 1rem;
  color: var(--text-main);
}

.task-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 14px;
  color: var(--text-secondary);
}

.task-list li:last-child {
  border-bottom: none;
}

@media (max-width: 640px) {
  .months-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
