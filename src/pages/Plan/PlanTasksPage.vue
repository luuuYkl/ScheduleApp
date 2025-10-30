<template>
  <div class="page">
    <h1 class="mb-4">计划 #{{ planId }} 的任务</h1>

    <!-- 新增:任务添加表单 -->
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
            :min="planStartDate"
            :max="planEndDate"
            required
          />
          <input
            v-model.trim="form.note"
            type="text"
            placeholder="描述 (可选)"
          />
        </div>
        <div class="form-row repeat-row">
          <div class="field">
            <label>重复类型</label>
            <select v-model="form.repeat_type">
              <option value="none">不重复</option>
              <option value="daily">每日重复</option>
              <option value="monthly">每月重复</option>
            </select>
          </div>
          <div class="field" v-if="form.repeat_type !== 'none'">
            <label>重复结束日期</label>
            <input 
              v-model="form.repeat_end_date" 
              type="date"
              :min="form.task_date"
              :max="planEndDate"
              required
            />
          </div>
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
              <input 
                type="checkbox" 
                :checked="t._isGrouped ? t._displayStatus === 'done' : t.status === 'done'" 
                @change="toggle(t)" 
              />
            <div class="info">
              <strong>{{ t.title }}</strong>
                <span v-if="t._isGrouped" class="repeat-badge">
                {{ t.repeat_type === 'daily' ? '📅 每日' : '📆 每月' }}
                  ({{ t._doneCount }}/{{ t._totalCount }})
              </span>
                <small v-if="t._isGrouped">{{ t._dateRange }}</small>
                <small v-else>{{ t.task_date }} · {{ t.status }}</small>
              <small v-if="t.note" class="note">{{ t.note }}</small>
            </div>
          </div>

          <div class="ops" v-if="editingId !== t.id">
            <button class="secondary" @click="startEdit(t)">编辑</button>
              <button class="danger" @click="remove(t)">删除</button>
          </div>

          <!-- 行内编辑态 -->
          <div class="edit" v-else>
            <input v-model="edit.title" type="text" placeholder="标题" />
            <input 
              v-model="edit.task_date" 
              type="date"
              :min="planStartDate"
              :max="planEndDate"
            />
            <input v-model="edit.note" type="text" placeholder="描述(可选)" />
            <select v-model="edit.repeat_type">
              <option value="none">不重复</option>
              <option value="daily">每日</option>
              <option value="monthly">每月</option>
            </select>
            <input 
              v-if="edit.repeat_type !== 'none'" 
              v-model="edit.repeat_end_date" 
              type="date"
              :min="edit.task_date"
              :max="planEndDate"
              placeholder="结束日期"
            />
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
import { useUserStore } from "@/store/user";
import { usePlanStore } from "@/store/plans";
import { generateRepeatTaskPayloads } from "@/services/repeat-task";

const route = useRoute();
const taskStore = useTaskStore();
const userStore = useUserStore();
const planStore = usePlanStore();
const planId = Number(route.params.id);

// 对任务进行分组，重复任务只显示一条
const list = computed(() => {
  const tasks = taskStore.tasks.filter(x => x.plan_id === planId);
  const grouped = new Map<string, any>();
  
  for (const task of tasks) {
    // 如果是重复任务，生成分组键
    if (task.repeat_type && task.repeat_type !== 'none') {
      // 分组键：标题 + 重复类型 + 备注（防止同名任务误合并）
      const groupKey = `${task.title}_${task.repeat_type}_${task.note || ''}`;
      
      if (!grouped.has(groupKey)) {
        // 第一次遇到这个分组，保存任务信息
        const relatedTasks = tasks.filter(t => 
          t.title === task.title && 
          t.repeat_type === task.repeat_type &&
          (t.note || '') === (task.note || '')
        );
        
        // 找到最早和最晚的日期
        const dates = relatedTasks.map(t => t.task_date).sort();
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        // 计算完成状态：所有子任务都完成才算完成
        const allDone = relatedTasks.every(t => t.status === 'done');
        const someDone = relatedTasks.some(t => t.status === 'done');
        const doneCount = relatedTasks.filter(t => t.status === 'done').length;
        
        grouped.set(groupKey, {
          ...task,
          task_date: startDate, // 显示开始日期
          _isGrouped: true,
          _dateRange: `${startDate} ~ ${endDate}`,
          _totalCount: relatedTasks.length,
          _doneCount: doneCount,
          _groupedIds: relatedTasks.map(t => t.id),
          _displayStatus: allDone ? 'done' : someDone ? 'partial' : 'pending'
        });
      }
    } else {
      // 非重复任务直接添加
      grouped.set(`single_${task.id}`, task);
    }
  }
  
  return Array.from(grouped.values()).sort((a, b) => 
    a.task_date.localeCompare(b.task_date)
  );
});

// 获取当前计划信息
const currentPlan = computed(() => planStore.plans.find((p: any) => p.id === planId));
const planStartDate = computed(() => currentPlan.value?.start_date || "");
const planEndDate = computed(() => currentPlan.value?.end_date || "");

const form = reactive({
  title: "",
  task_date: new Date().toISOString().slice(0, 10),
  note: "",
  repeat_type: "none" as "none" | "daily" | "monthly",
  repeat_end_date: ""
});

const submitting = ref(false);

async function addTask() {
  if (!form.title) return alert("请填写任务标题");
  if (!form.task_date) return alert("请选择任务日期");
  
  // 验证日期在计划范围内
  if (planStartDate.value && form.task_date < planStartDate.value) {
    return alert(`任务日期不能早于计划开始日期（${planStartDate.value}）`);
  }
  if (planEndDate.value && form.task_date > planEndDate.value) {
    return alert(`任务日期不能晚于计划结束日期（${planEndDate.value}）`);
  }
  
  if (form.repeat_type !== "none" && !form.repeat_end_date) {
    return alert("请选择重复结束日期");
  }
  
  // 验证重复结束日期在计划范围内
  if (form.repeat_type !== "none" && planEndDate.value && form.repeat_end_date > planEndDate.value) {
    return alert(`重复结束日期不能晚于计划结束日期（${planEndDate.value}）`);
  }

  const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id") || 0);
  if (!userId) return alert("请先登录");

  submitting.value = true;
  try {
    // 生成重复任务的 payload 数组
    const basePayload = {
      plan_id: planId,
      user_id: userId,
      title: form.title,
      task_date: form.task_date,
      note: form.note || undefined,
      repeat_type: form.repeat_type,
      repeat_end_date: form.repeat_end_date || undefined,
    };

    const payloads = generateRepeatTaskPayloads(basePayload);
    
    // 批量创建任务
    for (const payload of payloads) {
      await taskStore.createTask(payload);
    }
    
    // 重置表单
    form.title = "";
    form.task_date = new Date().toISOString().slice(0, 10);
    form.note = "";
    form.repeat_type = "none";
    form.repeat_end_date = "";
    
    // 刷新任务列表
    await taskStore.loadTasks(planId);
  } catch (e: any) {
    alert(e?.message || "添加失败，请重试");
  } finally {
    submitting.value = false;
  }
}

async function toggle(task: any) {
  // 如果是分组任务，切换所有关联任务的状态
  if (task._isGrouped && task._groupedIds) {
    const newStatus = task._displayStatus === 'done' ? 'pending' : 'done';
    for (const taskId of task._groupedIds) {
      await taskStore.updateTask(taskId, { status: newStatus });
    }
  } else {
    // 单个任务直接切换
    await taskStore.toggleTaskStatus(task.id);
  }
  // 刷新列表
  await taskStore.loadTasks(planId);
}

async function remove(task: any) {
  const confirmMsg = task._isGrouped 
    ? `确认删除该重复任务的所有 ${task._totalCount} 条记录？` 
    : "确认删除该任务？";
  if (!confirm(confirmMsg)) return;
  
  // 如果是分组任务，删除所有关联任务
  if (task._isGrouped && task._groupedIds) {
    for (const taskId of task._groupedIds) {
      await taskStore.deleteTask(taskId);
    }
  } else {
    await taskStore.deleteTask(task.id);
  }
  
  // 刷新列表
  await taskStore.loadTasks(planId);
}

const editingId = ref<number | null>(null);
const edit = reactive({ 
  id: 0, 
  title: "", 
  task_date: "", 
  note: "",
  repeat_type: "none" as "none" | "daily" | "monthly",
  repeat_end_date: ""
});

function startEdit(t: any) {
  editingId.value = t.id;
  edit.id = t.id;
  edit.title = t.title;
  edit.task_date = t.task_date;
  edit.note = t.note || "";
  edit.repeat_type = t.repeat_type || "none";
  edit.repeat_end_date = t.repeat_end_date || "";
}

function cancelEdit() {
  editingId.value = null;
}

async function saveEdit() {
  await taskStore.updateTask(edit.id, {
    title: edit.title,
    task_date: edit.task_date,
    note: edit.note || undefined,
    repeat_type: edit.repeat_type,
    repeat_end_date: edit.repeat_end_date || undefined,
  });
  editingId.value = null;
}

onMounted(async () => {
  await Promise.all([
    taskStore.loadTasks(planId),
    planStore.loadPlans()
  ]);
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
  grid-template-columns: 1fr auto 1fr auto;
  gap: 0.75rem;
  align-items: start;
}
.repeat-row {
  grid-template-columns: 1fr 1fr auto;
  margin-top: 0.75rem;
  align-items: end;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray);
}
.repeat-badge {
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  margin-left: 0.5rem;
  background: var(--color-primary-light, #eaf2fe);
  color: var(--color-primary);
  border-radius: 12px;
  font-weight: 600;
}
.edit {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}
.edit input, .edit select {
  flex: 1;
  min-width: 120px;
}
@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  .repeat-row {
    grid-template-columns: 1fr;
  }
  .edit {
    flex-direction: column;
  }
  .edit input, .edit select {
    width: 100%;
  }
}
.note { color: var(--color-gray); display:block; margin-top:2px; }
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
