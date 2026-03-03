<template>
  <a-form :model="form" @submit="handleSubmit" layout="vertical">
    <!-- 任务标题 -->
    <a-form-item field="title" hide-label>
      <a-input
        v-model="form.title"
        placeholder="完成任务、写代码、读书学习..."
        size="large"
        allow-clear
      />
    </a-form-item>

    <a-divider />

    <!-- 时间设置 -->
    <div class="form-section">
      <h3 class="section-label">📅 日期与时间</h3>

      <!-- 快捷日期选择 -->
      <a-space wrap :size="8" style="margin-bottom: 16px">
        <a-button
          v-for="quick in quickDates"
          :key="quick.value"
          :type="form.task_date === quick.value ? 'primary' : 'outline'"
          size="small"
          @click="form.task_date = quick.value"
        >
          {{ quick.label }}
        </a-button>
        <a-date-picker
          v-model="form.task_date"
          style="width: 140px"
        />
      </a-space>

      <!-- 时间段 -->
      <a-row :gutter="12" style="margin-bottom: 12px">
        <a-col :span="11">
          <a-form-item label="🕒 开始" hide-label>
            <a-time-picker
              v-model="form.start_time"
              format="HH:mm"
              placeholder="开始时间"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :span="2" style="display: flex; align-items: center; justify-content: center">
          <span style="color: var(--text-muted)">–</span>
        </a-col>
        <a-col :span="11">
          <a-form-item label="结束" hide-label>
            <a-time-picker
              v-model="form.end_time"
              format="HH:mm"
              placeholder="结束时间"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </div>

    <a-divider />

    <!-- 重复规则 -->
    <div class="form-section">
      <h3 class="section-label">🔁 重复</h3>
      <a-radio-group v-model="form.repeat_type" direction="horizontal">
        <a-radio
          v-for="option in repeatOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </a-radio>
      </a-radio-group>
    </div>

    <a-divider />

    <!-- 关联计划 -->
    <div class="form-section">
      <h3 class="section-label">🎯 关联计划</h3>
      <a-select 
        v-model="form.plan_id" 
        placeholder="选择关联的计划（可选）"
        allow-clear
        style="width: 100%"
      >
        <a-option 
          v-for="plan in availablePlans" 
          :key="plan.id" 
          :value="plan.id"
        >
          {{ plan.title }}
        </a-option>
      </a-select>
    </div>

    <a-divider />

    <!-- 可选信息（可折叠） -->
    <a-collapse :default-active-key="[]" :bordered="false">
      <a-collapse-item header="更多选项" key="optional">
        <!-- 备注 -->
        <a-form-item label="📝 备注">
          <a-textarea
            v-model="form.note"
            :max-length="200"
            show-word-limit
            :auto-size="{ minRows: 2, maxRows: 4 }"
            placeholder="添加任务详情或备注..."
          />
        </a-form-item>
      </a-collapse-item>
    </a-collapse>

    <!-- 主按钮 -->
    <div class="form-actions">
      <a-button
        type="primary"
        long
        size="large"
        html-type="submit"
        :loading="submitting"
      >
        {{ submitting ? "创建中..." : "创建任务" }}
      </a-button>
    </div>
  </a-form>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { Message } from "@arco-design/web-vue";
import { useTaskStore } from "@/store/tasks";
import { usePlanStore } from "@/store/plans";
import { useUserStore } from "@/store/user";

const emit = defineEmits<{ (e: "created"): void }>();
const taskStore = useTaskStore();
const planStore = usePlanStore();
const userStore = useUserStore();
const submitting = ref(false);

// 快捷日期
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

const quickDates = [
  { label: "今天", value: today },
  { label: "明天", value: tomorrow },
  { label: "下周", value: nextWeek },
];

// 重复选项
const repeatOptions = [
  { label: "不重复", value: "none" },
  { label: "每天", value: "daily" },
  { label: "每周", value: "weekly" },
  { label: "每月", value: "monthly" },
];

// 可用计划列表
const availablePlans = computed(() => {
  return planStore.plans || [];
});

const form = reactive({
  title: "",
  task_date: today,
  start_time: "",
  end_time: "",
  repeat_type: "none",
  plan_id: undefined as number | undefined,
  note: "",
});

// 辅助函数：将日期值转换为字符串格式
function formatDateValue(value: any): string {
  if (!value) return "";
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && typeof value.format === 'function') {
    return value.format('YYYY-MM-DD');
  }
  return String(value);
}

// 辅助函数：将时间值转换为字符串格式
function formatTimeValue(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && typeof value.format === 'function') {
    return value.format('HH:mm');
  }
  return String(value);
}

// 表单校验
function validate(): boolean {
  const missingFields: string[] = [];

  if (!form.title || form.title.trim().length === 0) {
    missingFields.push("任务标题");
  }

  const dateValue = formatDateValue(form.task_date);
  if (!dateValue) {
    missingFields.push("日期");
  }

  if (missingFields.length > 0) {
    const fieldNames = missingFields.join("、");
    Message.warning(`⚠️ 请完善必填信息：${fieldNames}`);
    return false;
  }

  return true;
}

async function handleSubmit() {
  console.log("[TaskForm] handleSubmit 触发");
  console.log("[TaskForm] 表单数据:", { ...form });
  
  if (!validate()) {
    console.log("[TaskForm] 验证失败");
    return;
  }

  console.log("[TaskForm] 用户状态:", userStore.user);
  
  if (!userStore.user?.id) {
    console.error("[TaskForm] 用户未登录，userStore.user:", userStore.user);
    Message.warning("⚠️ 请先登录");
    return;
  }

  submitting.value = true;
  try {
    const dateValue = formatDateValue(form.task_date);
    const startTimeValue = formatTimeValue(form.start_time);
    const endTimeValue = formatTimeValue(form.end_time);

    const taskPayload: any = {
      user_id: userStore.user.id,
      title: form.title.trim(),
      task_date: dateValue,
      start_time: startTimeValue,
      end_time: endTimeValue,
      repeat_type: form.repeat_type,
      note: form.note || undefined,
      status: "pending",
    };

    if (form.plan_id) {
      taskPayload.plan_id = form.plan_id;
    }

    console.log("[TaskForm] 准备创建任务，payload:", taskPayload);

    const createdTask = await taskStore.createTask(taskPayload);
    console.log("[TaskForm] 任务创建成功:", createdTask);

    Message.success("✅ 任务创建成功！");
    emit("created");

    // 重置表单
    form.title = "";
    form.task_date = today;
    form.start_time = "";
    form.end_time = "";
    form.repeat_type = "none";
    form.plan_id = undefined;
    form.note = "";
  } catch (e: any) {
    console.error("[TaskForm] 任务创建失败:", e);
    Message.error(e?.message || "创建失败，请重试");
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  // 加载计划列表供选择
  await planStore.loadPlans();
});
</script>

<style scoped>
.form-section {
  padding: 0 4px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 12px 0;
}

.form-actions {
  padding: 16px 0;
  background: var(--bg-main);
}

/* 自定义 Arco 样式 */
:deep(.arco-form-item) {
  margin-bottom: 16px;
}

:deep(.arco-divider) {
  margin: 12px 0;
}

:deep(.arco-collapse-item-content) {
  padding: 12px 0;
}
</style>