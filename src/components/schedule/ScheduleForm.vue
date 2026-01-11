<template>
  <form class="schedule-form" @submit.prevent="handleSubmit">
    <!-- 日程标题 -->
    <div class="form-section title-section">
      <input 
        v-model="form.title" 
        type="text"
        class="input-title" 
        placeholder="项目评审会议、团队聚餐、健身打卡..." 
        required 
      />
    </div>

    <div class="divider"></div>

    <!-- 时间设置 -->
    <div class="form-section time-section">
      <h3 class="section-label">📅 时间</h3>
      
      <!-- 快捷日期选择 -->
      <div class="quick-dates">
        <button 
          type="button"
          v-for="quick in quickDates" 
          :key="quick.value"
          :class="['quick-btn', { active: form.date === quick.value }]"
          @click="form.date = quick.value"
        >
          {{ quick.label }}
        </button>
        <input 
          type="date" 
          v-model="form.date" 
          class="date-picker"
          required 
        />
      </div>

      <!-- 时间段 -->
      <div class="time-range">
        <div class="time-input-group">
          <label class="time-label">🕒 开始</label>
          <input 
            type="time" 
            v-model="form.start_time" 
            class="time-input"
            placeholder="14:00"
          />
        </div>
        <span class="time-separator">–</span>
        <div class="time-input-group">
          <label class="time-label">结束</label>
          <input 
            type="time" 
            v-model="form.end_time" 
            class="time-input"
            placeholder="15:00"
          />
        </div>
      </div>

      <!-- 全天事件 -->
      <label class="checkbox-label">
        <input type="checkbox" v-model="isAllDay" @change="handleAllDayToggle" />
        <span>全天事件</span>
      </label>
    </div>

    <div class="divider"></div>

    <!-- 提醒方式 -->
    <div class="form-section reminder-section">
      <h3 class="section-label">🔔 提醒</h3>
      <div class="reminder-options">
        <label 
          v-for="option in reminderOptions" 
          :key="option.value"
          class="radio-label"
        >
          <input 
            type="radio" 
            v-model="form.reminder" 
            :value="option.value"
            name="reminder"
          />
          <span class="radio-text">{{ option.label }}</span>
        </label>
      </div>
      <p class="hint-text">💡 提示：大多数人习惯在事件前 10 分钟设置提醒</p>
    </div>

    <div class="divider"></div>

    <!-- 可选信息 -->
    <details class="form-section optional-section" open>
      <summary class="section-toggle">更多选项</summary>
      
      <!-- 重复规则 -->
      <div class="field-group">
        <label class="field-label">🔁 重复</label>
        <select v-model="form.repeat" class="select-input">
          <option value="none">不重复</option>
          <option value="daily">每天</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
        </select>
      </div>

      <!-- 地点 -->
      <div class="field-group">
        <label class="field-label">📍 地点</label>
        <input 
          v-model="form.location" 
          type="text"
          class="text-input" 
          placeholder="会议室 301、腾讯会议、咖啡厅..." 
        />
      </div>

      <!-- 备注 -->
      <div class="field-group">
        <label class="field-label">📝 备注</label>
        <textarea 
          v-model="form.description" 
          class="textarea-input"
          rows="2"
          maxlength="100"
          placeholder="可选，一句话就好"
        ></textarea>
        <small class="char-count">{{ form.description.length }}/100</small>
      </div>
    </details>

    <!-- 主按钮 -->
    <div class="form-actions">
      <button 
        type="submit" 
        class="btn-primary" 
        :disabled="submitting"
      >
        {{ submitting ? '创建中...' : '创建日程' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useScheduleStore } from '@/store/schedules';
import { useUserStore } from '@/store/user';

const emit = defineEmits<{ (e: 'created'): void }>();
const scheduleStore = useScheduleStore();
const userStore = useUserStore();
const submitting = ref(false);
const isAllDay = ref(false);

// 快捷日期
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

const quickDates = [
  { label: '今天', value: today },
  { label: '明天', value: tomorrow },
  { label: '下周', value: nextWeek }
];

// 提醒选项
const reminderOptions = [
  { label: '事件开始时', value: 'at_time' },
  { label: '提前 10 分钟', value: 'before_10min' },
  { label: '提前 1 小时', value: 'before_1hour' },
  { label: '不提醒', value: 'none' }
];

const form = reactive({
  title: '',
  date: today,
  start_time: '',
  end_time: '',
  reminder: 'before_10min',
  repeat: 'none',
  location: '',
  description: ''
});

function handleAllDayToggle() {
  if (isAllDay.value) {
    form.start_time = '';
    form.end_time = '';
  }
}

async function handleSubmit() {
  if (!userStore.user?.id) {
    alert('请先登录');
    return;
  }

  submitting.value = true;
  try {
    await scheduleStore.create({
      user_id: userStore.user.id,
      title: form.title.trim(),
      date: form.date,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      description: form.description || undefined
    });
    
    emit('created');
    
    // 重置表单
    form.title = '';
    form.date = today;
    form.start_time = '';
    form.end_time = '';
    form.reminder = 'before_10min';
    form.repeat = 'none';
    form.location = '';
    form.description = '';
    isAllDay.value = false;
  } catch (e: any) {
    alert(e?.message || '创建失败，请重试');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.schedule-form {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 表单区块 */
.form-section {
  padding: 1.5rem;
}

/* 分割线 */
.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 0;
}

/* 标题输入 */
.title-section {
  padding: 2rem 1.5rem 1.5rem;
}

.input-title {
  width: 100%;
  font-size: 18px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: var(--text-main);
  padding: 0;
  outline: none;
}

.input-title::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

/* 区块标签 */
.section-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 1rem 0;
}

/* 时间设置 */
.quick-dates {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.quick-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: var(--bg-main);
  color: var(--text-main);
}

.quick-btn.active {
  background: var(--ai-main);
  color: white;
  border-color: var(--ai-main);
}

.date-picker {
  padding: 0.5rem;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 13px;
  cursor: pointer;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.time-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.time-input {
  padding: 0.75rem;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 14px;
}

.time-separator {
  color: var(--text-muted);
  font-size: 16px;
  margin-top: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 提醒方式 */
.reminder-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-label:hover {
  background: var(--bg-main);
  border-color: var(--ai-main);
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.radio-label input[type="radio"]:checked + .radio-text {
  color: var(--ai-main);
  font-weight: 500;
}

.radio-text {
  font-size: 14px;
  color: var(--text-main);
}

.hint-text {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  padding: 0.5rem 0.75rem;
  background: var(--ai-bg);
  border-radius: 6px;
}

/* 可选信息 */
.optional-section {
  border: none;
}

.section-toggle {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  list-style: none;
  padding: 0.5rem 0;
  user-select: none;
}

.section-toggle::-webkit-details-marker {
  display: none;
}

.section-toggle::before {
  content: '›';
  display: inline-block;
  margin-right: 0.5rem;
  transition: transform 0.2s;
}

details[open] .section-toggle::before {
  transform: rotate(90deg);
}

.field-group {
  margin-top: 1rem;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.select-input,
.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 14px;
}

.textarea-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 14px;
  resize: vertical;
  max-height: 100px;
  font-family: inherit;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* 主按钮 */
.form-actions {
  padding: 1.5rem;
  background: var(--bg-main);
}

.btn-primary {
  width: 100%;
  padding: 1rem;
  background: var(--ai-main);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.02em;
}

.btn-primary:hover:not(:disabled) {
  background: var(--ai-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 640px) {
  .form-section {
    padding: 1.25rem 1rem;
  }

  .title-section {
    padding: 1.5rem 1rem 1.25rem;
  }

  .time-range {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .time-separator {
    margin-top: 0;
    text-align: center;
  }

  .quick-dates {
    flex-wrap: wrap;
  }

  .quick-btn {
    flex: 1 1 auto;
    min-width: 70px;
  }
}
</style>