<!--
  ═══════════════════════════════════════════════════════════════
  今日页面 (HomePage.vue)
  ═══════════════════════════════════════════════════════════════
  
  【页面定位】
  应用的核心入口页，展示用户今日的任务安排和长期计划概览。
  
  【核心功能】
  1. 时间轴视图 - 展示今日任务的时间分布，支持点击跳转详情
  2. 计划概览 - 展示长期计划列表及其进度状态
  
  【布局结构】
  ┌─────────────────────────────────────────────────────────┐
  │  顶栏: [返回] 标题           [添加任务按钮]              │
  ├─────────────────────────────────────────────────────────┤
  │  ┌──────────────────┐  ┌──────────────────┐            │
  │  │   时间轴视图      │  │   计划概览        │            │
  │  │   TimelineView   │  │   PlanOverview   │            │
  │  └──────────────────┘  └──────────────────┘            │
  ├─────────────────────────────────────────────────────────┤
  │  [浮动按钮-FAB]                                         │
  └─────────────────────────────────────────────────────────┘
  
  【关联组件】
  - TimelineView: 时间轴组件，显示今日任务
  - PlanOverview: 计划概览组件，显示长期计划
  - FloatingActionButton: 浮动操作按钮
  - PageScaffold: 页面脚手架，提供统一布局框架
-->
<template>
  <PageScaffold 
    title=""
    show-back-button={false}
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
    <div class="home-content layout-template-l">
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
  gap: var(--space-4);
}

/* 时间轴区域 - 单列布局 */
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
}

/* 中等屏幕适配 */
@media (min-width: 1024px) and (max-width: 1399px) {
  .timeline-section {
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

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
</style>