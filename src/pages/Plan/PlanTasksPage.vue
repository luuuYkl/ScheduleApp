<template>
  <div class="page" style="max-width:760px;margin:0 auto;">
    <h1 class="mb-4">计划 #{{ planId }} 的任务</h1>

    <!-- 新增任务 -->
    <div class="card" style="margin-bottom:1rem;">
      <h3>新增任务</h3>
      <div class="row">
        <input v-model="form.title" type="text" placeholder="任务标题（如：第N天打卡）" />
        <input v-model="form.task_date" type="date" />
        <button class="primary" @click="addTask">添加</button>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="card">
      <h3>任务列表</h3>
      <ul v-if="list.length" class="list">
        <li v-for="t in list" :key="t.id" class="item">
          <div class="left">
            <input type="checkbox" :checked="t.status==='done'" @change="toggle(t.id)" />
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

    <div class="mt-2">
      <button @click="$router.push('/home')">返回首页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/store/user";
import { useTaskStore } from "@/store/tasks";

const route = useRoute();
const userStore = useUserStore();
const taskStore = useTaskStore();

const planId = Number(route.params.id);
const list = computed(() => taskStore.tasks.filter(x => x.plan_id === planId));

// 新增表单
const form = reactive({
  title: "",
  task_date: new Date().toISOString().slice(0, 10)
});

async function addTask() {
  if (!form.title) return alert("请填写标题");
  await taskStore.createTask({
    plan_id: planId,
    user_id: userStore.user?.id || 1,
    title: form.title,
    task_date: form.task_date
  });
  form.title = "";
  await taskStore.loadTasks(planId);
}

// 完成切换
async function toggle(id: number) {
  await taskStore.toggleTaskStatus(id);
}

// 删除
async function remove(id: number) {
  if (!confirm("确认删除该任务？")) return;
  await taskStore.deleteTask(id);
  await taskStore.loadTasks(planId);
}

// 行内编辑
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

/**
 * ✅ 修复：updateTask 需要两个参数 (id, payload)
 */
async function saveEdit() {
  await taskStore.updateTask(edit.id, {
    title: edit.title,
    task_date: edit.task_date
  });
  editingId.value = null;
  await taskStore.loadTasks(planId);
}

onMounted(async () => {
  await taskStore.loadTasks(planId);
});
</script>

<style scoped>
.row { display:flex; gap:.5rem; align-items:center; }
.list { list-style:none; padding:0; margin:0; display:grid; gap:.5rem; }
.item { display:flex; justify-content:space-between; align-items:center; padding:.5rem; border:1px solid var(--color-border); border-radius:8px; }
.left { display:flex; gap:.75rem; align-items:center; }
.info { display:flex; flex-direction:column; }
.ops { display:flex; gap:.5rem; }
.edit { display:flex; gap:.5rem; align-items:center; }
.text-gray { color: var(--color-gray); }
</style>
