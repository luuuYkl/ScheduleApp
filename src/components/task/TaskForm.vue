<template>
  <form class="task-form" @submit.prevent="handleSubmit">
    <!-- 任务标题 -->
    <div class="form-group">
      <label for="title">任务标题 *</label>
      <input
        id="title"
        v-model="form.title"
        type="text"
        placeholder="输入任务标题"
        required
      />
    </div>

    <!-- 任务日期 -->
    <div class="form-group">
      <label for="taskDate">任务日期 *</label>
      <input
        id="taskDate"
        v-model="form.task_date"
        type="date"
        required
      />
    </div>

    <!-- 时间范围 -->
    <div class="form-row">
      <div class="form-group">
        <label for="startTime">开始时间</label>
        <input
          id="startTime"
          v-model="form.start_time"
          type="time"
        />
      </div>
      <div class="form-group">
        <label for="endTime">结束时间</label>
        <input
          id="endTime"
          v-model="form.end_time"
          type="time"
        />
      </div>
    </div>

    <!-- 备注 -->
    <div class="form-group">
      <label for="note">备注</label>
      <textarea
        id="note"
        v-model="form.note"
        placeholder="添加任务备注（可选）"
        rows="3"
      ></textarea>
    </div>

    <!-- 重复类型 -->
    <div class="form-group">
      <label for="repeatType">重复</label>
      <select id="repeatType" v-model="form.repeat_type">
        <option value="none">不重复</option>
        <option value="daily">每天</option>
        <option value="weekly">每周</option>
        <option value="monthly">每月</option>
      </select>
    </div>

    <!-- 重复结束日期 -->
    <div class="form-group" v-if="form.repeat_type !== 'none'">
      <label for="repeatEndDate">重复结束日期</label>
      <input
        id="repeatEndDate"
        v-model="form.repeat_end_date"
        type="date"
      />
    </div>

    <!-- 提交按钮 -->
    <div class="form-actions">
      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? '创建中...' : '创建任务' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useTaskStore } from "@/store/tasks";
import { useUserStore } from "@/store/user";
import { usePlanStore } from "@/store/plans";

const emit = defineEmits<{
  (e: "created", task: any): void;
}>();

const taskStore = useTaskStore();
const userStore = useUserStore();
const planStore = usePlanStore();

const loading = ref(false);

const form = reactive({
  title: "",
  task_date: new Date().toISOString().slice(0, 10),
  start_time: "",
  end_time: "",
  note: "",
  repeat_type: "none",
  repeat_end_date: "",
});

onMounted(() => {
  // 设置默认日期为今天
  form.task_date = new Date().toISOString().slice(0, 10);
});

async function handleSubmit() {
  if (!form.title.trim()) {
    alert("请输入任务标题");
    return;
  }

  loading.value = true;
  
  try {
    const user = userStore.user;
    const plans = planStore.plans;
    const defaultPlanId = plans.length > 0 ? plans[0].id : 1;

    const taskData = {
      plan_id: defaultPlanId,
      user_id: user?.id || 1,
      title: form.title.trim(),
      task_date: form.task_date,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      note: form.note.trim() || undefined,
      repeat_type: form.repeat_type as any,
      repeat_end_date: form.repeat_type !== "none" ? form.repeat_end_date : undefined,
    };

    const newTask = await taskStore.createTask(taskData);
    
    // 重置表单
    form.title = "";
    form.note = "";
    form.start_time = "";
    form.end_time = "";
    form.repeat_type = "none";
    form.repeat_end_date = "";
    
    emit("created", newTask);
  } catch (error) {
    console.error("创建任务失败:", error);
    alert("创建任务失败，请重试");
  } finally {
    loading.value = false;
  }
}

// 暴露重置方法供父组件调用
defineExpose({
  reset: () => {
    form.title = "";
    form.note = "";
    form.start_time = "";
    form.end_time = "";
    form.repeat_type = "none";
    form.repeat_end_date = "";
    form.task_date = new Date().toISOString().slice(0, 10);
  }
});
</script>

<style scoped>
.task-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main, #333);
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: var(--space-3, 12px);
  border: 1px solid var(--border-subtle, #e0e0e0);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  background: var(--bg-main, #fff);
  color: var(--text-main, #333);
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary, #3B82F6);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4, 16px);
}

.form-actions {
  margin-top: var(--space-4, 16px);
}

.btn-primary {
  width: 100%;
  padding: var(--space-3, 12px) var(--space-4, 16px);
  background: var(--primary, #3B82F6);
  color: white;
  border: none;
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark, #2563EB);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>