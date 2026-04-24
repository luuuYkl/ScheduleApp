<template>
  <PageScaffold
    back-to="/home"
  >
    <template #actions>
      <Button variant="outline" @click="clearForm">
        清空
      </Button>
    </template>
    
    <PullToRefresh @refresh="handleRefresh">
    <div class="schedule-page-container">
      <div class="main-content">
        <!-- 上下文提示区域 -->
        <Card class="context-panel mb-4" v-if="hasContextInfo">
          <div class="context-header">
            <h3>📋 上下文信息</h3>
            <Button variant="ghost" size="sm" @click="dismissContext">
              ✕
            </Button>
          </div>
          
          <div class="context-content">
            <div v-if="relatedPlan" class="context-item">
              <div class="context-icon">🎯</div>
              <div class="context-details">
                <div class="context-title">关联计划</div>
                <div class="context-value">{{ relatedPlan.title }}</div>
                <div class="context-period">{{ planPeriod }}</div>
              </div>
            </div>
            
            <div v-if="relatedTask" class="context-item">
              <div class="context-icon">✅</div>
              <div class="context-details">
                <div class="context-title">关联任务</div>
                <div class="context-value">{{ relatedTask.title }}</div>
                <div class="context-date">{{ taskDate }}</div>
              </div>
            </div>
          </div>
        </Card>
        
        <!-- 冲突预览区域 -->
        <Card class="conflict-panel mb-4" v-if="hasConflicts">
          <div class="conflict-header">
            <h3>⚠️ 时间冲突提醒</h3>
          </div>
          
          <div class="conflicts-list">
            <div 
              v-for="conflict in conflicts" 
              :key="conflict.id"
              class="conflict-item"
              :class="getConflictSeverity(conflict.severity)"
            >
              <div class="conflict-icon">{{ conflict.icon }}</div>
              <div class="conflict-details">
                <div class="conflict-title">{{ conflict.title }}</div>
                <div class="conflict-time">{{ conflict.time }}</div>
                <div class="conflict-description">{{ conflict.description }}</div>
              </div>
              <div class="conflict-severity" :class="conflict.severity">
                {{ getSeverityLabel(conflict.severity) }}
              </div>
            </div>
          </div>
          
          <div class="conflict-actions">
            <Button variant="outline" @click="adjustTime">
              调整时间
            </Button>
            <Button variant="secondary" @click="proceedAnyway">
              仍然创建
            </Button>
          </div>
        </Card>
        
        <!-- 日程表单 -->
        <Card class="schedule-form-card">
          <ScheduleForm 
            @created="handleCreated" 
            @formChange="handleFormChange"
            ref="scheduleFormRef" 
          />
        </Card>
      </div>
      
      <!-- 右侧：日程预览 -->
      <div class="preview-sidebar" v-if="showPreview">
        <Card class="preview-card">
          <div class="preview-header">
            <h3>📅 日程预览</h3>
          </div>
          
          <div class="preview-content">
            <div class="preview-item">
              <div class="preview-label">标题</div>
              <div class="preview-value" :class="{ 'preview-placeholder': !previewTitle }">
                {{ previewTitle || '未填写' }}
              </div>
            </div>
            
            <div class="preview-item">
              <div class="preview-label">日期</div>
              <div class="preview-value" :class="{ 'preview-placeholder': !previewDate }">
                {{ formatPreviewDate(previewDate) || '未选择' }}
              </div>
            </div>
            
            <div class="preview-item" v-if="previewIsAllDay">
              <div class="preview-label">时间</div>
              <div class="preview-value">
                🌙 全天事件
              </div>
            </div>
            
            <div class="preview-item" v-else-if="previewStartTime || previewEndTime">
              <div class="preview-label">时间</div>
              <div class="preview-value">
                {{ previewStartTime || '??' }} - {{ previewEndTime || '??' }}
              </div>
            </div>
            
            <div class="preview-item" v-if="previewLocation">
              <div class="preview-label">地点</div>
              <div class="preview-value">📍 {{ previewLocation }}</div>
            </div>
            
            <div class="preview-item" v-if="previewDescription">
              <div class="preview-label">备注</div>
              <div class="preview-value preview-description">{{ previewDescription }}</div>
            </div>
            
            <div class="preview-item" v-if="previewRepeat !== 'none'">
              <div class="preview-label">重复</div>
              <div class="preview-value">🔁 {{ getRepeatLabel(previewRepeat) }}</div>
            </div>
            
            <div class="preview-item" v-if="previewReminder !== 'none'">
              <div class="preview-label">提醒</div>
              <div class="preview-value">🔔 {{ getReminderLabel(previewReminder) }}</div>
            </div>
          </div>
          
          <!-- 预览底部提示 -->
          <div class="preview-footer" v-if="isFormEmpty">
            <p>💡 填写表单后可在此预览日程详情</p>
          </div>
        </Card>
      </div>
    </div>
    </PullToRefresh>
  </PageScaffold>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
import { useScheduleStore } from "@/store/schedules";
import PageScaffold from "@/components/common/PageScaffold.vue";
import Button from "@/components/common/Button.vue";
import Card from "@/components/common/Card.vue";
import ScheduleForm from "@/components/schedule/ScheduleForm.vue";
import PullToRefresh from "@/components/common/PullToRefresh.vue";

const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();

// 表单引用
const scheduleFormRef = ref<any>(null);

// 上下文信息
const relatedPlan = ref<any>(null);
const relatedTask = ref<any>(null);

const hasContextInfo = computed(() => {
  return relatedPlan.value || relatedTask.value;
});

const planPeriod = computed(() => {
  if (!relatedPlan.value) return '';
  return `${formatDate(relatedPlan.value.start_date)} - ${formatDate(relatedPlan.value.end_date)}`;
});

const taskDate = computed(() => {
  if (!relatedTask.value) return '';
  return formatDate(relatedTask.value.task_date);
});

// 冲突检测
interface ConflictItem {
  id: number;
  title: string;
  time: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  icon: string;
}

const conflicts = ref<ConflictItem[]>([]);

const hasConflicts = computed(() => {
  return conflicts.value.length > 0;
});

// 预览数据
const showPreview = ref(true);
const previewTitle = ref('');
const previewDate = ref('');
const previewStartTime = ref('');
const previewEndTime = ref('');
const previewLocation = ref('');
const previewDescription = ref('');
const previewRepeat = ref('none');
const previewReminder = ref('before_10min');
const previewIsAllDay = ref(false);

// 表单是否为空
const isFormEmpty = computed(() => {
  return !previewTitle.value && !previewDate.value && !previewStartTime.value && !previewEndTime.value && !previewLocation.value && !previewDescription.value;
});

// 方法函数
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
}

function formatPreviewDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let relativeDay = '';
  if (diffDays === 0) relativeDay = '今天';
  else if (diffDays === 1) relativeDay = '明天';
  else if (diffDays === -1) relativeDay = '昨天';
  else if (diffDays > 0 && diffDays <= 7) relativeDay = `${diffDays}天后`;
  else if (diffDays < 0 && diffDays >= -7) relativeDay = `${Math.abs(diffDays)}天前`;
  
  const formatted = date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
  
  return relativeDay ? `${relativeDay} (${formatted})` : formatted;
}

function getConflictSeverity(severity: string): string {
  return `severity-${severity}`;
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    'high': '严重冲突',
    'medium': '中等冲突',
    'low': '轻微冲突'
  };
  return labels[severity] || '冲突';
}

function getRepeatLabel(repeat: string): string {
  const labels: Record<string, string> = {
    'none': '不重复',
    'daily': '每天',
    'weekly': '每周',
    'monthly': '每月'
  };
  return labels[repeat] || repeat;
}

function getReminderLabel(reminder: string): string {
  const labels: Record<string, string> = {
    'at_time': '事件开始时',
    'before_10min': '提前 10 分钟',
    'before_1hour': '提前 1 小时',
    'none': '不提醒'
  };
  return labels[reminder] || reminder;
}

// 处理表单变化
function handleFormChange(formData: any) {
  previewTitle.value = formData.title || '';
  previewDate.value = formData.date || '';
  previewStartTime.value = formData.start_time || '';
  previewEndTime.value = formData.end_time || '';
  previewLocation.value = formData.location || '';
  previewDescription.value = formData.description || '';
  previewRepeat.value = formData.repeat || 'none';
  previewReminder.value = formData.reminder || 'before_10min';
  previewIsAllDay.value = formData.isAllDay || false;
  
  // 检测时间冲突
  detectConflicts(formData);
}

// 检测时间冲突
function detectConflicts(formData: any) {
  conflicts.value = [];
  
  // 如果没有选择日期或时间，不检测冲突
  if (!formData.date || (!formData.start_time && !formData.end_time)) {
    return;
  }
  
  // 如果是全天事件，不检测时间冲突
  if (formData.isAllDay) {
    return;
  }
  
  const selectedDate = formData.date;
  const selectedStart = formData.start_time;
  const selectedEnd = formData.end_time;
  
  // 只有一位时间无法检测冲突
  if (!selectedStart || !selectedEnd) {
    return;
  }
  
  // 将时间转换为分钟数便于比较
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const newStart = timeToMinutes(selectedStart);
  const newEnd = timeToMinutes(selectedEnd);
  
  // 遍历已有日程检测冲突
  scheduleStore.schedules.forEach((schedule: any) => {
    // 只检测同一天的日程
    if (schedule.date !== selectedDate) return;
    
    // 如果已有日程是全天事件
    if (schedule.is_all_day || (!schedule.start_time && !schedule.end_time)) {
      conflicts.value.push({
        id: schedule.id,
        title: schedule.title,
        time: '全天',
        description: '当天已有全天事件',
        severity: 'medium',
        icon: '📅'
      });
      return;
    }
    
    // 检测时间重叠
    if (schedule.start_time && schedule.end_time) {
      const existStart = timeToMinutes(schedule.start_time);
      const existEnd = timeToMinutes(schedule.end_time);
      
      // 时间重叠检测
      const hasOverlap = newStart < existEnd && newEnd > existStart;
      
      if (hasOverlap) {
        // 计算重叠程度
        const overlapStart = Math.max(newStart, existStart);
        const overlapEnd = Math.min(newEnd, existEnd);
        const overlapMinutes = overlapEnd - overlapStart;
        const newDuration = newEnd - newStart;
        const overlapRatio = overlapMinutes / newDuration;
        
        let severity: 'high' | 'medium' | 'low' = 'low';
        if (overlapRatio > 0.5) {
          severity = 'high';
        } else if (overlapRatio > 0.2) {
          severity = 'medium';
        }
        
        conflicts.value.push({
          id: schedule.id,
          title: schedule.title,
          time: `${schedule.start_time} - ${schedule.end_time}`,
          description: `时间与现有日程重叠约 ${Math.round(overlapMinutes)} 分钟`,
          severity,
          icon: '⏰'
        });
      }
    }
  });
}

// 操作函数
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/home');
  }
}

function clearForm() {
  if (scheduleFormRef.value?.resetForm) {
    scheduleFormRef.value.resetForm();
  }
  // 清空预览
  previewTitle.value = '';
  previewDate.value = '';
  previewStartTime.value = '';
  previewEndTime.value = '';
  previewLocation.value = '';
  previewDescription.value = '';
  previewRepeat.value = 'none';
  previewReminder.value = 'before_10min';
  previewIsAllDay.value = false;
  conflicts.value = [];
}

function dismissContext() {
  relatedPlan.value = null;
  relatedTask.value = null;
}

function adjustTime() {
  // 调整时间逻辑 - 滚动到时间选择区域
  const timeSection = document.querySelector('.form-section');
  if (timeSection) {
    timeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function proceedAnyway() {
  // 清除冲突提示，允许用户继续创建
  conflicts.value = [];
}

function handleCreated() {
  router.push("/home"); // 创建成功后返回首页查看
}

// 下拉刷新处理
async function handleRefresh() {
  // 重新加载所有相关数据
  await Promise.all([
    planStore.loadPlans(),
    taskStore.loadTasks(),
    scheduleStore.load(new Date().toISOString().slice(0, 10))
  ]);
  
  // 重新检查上下文
  const planId = route.query.planId;
  const taskId = route.query.taskId;
  
  if (planId) {
    relatedPlan.value = planStore.plans.find((p: any) => p.id === Number(planId));
  }
  
  if (taskId) {
    relatedTask.value = taskStore.tasks.find((t: any) => t.id === Number(taskId));
  }
}

// 初始化
onMounted(async () => {
  // 检查是否有上下文参数
  const planId = route.query.planId;
  const taskId = route.query.taskId;
  
  if (planId) {
    await planStore.loadPlans();
    relatedPlan.value = planStore.plans.find((p: any) => p.id === Number(planId));
  }
  
  if (taskId) {
    await taskStore.loadTasks();
    relatedTask.value = taskStore.tasks.find((t: any) => t.id === Number(taskId));
  }
  
  // 加载已有日程用于冲突检测
  await scheduleStore.load(new Date().toISOString().slice(0, 10));
});
</script>

<style scoped>
.schedule-page-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-5);
  max-width: 1200px;
  margin: 0 auto;
}

.main-content {
  min-width: 0;
}

/* 上下文提示面板 */
.context-panel {
  background: linear-gradient(135deg, var(--ai-bg) 0%, var(--bg-card) 100%);
  border-left: 4px solid var(--ai-main);
  padding: var(--space-4);
}

.context-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.context-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.context-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.context-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-main);
  border-radius: var(--radius-md);
}

.context-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.context-details {
  flex: 1;
}

.context-title {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.context-value {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: var(--space-1);
}

.context-period,
.context-date {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 冲突预览面板 */
.conflict-panel {
  background: var(--warning-bg);
  border-left: 4px solid var(--warning);
  padding: var(--space-4);
}

.conflict-header {
  margin-bottom: var(--space-3);
}

.conflict-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.conflicts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.conflict-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-main);
  border-radius: var(--radius-md);
  border-left: 3px solid;
}

.conflict-item.severity-high {
  border-left-color: var(--error);
  background: var(--error-bg);
}

.conflict-item.severity-medium {
  border-left-color: var(--warning);
  background: var(--warning-bg);
}

.conflict-item.severity-low {
  border-left-color: var(--ai-main);
  background: var(--ai-bg);
}

.conflict-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.conflict-details {
  flex: 1;
}

.conflict-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: var(--space-1);
}

.conflict-time {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.conflict-description {
  font-size: 13px;
  color: var(--text-secondary);
}

.conflict-severity {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 500;
  flex-shrink: 0;
}

.conflict-severity.high {
  background: var(--error-bg);
  color: var(--error);
}

.conflict-severity.medium {
  background: var(--warning-bg);
  color: var(--warning);
}

.conflict-severity.low {
  background: var(--ai-bg);
  color: var(--ai-main);
}

.conflict-actions {
  display: flex;
  gap: var(--space-3);
}

/* 日程表单卡片 */
.schedule-form-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* 预览侧边栏 */
.preview-sidebar {
  height: fit-content;
}

.preview-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  position: sticky;
  top: calc(var(--header-height, 64px) + var(--space-4));
}

.preview-header {
  margin-bottom: var(--space-4);
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.preview-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.preview-value {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 500;
}

.preview-placeholder {
  color: var(--text-tertiary);
  font-weight: normal;
}

.preview-description {
  font-weight: normal;
  line-height: 1.5;
}

.preview-footer {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}

.preview-footer p {
  margin: 0;
  font-size: 13px;
  color: var(--text-tertiary);
  text-align: center;
}

/* 桌面端固定布局 - 无响应式适配 */
</style>