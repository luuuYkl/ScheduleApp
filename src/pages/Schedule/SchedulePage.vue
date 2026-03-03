<template>
  <PageScaffold
    title="创建日程"
    subtitle="安排你的重要时刻"
    show-back-button
    @back="goBack"
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
          <ScheduleForm @created="handleCreated" ref="scheduleFormRef" />
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
              <div class="preview-value">{{ previewTitle || '未填写' }}</div>
            </div>
            
            <div class="preview-item">
              <div class="preview-label">日期</div>
              <div class="preview-value">{{ previewDate || '未选择' }}</div>
            </div>
            
            <div class="preview-item" v-if="previewStartTime || previewEndTime">
              <div class="preview-label">时间</div>
              <div class="preview-value">
                {{ previewStartTime }} - {{ previewEndTime }}
              </div>
            </div>
            
            <div class="preview-item" v-if="previewLocation">
              <div class="preview-label">地点</div>
              <div class="preview-value">{{ previewLocation }}</div>
            </div>
            
            <div class="preview-item" v-if="previewDescription">
              <div class="preview-label">备注</div>
              <div class="preview-value preview-description">{{ previewDescription }}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </PullToRefresh>
  </PageScaffold>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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
const conflicts = ref<any[]>([]);

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

// 方法函数
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
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

// 操作函数
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/home');
  }
}

function clearForm() {
  // 清空表单逻辑
  console.log('清空表单');
}

function dismissContext() {
  relatedPlan.value = null;
  relatedTask.value = null;
}

function adjustTime() {
  // 调整时间逻辑
  console.log('调整时间');
}

function proceedAnyway() {
  // 仍然创建逻辑
  console.log('仍然创建');
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

.preview-description {
  font-weight: normal;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .schedule-page-container {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .preview-sidebar {
    order: -1;
  }
  
  .preview-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .schedule-page-container {
    padding: var(--space-4);
  }
  
  .context-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .conflict-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .conflict-actions {
    flex-direction: column;
  }
  
  .conflict-actions Button {
    width: 100%;
  }
}
</style>
