<template>
  <PageScaffold
    :title="pageTitle"
    :subtitle="pageSubtitle"
    show-back-button
    @back="goBack"
  >
    <template #actions>
      <Button variant="outline" @click="toggleViewMode">
        {{ viewMode === 'calendar' ? '📊 列表视图' : '📅 日历视图' }}
      </Button>
      <Button variant="primary" @click="goSchedule">
        📅 安排日程
      </Button>
    </template>
    
    <div class="plan-calendar-container">
      <!-- 计划阶段条 -->
      <div class="phase-bar card mb-4">
        <div class="phase-header">
          <h3>🚀 计划阶段</h3>
          <div class="phase-progress">
            <span class="progress-text">整体进度</span>
            <span class="progress-value">{{ planProgress }}%</span>
          </div>
        </div>
        
        <div class="phases-container">
          <div 
            v-for="phase in planPhases" 
            :key="phase.key"
            class="phase-item"
            :class="{
              'active': isPhaseActive(phase),
              'completed': isPhaseCompleted(phase),
              'upcoming': isPhaseUpcoming(phase)
            }"
            @click="jumpToPhase(phase)"
          >
            <div class="phase-icon">{{ phase.icon }}</div>
            <div class="phase-content">
              <div class="phase-title">{{ phase.title }}</div>
              <div class="phase-dates">{{ formatDateRange(phase.startDate, phase.endDate) }}</div>
              <div class="phase-status">
                <span class="status-dot" :class="getPhaseStatusClass(phase)"></span>
                <span class="status-text">{{ getPhaseStatusText(phase) }}</span>
              </div>
            </div>
            <div class="phase-progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: phase.progress + '%' }"
                :class="getProgressClass(phase.progress)">
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 视觉区分提示 -->
      <div class="visual-guide card mb-4">
        <h3>🎨 视觉指引</h3>
        <div class="guide-grid">
          <div class="guide-item">
            <div class="color-sample high-priority"></div>
            <span>高优先级任务</span>
          </div>
          <div class="guide-item">
            <div class="color-sample medium-priority"></div>
            <span>中等优先级</span>
          </div>
          <div class="guide-item">
            <div class="color-sample low-priority"></div>
            <span>低优先级任务</span>
          </div>
          <div class="guide-item">
            <div class="color-sample completed"></div>
            <span>已完成</span>
          </div>
          <div class="guide-item">
            <div class="color-sample overdue"></div>
            <span>逾期任务</span>
          </div>
          <div class="guide-item">
            <div class="color-sample milestone"></div>
            <span>里程碑</span>
          </div>
        </div>
      </div>
      
      <!-- 日历视图 -->
      <div v-if="viewMode === 'calendar'" class="calendar-section">
        <CalendarView :planId="planId" />
      </div>
      
      <!-- 列表视图 -->
      <div v-else class="list-section">
        <Card class="tasks-list-card">
          <div class="list-header">
            <h3>📋 任务清单</h3>
            <div class="sort-controls">
              <select v-model="sortBy" class="sort-select">
                <option value="date">按日期排序</option>
                <option value="priority">按优先级排序</option>
                <option value="status">按状态排序</option>
              </select>
            </div>
          </div>
          
          <div class="tasks-list">
            <div 
              v-for="task in sortedTasks" 
              :key="task.id"
              class="task-item"
              :class="getTaskVisualClass(task)"
            >
              <div class="task-check">
                <TaskCheckBox 
                  :model-value="task.status === 'done'"
                  @update:model-value="toggleTaskStatus(task.id)"
                />
              </div>
              <div class="task-content">
                <h4 class="task-title">{{ task.title }}</h4>
                <div class="task-meta">
                  <span class="task-date">📅 {{ formatDate(task.task_date) }}</span>
                  <span class="task-priority" :class="'medium'">
                    {{ getPriorityLabel('medium') }}
                  </span>
                  <span v-if="false" class="milestone-tag">🎯 里程碑</span>
                </div>
                <div v-if="task.note" class="task-note">📝 {{ task.note }}</div>
              </div>
              <div class="task-actions">
                <Button variant="ghost" size="sm" @click="editTask(task.id)">
                  编辑
                </Button>
              </div>
            </div>
            
            <div v-if="sortedTasks.length === 0" class="empty-state">
              <div class="empty-icon">📋</div>
              <p>该计划暂无任务</p>
              <Button variant="outline" @click="goSchedule">
                添加任务
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
    
    <!-- 悬浮按钮：创建日程 -->
    <SimpleFAB 
      icon="➕" 
      label="日程" 
      @click="goSchedule" 
      position="bottom-right"
    />
  </PageScaffold>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
import PageScaffold from "@/components/common/PageScaffold.vue";
import Button from "@/components/common/Button.vue";
import Card from "@/components/common/Card.vue";
import SimpleFAB from "@/components/common/SimpleFAB.vue";
import TaskCheckBox from "@/components/task/TaskCheckBox.vue";
import CalendarView from "@/components/calendar/CalendarView.vue";

const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const taskStore = useTaskStore();

const planId = Number(route.params.id);
const viewMode = ref<'calendar' | 'list'>('calendar');
const sortBy = ref<'date' | 'priority' | 'status'>('date');

// 页面标题数据
const pageTitle = computed(() => {
  const plan = planStore.plans.find((p: any) => p.id === planId);
  return plan ? `📅 ${plan.title} - 计划日历` : '计划日历';
});

const pageSubtitle = computed(() => {
  const plan = planStore.plans.find((p: any) => p.id === planId);
  return plan ? `查看和管理 ${plan.title} 的任务安排` : '查看计划的时间安排';
});

// 计划阶段数据
const planPhases = computed(() => {
  const plan = planStore.plans.find((p: any) => p.id === planId);
  if (!plan) return [];
  
  const startDate = new Date(plan.start_date);
  const endDate = new Date(plan.end_date);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 简化为三个阶段
  return [
    {
      key: 'preparation',
      title: '准备阶段',
      icon: '📋',
      startDate: plan.start_date,
      endDate: addDays(plan.start_date, Math.floor(totalDays * 0.3)),
      progress: 100, // 假设已完成
      status: 'completed'
    },
    {
      key: 'execution',
      title: '执行阶段',
      icon: '🚀',
      startDate: addDays(plan.start_date, Math.floor(totalDays * 0.3)),
      endDate: addDays(plan.start_date, Math.floor(totalDays * 0.8)),
      progress: 65, // 示例进度
      status: 'active'
    },
    {
      key: 'closure',
      title: '收尾阶段',
      icon: '🏁',
      startDate: addDays(plan.start_date, Math.floor(totalDays * 0.8)),
      endDate: plan.end_date,
      progress: 0, // 尚未开始
      status: 'upcoming'
    }
  ];
});

// 计划整体进度
const planProgress = computed(() => {
  const phases = planPhases.value;
  if (phases.length === 0) return 0;
  
  const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
  return Math.round(totalProgress / phases.length);
});

// 当前计划的任务
const planTasks = computed(() => {
  return taskStore.tasks.filter((t: any) => t.plan_id === planId);
});

// 排序后的任务
const sortedTasks = computed(() => {
  const tasks = [...planTasks.value];
  
  switch (sortBy.value) {
    case 'priority':
      return tasks.sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          'high': 0,
          'medium': 1,
          'low': 2
        };
        // 临时使用固定优先级排序
        return 0;
      });
    case 'status':
      return tasks.sort((a, b) => {
        const statusOrder: Record<string, number> = {
          'pending': 0,
          'in_progress': 1,
          'done': 2
        };
        return statusOrder[a.status] - statusOrder[b.status];
      });
    case 'date':
    default:
      return tasks.sort((a, b) => a.task_date.localeCompare(b.task_date));
  }
});

// 方法函数
function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.getMonth() + 1}.${start.getDate()} - ${end.getMonth() + 1}.${end.getDate()}`;
}

function isPhaseActive(phase: any): boolean {
  return phase.status === 'active';
}

function isPhaseCompleted(phase: any): boolean {
  return phase.status === 'completed';
}

function isPhaseUpcoming(phase: any): boolean {
  return phase.status === 'upcoming';
}

function getPhaseStatusClass(phase: any): string {
  return `status-${phase.status}`;
}

function getPhaseStatusText(phase: any): string {
  const statusTexts: Record<string, string> = {
    'completed': '已完成',
    'active': '进行中',
    'upcoming': '即将到来'
  };
  return statusTexts[phase.status] || '未知';
}

function getProgressClass(progress: number): string {
  if (progress >= 80) return 'good';
  if (progress >= 60) return 'warning';
  return 'danger';
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    'high': '高优',
    'medium': '中等',
    'low': '低优'
  };
  return labels[priority] || '中等';
}

function getTaskVisualClass(task: any): string {
  const classes = [];
  
  // 临时使用固定优先级
  classes.push('priority-medium');
  
  // 状态类
  if (task.status === 'done') {
    classes.push('completed');
  } else if (new Date(task.task_date) < new Date() && task.status !== 'done') {
    classes.push('overdue');
  }
  
  // 里程碑类
  if (task.isMilestone) {
    classes.push('milestone');
  }
  
  return classes.join(' ');
}

// 操作函数
function goBack() {
  router.back();
}

function goSchedule() {
  router.push({
    path: '/schedule',
    query: { planId: String(planId) }
  });
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'calendar' ? 'list' : 'calendar';
}

function jumpToPhase(phase: any) {
  // 跳转到指定阶段的日期
  console.log('跳转到阶段:', phase.title);
}

async function toggleTaskStatus(taskId: number) {
  await taskStore.toggleTaskStatus(taskId);
}

function editTask(taskId: number) {
  router.push(`/task/${taskId}`);
}

// 初始化
onMounted(async () => {
  await Promise.all([
    planStore.loadPlans(),
    taskStore.loadTasks()
  ]);
});
</script>

<style scoped>
.plan-calendar-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 计划阶段条 */
.phase-bar {
  background: linear-gradient(135deg, var(--ai-bg) 0%, var(--bg-card) 100%);
  border-left: 4px solid var(--ai-main);
  padding: var(--space-5);
}

.phase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.phase-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.phase-progress {
  text-align: right;
}

.progress-text {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
}

.progress-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--ai-main);
  font-variant-numeric: tabular-nums;
}

.phases-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.phase-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-main);
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
}

.phase-item:hover {
  background: var(--bg-card-hover);
  transform: translateX(4px);
}

.phase-item.active {
  border-color: var(--ai-main);
  background: var(--ai-bg);
}

.phase-item.completed {
  border-color: var(--success);
  background: var(--success-bg);
}

.phase-item.upcoming {
  border-color: var(--text-secondary);
  opacity: 0.7;
}

.phase-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.phase-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.phase-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.phase-dates {
  font-size: 13px;
  color: var(--text-secondary);
}

.phase-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.status-completed {
  background: var(--success);
}

.status-dot.status-active {
  background: var(--ai-main);
}

.status-dot.status-upcoming {
  background: var(--text-secondary);
}

.status-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.phase-progress-bar {
  width: 100px;
  height: 6px;
  background: var(--bg-card);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-fill.good {
  background: var(--success);
}

.progress-fill.warning {
  background: var(--warning);
}

.progress-fill.danger {
  background: var(--error);
}

/* 视觉指引 */
.visual-guide {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.visual-guide h3 {
  margin: 0 0 var(--space-4) 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-3);
}

.guide-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.color-sample {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.color-sample.high-priority {
  background: var(--error);
}

.color-sample.medium-priority {
  background: var(--warning);
}

.color-sample.low-priority {
  background: var(--success);
}

.color-sample.completed {
  background: var(--success);
}

.color-sample.overdue {
  background: var(--error);
}

.color-sample.milestone {
  background: var(--ai-main);
}

/* 列表视图 */
.list-section {
  margin-top: var(--space-4);
}

.tasks-list-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.sort-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-md);
  background: var(--bg-main);
  color: var(--text-main);
  font-size: 14px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-main);
  border-radius: var(--radius-md);
  border-left: 4px solid transparent;
  transition: all 0.2s;
}

.task-item:hover {
  background: var(--bg-card-hover);
  transform: translateX(2px);
}

.task-item.priority-high {
  border-left-color: var(--error);
}

.task-item.priority-medium {
  border-left-color: var(--warning);
}

.task-item.priority-low {
  border-left-color: var(--success);
}

.task-item.completed {
  opacity: 0.7;
  border-left-color: var(--success);
}

.task-item.overdue {
  border-left-color: var(--error);
  background: var(--error-bg);
}

.task-item.milestone {
  border-left-color: var(--ai-main);
  background: var(--ai-bg);
}

.task-check {
  flex-shrink: 0;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-main);
  margin: 0 0 var(--space-2) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-meta {
  display: flex;
  gap: var(--space-3);
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.task-priority {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.task-priority.high {
  background: var(--error-bg);
  color: var(--error);
}

.task-priority.medium {
  background: var(--warning-bg);
  color: var(--warning);
}

.task-priority.low {
  background: var(--success-bg);
  color: var(--success);
}

.milestone-tag {
  background: var(--ai-bg);
  color: var(--ai-main);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
}

.task-note {
  font-size: 13px;
  color: var(--text-secondary);
  font-style: italic;
}

.task-actions {
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: var(--space-8) var(--space-4);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-3);
}

.empty-state p {
  margin: 0 0 var(--space-4) 0;
  color: var(--text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .phase-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .phase-progress {
    text-align: left;
  }
  
  .phase-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .guide-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
  
  .task-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .task-meta {
    flex-wrap: wrap;
    width: 100%;
  }
}
</style>
