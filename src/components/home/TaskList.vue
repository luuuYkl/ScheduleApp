<template>
  <div class="card">
    <div class="header">
      <h2>任务列表</h2>
      <small v-if="planId">仅显示计划 #{{ planId }} 的任务</small>
    </div>

    <ul class="list">
      <li v-for="t in tasks" :key="t.id" class="row">
        <label class="left">
          <input
            type="checkbox"
            :checked="t.status === 'done'"
            @change="toggle(t.id)"
          />
          <span class="title">{{ t.title }}</span>
          <span class="date">（{{ t.task_date }}）</span>
        </label>

        <div class="right">
          <span class="badge" :class="t.status">{{ t.status }}</span>
          <button @click="open(t.id)">详情</button>
        </div>
      </li>
    </ul>

    <p v-if="tasks.length === 0" class="empty">暂无任务</p>
  </div>
</template>

<script setup lang="ts">

import { computed, onMounted } from "vue";
import { useTaskStore } from "@/store/tasks";
import { useLogStore } from "@/store/log";
import { useUserStore } from "@/store/user";
import { useRouter } from "vue-router";

const props = defineProps<{ planId?: number }>();


const taskStore = useTaskStore();
const logStore = useLogStore();
const userStore = useUserStore();
const router = useRouter();


const todayStr = new Date().toISOString().slice(0, 10);
const tasks = computed(() => {
  const list = taskStore.tasks.filter((t: any) => t.task_date === todayStr);
  return props.planId ? list.filter((t: any) => t.plan_id === props.planId) : list;
});

onMounted(async () => {
  await taskStore.loadTasks(props.planId);
});


async function toggle(taskId: number) {
  await taskStore.toggleTaskStatus(taskId);
  // 勾选后生成日志
  const userId = userStore.user?.id;
  if (userId) {
    // 只生成一次日志（可根据实际需求调整，比如只在勾选为 done 时生成）
    await logStore.generateTodayLog(userId, taskStore.tasks);
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
.list { list-style: none; padding: 0; margin: 0; }
.row {
  display: flex; justify-content: space-between; align-items: center;
  padding: .5rem 0; border-bottom: 1px solid var(--color-border);
}
.left { display: flex; align-items: center; gap: .5rem; }
.title { font-weight: 600; }
.date { color: var(--color-gray); }
.right { display: flex; align-items: center; gap: .5rem; }
.badge {
  padding: .1rem .5rem; border-radius: 999px; font-size: .8rem;
  border: 1px solid var(--color-border);
}
.badge.done { background: #e7f8ee; border-color: #bfe6cf; }
.badge.pending { background: #eef2ff; border-color: #d2d9ff; }
.empty { color: var(--color-gray); margin-top: .5rem; }
</style>
