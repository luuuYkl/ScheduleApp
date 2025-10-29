<template>
  <div class="calendar">
    <!-- 日历头部：月份切换按钮 -->
    <header>
      <button @click="prevMonth">上一月</button>
      <span>{{ monthLabel }}</span>
      <button @click="nextMonth">下一月</button>
    </header>

    <!-- 日历内容：每周日期 -->
    <div class="days">
      <div class="day-name" v-for="day in weekDays" :key="day">{{ day }}</div>
      <div
        v-for="day in daysInMonth"
        :key="day.date"
        class="day"
        :class="{ 'has-tasks': day.tasks.length > 0, 'done': isAllTasksDone(day) }"
        @click="showTasks(day)"
      >
        <span>{{ day.date }}</span>
        <div v-if="day.tasks.length">
          <span>{{ day.tasks.length }} tasks</span>
        </div>
      </div>
    </div>

    <!-- 任务列表：点击日期后显示该日期的任务 -->
    <div v-if="selectedDay" class="task-list">
      <h3>任务列表 - {{ selectedDay.date }}</h3>
      <ul>
        <li v-for="task in selectedDay.tasks" :key="task.id">
          <span>{{ task.title }}</span>
          <span>{{ task.status === 'done' ? '✅ 完成' : '❌ 未完成' }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useTaskStore } from "@/store/tasks";

const taskStore = useTaskStore();

// 当前月份和年份
const currentMonth = ref<number>(new Date().getMonth());
const currentYear = ref<number>(new Date().getFullYear());
const selectedDay = ref<{ date: string; tasks: any[] } | null>(null);

// 星期天到星期六
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

// 获取本月的所有天数及任务
const daysInMonth = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);
  const days: any[] = [];

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const tasks = taskStore.tasks.filter(
      (task: any) => task.task_date === dateStr
    );
    days.push({ date: dateStr, tasks });
  }

  return days;
});

// 月份标签
const monthLabel = computed(() => {
  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];
  return `${monthNames[currentMonth.value]} ${currentYear.value}`;
});

// 上一个月
function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value -= 1;
  } else {
    currentMonth.value -= 1;
  }
}

// 下一个月
function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value += 1;
  } else {
    currentMonth.value += 1;
  }
}

// 查看某天的任务
function showTasks(day: any) {
  selectedDay.value = day;
}

// 判断当天的所有任务是否都完成
function isAllTasksDone(day: any) {
  return day.tasks.every((task: any) => task.status === 'done');
}


onMounted(async () => {
  await taskStore.loadTasks(); // 加载所有任务
});
</script>

<style scoped>
.calendar {
  padding: 1rem;
  background: var(--color-bg-light);
  border-radius: 8px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: var(--color-primary-dark);
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1rem;
}

.day-name {
  text-align: center;
  font-weight: bold;
}

.day {
  padding: 1rem;
  background: #f1f5f9;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
}

.day:hover {
  background-color: var(--color-primary-light);
}

.has-tasks {
  background-color: var(--color-secondary-light);
}

.done {
  background-color: #d1fad3;
}

.task-list {
  margin-top: 1rem;
}

.task-list ul {
  padding: 0;
  list-style: none;
}

.task-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}
</style>
