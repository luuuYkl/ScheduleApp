<!-- src/pages/User/NotificationSettings.vue -->
<!-- 用户通知设置页面 -->

<template>
  <div class="notification-settings">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">通知设置</h1>
      <p class="page-subtitle">管理您的提醒偏好和通知选项</p>
    </div>

    <!-- 通知总开关 -->
    <div class="settings-section">
      <div class="section-header">
        <h2>全局设置</h2>
      </div>

      <div class="setting-item">
        <div class="setting-content">
          <h3>启用通知提醒</h3>
          <p>开启后将接收任务提醒、进度通知等系统消息</p>
        </div>
        <Switch
          v-model="notificationsEnabled"
          @update:modelValue="handleNotificationsToggle"
          class="toggle-switch"
        />
      </div>
    </div>

    <!-- 浏览器权限状态 -->
    <div v-if="notificationsEnabled" class="settings-section">
      <div class="section-header">
        <h2>权限状态</h2>
      </div>

      <div class="permission-status">
        <div class="status-item">
          <span class="status-label">浏览器通知权限:</span>
          <span :class="['status-value', permissionStatusClass]">
            {{ permissionStatusText }}
          </span>
        </div>

        <Button
          v-if="!notificationService.hasPermission()"
          @click="requestPermission"
          variant="primary"
          size="small"
          class="request-permission-btn"
        >
          请求通知权限
        </Button>
      </div>
    </div>

    <!-- 提醒类型设置 -->
    <div v-if="notificationsEnabled" class="settings-section">
      <div class="section-header">
        <h2>提醒类型</h2>
        <p>选择您希望接收的提醒类型</p>
      </div>

      <div class="setting-group">
        <div
          v-for="reminder in reminderTypes"
          :key="reminder.key"
          class="setting-item"
        >
          <div class="setting-content">
            <h3>{{ reminder.title }}</h3>
            <p>{{ reminder.description }}</p>
          </div>
          <Switch
            v-model="reminder.enabled"
            @update:modelValue="
              (val: boolean) => handleReminderToggle(reminder.key, val)
            "
            :disabled="!notificationsEnabled"
            class="toggle-switch"
          />
        </div>
      </div>
    </div>

    <!-- 活跃时间段设置 -->
    <div v-if="notificationsEnabled" class="settings-section">
      <div class="section-header">
        <h2>活跃时间段</h2>
        <p>设置您通常活跃的时间段，系统将在这些时间内发送提醒</p>
      </div>

      <div class="time-settings-grid">
        <div class="time-setting-item">
          <label>上午</label>
          <div class="time-input-group">
            <input
              v-model="activeTimes.morningStart"
              type="time"
              @change="saveActiveTimes"
              class="time-input"
            />
            <span>-</span>
            <input
              v-model="activeTimes.morningEnd"
              type="time"
              @change="saveActiveTimes"
              class="time-input"
            />
          </div>
        </div>

        <div class="time-setting-item">
          <label>下午</label>
          <div class="time-input-group">
            <input
              v-model="activeTimes.afternoonStart"
              type="time"
              @change="saveActiveTimes"
              class="time-input"
            />
            <span>-</span>
            <input
              v-model="activeTimes.afternoonEnd"
              type="time"
              @change="saveActiveTimes"
              class="time-input"
            />
          </div>
        </div>

        <div class="time-setting-item">
          <label>晚上</label>
          <div class="time-input-group">
            <input
              v-model="activeTimes.eveningStart"
              type="time"
              @change="saveActiveTimes"
              class="time-input"
            />
            <span>-</span>
            <input
              v-model="activeTimes.eveningEnd"
              type="time"
              @change="saveActiveTimes"
              class="time-input"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 提前提醒设置 -->
    <div v-if="notificationsEnabled" class="settings-section">
      <div class="section-header">
        <h2>提前提醒</h2>
        <p>设置不同类型提醒的提前时间</p>
      </div>

      <div class="advance-settings">
        <div class="setting-item">
          <div class="setting-content">
            <h3>任务到期提醒</h3>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  v-model="advanceNotice.taskDueHours"
                  value="1"
                  @change="saveAdvanceNotice"
                />
                1小时前
              </label>
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  v-model="advanceNotice.taskDueHours"
                  value="24"
                  @change="saveAdvanceNotice"
                />
                1天前
              </label>
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  v-model="advanceNotice.taskDueHours"
                  value="168"
                  @change="saveAdvanceNotice"
                />
                1周前
              </label>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-content">
            <h3>每日签到提醒</h3>
            <input
              v-model="advanceNotice.dailyCheckin"
              type="time"
              @change="saveAdvanceNotice"
              class="time-input single"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-content">
            <h3>每周回顾提醒</h3>
            <select
              v-model="advanceNotice.weeklyReviewDay"
              @change="saveAdvanceNotice"
              class="day-select"
            >
              <option value="Sunday">周日</option>
              <option value="Monday">周一</option>
              <option value="Tuesday">周二</option>
              <option value="Wednesday">周三</option>
              <option value="Thursday">周四</option>
              <option value="Friday">周五</option>
              <option value="Saturday">周六</option>
            </select>
            <input
              v-model="advanceNotice.weeklyReviewTime"
              type="time"
              @change="saveAdvanceNotice"
              class="time-input single"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-content">
            <h3>计划进度提醒</h3>
            <div class="slider-container">
              <input
                v-model.number="advanceNotice.planProgress"
                type="range"
                min="50"
                max="100"
                step="5"
                @change="saveAdvanceNotice"
                class="progress-slider"
              />
              <span class="slider-value"
                >{{ advanceNotice.planProgress }}%</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 当前提醒预览 -->
    <div v-if="notificationsEnabled" class="settings-section">
      <div class="section-header">
        <h2>当前提醒</h2>
        <p>系统当前计划发送的提醒数量</p>
      </div>

      <div class="reminder-summary">
        <div class="summary-item">
          <span class="summary-label">待发送提醒:</span>
          <span class="summary-value">{{ pendingRemindersCount }}</span>
        </div>
        <Button
          @click="clearAllReminders"
          variant="outline"
          size="small"
          :disabled="pendingRemindersCount === 0"
        >
          清除所有提醒
        </Button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions-footer">
      <Button @click="saveAllSettings" variant="primary" :loading="saving">
        保存设置
      </Button>
      <Button @click="resetToDefaults" variant="outline"> 恢复默认 </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useNotification } from "@/services/notification";
import {
  useReminders,
  DEFAULT_ACTIVE_TIMES,
  DEFAULT_ADVANCE_NOTICE,
} from "@/services/reminders";
import Switch from "@/components/common/Switch.vue";
import Button from "@/components/common/Button.vue";

// 服务实例
const notificationService = useNotification();
const reminderService = useReminders();

// 状态管理
const notificationsEnabled = ref(false);
const saving = ref(false);
const pendingRemindersCount = ref(0);

// 提醒类型配置
const reminderTypes = ref([
  {
    key: "task_due",
    title: "任务到期提醒",
    description: "任务即将到期时的提醒",
    enabled: true,
  },
  {
    key: "daily_checkin",
    title: "每日签到提醒",
    description: "每天固定时间提醒签到",
    enabled: true,
  },
  {
    key: "weekly_review",
    title: "每周回顾提醒",
    description: "每周固定时间提醒回顾",
    enabled: true,
  },
  {
    key: "plan_progress",
    title: "计划进度提醒",
    description: "计划达到设定进度时提醒",
    enabled: true,
  },
]);

// 活跃时间段配置
const activeTimes = ref({ ...DEFAULT_ACTIVE_TIMES });

// 提前提醒配置
const advanceNotice = ref({
  taskDueHours: ["1", "24"], // 1小时和1天前
  dailyCheckin: "20:00",
  weeklyReviewDay: "Sunday",
  weeklyReviewTime: "20:00",
  planProgress: 80,
});

// 计算属性
const permissionStatusText = computed(() => {
  if (!notificationsEnabled.value) return "未启用";
  if (notificationService.hasPermission()) return "已授权";
  return "未授权";
});

const permissionStatusClass = computed(() => {
  if (!notificationsEnabled.value) return "status-disabled";
  if (notificationService.hasPermission()) return "status-granted";
  return "status-denied";
});

// 生命周期钩子
onMounted(() => {
  loadSettings();
  updatePendingRemindersCount();
});

// 方法实现
const loadSettings = () => {
  // 从 localStorage 加载设置
  const savedSettings = localStorage.getItem("notification_settings");
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    notificationsEnabled.value = settings.enabled || false;
    reminderTypes.value = settings.reminderTypes || reminderTypes.value;
    activeTimes.value = settings.activeTimes || DEFAULT_ACTIVE_TIMES;
    advanceNotice.value = settings.advanceNotice || advanceNotice.value;
  }
};

const saveSettings = () => {
  const settings = {
    enabled: notificationsEnabled.value,
    reminderTypes: reminderTypes.value,
    activeTimes: activeTimes.value,
    advanceNotice: advanceNotice.value,
  };
  localStorage.setItem("notification_settings", JSON.stringify(settings));
};

const handleNotificationsToggle = async (enabled: boolean) => {
  notificationsEnabled.value = enabled;

  if (enabled && !notificationService.hasPermission()) {
    await requestPermission();
  }

  saveSettings();
};

const requestPermission = async () => {
  try {
    const granted = await notificationService.requestPermission();
    if (!granted) {
      notificationsEnabled.value = false;
    }
  } catch (error) {
    console.error("请求权限失败:", error);
    notificationsEnabled.value = false;
  }
};

const handleReminderToggle = (key: string, enabled: boolean) => {
  const reminder = reminderTypes.value.find((r) => r.key === key);
  if (reminder) {
    reminder.enabled = enabled;
    saveSettings();
  }
};

const saveActiveTimes = () => {
  reminderService.setActiveTimes(activeTimes.value);
  saveSettings();
};

const saveAdvanceNotice = () => {
  // 转换任务提前提醒时间为毫秒
  const taskDueMs = advanceNotice.value.taskDueHours.map(
    (hour) => parseInt(hour) * 3600000,
  );

  reminderService.setAdvanceNotice({
    taskDue: taskDueMs,
    dailyCheckin: advanceNotice.value.dailyCheckin,
    weeklyReview: `${advanceNotice.value.weeklyReviewDay} ${advanceNotice.value.weeklyReviewTime}`,
    planProgress: advanceNotice.value.planProgress,
  });

  saveSettings();
};

const saveAllSettings = async () => {
  saving.value = true;
  try {
    saveSettings();
    saveActiveTimes();
    saveAdvanceNotice();

    // 显示成功提示
    if (notificationsEnabled.value) {
      notificationService.showNotification({
        title: "设置已保存",
        body: "通知设置已成功更新",
      });
    }
  } catch (error) {
    console.error("保存设置失败:", error);
  } finally {
    saving.value = false;
  }
};

const resetToDefaults = () => {
  if (confirm("确定要恢复所有通知设置为默认值吗？")) {
    notificationsEnabled.value = false;
    reminderTypes.value = [
      {
        key: "task_due",
        title: "任务到期提醒",
        description: "任务即将到期时的提醒",
        enabled: true,
      },
      {
        key: "daily_checkin",
        title: "每日签到提醒",
        description: "每天固定时间提醒签到",
        enabled: true,
      },
      {
        key: "weekly_review",
        title: "每周回顾提醒",
        description: "每周固定时间提醒回顾",
        enabled: true,
      },
      {
        key: "plan_progress",
        title: "计划进度提醒",
        description: "计划达到设定进度时提醒",
        enabled: true,
      },
    ];
    activeTimes.value = { ...DEFAULT_ACTIVE_TIMES };
    advanceNotice.value = {
      taskDueHours: ["1", "24"],
      dailyCheckin: "20:00",
      weeklyReviewDay: "Sunday",
      weeklyReviewTime: "20:00",
      planProgress: 80,
    };
    saveSettings();
  }
};

const clearAllReminders = () => {
  if (confirm("确定要清除所有待发送的提醒吗？")) {
    reminderService.clearAllReminders();
    updatePendingRemindersCount();
  }
};

const updatePendingRemindersCount = () => {
  pendingRemindersCount.value = notificationService.getPendingRemindersCount();
};

// 监听提醒数量变化
setInterval(updatePendingRemindersCount, 5000);
</script>

<style scoped>
.notification-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.settings-section {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.section-header p {
  color: var(--text-secondary);
  font-size: 14px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-content h3 {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.setting-content p {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.toggle-switch {
  flex-shrink: 0;
}

.permission-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label {
  color: var(--text-secondary);
}

.status-value {
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.status-granted {
  color: var(--success-color);
  background: var(--success-bg);
}

.status-denied {
  color: var(--error-color);
  background: var(--error-bg);
}

.status-disabled {
  color: var(--text-secondary);
  background: var(--bg-muted);
}

.request-permission-btn {
  align-self: flex-start;
}

.time-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.time-setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-setting-item label {
  font-weight: 500;
  color: var(--text-primary);
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  width: 120px;
}

.time-input.single {
  width: 160px;
}

.advance-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.checkbox-group {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}

.checkbox-item input {
  margin: 0;
}

.day-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  margin-right: 8px;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.progress-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--border-color);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}

.slider-value {
  font-weight: 500;
  color: var(--text-primary);
  min-width: 40px;
  text-align: right;
}

.reminder-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-muted);
  border-radius: 8px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  color: var(--text-secondary);
}

.summary-value {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 18px;
}

.actions-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-settings {
    padding: 16px;
  }

  .settings-section {
    padding: 16px;
  }

  .time-settings-grid {
    grid-template-columns: 1fr;
  }

  .actions-footer {
    flex-direction: column;
  }

  .checkbox-group {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
