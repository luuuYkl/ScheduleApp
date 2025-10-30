<template>
  <div class="card">
    <div class="header">
      <h2>今日任务与日程</h2>
      <small v-if="planId">仅显示计划 #{{ planId }} 的任务</small>
    </div>

    <!-- 今日日程 -->
    <section v-if="schedules.length > 0" class="section">
      <h3 class="section-title">📅 日程</h3>
      <ul class="list">
        <li v-for="s in schedules" :key="'s'+s.id" class="row schedule-row">
          <label class="left">
            <input type="checkbox" :checked="s.completed" @change="toggleSchedule(s.id)" />
            <span class="title" :class="{completed: s.completed}">{{ s.title }}</span>
            <span class="time" v-if="s.start_time">{{ s.start_time }} - {{ s.end_time || '未结束' }}</span>
              <span v-if="s.description" class="desc">{{ s.description }}</span>
          </label>
          <div class="right">
            <span class="badge schedule">日程</span>
          </div>
        </li>
      </ul>
    </section>

    <!-- 今日任务（若今日为空则显示最近未来任务） -->
    <section v-if="tasks.length > 0" class="section">
      <h3 class="section-title">✅ 任务 <small v-if="tasks[0].task_date !== todayStr" class="hint">(即将开始)</small></h3>
      <ul class="list">
        <li v-for="t in tasks" :key="'t'+t.id" class="row">
          <label class="left">
            <input
              type="checkbox"
              :checked="t.status === 'done'"
              @change="toggle(t.id)"
            />
            <span class="title">{{ t.title }}</span>
            <span class="date">（{{ t.task_date }}）</span>
              <span v-if="t.note" class="task-note">{{ t.note }}</span>
          </label>

          <div class="right">
            <span class="badge" :class="t.status">{{ t.status }}</span>
            <button @click="open(t.id)">详情</button>
          </div>
        </li>
      </ul>
    </section>

    <p v-if="tasks.length === 0 && schedules.length === 0" class="empty">今天暂无任务与日程</p>
  </div>
</template>

<script setup lang="ts">

import { computed, onMounted } from "vue";
import { useTaskStore } from "@/store/tasks";
import { useScheduleStore } from "@/store/schedules";
import { useLogStore } from "@/store/log";
import { useUserStore } from "@/store/user";
import { useRouter } from "vue-router";

const props = defineProps<{ planId?: number }>();


const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();
const logStore = useLogStore();
const userStore = useUserStore();
const router = useRouter();


const todayStr = new Date().toISOString().slice(0, 10);
const tasks = computed(() => {
  // 今日任务列表
  const todayList = taskStore.tasks.filter((t: any) => t.task_date === todayStr);
  const filteredToday = props.planId ? todayList.filter((t: any) => t.plan_id === props.planId) : todayList;
  if (filteredToday.length > 0) return filteredToday;
  // 回退：未来任务（日期 >= 今天），按日期升序取前 5 条
  const future = taskStore.tasks
    .filter((t: any) => t.task_date >= todayStr && (!props.planId || t.plan_id === props.planId))
    .sort((a: any, b: any) => a.task_date.localeCompare(b.task_date))
    .slice(0, 5);
  return future;
});
const schedules = computed(() => scheduleStore.schedules.filter(s => s.date === todayStr));

onMounted(async () => {
  await taskStore.loadTasks(props.planId);
  await scheduleStore.load(todayStr);
});


async function toggle(taskId: number) {
  await taskStore.toggleTaskStatus(taskId);
  // 勾选后生成日志（包含任务和日程）
  const userId = userStore.user?.id;
  if (userId) {
    await logStore.generateTodayLog(userId, taskStore.tasks, schedules.value);
  }
}

async function toggleSchedule(scheduleId: number) {
  await scheduleStore.toggleComplete(scheduleId);
  // 勾选日程后也更新日志（包含任务和日程）
  const userId = userStore.user?.id;
  if (userId) {
    await logStore.generateTodayLog(userId, taskStore.tasks, schedules.value);
  }
}

function open(id: number) {
  router.push(`/task/${id}`);
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: baseline;
  gap: .5rem;
  margin-bottom: .5rem;
}
.section { margin-bottom: 1rem; }
.section-title { font-size:.85rem; font-weight:600; color: var(--color-gray); margin-bottom:.35rem; letter-spacing:.05em; }
.list { list-style: none; padding: 0; margin: 0; }
.row {
  display: flex; justify-content: space-between; align-items: center;
  padding: .5rem 0; border-bottom: 1px solid var(--color-border);
}
.schedule-row { background: #fef9e7; padding:.5rem .5rem; border-radius:4px; border:1px solid #f9e79f; margin-bottom:.35rem; }
.left { display: flex; align-items: center; gap: .5rem; }
.icon { font-size:1rem; }
.title { font-weight: 600; }
.title.completed { text-decoration: line-through; opacity: 0.6; }
.time { font-size:.7rem; color: var(--color-gray); }
.desc { display:block; font-size:.65rem; color: var(--color-gray); }
.task-note { display:block; font-size:.65rem; color: var(--color-gray); }
.date { color: var(--color-gray); }
.right { display: flex; align-items: center; gap: .5rem; }
.badge {
  padding: .1rem .5rem; border-radius: 999px; font-size: .8rem;
  border: 1px solid var(--color-border);
}
.badge.done { background: #e7f8ee; border-color: #bfe6cf; }
.badge.pending { background: #eef2ff; border-color: #d2d9ff; }
.badge.schedule { background: #fffacd; border-color: #f9e79f; }
.empty { color: var(--color-gray); margin-top: .5rem; }
</style>
