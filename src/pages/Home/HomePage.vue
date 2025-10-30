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

    <!-- 悬浮按钮：创建日程 -->
    <button class="fab" @click="goSchedule" title="创建日程">
      <span class="icon">➕</span>
      <span class="text">日程</span>
    </button>
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
function goSchedule() {
  router.push("/schedule");
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

/* 悬浮按钮 (FAB - Floating Action Button) */
.fab {
  position: fixed;
  bottom: 80px; /* 避开底部导航 */
  right: 1.5rem;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary, #3b82f6);
  color: #fff;
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 50;
}
.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 18px rgba(59, 130, 246, 0.6);
}
.fab .icon {
  font-size: 1.5rem;
  line-height: 1;
}
.fab .text {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}
@media (max-width: 640px) {
  .fab { bottom: 70px; right: 1rem; width: 56px; height: 56px; }
  .fab .icon { font-size: 1.25rem; }
  .fab .text { font-size: 0.6rem; }
}
</style>
