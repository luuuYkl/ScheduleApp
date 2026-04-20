<!--
  ═══════════════════════════════════════════════════════════════
  今日页面 (HomePage.vue)
  ═══════════════════════════════════════════════════════════════
  
  【页面定位】
  应用的核心入口页，展示用户今日的任务安排和长期计划概览。
  
  【核心功能】
  1. 今日仪表盘 - 快速概览今日待办/已完成/专注/计划进度
  2. 时间轴视图 - 展示今日任务的时间分布，支持点击跳转详情
  
  【布局结构】
  ┌─────────────────────────────────────────────────────────┐
  │  顶栏:  今日 · 4月17日 星期四    [专注模式] [添加任务]   │
  ├─────────────────────────────────────────────────────────┤
  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────────┐      │
  │  │ 待办  │ │ 已完成│ │ 专注  │ │ 🎯 计划进度      │      │
  │  │  5   │ │  3   │ │ 2h30 │ │ ██████░░ 75%     │      │
  │  └──────┘ └──────┘ └──────┘ └──────────────────┘      │
  ├─────────────────────────────────────────────────────────┤
  │  [时间轴视图 - TimelineView]                             │
  └─────────────────────────────────────────────────────────┘
-->
<template>
  <PageScaffold 
    class="layer-context"
  >
    <!-- ========== 顶栏操作区 ========== -->
    <template #actions>
      <div class="desktop-cta priority-essential">
        <Button 
          variant="secondary" 
          size="small" 
          @click="goToFocusMode"
          class="focus-btn"
        >
          <span class="focus-icon">🎯</span>
          <span class="focus-text">专注模式</span>
        </Button>
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

    <!-- ========== 主内容区 ========== -->
    <div class="home-content">
      <!-- 今日仪表盘摘要卡片 -->
      <div class="dashboard-summary">
        <div class="summary-card summary-pending" @click="goToCreateTask">
          <div class="summary-icon">📋</div>
          <div class="summary-info">
            <span class="summary-value">{{ pendingCount }}</span>
            <span class="summary-label">待办</span>
          </div>
        </div>
        <div class="summary-card summary-done">
          <div class="summary-icon">✅</div>
          <div class="summary-info">
            <span class="summary-value">{{ completedCount }}</span>
            <span class="summary-label">已完成</span>
          </div>
        </div>
        <div class="summary-card summary-focus" @click="goToFocusMode">
          <div class="summary-icon">🎯</div>
          <div class="summary-info">
            <span class="summary-value">{{ focusTimeToday }}</span>
            <span class="summary-label">专注</span>
          </div>
        </div>
        <div class="summary-card summary-plan">
          <div class="summary-icon">📊</div>
          <div class="summary-info">
            <div class="summary-progress">
              <div class="progress-bar-mini">
                <div class="progress-fill-mini" :style="{ width: planProgress + '%' }"></div>
              </div>
              <span class="progress-text">{{ planProgress }}%</span>
            </div>
            <span class="summary-label">计划进度</span>
          </div>
        </div>
      </div>

      <!-- 时间轴视图 - 展示今日任务的时间分布 -->
      <div class="timeline-section">
        <TimelineView />
      </div>
    </div>
    
    <!-- ========== 浮动操作区 ========== -->
    <div class="desktop-fab priority-low">
      <FloatingActionButton />
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════
// 依赖导入
// ═══════════════════════════════════════════════════════════════
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

// 状态管理
import { useTaskStore } from "@/store/tasks";       // 任务数据仓库
import { useScheduleStore } from "@/store/schedules"; // 日程数据仓库

// 子组件
import TimelineView from "@/components/home/TimelineView.vue";         // 时间轴组件
import PageScaffold from "@/components/common/PageScaffold.vue";       // 页面脚手架
import Button from "@/components/common/Button.vue";                   // 通用按钮
import FloatingActionButton from "@/components/common/FloatingActionButton.vue"; // 浮动操作按钮

// ═══════════════════════════════════════════════════════════════
// 初始化
// ═══════════════════════════════════════════════════════════════
const router = useRouter();
const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();

// 今日日期字符串 (YYYY-MM-DD格式)
const todayStr = new Date().toISOString().slice(0, 10);

// ═══════════════════════════════════════════════════════════════
// 仪表盘计算属性
// ═══════════════════════════════════════════════════════════════
const todayLabel = computed(() => {
  const now = new Date();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return `${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
});

const pendingCount = computed(() => {
  return taskStore.tasks.filter(t => 
    t.start_date <= todayStr && t.end_date >= todayStr && t.status !== 'done'
  ).length;
});

const completedCount = computed(() => {
  return taskStore.tasks.filter(t => 
    t.start_date <= todayStr && t.end_date >= todayStr && t.status === 'done'
  ).length;
});

const focusTimeToday = computed(() => {
  // 简化：返回任务总数作为估算
  const total = pendingCount.value + completedCount.value;
  if (total === 0) return '0h';
  const hours = Math.round(total * 0.5 * 10) / 10;
  return `${hours}h`;
});

const planProgress = computed(() => {
  const tasks = taskStore.tasks.filter(t => 
    t.start_date <= todayStr && t.end_date >= todayStr
  );
  if (tasks.length === 0) return 0;
  const done = tasks.filter(t => t.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
});

// ═══════════════════════════════════════════════════════════════
// 导航函数 - 路由跳转
// ═══════════════════════════════════════════════════════════════
function goToCreatePlan() {
  router.push('/plan/create');  // 跳转至计划创建页
}

function goToCreateTask() {
  router.push('/task/create');  // 跳转至任务创建页
}

function goToFocusMode() {
  router.push('/focus');  // 跳转至专注模式页
}

function goToCreateSchedule() {
  router.push('/schedule');     // 跳转至日程页
}

function goToCalendar() {
  router.push('/calendar');     // 跳转至日历页
}

// ═══════════════════════════════════════════════════════════════
// 生命周期 - 数据初始化
// ═══════════════════════════════════════════════════════════════
onMounted(() => {
  // 页面加载时获取任务和日程数据
  taskStore.loadTasks();
  scheduleStore.load(todayStr);
});
</script>

<style scoped>
.home-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  gap: var(--space-5);
}

/* ========== 今日仪表盘摘要卡片 ========== */
.dashboard-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  width: 100%;
  max-width: 900px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: default;
  transition: all 200ms var(--ease-standard);
}

.summary-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
  border-color: var(--border-main);
}

.summary-pending { cursor: pointer; }
.summary-focus { cursor: pointer; }

.summary-icon {
  font-size: 24px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.summary-pending .summary-icon {
  background: rgba(59, 130, 246, 0.1);
}

.summary-done .summary-icon {
  background: rgba(16, 185, 129, 0.1);
}

.summary-focus .summary-icon {
  background: rgba(239, 68, 68, 0.1);
}

.summary-plan .summary-icon {
  background: rgba(168, 85, 247, 0.1);
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-emphasis);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.summary-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 计划进度条 */
.summary-progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.progress-bar-mini {
  flex: 1;
  height: 6px;
  background: var(--bg-card-hover);
  border-radius: var(--radius-full);
  overflow: hidden;
  min-width: 40px;
}

.progress-fill-mini {
  height: 100%;
  background: linear-gradient(90deg, var(--ai-main), #A855F7);
  border-radius: var(--radius-full);
  transition: width 0.5s var(--ease-standard);
}

.progress-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--ai-main);
  font-variant-numeric: tabular-nums;
}

/* 时间轴区域 */
.timeline-section {
  width: 100%;
  max-width: 900px;
  flex: 1;
}

/* 大屏幕优化 */
@media (min-width: 1400px) {
  .timeline-section {
    max-width: 1500px;
  }
  
  .dashboard-summary {
    max-width: 1500px;
  }
}

/* 中等屏幕适配 */
@media (min-width: 1024px) and (max-width: 1399px) {
  .timeline-section {
    max-width: 900px;
  }
  
  .dashboard-summary {
    max-width: 900px;
  }
}

/* 平板和小屏幕 */
@media (max-width: 1023px) {
  .home-content {
    padding: 0 var(--space-2);
  }
  
  .timeline-section {
    max-width: 100%;
  }
  
  .dashboard-summary {
    max-width: 100%;
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 浮动操作按钮区域 */
.desktop-fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: var(--z-fixed);
}

/* 顶栏按钮 */
.desktop-cta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.focus-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.focus-icon {
  font-size: 16px;
}

.focus-text {
  font-size: 14px;
  font-weight: 500;
}

.cta-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cta-icon {
  font-size: 16px;
  font-weight: 600;
}

.cta-text {
  font-size: 14px;
  font-weight: 500;
}
</style>
