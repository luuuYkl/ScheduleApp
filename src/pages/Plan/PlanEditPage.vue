<template>
  <div class="page card" style="max-width:640px;margin:0 auto;">
    <h1>编辑计划</h1>
    <p class="text-gray">当前计划 ID：{{ planId }}</p>

    <!-- 计划表单 -->
    <form class="form" @submit.prevent="savePlan">
      <label>
        标题
        <input v-model="form.title" type="text" placeholder="计划标题" required />
      </label>

      <label>
        描述
        <textarea v-model="form.description" placeholder="计划描述（可选）"></textarea>
      </label>

      <div class="row">
        <label>
          开始日期
          <input v-model="form.start_date" type="date" />
        </label>
        <label>
          结束日期
          <input v-model="form.end_date" type="date" />
        </label>
      </div>

      <label>
        频率
        <select v-model="form.frequency">
          <option value="daily">每天</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
          <option value="once">仅一次</option>
        </select>
      </label>

      <div class="ops">
        <button class="primary" type="submit" :disabled="saving">
          {{ saving ? '保存中...' : '保存计划' }}
        </button>
        <button type="button" class="secondary" @click="cancel">取消</button>
      </div>
    </form>

    <!-- 任务管理 -->
    <section class="tasks">
      <h2>关联任务</h2>

      <!-- 新增任务 -->
      <div class="task-add">
        <input v-model="newTaskTitle" placeholder="新任务标题" />
        <input v-model="newTaskDate" type="date" />
        <button class="primary" @click="addTask">添加任务</button>
      </div>

      <!-- 任务列表 -->
      <ul v-if="tasks.length" class="task-list">
        <li v-for="t in tasks" :key="t.id" :class="{ done: t.status === 'done' }">
          <div v-if="editingId !== t.id" class="task-row">
            <input type="checkbox" :checked="t.status === 'done'" @change="toggleTask(t.id)" />
            <div class="task-main">
              <div class="title">{{ t.title }}</div>
              <div class="meta">{{ t.task_date }}</div>
            </div>
            <div class="task-actions">
              <button @click="startEdit(t)">编辑</button>
              <button class="danger" @click="deleteTask(t.id)">删除</button>
            </div>
          </div>

          <!-- 行内编辑 -->
          <div v-else class="task-edit">
            <input v-model="editTitle" />
            <input v-model="editDate" type="date" />
            <button class="primary" @click="saveTaskEdit">保存</button>
            <button @click="cancelEdit">取消</button>
          </div>
        </li>
      </ul>

      <p v-else class="text-gray">此计划暂无任务。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useUserStore } from "@/store/user";

const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const userStore = useUserStore();

// 解析 planId（确保为数字）
const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
const planId = Number(rawId);

// 表单模型
const form = reactive({
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  frequency: "daily",
});

const saving = ref(false);

// 任务相关状态与编辑态
const newTaskTitle = ref("");
const newTaskDate = ref(new Date().toISOString().slice(0, 10));
const editingId = ref<number | null>(null);
const editTitle = ref("");
const editDate = ref("");

// 任务列表（来自 store）
const tasks = computed(() => planStore.tasks.filter((t: any) => t.plan_id === planId));

// 加载计划与任务
async function loadData() {
  // 确保本地缓存有计划与任务
  await Promise.all([planStore.loadPlans(), planStore.loadTasks(planId)]);
  const plan = planStore.getPlan(planId);
  if (!plan) {
    alert("未找到该计划");
    router.push("/home");
    return;
  }
  // 填充表单
  form.title = plan.title ?? "";
  form.description = plan.description ?? "";
  form.start_date = plan.start_date ?? "";
  form.end_date = plan.end_date ?? "";
  form.frequency = plan.frequency ?? "daily";
}

onMounted(() => {
  loadData();
});

// 保存计划（更新）
async function savePlan() {
  if (!form.title) return alert("请填写标题");
  saving.value = true;
  try {
    if (!planStore.updatePlan) throw new Error("计划更新接口未实现");
    await planStore.updatePlan(planId, {
      title: form.title,
      description: form.description,
      start_date: form.start_date,
      end_date: form.end_date,
      frequency: form.frequency,
    });
    alert("保存成功");
    // 返回上页
    router.back();
  } catch (e: any) {
    alert(e?.message || "保存失败");
  } finally {
    saving.value = false;
  }
}

function cancel() {
  router.back();
}

/* ---------------- 任务操作 ---------------- */

async function addTask() {
  if (!newTaskTitle.value) return alert("请输入任务标题");
  const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id") || 0);
  if (!userId) return alert("请先登录");
  try {
    await planStore.createTask({
      plan_id: planId,
      user_id: userId,
      title: newTaskTitle.value,
      task_date: newTaskDate.value,
    });
    newTaskTitle.value = "";
    newTaskDate.value = new Date().toISOString().slice(0, 10);
    await planStore.loadTasks(planId);
  } catch (e: any) {
    alert(e?.message || "添加任务失败");
  }
}

function startEdit(t: any) {
  editingId.value = t.id;
  editTitle.value = t.title;
  editDate.value = t.task_date;
}

function cancelEdit() {
  editingId.value = null;
  editTitle.value = "";
  editDate.value = "";
}

async function saveTaskEdit() {
  if (!editingId.value) return;
  if (!editTitle.value) return alert("请输入任务标题");
  try {
    await planStore.updateTask(editingId.value, {
      title: editTitle.value,
      task_date: editDate.value,
    });
    editingId.value = null;
    await planStore.loadTasks(planId);
  } catch (e: any) {
    alert(e?.message || "更新任务失败");
  }
}

async function deleteTask(id: number) {
  if (!confirm("确认删除该任务？")) return;
  try {
    await planStore.deleteTask(id);
    await planStore.loadTasks(planId);
  } catch (e: any) {
    alert(e?.message || "删除任务失败");
  }
}

async function toggleTask(id: number) {
  try {
    await planStore.toggleTaskStatus(id);
    // store 已更新，本地列表会响应；如需强制刷新可调用 loadTasks
  } catch (e: any) {
    alert(e?.message || "切换状态失败");
  }
}
</script>

<style scoped>
.page { padding: 1rem; }
.form { display: grid; gap: .6rem; margin-bottom: 1rem; }
.form label { display: flex; flex-direction: column; font-weight: 600; }
.row { display: flex; gap: .6rem; }
.ops { display: flex; gap: .5rem; margin-top: .5rem; }
.primary { background: #3b82f6; color: #fff; border: none; padding: .5rem 1rem; border-radius: 6px; }
.secondary { background: #f1f5f9; border: 1px solid #d1d5db; padding: .5rem 1rem; border-radius: 6px; }
.tasks { margin-top: 1.2rem; }
.task-add { display:flex; gap:.5rem; align-items:center; margin-bottom:.8rem; }
.task-list { list-style:none; padding:0; margin:0; display:grid; gap:.5rem; }
.task-row { display:flex; align-items:center; gap:.6rem; }
.task-main { flex:1; }
.task-actions { display:flex; gap:.4rem; }
.done .title { text-decoration: line-through; color:#6b7280; }
.task-edit { display:flex; gap:.5rem; align-items:center; }
.text-gray { color:#6b7280; }
.danger { background:#ef4444; color:#fff; border:none; padding:.3rem .6rem; border-radius:6px; }
</style>
