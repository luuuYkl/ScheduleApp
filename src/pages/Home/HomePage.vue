<template>
  <PageScaffold 
    title="我的一天" 
    subtitle="专注当下，掌控节奏"
    show-back-button={false}
    class="layer-context"
  >
    <template #actions>
      <div class="desktop-actions priority-medium">
        <Button variant="outline" size="sm" @click="refreshData">
          🔄 刷新
        </Button>
      </div>
      <div class="mobile-cta priority-essential">
        <Button 
          variant="primary" 
          size="sm" 
          @click="goToCreateTask"
          class="cta-main"
        >
          <span class="cta-icon">+</span>
          <span class="cta-text">添加任务</span>
        </Button>

      </div>
    </template>

    <div class="home-content layout-template-l">
      <!-- Context Layer: 今日节奏条 -->
      <div class="rhythm-bar card layer-context priority-high">
        <div class="rhythm-header">
          <h2>🎯 今日节奏</h2>
          <div class="rhythm-score">
            <span class="score-value">{{ rhythmScore }}%</span>
            <span class="score-label">完成度</span>
          </div>
        </div>
        
        <div class="rhythm-indicators">
          <div 
            v-for="indicator in rhythmIndicators" 
            :key="indicator.key"
            class="indicator"
            :class="{
              'active': indicator.isActive,
              'completed': indicator.isCompleted,
              'overdue': indicator.isOverdue
            }"
          >
            <div class="indicator-icon">{{ indicator.icon }}</div>
            <div class="indicator-label">{{ indicator.label }}</div>
          </div>
        </div>
        
        <div class="rhythm-summary">
          <div class="summary-item">
            <span class="summary-label">📅 今日任务</span>
            <span class="summary-value">{{ todayStats.totalTasks }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">✅ 已完成</span>
            <span class="summary-value success">{{ todayStats.completedTasks }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">⏰ 待处理</span>
            <span class="summary-value warning">{{ todayStats.pendingTasks }}</span>
          </div>
        </div>
      </div>

      <!-- Primary Layer: 双卡布局 -->
      <div class="home-primary layer-primary priority-high">
        <!-- 战略层：长期计划概览 -->
        <div class="plan-section desktop-strategy">
          <PlanOverview />
        </div>
        
        <!-- 执行层：今日任务 -->
        <div class="task-section desktop-execution">
          <TaskList />
        </div>
      </div>
      

    </div>
    
    <!-- 浮动操作按钮 - 桌面端显示 -->
    <div class="desktop-fab priority-low">
      <FloatingActionButton />
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { useScheduleStore } from "@/store/schedules";
import PlanOverview from "@/components/home/PlanOverview.vue";
import TaskList from "@/components/home/TaskList.vue";
import PageScaffold from "@/components/common/PageScaffold.vue";
import Button from "@/components/common/Button.vue";
import FloatingActionButton from "@/components/common/FloatingActionButton.vue";

const router = useRouter();
const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();

const todayStr = new Date().toISOString().slice(0, 10);

// 节奏指标数据
const rhythmIndicators = computed(() => [
  {
    key: 'morning',
    icon: '🌅',
    label: '晨间启动',
    isActive: isMorningActive(),
    isCompleted: isMorningCompleted(),
    isOverdue: isMorningOverdue()
  },
  {
    key: 'focus',
    icon: '🎯',
    label: '专注时段',
    isActive: isFocusActive(),
    isCompleted: isFocusCompleted(),
    isOverdue: isFocusOverdue()
  },
  {
    key: 'review',
    icon: '📝',
    label: '晚间复盘',
    isActive: isReviewActive(),
    isCompleted: isReviewCompleted(),
    isOverdue: isReviewOverdue()
  }
]);

// 今日统计数据
const todayStats = computed(() => {
  const todayTasks = taskStore.tasks.filter((t: any) => t.task_date === todayStr);
  const completedTasks = todayTasks.filter((t: any) => t.status === 'done').length;
  
  return {
    totalTasks: todayTasks.length,
    completedTasks,
    pendingTasks: todayTasks.length - completedTasks
  };
});

// 节奏分数计算
const rhythmScore = computed(() => {
  const activeIndicators = rhythmIndicators.value.filter(i => i.isActive);
  if (activeIndicators.length === 0) return 100;
  
  const completedCount = activeIndicators.filter(i => i.isCompleted).length;
  return Math.round((completedCount / activeIndicators.length) * 100);
});

// 节奏指标状态判断函数
function isMorningActive(): boolean {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 12;
}

function isMorningCompleted(): boolean {
  // 检查是否有早上完成的任务
  const morningTasks = taskStore.tasks.filter((t: any) => {
    if (t.task_date !== todayStr || t.status !== 'done') return false;
    const taskHour = new Date(`${todayStr}T${t.start_time || '09:00'}`).getHours();
    return taskHour >= 6 && taskHour < 12;
  });
  return morningTasks.length > 0;
}

function isMorningOverdue(): boolean {
  const hour = new Date().getHours();
  return hour >= 12 && !isMorningCompleted();
}

function isFocusActive(): boolean {
  const hour = new Date().getHours();
  return hour >= 14 && hour < 18;
}

function isFocusCompleted(): boolean {
  // 检查下午是否有足够的任务完成
  const afternoonTasks = taskStore.tasks.filter((t: any) => {
    if (t.task_date !== todayStr || t.status !== 'done') return false;
    const taskHour = new Date(`${todayStr}T${t.start_time || '15:00'}`).getHours();
    return taskHour >= 14 && taskHour < 18;
  });
  return afternoonTasks.length >= 2;
}

function isFocusOverdue(): boolean {
  const hour = new Date().getHours();
  return hour >= 18 && !isFocusCompleted();
}

function isReviewActive(): boolean {
  const hour = new Date().getHours();
  return hour >= 19 && hour < 22;
}

function isReviewCompleted(): boolean {
  // 检查晚上是否完成复盘相关任务
  const eveningTasks = taskStore.tasks.filter((t: any) => {
    if (t.task_date !== todayStr || t.status !== 'done') return false;
    const taskHour = new Date(`${todayStr}T${t.start_time || '20:00'}`).getHours();
    return taskHour >= 19 && taskHour < 22;
  });
  return eveningTasks.some(t => t.title.includes('复盘') || t.title.includes('总结'));
}

function isReviewOverdue(): boolean {
  const hour = new Date().getHours();
  return hour >= 22 && !isReviewCompleted();
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

function refreshData() {
  // 刷新数据
  taskStore.loadTasks();
  scheduleStore.load(todayStr);
}

onMounted(() => {
  refreshData();
});
const isMobile = ref(window.innerWidth <= 768);

// 监听窗口大小变化
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth <= 768;
});

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.home-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: var(--space-4);
}

/* 今日节奏条 */
.rhythm-bar {
  background: linear-gradient(135deg, var(--ai-bg) 0%, var(--bg-card) 100%);
  border-left: 4px solid var(--ai-main);
  padding: var(--space-5);
}

.rhythm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.rhythm-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-main);
}

.rhythm-score {
  text-align: right;
}

.score-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--ai-main);
  font-variant-numeric: tabular-nums;
}

.score-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.rhythm-indicators {
  display: flex;
  justify-content: space-around;
  margin-bottom: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--bg-main);
  border: 2px solid transparent;
  transition: all 0.3s;
  min-width: 100px;
}

.indicator.active {
  border-color: var(--ai-main);
  background: var(--ai-bg);
  transform: scale(1.05);
}

.indicator.completed {
  border-color: var(--success);
  background: var(--success-bg);
}

.indicator.overdue {
  border-color: var(--error);
  background: var(--error-bg);
  animation: pulse 2s infinite;
}

.indicator-icon {
  font-size: 24px;
}

.indicator-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
  text-align: center;
}

.indicator-progress {
  font-size: 12px;
  font-weight: 600;
  color: var(--ai-main);
}

.rhythm-summary {
  display: flex;
  justify-content: space-around;
  gap: var(--space-4);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.summary-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.summary-value.success {
  color: var(--success);
}

.summary-value.warning {
  color: var(--warning);
}

/* 4层结构布局 */
.home-primary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
  margin-bottom: var(--space-4);
}

.plan-section,
.task-section {
  min-width: 0;
}

/* 桌面端战略与执行分离 */
.desktop-strategy {
  /* 左侧：战略层 */
}

.desktop-execution {
  /* 右侧：执行层 */
}



@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* 响应式设计 */

/* 平板端优化 */
@media (min-width: 769px) and (max-width: 1024px) {
  .home-primary {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .rhythm-indicators {
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  
  .indicator {
    min-width: 80px;
    padding: var(--space-2);
  }
  
  .actions-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  /* 桌面操作按钮显示 */
  .desktop-actions {
    display: flex !important;
  }
  
  .mobile-cta {
    display: none !important;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .rhythm-bar {
    padding: var(--space-4);
  }
  
  .rhythm-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .rhythm-score {
    text-align: left;
  }
  
  .rhythm-indicators {
    justify-content: space-between;
  }
  
  .indicator {
    min-width: 70px;
    padding: var(--space-2);
  }
  
  .indicator-label {
    font-size: 12px;
  }
  
  .rhythm-summary {
    flex-direction: column;
    gap: var(--space-2);
  }
  
  /* 移动端布局调整 */
  .home-primary {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-btn {
    padding: var(--space-3);
  }
  
  /* 移动端CTA按钮 */
  .desktop-actions {
    display: none !important;
  }
  
  .mobile-cta {
    display: flex !important;
    gap: var(--space-2);
    align-items: center;
  }
  
  .cta-main {
    flex: 1;
    justify-content: center;
  }
  
  .cta-icon {
    font-size: 18px;
    margin-right: var(--space-1);
  }
  
  .cta-text {
    font-size: 14px;
  }
  
  .cta-toggle {
    min-width: 40px;
    padding: 0;
  }
  
  /* 移动端快捷操作模态框 */
  .mobile-expanded {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 400px;
    z-index: var(--z-modal);
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--border-main);
  }
}

/* 极小屏优化 */
@media (max-width: 480px) {
  .cta-text {
    display: none; /* 隐藏文字只留图标 */
  }
  
  .indicator {
    min-width: 60px;
    padding: var(--space-1);
  }
  
  .indicator-label {
    font-size: 11px;
  }
  
  .score-value {
    font-size: 20px;
  }
}
</style>
