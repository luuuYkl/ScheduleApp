<template>
  <div class="plan-tasks-layout">
    <!-- 左侧导航 -->
    <aside class="sidebar-nav">
      <div class="sidebar-header">
        <h3>📋 计划</h3>
        <button class="sidebar-add-btn" @click="goToCreatePlan" title="新建计划">
          +
        </button>
      </div>
      
      <div class="plan-list-nav">
        <div
          v-for="plan in plansList"
          :key="plan.id"
          :class="['plan-nav-item', { active: plan.id === planId }]"
          @click="switchPlan(plan.id)"
        >
          <span class="plan-nav-title">{{ plan.title }}</span>
          <span class="plan-nav-status" :class="getPlanStatusClass(plan)">
            {{ getPlanStatusText(plan) }}
          </span>
        </div>
        
        <div v-if="plansList.length === 0" class="nav-empty">
          <span>暂无计划</span>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 计划标题与描述 -->
      <header class="plan-header">
        <div class="plan-info">
          <h1 class="plan-title">
            <span class="plan-id">#{{ planId }}</span>
            {{ currentPlan?.title || '任务管理' }}
          </h1>
          <p v-if="currentPlan?.description" class="plan-description">
            {{ currentPlan.description }}
          </p>
          <div class="plan-meta">
            <span v-if="planStartDate" class="meta-item">
              📅 {{ formatDate(planStartDate) }} - {{ formatDate(planEndDate) }}
            </span>
            <span class="meta-item">
              ✅ {{ taskStats.total }} 个任务
            </span>
          </div>
        </div>
      </header>

      <!-- 本周目标摘要（简洁信息条） -->
      <div class="weekly-summary-bar">
        <span class="summary-icon">🎯</span>
        <span class="summary-label">本周目标</span>
        <span class="summary-percent" :class="getPercentClass(weeklyStats.completionRate)">
          {{ weeklyStats.completionRate }}%
        </span>
        <span class="summary-detail">
          {{ weeklyStats.completed }}/{{ weeklyStats.total }} 已完成
        </span>
        <div v-if="weeklyStats.remaining > 0" class="summary-remaining">
          · 剩余 {{ weeklyStats.remaining }} 项
        </div>
      </div>

      <!-- 任务操作区（一行式） -->
      <div class="quick-add-bar">
        <input
          v-model.trim="quickForm.title"
          type="text"
          placeholder="添加新任务..."
          class="quick-input"
          @keyup.enter="quickAddTask"
        />
        <input
          v-model="quickForm.task_date"
          type="date"
          class="quick-date"
          :min="planStartDate"
          :max="planEndDate"
        />
        <select v-model="quickForm.repeat_type" class="quick-select">
          <option value="none">不重复</option>
          <option value="daily">每日</option>
          <option value="monthly">每月</option>
        </select>
        <button 
          class="quick-add-btn" 
          @click="quickAddTask"
          :disabled="submitting || !quickForm.title"
        >
          {{ submitting ? '...' : '添加' }}
        </button>
      </div>

      <!-- 任务列表区 -->
      <div class="task-list-section">
        <!-- 筛选控制栏 -->
        <div class="list-controls">
          <div class="filter-chips">
            <button
              v-for="filter in statusFilters"
              :key="filter.key"
              :class="['filter-chip', { active: activeFilter === filter.key }]"
              @click="activeFilter = filter.key"
            >
              {{ filter.label }}
              <span v-if="filter.count > 0" class="chip-count">{{ filter.count }}</span>
            </button>
          </div>
          
          <div class="view-toggle">
            <button
              :class="['toggle-btn', { active: viewMode === 'grouped' }]"
              @click="viewMode = 'grouped'"
              title="分组视图"
            >
              ☰
            </button>
            <button
              :class="['toggle-btn', { active: viewMode === 'flat' }]"
              @click="viewMode = 'flat'"
              title="列表视图"
            >
              ≡
            </button>
            <button
              :class="['toggle-btn', { active: viewMode === 'month' }]"
              @click="viewMode = 'month'"
              title="月视图"
            >
              📅
            </button>
          </div>
        </div>

        <!-- 任务列表 -->
        <div class="task-list-container">
          <!-- 月视图 -->
          <div v-if="viewMode === 'month'" class="month-view-container">
            <!-- 月视图导航（横向并置） -->
            <div class="month-nav-compact">
              <button class="nav-compact" @click="goPrevMonth" title="上个月">←</button>
              <span class="month-label-compact">{{ monthLabel }}</span>
              <button class="nav-compact" @click="goNextMonth" title="下个月">→</button>
              <div class="nav-divider"></div>
              <button class="today-compact" @click="goToToday">今天</button>
            </div>

            <!-- 日历网格（弹性高度） -->
            <div class="calendar-wrapper">
              <div class="calendar-grid">
                <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
                
                <!-- 空白填充 -->
                <div
                  v-for="blank in leadingBlanks"
                  :key="'blank-' + blank"
                  class="calendar-cell blank-cell"
                ></div>
                
                <!-- 日期单元格 -->
                <div
                  v-for="day in calendarDays"
                  :key="day.date"
                  class="calendar-cell"
                  :class="{
                    'is-today': day.isToday,
                    'has-tasks': day.tasks.length > 0,
                    'all-done': day.allDone
                  }"
                  @click="selectCalendarDay(day)"
                >
                  <span class="cell-date">{{ day.day }}</span>
                  <div v-if="day.tasks.length > 0" class="task-indicators">
                    <div
                      v-for="(task, idx) in day.tasks.slice(0, 4)"
                      :key="'task-' + idx"
                      class="task-dot"
                      :class="{ 'task-done': task.status === 'done' }"
                      :title="task.title"
                    ></div>
                    <div v-if="day.tasks.length > 4" class="more-tasks">
                      +{{ day.tasks.length - 4 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 选中日期的任务详情 -->
            <div v-if="selectedCalendarDay" class="selected-day-tasks">
              <div class="selected-day-header">
                <h3>{{ selectedCalendarDay.date }}</h3>
                <button class="close-btn" @click="selectedCalendarDay = null">✕</button>
              </div>
              <ul class="selected-day-list">
                <li
                  v-for="task in selectedCalendarDay.tasks"
                  :key="task.id"
                  class="selected-task-item"
                  :class="{ completed: task.status === 'done' }"
                >
                  <input
                    type="checkbox"
                    :checked="task.status === 'done'"
                    @change="toggleTask(task)"
                  />
                  <span class="task-title">{{ task.title }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div v-if="viewMode !== 'month' && filteredGroups.length > 0" class="task-groups">
            <div
              v-for="group in filteredGroups"
              :key="group.key"
              class="task-group"
              :class="`group-${group.type}`"
            >
              <div class="group-header">
                <span class="group-icon">{{ group.icon }}</span>
                <span class="group-title">{{ group.title }}</span>
                <span class="group-count">{{ group.tasks.length }}</span>
              </div>
              
              <ul class="task-list">
                <li
                  v-for="task in group.tasks"
                  :key="task.id"
                  class="task-item"
                  :class="{ completed: task.status === 'done' }"
                >
                  <!-- 编辑态 -->
                  <template v-if="editingId === task.id">
                    <div class="task-edit-form">
                      <input v-model="editForm.title" type="text" class="edit-input" />
                      <input v-model="editForm.task_date" type="date" class="edit-date" />
                      <button class="edit-save" @click="saveEdit">✓</button>
                      <button class="edit-cancel" @click="cancelEdit">✕</button>
                    </div>
                  </template>
                  
                  <!-- 展示态 -->
                  <template v-else>
                    <input
                      type="checkbox"
                      class="task-checkbox"
                      :checked="task.status === 'done'"
                      @change="toggleTask(task)"
                    />
                    <span class="task-status-dot" :class="task.status"></span>
                    <div class="task-content">
                      <span class="task-title">{{ task.title }}</span>
                      <div class="task-meta">
                        <span class="task-date">{{ formatDateShort(task.task_date) }}</span>
                        <span v-if="task.repeat_type && task.repeat_type !== 'none'" class="task-repeat">
                          {{ task.repeat_type === 'daily' ? '📅 每日' : '📆 每月' }}
                        </span>
                        <span v-if="task.note" class="task-note">{{ task.note }}</span>
                      </div>
                    </div>
                    <div class="task-actions">
                      <button class="action-btn" @click="startEdit(task)" title="编辑">✏️</button>
                      <button class="action-btn delete" @click="deleteTask(task)" title="删除">🗑️</button>
                    </div>
                  </template>
                </li>
              </ul>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-state">
            <div class="empty-icon">📝</div>
            <p class="empty-title">暂无任务</p>
            <p class="empty-hint">在上方输入框添加你的第一个任务</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { usePlanStore } from "@/store/plans";
import { useUserStore } from "@/store/user";

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const planStore = usePlanStore();
const userStore = useUserStore();

const planId = Number(route.params.id);

// ========== 状态 ==========
const viewMode = ref<'grouped' | 'flat' | 'month'>('grouped');
const activeFilter = ref<string>('all');
const submitting = ref(false);
const editingId = ref<number | null>(null);

// 月视图状态
const currentDate = ref(new Date());
const selectedCalendarDay = ref<{date: string; tasks: any[]; allDone: boolean} | null>(null);
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

// 快速添加表单
const quickForm = reactive({
  title: "",
  task_date: new Date().toISOString().slice(0, 10),
  repeat_type: "none" as "none" | "daily" | "monthly",
});

// 编辑表单
const editForm = reactive({
  id: 0,
  title: "",
  task_date: "",
});

// 筛选选项
const statusFilters = computed(() => [
  { key: 'all', label: '全部', count: taskStore.tasks.filter(t => t.plan_id === planId).length },
  { key: 'pending', label: '待完成', count: taskStore.tasks.filter(t => t.plan_id === planId && t.status !== 'done').length },
  { key: 'done', label: '已完成', count: taskStore.tasks.filter(t => t.plan_id === planId && t.status === 'done').length },
]);

// ========== 计算属性 ==========

const plansList = computed(() => planStore.plans);

const currentPlan = computed(() =>
  planStore.plans.find((p: any) => p.id === planId)
);

const planStartDate = computed(() => currentPlan.value?.start_date || "");
const planEndDate = computed(() => currentPlan.value?.end_date || "");

const taskStats = computed(() => {
  const tasks = taskStore.tasks.filter(t => t.plan_id === planId);
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
  };
});

// 本周统计
const weeklyStats = computed(() => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const weekTasks = taskStore.tasks.filter(t =>
    t.plan_id === planId &&
    t.task_date >= weekStartStr &&
    t.task_date <= weekEndStr
  );

  const completed = weekTasks.filter(t => t.status === 'done').length;
  const total = weekTasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, completionRate, remaining: total - completed };
});

// 任务分组
const filteredGroups = computed(() => {
  let tasks = taskStore.tasks.filter(t => t.plan_id === planId);

  // 状态筛选
  if (activeFilter.value === 'pending') {
    tasks = tasks.filter(t => t.status !== 'done');
  } else if (activeFilter.value === 'done') {
    tasks = tasks.filter(t => t.status === 'done');
  }

  if (viewMode.value === 'flat') {
    return [{
      key: 'all',
      type: 'flat',
      icon: '📋',
      title: '所有任务',
      tasks: tasks.sort((a, b) => a.task_date.localeCompare(b.task_date))
    }];
  }

  const groups: Array<{key: string; type: string; icon: string; title: string; tasks: any[]}> = [];
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // 今天
  const todayTasks = tasks.filter(t => t.task_date === today);
  if (todayTasks.length > 0) {
    groups.push({ key: 'today', type: 'today', icon: '📌', title: '今天', tasks: todayTasks });
  }

  // 明天
  const tomorrowTasks = tasks.filter(t => t.task_date === tomorrow);
  if (tomorrowTasks.length > 0) {
    groups.push({ key: 'tomorrow', type: 'future', icon: '📅', title: '明天', tasks: tomorrowTasks });
  }

  // 本周
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekTasks = tasks.filter(t => {
    const taskDate = new Date(t.task_date);
    return t.task_date !== today &&
           t.task_date !== tomorrow &&
           taskDate >= weekStart &&
           taskDate <= weekEnd;
  });
  if (weekTasks.length > 0) {
    groups.push({
      key: 'this-week',
      type: 'week',
      icon: '📆',
      title: '本周',
      tasks: weekTasks.sort((a, b) => a.task_date.localeCompare(b.task_date))
    });
  }

  // 逾期
  const overdueTasks = tasks.filter(t => t.task_date < today && t.status !== 'done');
  if (overdueTasks.length > 0) {
    groups.push({
      key: 'overdue',
      type: 'overdue',
      icon: '⚠️',
      title: '逾期',
      tasks: overdueTasks.sort((a, b) => a.task_date.localeCompare(b.task_date))
    });
  }

  // 未来
  const futureTasks = tasks.filter(t => t.task_date > weekEnd.toISOString().slice(0, 10));
  if (futureTasks.length > 0) {
    groups.push({
      key: 'future',
      type: 'future',
      icon: '🗓️',
      title: '未来',
      tasks: futureTasks.sort((a, b) => a.task_date.localeCompare(b.task_date))
    });
  }

  return groups;
});

// ========== 月视图计算属性 ==========

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days = [];
  
  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const tasks = taskStore.tasks.filter(t => 
      t.plan_id === planId && t.task_date === dateStr
    );
    const allDone = tasks.length > 0 && tasks.every(t => t.status === 'done');
    
    days.push({
      date: dateStr,
      day,
      tasks,
      allDone,
      isToday: dateStr === new Date().toISOString().slice(0, 10)
    });
  }
  
  return days;
});

const leadingBlanks = computed(() => {
  const firstDay = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1).getDay();
  return Array.from({ length: firstDay }, (_, i) => i);
});

const monthLabel = computed(() => {
  return `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`;
});

// ========== 方法 ==========

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return '今天';
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (dateStr === tomorrow) return '明天';
  return dateStr.slice(5);
}

function getPercentClass(percent: number): string {
  if (percent >= 80) return 'high';
  if (percent >= 50) return 'medium';
  return 'low';
}

function getPlanStatusClass(plan: any): string {
  const statusMap: Record<string, string> = {
    'NOT_STARTED': 'status-pending',
    'IN_PROGRESS': 'status-active',
    'COMPLETED': 'status-done',
  };
  return statusMap[plan.status] || 'status-pending';
}

function getPlanStatusText(plan: any): string {
  const statusMap: Record<string, string> = {
    'NOT_STARTED': '未开始',
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成',
  };
  return statusMap[plan.status] || '未知';
}

function switchPlan(id: number) {
  router.push(`/plan/${id}/tasks`);
}

function goToCreatePlan() {
  router.push('/plan/create');
}

// 快速添加任务
async function quickAddTask() {
  if (!quickForm.title) return;

  const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id") || 0);
  if (!userId) return alert("请先登录");

  submitting.value = true;
  try {
    await taskStore.createTask({
      plan_id: planId,
      user_id: userId,
      title: quickForm.title,
      task_date: quickForm.task_date,
      repeat_type: quickForm.repeat_type,
    });

    // 重置
    quickForm.title = "";
    quickForm.repeat_type = "none";

    await taskStore.loadTasks(planId);
  } catch (e: any) {
    alert(e?.message || "添加失败");
  } finally {
    submitting.value = false;
  }
}

// 切换任务状态
async function toggleTask(task: any) {
  await taskStore.toggleTaskStatus(task.id);
  await taskStore.loadTasks(planId);
}

// 开始编辑
function startEdit(task: any) {
  editingId.value = task.id;
  editForm.id = task.id;
  editForm.title = task.title;
  editForm.task_date = task.task_date;
}

// 取消编辑
function cancelEdit() {
  editingId.value = null;
}

// 保存编辑
async function saveEdit() {
  await taskStore.updateTask(editForm.id, {
    title: editForm.title,
    task_date: editForm.task_date,
  });
  editingId.value = null;
  await taskStore.loadTasks(planId);
}

// 删除任务
async function deleteTask(task: any) {
  if (!confirm(`确认删除任务「${task.title}」？`)) return;
  await taskStore.deleteTask(task.id);
  await taskStore.loadTasks(planId);
}

// ========== 月视图方法 ==========

function goPrevMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
}

function goNextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
}

function goToToday() {
  currentDate.value = new Date();
}

function selectCalendarDay(day: any) {
  selectedCalendarDay.value = day;
}

// ========== 生命周期 ==========

onMounted(async () => {
  await Promise.all([
    taskStore.loadTasks(planId),
    planStore.loadPlans(),
  ]);
});
</script>

<style scoped>
/* ========== 整体布局 ========== */
.plan-tasks-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
  background: var(--bg-main);
}

/* ========== 左侧导航 ========== */
.sidebar-nav {
  background: var(--bg-card);
  border-right: 1px solid var(--border-main);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.sidebar-add-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--ai-main);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.sidebar-add-btn:hover {
  background: var(--ai-light);
  transform: scale(1.05);
}

.plan-list-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.plan-nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: var(--space-1);
}

.plan-nav-item:hover {
  background: var(--bg-card-hover);
}

.plan-nav-item.active {
  background: var(--ai-bg);
  border-left: 3px solid var(--ai-main);
}

.plan-nav-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.plan-nav-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.status-pending {
  background: var(--warning-bg);
  color: var(--warning);
}

.status-active {
  background: var(--ai-bg);
  color: var(--ai-main);
}

.status-done {
  background: var(--success-bg);
  color: var(--success);
}

.nav-empty {
  text-align: center;
  padding: var(--space-4);
  color: var(--text-muted);
  font-size: 13px;
}

/* ========== 主内容区 ========== */
.main-content {
  display: flex;
  flex-direction: column;
  padding: var(--space-5);
  gap: var(--space-4);
  overflow-y: auto;
}

/* ========== 计划头部 ========== */
.plan-header {
  margin-bottom: var(--space-2);
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.plan-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-emphasis);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.plan-id {
  font-size: 16px;
  font-weight: 400;
  color: var(--text-muted);
}

.plan-description {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.plan-meta {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-1);
}

.meta-item {
  font-size: 13px;
  color: var(--text-secondary);
}

/* ========== 本周目标摘要条 ========== */
.weekly-summary-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  font-size: 14px;
}

.summary-icon {
  font-size: 16px;
}

.summary-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.summary-percent {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.summary-percent.high {
  color: var(--success);
}

.summary-percent.medium {
  color: var(--warning);
}

.summary-percent.low {
  color: var(--error);
}

.summary-detail {
  color: var(--text-main);
}

.summary-remaining {
  color: var(--text-muted);
}

/* ========== 快速添加栏 ========== */
.quick-add-bar {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-main);
}

.quick-input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background: var(--bg-main);
  color: var(--text-main);
  min-width: 0;
}

.quick-input:focus {
  outline: none;
  border-color: var(--ai-main);
}

.quick-date,
.quick-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 13px;
  background: var(--bg-main);
  color: var(--text-main);
  flex-shrink: 0;
}

.quick-date {
  width: 140px;
}

.quick-select {
  width: 100px;
}

.quick-add-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--ai-main);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.quick-add-btn:hover:not(:disabled) {
  background: var(--ai-light);
}

.quick-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== 任务列表区 ========== */
.task-list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-main);
  overflow: hidden;
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
}

.filter-chips {
  display: flex;
  gap: var(--space-2);
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border-main);
  background: var(--bg-main);
  border-radius: var(--radius-full);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover {
  border-color: var(--ai-main);
  color: var(--text-main);
}

.filter-chip.active {
  background: var(--ai-main);
  border-color: var(--ai-main);
  color: white;
}

.chip-count {
  font-size: 11px;
  background: rgba(0,0,0,0.1);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.filter-chip.active .chip-count {
  background: rgba(255,255,255,0.2);
}

.view-toggle {
  display: flex;
  border: 1px solid var(--border-main);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.toggle-btn {
  padding: var(--space-1) var(--space-3);
  border: none;
  background: var(--bg-main);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--bg-card-hover);
}

.toggle-btn.active {
  background: var(--ai-main);
  color: white;
}

/* ========== 任务列表容器 ========== */
.task-list-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3);
}

.task-groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.task-group {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.group-icon {
  font-size: 14px;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.group-count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-main);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.group-today .group-header {
  background: var(--success-bg);
}

.group-overdue .group-header {
  background: var(--error-bg);
}

/* ========== 任务项 ========== */
.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.task-item:hover {
  background: var(--bg-card-hover);
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.task-checkbox {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
  flex-shrink: 0;
}

.task-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

.task-status-dot.pending {
  background: var(--warning);
}

.task-status-dot.done {
  background: var(--success);
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  line-height: 1.4;
}

.task-meta {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-1);
  font-size: 12px;
  color: var(--text-muted);
}

.task-date {
  color: var(--text-secondary);
}

.task-repeat {
  color: var(--ai-main);
}

.task-note {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.task-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity 0.2s;
}

.task-item:hover .task-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--bg-main);
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-elevated);
}

.action-btn.delete:hover {
  background: var(--error-bg);
}

/* ========== 编辑表单 ========== */
.task-edit-form {
  display: flex;
  gap: var(--space-2);
  width: 100%;
}

.edit-input {
  flex: 1;
  padding: var(--space-2);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background: var(--bg-main);
  color: var(--text-main);
}

.edit-date {
  padding: var(--space-2);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-sm);
  font-size: 13px;
  background: var(--bg-main);
  color: var(--text-main);
  width: 130px;
}

.edit-save,
.edit-cancel {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-save {
  background: var(--success);
  color: white;
}

.edit-cancel {
  background: var(--bg-main);
  color: var(--text-secondary);
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-3);
  opacity: 0.6;
}

.empty-title {
  margin: 0 0 var(--space-2);
  font-size: 16px;
  font-weight: 500;
  color: var(--text-main);
}

.empty-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

/* ========== 月视图样式 ========== */
.month-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 压缩导航栏（横向并置） */
.month-nav-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.nav-compact {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border-subtle);
  background: var(--bg-main);
  color: var(--text-main);
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 28px;
  height: 28px;
}

.nav-compact:hover {
  background: var(--bg-card-hover);
  border-color: var(--ai-main);
}

.month-label-compact {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  min-width: 100px;
  text-align: center;
}

.nav-divider {
  width: 1px;
  height: 16px;
  background: var(--border-subtle);
  flex-shrink: 0;
}

.today-compact {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--ai-main);
  background: var(--ai-bg);
  color: var(--ai-main);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.today-compact:hover {
  background: var(--ai-main);
  color: white;
}

/* 日历网格（弹性高度） */
.calendar-wrapper {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: var(--space-3) var(--space-3) 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 4px;
  height: 100%;
  min-height: 400px;
  background: rgba(120, 120, 120, 0.02);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  padding: var(--space-2);
}

.weekday {
  text-align: center;
  font-weight: 500;
  font-size: 11px;
  color: var(--text-muted);
  padding: var(--space-1) 0;
  letter-spacing: 0.05em;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-1);
  background: transparent;
  border: 1px solid rgba(120, 120, 120, 0.1);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 0;
}

.calendar-cell:hover {
  background: rgba(120, 120, 120, 0.08);
  border-color: rgba(79, 70, 229, 0.3);
  transform: translateY(-1px);
}

.calendar-cell.blank-cell {
  background: transparent;
  border: none;
  cursor: default;
  opacity: 0;
  pointer-events: none;
}

.calendar-cell.blank-cell:hover {
  transform: none;
}

/* 今天高亮（渐变） */
.calendar-cell.is-today {
  background: linear-gradient(135deg, 
    rgba(79, 70, 229, 0.12), 
    rgba(79, 70, 229, 0.06)
  );
  border: 1.5px solid rgba(79, 70, 229, 0.4);
}

.calendar-cell.is-today .cell-date {
  color: var(--ai-main);
  font-weight: 600;
}

.calendar-cell.has-tasks {
  background: rgba(120, 120, 120, 0.06);
}

.calendar-cell.all-done {
  background: linear-gradient(135deg,
    rgba(34, 197, 94, 0.1),
    rgba(34, 197, 94, 0.05)
  );
  border-color: rgba(34, 197, 94, 0.3);
}

.cell-date {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
}

/* 任务指示点（增强） */
.task-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
  align-items: center;
}

.task-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ai-main), var(--ai-light));
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
}

.task-dot.task-done {
  background: linear-gradient(135deg, var(--success), rgba(34, 197, 94, 0.6));
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.25);
  animation: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.95);
  }
}

.more-tasks {
  font-size: 9px;
  color: var(--text-muted);
  font-weight: 500;
  padding: 0 2px;
}

/* 侧滑详情面板 */
.selected-day-tasks {
  flex-shrink: 0;
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  max-height: 300px;
  overflow-y: auto;
}

.selected-day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.selected-day-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: var(--bg-main);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--error-bg);
  color: var(--error);
}

.selected-day-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.selected-task-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  margin-bottom: var(--space-1);
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
}

.selected-task-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-main);
}

.selected-task-item.completed .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.selected-task-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.selected-task-item .task-title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
}

/* ========== 响应式 ========== */
@media (max-width: 900px) {
  .plan-tasks-layout {
    grid-template-columns: 1fr;
  }

  .sidebar-nav {
    display: none;
  }

  .main-content {
    padding: var(--space-4);
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: var(--space-3);
    gap: var(--space-3);
  }

  .plan-title {
    font-size: 20px;
  }

  .quick-add-bar {
    flex-wrap: wrap;
  }

  .quick-input {
    width: 100%;
    flex: none;
    order: 1;
  }

  .quick-date,
  .quick-select {
    flex: 1;
    width: auto;
  }

  .quick-add-btn {
    width: 100%;
    order: 2;
  }

  .list-controls {
    flex-direction: column;
    gap: var(--space-2);
    align-items: stretch;
  }

  .filter-chips {
    flex-wrap: wrap;
  }

  .view-toggle {
    align-self: flex-end;
  }

  .task-actions {
    opacity: 1;
  }

  .task-meta {
    flex-wrap: wrap;
  }

  /* 月视图移动端适配 */
  .month-nav-compact {
    padding: var(--space-1) var(--space-2);
    gap: var(--space-2);
  }

  .nav-compact {
    min-width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .month-label-compact {
    font-size: 13px;
    min-width: 80px;
  }

  .today-compact {
    font-size: 11px;
    padding: var(--space-1);
  }

  .calendar-wrapper {
    padding: var(--space-2) var(--space-2) 0;
  }

  .calendar-grid {
    gap: 2px;
    padding: var(--space-1);
    min-height: 300px;
  }

  .weekday {
    font-size: 10px;
    padding: var(--space-0.5) 0;
  }

  .calendar-cell {
    gap: 2px;
    padding: var(--space-0.5);
  }

  .cell-date {
    font-size: 11px;
  }

  .task-dot {
    width: 5px;
    height: 5px;
    gap: 2px;
  }

  .more-tasks {
    font-size: 8px;
  }

  .selected-day-tasks {
    padding: var(--space-2);
    max-height: 250px;
  }

  .selected-day-header h3 {
    font-size: 13px;
  }
}
</style>