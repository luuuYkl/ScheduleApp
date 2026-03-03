<template>
  <PageScaffold 
    title="主页概览" 
    subtitle="一站式掌控所有计划与任务"
    show-back-button={false}
  >
    <template #actions>
      <Button variant="primary" @click="goToCreatePlan">
        📋 创建计划
      </Button>
      <Button variant="secondary" @click="goToCreateTask">
        ✅ 添加任务
      </Button>
    </template>

    <div class="dashboard-content">
      <!-- 标准化三卡结构 -->
      <div class="cards-container">
        <!-- 左侧：计划概览卡片 -->
        <Card class="overview-card primary-card">
          <div class="card-header">
            <h3>📊 计划概览</h3>
            <div class="refresh-btn" @click="refreshPlans">
              🔄
            </div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">⚡</div>
              <div class="stat-content">
                <span class="stat-value">{{ planStats.inProgress }}</span>
                <span class="stat-label">进行中</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">📋</div>
              <div class="stat-content">
                <span class="stat-value">{{ planStats.total }}</span>
                <span class="stat-label">总计划</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <span class="stat-value">{{ planStats.completed }}</span>
                <span class="stat-label">已完成</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⚠️</div>
              <div class="stat-content">
                <span class="stat-value">{{ planStats.atRisk }}</span>
                <span class="stat-label">风险中</span>
              </div>
            </div>
          </div>
          
          <div class="progress-section">
            <div class="progress-header">
              <span>整体完成率</span>
              <span class="progress-percent">{{ overallCompletion }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: overallCompletion + '%' }"
                :class="getProgressClass(overallCompletion)">
              </div>
            </div>
          </div>
        </Card>

        <!-- 中间：今日任务卡片 -->
        <Card class="tasks-card">
          <div class="card-header">
            <h3>📅 今日任务</h3>
            <span class="task-count">{{ todayTasks.length }}项</span>
          </div>
          
          <div class="tasks-list">
            <div 
              v-for="task in displayedTasks" 
              :key="task.id"
              class="task-item"
              :class="getTaskStatusClass(task.status)"
              @click="goToTaskDetail(task.id)"
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
                  <span v-if="task.startTime" class="time-info">
                    ⏰ {{ task.startTime }}
                  </span>
                  <span v-if="task.planTitle" class="plan-info">
                    🎯 {{ task.planTitle }}
                  </span>
                </div>
              </div>
              <div class="task-priority" :class="task.priority">
                {{ getPriorityLabel(task.priority) }}
              </div>
            </div>
            
            <div v-if="todayTasks.length === 0" class="empty-state">
              <div class="empty-icon">✅</div>
              <p>今日暂无任务</p>
              <Button variant="outline" size="sm" @click="goToCreateTask">
                添加任务
              </Button>
            </div>
          </div>
          
          <div v-if="todayTasks.length > 3" class="view-all">
            <Button variant="ghost" size="sm" @click="goToAllTasks">
              查看全部任务 →
            </Button>
          </div>
        </Card>

        <!-- 右侧：AI洞察卡片 -->
        <Card class="insights-card ai-card">
          <div class="card-header">
            <h3>🤖 AI 洞察</h3>
            <div class="ai-status" :class="aiInsight.status">
              {{ getAiStatusText(aiInsight.status) }}
            </div>
          </div>
          
          <div class="insight-content">
            <div class="insight-main">
              <div class="insight-icon">{{ aiInsight.icon }}</div>
              <p class="insight-text">{{ aiInsight.message }}</p>
            </div>
            
            <div v-if="aiInsight.suggestions.length > 0" class="suggestions">
              <h4>💡 建议行动</h4>
              <ul class="suggestion-list">
                <li 
                  v-for="(suggestion, index) in aiInsight.suggestions" 
                  :key="index"
                  class="suggestion-item"
                >
                  {{ suggestion }}
                </li>
              </ul>
            </div>
          </div>
          
          <div class="insight-actions">
            <Button variant="primary" size="sm" @click="applyAiSuggestions">
              应用建议
            </Button>
            <Button variant="outline" size="sm" @click="refreshAiInsight">
              重新分析
            </Button>
          </div>
        </Card>
      </div>
      
      <!-- 底部：快捷操作区域 -->
      <div class="quick-actions-section">
        <Card class="quick-actions-card">
          <h3>⚡ 快速开始</h3>
          <div class="quick-actions-grid">
            <Button 
              v-for="action in quickActions" 
              :key="action.key"
              :variant="action.variant"
              @click="action.handler"
              class="quick-action-btn"
            >
              <span class="action-icon">{{ action.icon }}</span>
              <span class="action-text">{{ action.label }}</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
import PageScaffold from "@/components/common/PageScaffold.vue";
import Button from "@/components/common/Button.vue";
import Card from "@/components/common/Card.vue";
import TaskCheckBox from "@/components/task/TaskCheckBox.vue";

const router = useRouter();
const planStore = usePlanStore();
const taskStore = useTaskStore();

const todayStr = new Date().toISOString().slice(0, 10);

// 计划统计数据
const planStats = computed(() => {
  const plans = planStore.plans;
  const inProgress = plans.filter((p: any) => p.status === 'IN_PROGRESS').length;
  const completed = plans.filter((p: any) => p.status === 'COMPLETED').length;
  const atRisk = plans.filter((p: any) => {
    if (p.status !== 'IN_PROGRESS') return false;
    const endDate = new Date(p.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft < 7;
  }).length;
  
  return {
    total: plans.length,
    inProgress,
    completed,
    atRisk
  };
});

// 整体完成率
const overallCompletion = computed(() => {
  if (planStats.value.total === 0) return 0;
  return Math.round((planStats.value.completed / planStats.value.total) * 100);
});

// 今日任务
const todayTasks = computed(() => {
  return taskStore.tasks
    .filter((t: any) => t.task_date === todayStr)
    .map((t: any) => ({
      ...t,
      planTitle: getPlanTitle(t.plan_id)
    }))
    .sort((a: any, b: any) => {
      // 按状态排序：未完成 > 进行中 > 已完成
      const statusOrder: Record<string, number> = {
        'pending': 0,
        'in_progress': 1,
        'done': 2
      };
      return statusOrder[a.status] - statusOrder[b.status];
    });
});

const displayedTasks = computed(() => {
  return todayTasks.value.slice(0, 5);
});

// AI洞察数据
const aiInsight = ref({
  status: 'analyzing',
  icon: '🤔',
  message: '正在分析您的使用模式...',
  suggestions: [] as string[]
});

// 快捷操作
const quickActions = [
  {
    key: 'create_plan',
    label: '创建计划',
    icon: '📋',
    variant: 'primary' as const,
    handler: () => goToCreatePlan()
  },
  {
    key: 'add_task',
    label: '添加任务',
    icon: '✅',
    variant: 'secondary' as const,
    handler: () => goToCreateTask()
  },
  {
    key: 'schedule',
    label: '安排日程',
    icon: '📅',
    variant: 'secondary' as const,
    handler: () => goToCreateSchedule()
  },
  {
    key: 'calendar',
    label: '查看日历',
    icon: '🗓️',
    variant: 'secondary' as const,
    handler: () => goToCalendar()
  }
];

// 方法函数
function getPlanTitle(planId: number): string {
  const plan = planStore.plans.find((p: any) => p.id === planId);
  return plan ? plan.title : '';
}

function getTaskStatusClass(status: string): string {
  return `status-${status}`;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    'high': '高优',
    'medium': '中等',
    'low': '低优'
  };
  return labels[priority] || '中等';
}

function getProgressClass(percentage: number): string {
  if (percentage >= 80) return 'good';
  if (percentage >= 60) return 'warning';
  return 'danger';
}

function getAiStatusText(status: string): string {
  const texts: Record<string, string> = {
    'analyzing': '分析中',
    'insight': '发现洞察',
    'warning': '需要注意',
    'success': '表现良好'
  };
  return texts[status] || '分析中';
}

// 导航函数
function goToCreatePlan() {
  router.push('/plan/create');
}

function goToCreateTask() {
  router.push('/task/create');
}

function goToCreateSchedule() {
  router.push('/schedule');
}

function goToCalendar() {
  router.push('/calendar');
}

function goToTaskDetail(taskId: number) {
  router.push(`/task/${taskId}`);
}

function goToAllTasks() {
  router.push('/tasks');
}

// 操作函数
async function refreshPlans() {
  await planStore.loadPlans();
}

async function toggleTaskStatus(taskId: number) {
  await taskStore.toggleTaskStatus(taskId);
}

function applyAiSuggestions() {
  // 应用AI建议的逻辑
  console.log('应用AI建议');
}

async function refreshAiInsight() {
  aiInsight.value.status = 'analyzing';
  aiInsight.value.message = '正在重新分析...';
  
  // 模拟AI分析
  setTimeout(() => {
    aiInsight.value = {
      status: 'insight',
      icon: '💡',
      message: '检测到您本周的计划完成率较高，建议继续保持当前节奏！',
      suggestions: [
        '考虑为下周设定更具挑战性的目标',
        '分享您的成功经验给其他用户',
        '尝试新的时间管理技巧'
      ]
    };
  }, 2000);
}

// 初始化
onMounted(async () => {
  await Promise.all([
    planStore.loadPlans(),
    taskStore.loadTasks()
  ]);
  
  // 初始化AI洞察
  refreshAiInsight();
});
</script>

<style scoped>
.dashboard-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

/* 标准化三卡容器 */
.cards-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

/* 卡片通用样式 */
.overview-card,
.tasks-card,
.insights-card {
  height: fit-content;
}

.primary-card {
  background: linear-gradient(135deg, var(--ai-bg) 0%, var(--bg-card) 100%);
  border-left: 4px solid var(--ai-main);
}

.ai-card {
  background: linear-gradient(135deg, var(--ai-bg) 0%, var(--bg-card) 100%);
  border-left: 4px solid var(--ai-main);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.refresh-btn {
  font-size: 16px;
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: var(--bg-card-hover);
  transform: rotate(180deg);
}

.task-count {
  font-size: 14px;
  color: var(--text-secondary);
  background: var(--ai-bg);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
}

.ai-status {
  font-size: 12px;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 500;
}

.ai-status.analyzing {
  background: var(--warning-bg);
  color: var(--warning);
}

.ai-status.insight {
  background: var(--success-bg);
  color: var(--success);
}

.ai-status.warning {
  background: var(--error-bg);
  color: var(--error);
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-main);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.stat-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--ai-main);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 进度条区域 */
.progress-section {
  margin-top: var(--space-2);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
  font-size: 14px;
}

.progress-percent {
  font-weight: 600;
  color: var(--ai-main);
}

.progress-bar {
  height: 8px;
  background: var(--bg-main);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
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

/* 任务列表 */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-main);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-emphasis);
}

.task-item.status-done {
  opacity: 0.7;
}

.task-check {
  flex-shrink: 0;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-main);
  margin: 0 0 var(--space-1) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-meta {
  display: flex;
  gap: var(--space-3);
  font-size: 12px;
  color: var(--text-secondary);
}

.time-info,
.plan-info {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.task-priority {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 500;
  flex-shrink: 0;
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

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--space-6) var(--space-3);
}

.empty-icon {
  font-size: 32px;
  margin-bottom: var(--space-2);
}

.empty-state p {
  margin: 0 0 var(--space-3) 0;
  color: var(--text-secondary);
}

/* 查看全部 */
.view-all {
  text-align: center;
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}

/* AI洞察内容 */
.insight-content {
  margin-bottom: var(--space-4);
}

.insight-main {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-main);
  border-radius: var(--radius-md);
}

.insight-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.insight-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-main);
}

.suggestions h4 {
  margin: 0 0 var(--space-2) 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.suggestion-item {
  padding: var(--space-2) var(--space-3);
  background: var(--ai-bg);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  border-left: 3px solid var(--ai-main);
}

.insight-actions {
  display: flex;
  gap: var(--space-2);
}

/* 快捷操作区域 */
.quick-actions-section {
  margin-top: var(--space-4);
}

.quick-actions-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.quick-actions-card h3 {
  margin: 0 0 var(--space-4) 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.action-icon {
  font-size: 20px;
}

.action-text {
  font-size: 13px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .cards-container {
    grid-template-columns: 1fr 1fr;
  }
  
  .insights-card {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .task-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .task-meta {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .insight-main {
    flex-direction: column;
    text-align: center;
  }
}
</style>
