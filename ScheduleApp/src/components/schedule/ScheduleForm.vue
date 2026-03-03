<template>
  <a-form :model="form" @submit="handleSubmit" layout="vertical">
    <!-- 日程标题 -->
    <a-form-item field="title" hide-label>
      <a-input
        v-model="form.title"
        placeholder="项目评审会议、团队聚餐、健身打卡..."
        size="large"
        allow-clear
      />
    </a-form-item>

    <a-divider />

    <!-- 时间设置 -->
    <div class="form-section">
      <h3 class="section-label">📅 时间</h3>

      <!-- 快捷日期选择 -->
      <a-space wrap :size="8" style="margin-bottom: 16px">
        <a-button
          v-for="quick in quickDates"
          :key="quick.value"
          :type="form.date === quick.value ? 'primary' : 'outline'"
          size="small"
          @click="form.date = quick.value"
        >
          {{ quick.label }}
        </a-button>
        <a-date-picker
          v-model="form.date"
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

      <!-- 全天事件 -->
      <a-checkbox v-model="isAllDay" @change="handleAllDayToggle">
        全天事件
      </a-checkbox>
    </div>

    <a-divider />

    <!-- 提醒方式 -->
    <div class="form-section">
      <h3 class="section-label">🔔 提醒</h3>
      <a-radio-group v-model="form.reminder" direction="vertical">
        <a-radio
          v-for="option in reminderOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </a-radio>
      </a-radio-group>
      <a-alert type="info" style="margin-top: 12px">
        💡 提示：大多数人习惯在事件前 10 分钟设置提醒
      </a-alert>
    </div>

    <a-divider />

    <!-- 可选信息（可折叠） -->
    <a-collapse :default-active-key="['optional']" :bordered="false">
      <a-collapse-item header="更多选项" key="optional">
        <!-- 重复规则 -->
        <a-form-item label="🔁 重复">
          <a-select v-model="form.repeat" style="width: 100%">
            <a-option value="none">不重复</a-option>
            <a-option value="daily">每天</a-option>
            <a-option value="weekly">每周</a-option>
            <a-option value="monthly">每月</a-option>
          </a-select>
        </a-form-item>

        <!-- 地点 -->
        <a-form-item label="📍 地点">
          <a-input
            v-model="form.location"
            placeholder="会议室 301、腾讯会议、咖啡厅..."
            allow-clear
          />
        </a-form-item>

        <!-- 备注 -->
        <a-form-item label="📝 备注">
          <a-textarea
            v-model="form.description"
            :max-length="100"
            show-word-limit
            :auto-size="{ minRows: 2, maxRows: 4 }"
            placeholder="可选，一句话就好"
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
        {{ submitting ? "创建中..." : "创建日程" }}
      </a-button>
    </div>
  </a-form>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { Message } from "@arco-design/web-vue";
import { useScheduleStore } from "@/store/schedules";
import { useUserStore } from "@/store/user";

const emit = defineEmits<{ (e: "created"): void }>();
const scheduleStore = useScheduleStore();
const userStore = useUserStore();
const submitting = ref(false);
const isAllDay = ref(false);

// 快捷日期
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

const quickDates = [
  { label: "今天", value: today },
  { label: "明天", value: tomorrow },
  { label: "下周", value: nextWeek },
];

// 提醒选项
const reminderOptions = [
  { label: "事件开始时", value: "at_time" },
  { label: "提前 10 分钟", value: "before_10min" },
  { label: "提前 1 小时", value: "before_1hour" },
  { label: "不提醒", value: "none" },
];

const form = reactive({
  title: "",
  date: today,
  start_time: "",
  end_time: "",
  reminder: "before_10min",
  repeat: "none",
  location: "",
  description: "",
});

function handleAllDayToggle() {
  if (isAllDay.value) {
    form.start_time = "";
    form.end_time = "";
  }
}

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

// 表单校验 - 带有友好的必填提醒
function validate(): boolean {
  const missingFields: string[] = [];

  // 标题验证
  if (!form.title || form.title.trim().length === 0) {
    missingFields.push("日程标题");
  }

  // 日期验证
  const dateValue = formatDateValue(form.date);
  if (!dateValue) {
    missingFields.push("日期");
  }

  // 显示必填项提醒
  if (missingFields.length > 0) {
    const fieldNames = missingFields.join("、");
    Message.warning(`⚠️ 请完善必填信息：${fieldNames}`);
    return false;
  }

  return true;
}

async function handleSubmit() {
  console.log("[ScheduleForm] handleSubmit 触发");
  console.log("[ScheduleForm] 表单数据:", { ...form });
  
  // 表单校验
  if (!validate()) {
    console.log("[ScheduleForm] 验证失败");
    return;
  }

  // 检查用户登录状态
  console.log("[ScheduleForm] 用户状态:", userStore.user);
  
  if (!userStore.user?.id) {
    console.error("[ScheduleForm] 用户未登录，userStore.user:", userStore.user);
    Message.warning("⚠️ 请先登录");
    return;
  }

  submitting.value = true;
  try {
    // 处理日期和时间格式（Arco Design 的 date-picker/time-picker 返回 Dayjs 对象）
    const dateValue = formatDateValue(form.date);
    const startTimeValue = formatTimeValue(form.start_time);
    const endTimeValue = formatTimeValue(form.end_time);

    const payload = {
      user_id: userStore.user.id,
      title: form.title.trim(),
      date: dateValue,
      start_time: startTimeValue,
      end_time: endTimeValue,
      description: form.description || undefined,
    };
    
    console.log("[ScheduleForm] 准备创建日程，payload:", payload);

    const createdSchedule = await scheduleStore.create(payload);
    console.log("[ScheduleForm] 日程创建成功:", createdSchedule);

    Message.success("✅ 日程创建成功！");
    emit("created");

    // 重置表单
    form.title = "";
    form.date = today;
    form.start_time = "";
    form.end_time = "";
    form.reminder = "before_10min";
    form.repeat = "none";
    form.location = "";
    form.description = "";
    isAllDay.value = false;
  } catch (e: any) {
    console.error("[ScheduleForm] 日程创建失败:", e);
    Message.error(e?.message || "创建失败，请重试");
  } finally {
    submitting.value = false;
  }
}
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