<template>
  <PageScaffold 
    title=""
    show-back-button={false}
    class="layer-context"
  >
    <template #actions>
      <!-- 刷新按钮已移除 -->
      <div class="mobile-cta priority-essential">
        <Button 
          variant="primary" 
          size="small" 
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
        <!-- 标题和完成度已移除 -->
        
        <!-- 节奏指标已移除 -->
        
        <div class="rhythm-summary">
          <div class="summary-item">
            <span class="summary-label">今日任务</span>
            <span class="summary-value">{{ todayStats.totalTasks }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">已完成</span>
            <span class="summary-value success">{{ todayStats.completedTasks }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">待处理</span>
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
    
    <!-- 移动端双按钮 - 保留文本 -->
    <div v-if="isMobile" class="mobile-double-buttons priority-essential">
      <Button 
        variant="primary" 
        size="small" 
        @click="goToCreateTask"
        class="btn-with-text"
      >
        <span class="btn-icon">+</span>
        <span class="btn-text">添加任务</span>
      </Button>
      <Button 
        variant="outline" 
        size="small" 
        @click="goToCalendar"
        class="btn-with-icon"
      >
        <span class="btn-icon">📅</span>
      </Button>
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

// 节奏指标已移除

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

// 节奏分数计算（基于任务完成率）
const rhythmScore = computed(() => {
  if (todayStats.value.totalTasks === 0) return 100;
  return Math.round((todayStats.value.completedTasks / todayStats.value.totalTasks) * 100);
});

// 节奏指标相关函数已移除

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

// 刷新数据功能已移除
// function refreshData() {
//   taskStore.loadTasks();
//   scheduleStore.load(todayStr);
// }

onMounted(() => {
  // 数据初始化
  taskStore.loadTasks();
  scheduleStore.load(todayStr);
});
const isMobile = ref(window.innerWidth <= 768);

// 监听窗口大小变化
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth <= 768;
});
</script>

<style scoped>
.home-content {
  width: 100%;
  margin: 0 auto;
  display: grid;
  gap: var(--space-6);
  padding: 0;
}

/* 今日节奏条 */
.rhythm-bar {
  background: linear-gradient(135deg, var(--ai-bg) 0%, var(--bg-card) 100%);
  border-left: 4px solid var(--ai-main);
  padding: var(--space-5);
}

/* 节奏标题和完成度样式已移除 */

/* 节奏指标样式已移除 */

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
  
  /* 节奏指标样式已移除 */
  
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
  .home-content {
    padding: 0 var(--space-4); /* 移动端适当减少padding */
  }
  .rhythm-bar {
    padding: var(--space-4);
  }
  
  /* 节奏标题和完成度样式已移除 */
  
  /* 节奏指标样式已移除 */
  
  .rhythm-summary {
    flex-direction: row; /* 保持横向排列 */
    justify-content: space-around;
    gap: var(--space-3);
    flex-wrap: wrap; /* 允许换行以适应小屏幕 */
  }
  
  .summary-item {
    flex: 1;
    min-width: 80px; /* 确保最小宽度 */
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
  
  /* 移动端双按钮布局 */
  .desktop-actions {
    display: none !important;
  }
  
  .mobile-cta {
    display: none !important;
  }
  
  .mobile-double-buttons {
    position: sticky;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: var(--space-3);
    z-index: var(--z-fixed);
  }
  
  .btn-with-text,
  .btn-with-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    padding: var(--space-3) var(--space-4);
  }
  
  .btn-with-text {
    flex: 1;
  }
  
  .btn-icon {
    font-size: 18px;
    margin-right: var(--space-2);
  }
  
  .btn-text {
    font-size: 14px;
    font-weight: 500;
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
  .btn-text {
    display: inline; /* 保留主按钮文字 */
  }
  
  /* 节奏统计在极小屏的优化 - 只显示数字 */
  .rhythm-summary {
    gap: var(--space-1);
    padding: 0 var(--space-1);
    justify-content: space-between;
  }
  
  .summary-item {
    min-width: auto;
    flex: 1;
    padding: var(--space-1) 0;
    align-items: center;
  }
  
  .summary-label {
    display: none; /* 隐藏文字标签 */
  }
  
  .summary-value {
    font-size: 18px; /* 稍微增大数字字体 */
    font-weight: 700;
  }
  
  .summary-value.success {
    color: var(--success);
  }
  
  .summary-value.warning {
    color: var(--warning);
  }
  
  .mobile-double-buttons {
    gap: var(--space-2);
  }
  
  .btn-with-text,
  .btn-with-icon {
    min-width: 100px;
    padding: var(--space-2) var(--space-3);
  }
  
  .indicator {
    min-width: 60px;
    padding: var(--space-1);
  }
  
  .indicator-label {
    font-size: 11px;
  }
  
  /* 完成度样式已移除 */
}
</style>
