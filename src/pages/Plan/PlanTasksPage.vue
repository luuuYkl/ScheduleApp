<template>
  <div class="page">
    <h1 class="mb-4">计划 #{{ planId }} 的任务</h1>

    <!-- 新增：任务添加表单 -->
    <div class="card mb-4">
      <h3>添加任务</h3>
      <form class="add-form" @submit.prevent="addTask">
        <div class="form-row">
          <input 
            v-model.trim="form.title" 
            type="text" 
            placeholder="任务标题"
            required
          />
          <input 
            v-model="form.task_date" 
            type="date"
            required
          />
          <button 
            type="submit" 
            class="primary" 
            :disabled="submitting"
          >
            {{ submitting ? '添加中...' : '添加任务' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 任务列表 -->
    <div class="card">
      <h3>任务列表</h3>
      <ul v-if="list.length" class="list">
        <li v-for="t in list" :key="t.id" class="item">
          <div class="left">
            <input type="checkbox" :checked="t.status === 'done'" @change="toggle(t.id)" />
            <div class="info">
              <strong>{{ t.title }}</strong>
              <small>{{ t.task_date }} · {{ t.status }}</small>
            </div>
          </div>

          <div class="ops" v-if="editingId !== t.id">
            <button class="secondary" @click="startEdit(t)">编辑</button>
            <button class="danger" @click="remove(t.id)">删除</button>
          </div>

          <!-- 行内编辑态 -->
          <div class="edit" v-else>
            <input v-model="edit.title" type="text" />
            <input v-model="edit.task_date" type="date" />
            <button class="primary" @click="saveEdit">保存</button>
            <button @click="cancelEdit">取消</button>
          </div>
        </li>
      </ul>
      <p v-else class="text-gray">暂无任务，先添加一个吧～</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { useUserStore } from "@/store/user"; // 新增

const route = useRoute();
const taskStore = useTaskStore();
const userStore = useUserStore(); // 新增
const planId = Number(route.params.id);
const list = computed(() => taskStore.tasks.filter(x => x.plan_id === planId));

const form = reactive({
  title: "",
  task_date: new Date().toISOString().slice(0, 10),
});

const submitting = ref(false);

async function addTask() {
  if (!form.title) return alert("请填写任务标题");
  if (!form.task_date) return alert("请选择任务日期");

  const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id") || 0);
  if (!userId) return alert("请先登录");

  submitting.value = true;
  try {
    await taskStore.createTask({
      plan_id: planId,
      user_id: userId,
      title: form.title,
      task_date: form.task_date,
    });
    
    // 重置表单
    form.title = "";
    form.task_date = new Date().toISOString().slice(0, 10);
    
    // 刷新任务列表（可选，如果 store 已自动更新则不需要）
    await taskStore.loadTasks(planId);
  } catch (e: any) {
    alert(e?.message || "添加失败，请重试");
  } finally {
    submitting.value = false;
  }
}

async function toggle(id: number) {
  await taskStore.toggleTaskStatus(id);
}

async function remove(id: number) {
  if (!confirm("确认删除该任务？")) return;
  await taskStore.deleteTask(id);
}

const editingId = ref<number | null>(null);
const edit = reactive({ id: 0, title: "", task_date: "" });

function startEdit(t: any) {
  editingId.value = t.id;
  edit.id = t.id;
  edit.title = t.title;
  edit.task_date = t.task_date;
}

function cancelEdit() {
  editingId.value = null;
}

async function saveEdit() {
  await taskStore.updateTask(edit.id, {
    title: edit.title,
    task_date: edit.task_date,
  });
  editingId.value = null;
}

onMounted(async () => {
  await taskStore.loadTasks(planId);
});
</script>

<style scoped>
.list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.add-form {
  margin-top: 1rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.75rem;
  align-items: start;
}
@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
.primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
