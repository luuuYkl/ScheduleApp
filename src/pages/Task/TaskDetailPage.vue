<template>
  <div class="page card" style="max-width:720px;margin:0 auto;">
    <h1 class="mb-2">任务详情</h1>

    <template v-if="task">
      <section class="block">
        <p><strong>标题：</strong>{{ task.title }}</p>
        <p><strong>日期：</strong>{{ task.task_date }}</p>
        <p>
          <strong>状态：</strong>
          <span :class="['badge', task.status]">{{ task.status }}</span>
        </p>
      </section>

      <!-- 单任务进度（done=100 / pending=0） -->
      <section class="block">
        <TaskProgress :value="task.status === 'done' ? 100 : 0" label="该任务进度" />
      </section>

      <!-- 计划整体进度（根据同计划所有任务计算） -->
      <section v-if="planProgress !== null" class="block">
        <TaskProgress :value="planProgress" label="所属计划整体进度" />
        <small class="hint">基于该计划下任务的完成比例计算</small>
      </section>

      <section class="block">
        <TaskCheckBox
          :checked="task.status === 'done'"
          :disabled="toggling"
          @toggle="toggle"
        >
          {{ task.status === 'done' ? '标记为未完成' : '标记为已完成' }}
        </TaskCheckBox>

        <div class="ops">
          <button @click="back">返回</button>
        </div>
      </section>
    </template>

    <p v-else>正在加载任务…</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { useLogStore } from "@/store/log"; // 新增
import { useUserStore } from "@/store/user"; // 新增
import TaskProgress from "@/components/task/TaskProgress.vue";
import TaskCheckBox from "@/components/task/TaskCheckBox.vue";

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const logStore = useLogStore(); // 新增
const userStore = useUserStore(); // 新增

const id = Number(route.params.id);
const toggling = ref(false);

// 当前任务
const task = computed(() => taskStore.tasks.find(t => t.id === id));

// 计划层面的整体进度（同 plan_id 的所有任务计算）
const planProgress = computed(() => {
  if (!task.value) return null;
  const list = taskStore.tasks.filter(t => t.plan_id === task.value!.plan_id);
  if (list.length === 0) return 0;
  const done = list.filter(t => t.status === "done").length;
  return Math.round((done / list.length) * 100);
});

onMounted(async () => {
  // 若刷新后 store 为空，加载一次任务（简单做法：全量加载）
  if (!task.value) {
    await taskStore.loadTasks();
  }
});

async function toggle() {
  if (!task.value) return;
  toggling.value = true;
  try {
    await taskStore.toggleTaskStatus(task.value.id);
    
    // 任务完成时,生成日志
    if (task.value.status === 'done') {
      const userId = userStore.user?.id;
      if (userId) {
        // 获取同一计划的所有任务
        const planTasks = taskStore.tasks.filter(
          t => t.plan_id === task.value!.plan_id
        );
        // 生成日志
        await logStore.generateTodayLog(userId, planTasks);
      }
    }
  } finally {
    toggling.value = false;
  }
}

function back() {
  router.back();
}
</script>

<style scoped>
.block { margin: 1rem 0; }
.badge {
  padding: .1rem .5rem; border-radius: 999px; font-size: .85rem;
  border: 1px solid var(--color-border);
}
.badge.done { background: #e7f8ee; border-color: #bfe6cf; }
.badge.pending { background: #eef2ff; border-color: #d2d9ff; }
.hint { color: var(--color-gray); }
.ops { margin-top: .75rem; display: flex; gap: .5rem; }
</style>
