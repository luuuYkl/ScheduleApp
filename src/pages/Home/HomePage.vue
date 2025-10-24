<template>
  <div class="page home">
    <div class="grid">
      <div class="actions card">
        <div class="btns">
          <button class="secondary" @click="goLog">查看日志</button>
          <button @click="refresh">刷新数据</button>
        </div>
      </div>
      <PlanOverview @create="goCreate" />

      <TaskList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import PlanOverview from "@/components/home/PlanOverview.vue";
import TaskList from "@/components/home/TaskList.vue";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";

const router = useRouter();
const planStore = usePlanStore();
const taskStore = useTaskStore();

function goCreate() {
  router.push("/plan/create");
}
function goLog() {
  router.push("/log");
}
async function refresh() {
  await Promise.all([planStore.loadPlans(), taskStore.loadTasks()]);
}
</script>

<style scoped>
.home .grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
/* 你后面可以加媒体查询做两栏布局 */
.actions .btns {
  display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .5rem;
}
</style>
