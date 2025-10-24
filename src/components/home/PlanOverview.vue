<template>
  <div class="card">
    <div class="header">
      <h2>计划进度概览</h2>
      <!-- 增：新建计划 -->
      <button class="primary" @click="goCreate">新建计划</button>
    </div>

    <div v-if="plans.length === 0" class="empty">暂无计划，点击右上角新建一个吧～</div>

    <ul v-else class="list">
      <li v-for="p in plans" :key="p.id" class="plan">
        <div class="top">
          <strong>{{ p.title }}</strong>
          <small class="range">（{{ p.start_date }} ~ {{ p.end_date }} / {{ p.frequency }}）</small>
          <span class="pct">{{ progressFor(p.id) }}%</span>
        </div>
        <div class="bar">
          <div class="fill" :style="{ width: progressFor(p.id) + '%' }"></div>
        </div>

        <!-- PlanOverview.vue 的 ops 区 -->
        <div class="ops">
          <button class="secondary" @click="editPlan(p.id)">修改</button>
          <button @click="goPlanTasks(p.id)">管理任务</button> <!-- ✅ 新增入口 -->
          <button class="danger" :disabled="loading" @click="removePlan(p.id)">
            {{ loading ? "处理中..." : "删除" }}
          </button>
        </div>

      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";

const router = useRouter();
const planStore = usePlanStore();
const taskStore = useTaskStore();
const loading = ref(false);

const plans = computed(() => planStore.plans);

onMounted(async () => {
  await planStore.loadPlans();
  await taskStore.loadTasks(); // 用于进度统计
});

// 进度
function progressFor(planId: number) {
  const ts = taskStore.tasks.filter((t: any) => t.plan_id === planId);
  if (ts.length === 0) return 0;
  const done = ts.filter((t: any) => t.status === "done").length;
  return Math.round((done / ts.length) * 100);
}

// 增：跳到创建页
function goCreate() {
  router.push("/plan/create");
}

// 改：稳定做法——用 query 表示编辑目标 /plan/create?edit=ID
function editPlan(id: number | string) {
  router.push({ path: "/plan/create", query: { edit: String(id) } });
}

// 删：删除计划并刷新
async function removePlan(id: number) {
  if (!confirm("确定删除该计划吗？相关任务也会一并删除。")) return;
  loading.value = true;
  try {
    await planStore.removePlan(id);
    await Promise.all([planStore.loadPlans(), taskStore.loadTasks()]);
  } catch (e: any) {
    alert(e?.message || "删除失败");
  } finally {
    loading.value = false;
  }
}

function goPlanTasks(id: number | string) {
  // 优先走命名路由（如果你在 router 里已添加 name: 'plan-tasks'）
  if (router.hasRoute("plan-tasks")) {
    router.push({ name: "plan-tasks", params: { id: String(id) } });
  } else {
    // 兜底：直接用路径跳转
    router.push(`/plan/${id}/tasks`);
  }
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .5rem;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: .75rem;
}

.plan .top {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: .5rem;
  align-items: baseline;
}

.range {
  color: var(--color-gray);
}

.pct {
  font-weight: 600;
  color: var(--color-primary);
}

.bar {
  height: 10px;
  background: #f1f5f9;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  overflow: hidden;
  margin-top: .5rem;
}

.fill {
  height: 100%;
  background: var(--color-primary);
  transition: width .2s ease;
}

.ops {
  display: flex;
  gap: .5rem;
  margin-top: .5rem;
}

.empty {
  color: var(--color-gray);
}

.ops button:not(.danger):not(.secondary) {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: .4rem .75rem;
}

.ops button:not(.danger):not(.secondary):hover {
  background: #f8fafc;
}
</style>
