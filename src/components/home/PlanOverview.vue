// ...existing code...
<template>
  <!-- 卡片容器：展示计划列表与操作 -->
  <div class="card">
    <div class="header">
      <h2>计划进度概览</h2>
      <!-- 新建计划按钮（跳转到创建页面） -->
      <button class="primary" @click="goCreate">新建计划</button>
    </div>

    <!-- 列表为空时的占位文案 -->
    <div v-if="plans.length === 0" class="empty">暂无计划，点击右上角新建一个吧～</div>

    <!-- 计划列表：每个计划显示标题、时间范围、进度条和操作 -->
    <ul v-else class="list">
      <li v-for="p in plans" :key="p.id" class="plan">
        <div class="top">
          <!-- 计划标题 -->
          <strong>{{ p.title }}</strong>
          <!-- 显示开始/结束日期与频率 -->
          <small class="range">（{{ p.start_date }} ~ {{ p.end_date }} / {{ p.frequency }}）</small>
          <!-- 百分比数字表示 -->
          <span class="pct">{{ progressFor(p.id) }}%</span>
        </div>

        <!-- 进度条：根据进度改变 fill 的宽度 -->
        <div class="bar">
          <div class="fill" :style="{ width: progressFor(p.id) + '%' }"></div>
        </div>

        <!-- 操作区：编辑 / 管理任务 / 删除 -->
        <div class="ops">
          <!-- 编辑：使用 query 表示编辑目标 -->
          <button class="secondary" @click="editPlan(p.id)">修改</button>

          <!-- 管理任务：跳到该计划的任务管理页 -->
          <button @click="goPlanTasks(p.id)">管理任务</button>

          <!-- 删除：调用 store 删除并在处理中禁用按钮 -->
          <button class="danger" :disabled="loading" @click="removePlan(p.id)">
            {{ loading ? "处理中..." : "删除" }}
          </button>
        </div>

      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
/*
  PlanOverview.vue - 脚本说明
  - 负责从 planStore 读取计划列表
  - 使用 taskStore 加载任务以计算每个计划的完成进度
  - 提供新建、编辑、删除、跳转到任务页等操作
*/

import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";

// router 用于页面跳转
const router = useRouter();

// Pinia store：计划与任务
const planStore = usePlanStore();
const taskStore = useTaskStore();

// 删除/请求处理中状态标记，防止重复点击
const loading = ref(false);

// 计算属性：从 planStore 获取当前计划数组
const plans = computed(() => planStore.plans);

// 生命周期：组件挂载时加载计划和任务数据（用于进度计算）
onMounted(async () => {
  await planStore.loadPlans();
  // 同步加载任务以便 progressFor 能正确计算
  await taskStore.loadTasks();
});

/*
  progressFor(planId)
  - 计算给定计划的任务完成率（百分比整数）
  - 策略：统计计划时间范围内的所有任务实例（包括重复任务的每次重复）
  - 对于重复任务，统计其在计划持续期间内的所有日期的任务
  - 返回 0-100 的整数
*/
function progressFor(planId: number) {
  const plan = plans.value.find((p: any) => p.id === planId);
  if (!plan) return 0;

  const startDate = new Date(plan.start_date);
  const endDate = new Date(plan.end_date);

  // 筛选属于该计划且在计划日期范围内的所有任务
  const tasksInRange = taskStore.tasks.filter((t: any) => {
    if (t.plan_id !== planId) return false;
    const taskDate = new Date(t.task_date);
    return taskDate >= startDate && taskDate <= endDate;
  });

  if (tasksInRange.length === 0) return 0;
  
  const done = tasksInRange.filter((t: any) => t.status === "done").length;
  return Math.round((done / tasksInRange.length) * 100);
}

/*
  goCreate()
  - 跳转到创建计划页面
*/
function goCreate() {
  router.push("/plan/create");
}

/*
  editPlan(id)
  - 编辑计划：为了保持路由稳定性，使用 /plan/create?edit=ID 的方式进入编辑态
*/
function editPlan(id: number | string) {
  router.push({ path: "/plan/create", query: { edit: String(id) } });
}

/*
  removePlan(id)
  - 删除计划并刷新计划与任务数据
  - 显示原生 confirm 提示以防误删
  - 捕获错误并用 alert 提示用户
*/
async function removePlan(id: number) {
  if (!confirm("确定删除该计划吗？相关任务也会一并删除。")) return;
  loading.value = true;
  try {
    await planStore.removePlan(id);
    // 并行刷新 plan 与 task 数据
    await Promise.all([planStore.loadPlans(), taskStore.loadTasks()]);
  } catch (e: any) {
    alert(e?.message || "删除失败");
  } finally {
    loading.value = false;
  }
}

/*
  goPlanTasks(id)
  - 跳转到计划任务管理页
  - 优先使用命名路由（如果 router 中有 name: 'plan-tasks'），否则使用路径拼接兜底
*/
function goPlanTasks(id: number | string) {
  if (router.hasRoute("plan-tasks")) {
    router.push({ name: "plan-tasks", params: { id: String(id) } });
  } else {
    router.push(`/plan/${id}/tasks`);
  }
}
</script>

<style scoped>
/* 样式：简要说明每部分的作用 */
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

/* 每个计划项的顶部排版：标题 / 时间范围 / 百分比 */
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

/* 进度条容器与填充 */
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

/* 操作按钮区域 */
.ops {
  display: flex;
  gap: .5rem;
  margin-top: .5rem;
}

.empty {
  color: var(--color-gray);
}

/* 非危险类按钮的基础样式 */
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
// ...existing code...