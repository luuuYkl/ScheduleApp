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

    <!-- 日期范围 -->
    <div class="form-group">
      <label for="startDate">开始日期 *</label>
      <div class="date-range">
        <input
          id="startDate"
          v-model="form.start_date"
          type="date"
          required
        />
        <span class="date-separator">-</span>
        <input
          id="endDate"
          v-model="form.end_date"
          type="date"
          required
        />
      </div>
      <div class="date-presets">
        <button
          v-for="preset in datePresets"
          :key="preset.label"
          type="button"
          class="date-preset-btn"
          @click="setDatePreset(preset.value)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <!-- 优先级 -->
    <div class="form-group">
      <label>优先级</label>
      <div class="priority-chips">
        <button
          v-for="p in priorityOptions"
          :key="p.value"
          :class="['priority-chip', { active: form.priority === p.value }]"
          :style="{ '--priority-color': p.color }"
          type="button"
          @click="form.priority = p.value"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- 标签 -->
    <div class="form-group">
      <label>标签</label>
      <div class="tag-chips">
        <button
          v-for="tag in tagPresets"
          :key="tag"
          :class="['tag-chip', { active: form.tags.includes(tag) }]"
          type="button"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- 计划选择 -->
    <div class="form-group">
      <label for="planSelect">关联计划</label>
      <select id="planSelect" v-model="form.plan_id">
        <option :value="0">不关联</option>
        <option
          v-for="plan in planStore.plans"
          :key="plan.id"
          :value="plan.id"
        >
          {{ plan.title }}
        </option>
      </select>
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
import { ref, reactive, computed, onMounted } from "vue";
import { useTaskStore } from "@/store/tasks";
import { useUserStore } from "@/store/user";
import { usePlanStore } from "@/store/plans";

const emit = defineEmits<{
  (e: "created", task: any): void;
  (e: "update", form: any): void;
}>();

const taskStore = useTaskStore();
const userStore = useUserStore();
const planStore = usePlanStore();

const loading = ref(false);

// 优先级选项
const priorityOptions = [
  { value: 'high' as const, label: '高', color: '#ef4444' },
  { value: 'medium' as const, label: '中', color: '#f59e0b' },
  { value: 'low' as const, label: '低', color: '#6b7280' },
];

// 标签预设
const tagPresets = ['工作', '学习', '运动', '生活', '其他'];

// 快捷日期预设
const datePresets = computed(() => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return [
    { label: '今天', value: today.toISOString().slice(0, 10) },
    { label: '明天', value: tomorrow.toISOString().slice(0, 10) },
    { label: '本周', value: weekStart.toISOString().slice(0, 10) },
  ];
});

const form = reactive({
  title: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10),
  start_time: "",
  end_time: "",
  priority: "medium" as "high" | "medium" | "low",
  tags: [] as string[],
  plan_id: 0,
  note: "",
  repeat_type: "none",
  repeat_end_date: "",
});

// 切换标签
function toggleTag(tag: string) {
  const index = form.tags.indexOf(tag);
  if (index > -1) {
    form.tags.splice(index, 1);
  } else {
    form.tags.push(tag);
  }
}

// 设置快捷日期
function setDatePreset(date: string) {
  form.start_date = date;
  form.end_date = date;
}

// 计算属性用于预览
const previewData = computed(() => ({
  title: form.title || "任务标题",
  priority: form.priority,
  priorityLabel: priorityOptions.find(p => p.value === form.priority)?.label,
  priorityColor: priorityOptions.find(p => p.value === form.priority)?.color,
  date: form.start_date,
  startDate: form.start_date,
  endDate: form.end_date,
  startTime: form.start_time,
  endTime: form.end_time,
  tags: form.tags,
  note: form.note,
  repeatType: form.repeat_type,
  plan: planStore.plans.find(p => p.id === form.plan_id),
}));

async function handleSubmit() {
  if (!form.title.trim()) {
    alert("请输入任务标题");
    return;
  }

  // 验证日期范围
  if (form.start_date > form.end_date) {
    alert("开始日期不能晚于结束日期");
    return;
  }

  loading.value = true;
  
  try {
    const user = userStore.user;
    // 使用表单选择的计划ID，如果没有选择则使用默认第一个计划
    const planId = form.plan_id || 0;
    const plans = planStore.plans;
    const actualPlanId = planId > 0 ? planId : (plans.length > 0 ? plans[0].id : 1);

    const taskData = {
      plan_id: actualPlanId,
      user_id: user?.id || 1,
      title: form.title.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      priority: form.priority,
      tags: form.tags,
      note: form.note.trim() || undefined,
      repeat_type: form.repeat_type as any,
      repeat_end_date: form.repeat_type !== "none" ? form.repeat_end_date : undefined,
    };

    const newTask = await taskStore.createTask(taskData);
    
    // 重置表单
    form.title = "";
    form.start_date = new Date().toISOString().slice(0, 10);
    form.end_date = new Date().toISOString().slice(0, 10);
    form.start_time = "";
    form.end_time = "";
    form.priority = "medium";
    form.tags = [];
    form.plan_id = 0;
    form.note = "";
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
    form.start_date = new Date().toISOString().slice(0, 10);
    form.end_date = new Date().toISOString().slice(0, 10);
    form.start_time = "";
    form.end_time = "";
    form.priority = "medium";
    form.tags = [];
    form.plan_id = 0;
    form.note = "";
    form.repeat_type = "none";
    form.repeat_end_date = "";
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

/* 日期范围 */
.date-range {
  display: flex;
  gap: var(--space-2, 8px);
  align-items: center;
}

.date-separator {
  color: var(--text-secondary, #666);
  font-size: 16px;
}

.date-presets {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-2, 8px);
}

.date-preset-btn {
  padding: var(--space-1, 4px) var(--space-3, 12px);
  background: var(--bg-elevated, #f5f5f5);
  border: 1px solid var(--border-subtle, #e0e0e0);
  border-radius: var(--radius-sm, 6px);
  font-size: 12px;
  color: var(--text-secondary, #666);
  cursor: pointer;
  transition: all 0.2s;
}

.date-preset-btn:hover {
  background: var(--primary, #3B82F6);
  color: white;
  border-color: var(--primary, #3B82F6);
}

/* 优先级芯片 */
.priority-chips {
  display: flex;
  gap: var(--space-2, 8px);
}

.priority-chip {
  padding: var(--space-2, 8px) var(--space-3, 12px);
  border: 1px solid var(--border-subtle, #e0e0e0);
  background: var(--bg-main, #fff);
  border-radius: var(--radius-sm, 6px);
  font-size: 13px;
  color: var(--text-secondary, #666);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.priority-chip:hover {
  border-color: var(--border-main, #ccc);
  background: var(--bg-elevated, #f5f5f5);
}

.priority-chip.active {
  border-color: var(--priority-color);
  background: var(--priority-color);
  color: white;
}

/* 标签芯片 */
.tag-chips {
  display: flex;
  gap: var(--space-2, 8px);
  flex-wrap: wrap;
}

.tag-chip {
  padding: var(--space-1, 4px) var(--space-3, 12px);
  border: 1px solid var(--border-subtle, #e0e0e0);
  background: var(--bg-main, #fff);
  border-radius: var(--radius-full, 9999px);
  font-size: 12px;
  color: var(--text-secondary, #666);
  cursor: pointer;
  transition: all 0.2s;
}

.tag-chip:hover {
  border-color: var(--primary, #3B82F6);
  color: var(--text-main, #333);
}

.tag-chip.active {
  background: var(--primary, #3B82F6);
  border-color: var(--primary, #3B82F6);
  color: white;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>