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
        <div class="quick-date-group">
          <input
            v-model="quickForm.start_date"
            type="date"
            class="quick-date"
            :min="planStartDate"
            :max="planEndDate"
            title="开始日期"
          />
          <input
            v-model="quickForm.end_date"
            type="date"
            class="quick-date"
            :min="quickForm.start_date"
            :max="planEndDate"
            title="结束日期"
          />
        </div>
        
        <select v-model="quickForm.repeat_type" class="quick-select">
          <option value="none">不重复</option>
          <option value="daily">每日</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
        </select>
        
        <button 
          class="advanced-toggle-btn" 
          @click="showAdvanced = !showAdvanced"
          :class="{ active: showAdvanced }"
        >
          {{ showAdvanced ? '收起' : '高级选项' }}
          <span class="toggle-icon">{{ showAdvanced ? '▲' : '▼' }}</span>
        </button>
        
        <button 
          class="quick-add-btn" 
          @click="quickAddTask"
          :disabled="submitting || !quickForm.title"
        >
          {{ submitting ? '...' : '添加' }}
        </button>
      </div>

      <!-- 高级选项（展开后显示） -->
      <transition name="slide-fade">
        <div v-if="showAdvanced" class="advanced-options">
          <div class="advanced-row">
            <label class="advanced-label">优先级：</label>
            <div class="priority-chips">
              <button
                v-for="p in priorityOptions"
                :key="p.value"
                :class="['priority-chip', { active: quickForm.priority === p.value }]"
                :style="{ '--priority-color': p.color }"
                @click="quickForm.priority = p.value"
              >
                {{ p.label }}
              </button>
            </div>
          </div>
          
          <div class="advanced-row">
            <label class="advanced-label">时间：</label>
            <input 
              v-model="quickForm.start_time" 
              type="time" 
              class="advanced-time"
              placeholder="开始时间"
            />
            <span class="time-separator">-</span>
            <input 
              v-model="quickForm.end_time" 
              type="time" 
              class="advanced-time"
              placeholder="结束时间"
            />
          </div>
          
          <div class="advanced-row">
            <label class="advanced-label">标签：</label>
            <div class="tag-chips">
              <button
                v-for="tag in tagPresets"
                :key="tag"
                :class="['tag-chip', { active: quickForm.tags.includes(tag) }]"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
          
          <div class="advanced-row">
            <label class="advanced-label">备注：</label>
            <textarea 
              v-model="quickForm.note" 
              class="advanced-textarea" 
              placeholder="添加备注..."
              rows="2"
            ></textarea>
          </div>
        </div>
      </transition>

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
            <!-- 月视图导航 -->
            <div class="month-nav-compact">
              <div class="month-nav-left">
                <button class="nav-arrow-btn" @click="goPrevMonth" title="上个月">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <span class="month-label-compact">{{ monthLabel }}</span>
                <button class="nav-arrow-btn" @click="goNextMonth" title="下个月">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
              <button class="today-compact" @click="goToToday">📍 今天</button>
            </div>

            <!-- 月度进度概览 -->
            <div class="month-stats-bar">
              <div class="month-stats-info">
                <span class="month-stats-label">本月进度</span>
                <span class="month-stats-numbers">{{ monthStats.completed }}/{{ monthStats.total }}</span>
              </div>
              <div class="month-progress-track">
                <div class="month-progress-fill" :style="{ width: monthStats.percent + '%' }"></div>
              </div>
              <span class="month-stats-percent" :class="getPercentClass(monthStats.percent)">{{ monthStats.percent }}%</span>
            </div>

            <!-- 日历网格 -->
            <div class="calendar-wrapper">
              <div class="calendar-grid">
                <div 
                  v-for="(day, idx) in weekdayLabels" 
                  :key="day.label" 
                  class="weekday"
                  :class="{ 'is-weekend': idx === 0 || idx === 6 }"
                >{{ day.label }}</div>
                
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
                    'is-weekend': day.isWeekend,
                    'has-tasks': day.tasks.length > 0,
                    'all-done': day.allDone,
                    'is-selected': selectedCalendarDay?.date === day.date
                  }"
                  @click="selectCalendarDay(day)"
                >
                  <span class="cell-date">{{ day.day }}</span>
                  <!-- 任务指示条 -->
                  <div v-if="day.tasks.length > 0" class="task-bars">
                    <div
                      v-for="(task, idx) in day.tasks.slice(0, 3)"
                      :key="'task-' + idx"
                      class="task-bar-item"
                      :class="{ 'task-done': task.status === 'done' }"
                      :title="task.title"
                    >
                      <span class="task-bar-text">{{ task.title }}</span>
                    </div>
                    <div v-if="day.tasks.length > 3" class="task-bar-more">
                      +{{ day.tasks.length - 3 }}
                    </div>
                  </div>
                </div>
              </div>
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
                  :key="task.isMerged ? 'merged-' + task.repeat_group_id : task.id"
                  class="task-item"
                  :class="{
                    completed: task.isMerged ? task.doneCount === task.totalCount : task.status === 'done',
                    'merged-task': task.isMerged,
                    'is-selected': selectedTask?.id === task.id
                  }"
                  @click="selectTask(task)"
                >
                  <!-- 编辑态 -->
                  <template v-if="editingId === task.id">
                    <div class="task-edit-form">
                      <input v-model="editForm.title" type="text" class="edit-input" />
                      <input v-model="editForm.start_date" type="date" class="edit-date" title="开始日期" />
                      <input v-model="editForm.end_date" type="date" class="edit-date" title="结束日期" />
                      <button class="edit-save" @click="saveEdit">✓</button>
                      <button class="edit-cancel" @click="cancelEdit">✕</button>
                    </div>
                  </template>
                  
                  <!-- 展示态 -->
                  <template v-else>
                    <input
                      type="checkbox"
                      class="task-checkbox"
                      :checked="task.isMerged ? task.doneCount === task.totalCount : task.status === 'done'"
                      @change="toggleTask(task)"
                    />
                    <span class="task-status-dot" :class="task.isMerged ? (task.doneCount === task.totalCount ? 'done' : 'partial') : task.status"></span>
                    <div class="task-content">
                      <span class="task-title">
                        {{ task.title }}
                        <span v-if="task.isMerged" class="merged-badge">
                          🔄 {{ task.repeat_type === 'daily' ? '每日' : task.repeat_type === 'weekly' ? '每周' : '每月' }}
                        </span>
                      </span>
                      <div class="task-meta">
                        <span class="task-date">
                          {{ formatDateShort(task.start_date) }}
                          <span v-if="task.start_date !== task.end_date">
                            - {{ formatDateShort(task.end_date) }}
                          </span>
                        </span>
                        <!-- 合并任务进度 -->
                        <span v-if="task.isMerged" class="task-progress">
                          <span class="progress-bar">
                            <span class="progress-fill" :style="{ width: (task.doneCount / task.totalCount * 100) + '%' }"></span>
                          </span>
                          <span class="progress-text">{{ task.doneCount }}/{{ task.totalCount }}</span>
                        </span>
                        <span v-else-if="task.start_date !== task.end_date" class="task-duration">
                          {{ calculateDuration(task.start_date, task.end_date) }}天
                        </span>
                        <span v-if="!task.isMerged && task.repeat_type && task.repeat_type !== 'none'" class="task-repeat">
                          {{ task.repeat_type === 'daily' ? '📅 每日' : task.repeat_type === 'weekly' ? '📆 每周' : '📆 每月' }}
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

    <!-- 右侧详情栏 -->
    <aside v-if="selectedTask || selectedCalendarDay" class="detail-panel">
      <!-- 列表视图：选中任务详情 -->
      <template v-if="selectedTask && viewMode !== 'month'">
        <div class="detail-header">
          <h3>任务详情</h3>
          <button class="close-btn" @click="selectedTask = null">✕</button>
        </div>
        <div class="detail-body">
          <div class="detail-title-row">
            <span class="detail-status-dot" :class="selectedTask.status"></span>
            <span class="detail-task-name">{{ selectedTask.title }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">状态</span>
            <span class="detail-value">{{ selectedTask.status === 'done' ? '✅ 已完成' : '⏳ 进行中' }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">日期</span>
            <span class="detail-value">{{ formatDateRange(selectedTask.start_date, selectedTask.end_date) }}</span>
          </div>
          <div v-if="selectedTask.start_time" class="detail-field">
            <span class="detail-label">时间</span>
            <span class="detail-value">{{ selectedTask.start_time }} - {{ selectedTask.end_time }}</span>
          </div>
          <div v-if="selectedTask.repeat_type && selectedTask.repeat_type !== 'none'" class="detail-field">
            <span class="detail-label">重复</span>
            <span class="detail-value">{{ selectedTask.repeat_type === 'daily' ? '每日' : selectedTask.repeat_type === 'weekly' ? '每周' : '每月' }}</span>
          </div>
          <div v-if="selectedTask.note" class="detail-field">
            <span class="detail-label">备注</span>
            <span class="detail-value detail-note">{{ selectedTask.note }}</span>
          </div>
          <div v-if="selectedTask.isMerged" class="detail-field">
            <span class="detail-label">进度</span>
            <span class="detail-value">{{ selectedTask.doneCount }}/{{ selectedTask.totalCount }}</span>
          </div>
          <div class="detail-actions">
            <button class="detail-action-btn edit" @click="startEdit(selectedTask); selectedTask = null">✏️ 编辑</button>
            <button class="detail-action-btn delete" @click="deleteTask(selectedTask); selectedTask = null">🗑️ 删除</button>
          </div>
        </div>
      </template>

      <!-- 月视图：选中日期任务列表 -->
      <template v-if="selectedCalendarDay && viewMode === 'month'">
        <div class="detail-header">
          <h3>{{ formatSelectedDate(selectedCalendarDay.date) }}</h3>
          <button class="close-btn" @click="selectedCalendarDay = null">✕</button>
        </div>
        <div class="detail-body">
          <div class="detail-date-summary">
            <span class="detail-date-count">{{ selectedCalendarDay.tasks.length }} 个任务</span>
            <span class="detail-date-done">{{ selectedCalendarDay.tasks.filter((t: any) => t.status === 'done').length }} 已完成</span>
          </div>
          <ul class="detail-day-list">
            <li v-for="task in selectedCalendarDay.tasks" :key="task.id" class="detail-day-item" :class="{ completed: task.status === 'done' }">
              <input type="checkbox" class="selected-task-checkbox" :checked="task.status === 'done'" @change="toggleTask(task)" />
              <span class="selected-task-title">{{ task.title }}</span>
              <span class="selected-task-status" :class="task.status">{{ task.status === 'done' ? '✓' : '○' }}</span>
            </li>
          </ul>
          <div v-if="selectedCalendarDay.tasks.length === 0" class="detail-empty">当天暂无任务</div>
        </div>
      </template>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { usePlanStore } from "@/store/plans";
import { useUserStore } from "@/store/user";
import { generateRepeatTaskPayloads } from "@/services/repeat-task";

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
const showAdvanced = ref(false); // 高级选项展开状态

// 列表视图选中任务
const selectedTask = ref<any>(null);

// 月视图状态
const currentDate = ref(new Date());
const selectedCalendarDay = ref<{date: string; tasks: any[]; allDone: boolean} | null>(null);
const weekdayLabels = [
  { label: '日' }, { label: '一' }, { label: '二' }, { label: '三' },
  { label: '四' }, { label: '五' }, { label: '六' }
];

// 快速添加表单
const quickForm = reactive({
  title: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10),
  start_time: "",
  end_time: "",
  repeat_type: "none" as "none" | "daily" | "weekly" | "monthly",
  priority: "medium" as "high" | "medium" | "low",
  tags: [] as string[],
  note: "",
});

// 编辑表单
const editForm = reactive({
  id: 0,
  title: "",
  start_date: "",
  end_date: "",
});

// 合并重复任务 - 相同 repeat_group_id 的任务合并为一条显示
const mergedTaskList = computed(() => {
  const tasks = taskStore.tasks.filter(t => t.plan_id === planId);
  const result: any[] = [];
  const groupMap = new Map<number, any[]>();

  for (const task of tasks) {
    if (task.repeat_group_id) {
      if (!groupMap.has(task.repeat_group_id)) {
        groupMap.set(task.repeat_group_id, []);
      }
      groupMap.get(task.repeat_group_id)!.push({ ...task });
    } else {
      result.push({ ...task, isMerged: false });
    }
  }

  for (const [, group] of groupMap) {
    const sorted = [...group].sort((a, b) => a.start_date.localeCompare(b.start_date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const doneCount = sorted.filter(t => t.status === 'done').length;
    const totalCount = sorted.length;

    result.push({
      id: first.id,
      title: first.title,
      plan_id: first.plan_id,
      start_date: first.start_date,
      end_date: last.end_date,
      status: doneCount === totalCount ? 'done' : 'partial',
      repeat_type: first.repeat_type,
      repeat_group_id: first.repeat_group_id,
      note: first.note,
      isMerged: true,
      totalCount,
      doneCount,
      subTasks: sorted,
    });
  }

  return result;
});

// 筛选选项（基于合并后的任务列表）
const statusFilters = computed(() => [
  { key: 'all', label: '全部', count: mergedTaskList.value.length },
  { key: 'pending', label: '待完成', count: mergedTaskList.value.filter(t => t.isMerged ? t.doneCount < t.totalCount : t.status !== 'done').length },
  { key: 'done', label: '已完成', count: mergedTaskList.value.filter(t => t.isMerged ? t.doneCount === t.totalCount : t.status === 'done').length },
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
    t.start_date <= weekEndStr &&
    t.end_date >= weekStartStr
  );

  const completed = weekTasks.filter(t => t.status === 'done').length;
  const total = weekTasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, completionRate, remaining: total - completed };
});

// 辅助函数：判断合并任务是否属于某日期范围（用于分组）
function isTaskInDateRange(task: any, rangeStart: string, rangeEnd: string): boolean {
  if (task.isMerged) {
    // 合并任务：只要子任务中有任何一天在范围内就属于该分组
    return task.subTasks.some((st: any) =>
      st.start_date >= rangeStart && st.start_date <= rangeEnd
    );
  }
  return task.start_date >= rangeStart && task.start_date <= rangeEnd;
}

// 辅助函数：判断合并任务的分组日期（用于排除逻辑）
function getTaskGroupDate(task: any): string {
  if (task.isMerged) {
    // 合并任务：用第一个未完成子任务的日期作为分组依据
    const undone = task.subTasks.find((st: any) => st.status !== 'done');
    return undone ? undone.start_date : task.start_date;
  }
  return task.start_date;
}

// 辅助函数：判断任务是否已完成
function isTaskDone(task: any): boolean {
  if (task.isMerged) return task.doneCount === task.totalCount;
  return task.status === 'done';
}

// 任务分组（基于合并后的任务列表）
const filteredGroups = computed(() => {
  let tasks = [...mergedTaskList.value];

  // 状态筛选
  if (activeFilter.value === 'pending') {
    tasks = tasks.filter(t => !isTaskDone(t));
  } else if (activeFilter.value === 'done') {
    tasks = tasks.filter(t => isTaskDone(t));
  }

  if (viewMode.value === 'flat') {
    return [{
      key: 'all',
      type: 'flat',
      icon: '📋',
      title: '所有任务',
      tasks: tasks.sort((a, b) => a.start_date.localeCompare(b.start_date))
    }];
  }

  const groups: Array<{key: string; type: string; icon: string; title: string; tasks: any[]}> = [];
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  // 计算本周开始和结束日期
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  // 今天：任务覆盖今天
  const todayTasks = tasks.filter(t => {
    const groupDate = getTaskGroupDate(t);
    if (t.isMerged) {
      // 合并任务：子任务中有今天的
      return t.subTasks.some((st: any) => st.start_date === today);
    }
    return groupDate === today;
  });
  if (todayTasks.length > 0) {
    groups.push({ key: 'today', type: 'today', icon: '📌', title: '今天', tasks: todayTasks });
  }

  // 明天
  const tomorrowTasks = tasks.filter(t => {
    if (t.isMerged) {
      return t.subTasks.some((st: any) => st.start_date === tomorrow) &&
             !t.subTasks.some((st: any) => st.start_date === today);
    }
    return getTaskGroupDate(t) === tomorrow;
  });
  if (tomorrowTasks.length > 0) {
    groups.push({ key: 'tomorrow', type: 'future', icon: '📅', title: '明天', tasks: tomorrowTasks });
  }

  // 本周（排除今天和明天）
  const weekTasks = tasks.filter(t => {
    if (t.isMerged) {
      const hasToday = t.subTasks.some((st: any) => st.start_date === today);
      const hasTomorrow = t.subTasks.some((st: any) => st.start_date === tomorrow);
      const hasWeekTask = t.subTasks.some((st: any) =>
        st.start_date >= weekStartStr && st.start_date <= weekEndStr
      );
      return hasWeekTask && !hasToday && !hasTomorrow;
    }
    const groupDate = getTaskGroupDate(t);
    return groupDate !== today && groupDate !== tomorrow &&
           groupDate >= weekStartStr && groupDate <= weekEndStr;
  });
  if (weekTasks.length > 0) {
    groups.push({
      key: 'this-week',
      type: 'week',
      icon: '📆',
      title: '本周',
      tasks: weekTasks.sort((a, b) => a.start_date.localeCompare(b.start_date))
    });
  }

  // 逾期：合并任务中有未完成且结束日期早于今天的子任务
  const overdueTasks = tasks.filter(t => {
    if (t.isMerged) {
      return t.subTasks.some((st: any) => st.end_date < today && st.status !== 'done');
    }
    return t.end_date < today && t.status !== 'done';
  });
  if (overdueTasks.length > 0) {
    groups.push({
      key: 'overdue',
      type: 'overdue',
      icon: '⚠️',
      title: '逾期',
      tasks: overdueTasks.sort((a, b) => a.start_date.localeCompare(b.start_date))
    });
  }

  // 未来：任务开始日期晚于本周
  const futureTasks = tasks.filter(t => {
    if (t.isMerged) {
      return t.subTasks.every((st: any) => st.start_date > weekEndStr);
    }
    return getTaskGroupDate(t) > weekEndStr;
  });
  if (futureTasks.length > 0) {
    groups.push({
      key: 'future',
      type: 'future',
      icon: '🗓️',
      title: '未来',
      tasks: futureTasks.sort((a, b) => a.start_date.localeCompare(b.start_date))
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
    // 范围匹配：查找覆盖当天的所有任务（start_date <= dateStr <= end_date）
    const tasks = taskStore.tasks.filter(t => 
      t.plan_id === planId && 
      t.start_date <= dateStr &&
      t.end_date >= dateStr
    );
    const allDone = tasks.length > 0 && tasks.every(t => t.status === 'done');
    
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay();
    
    days.push({
      date: dateStr,
      day,
      tasks,
      allDone,
      isToday: dateStr === new Date().toISOString().slice(0, 10),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
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

// 月度统计
const monthStats = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const monthTasks = taskStore.tasks.filter(t =>
    t.plan_id === planId &&
    t.start_date <= monthEnd &&
    t.end_date >= monthStart
  );

  const completed = monthTasks.filter(t => t.status === 'done').length;
  const total = monthTasks.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percent };
});

// 格式化选中日期的显示
function formatSelectedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return '今天';
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

// ========== 辅助数据和函数 ==========

// 优先级选项
const priorityOptions = [
  { value: 'high' as const, label: '高', color: '#ef4444' },
  { value: 'medium' as const, label: '中', color: '#f59e0b' },
  { value: 'low' as const, label: '低', color: '#6b7280' },
];

// 标签预设
const tagPresets = ['工作', '学习', '运动', '生活', '其他'];

// 切换标签
function toggleTag(tag: string) {
  const index = quickForm.tags.indexOf(tag);
  if (index > -1) {
    quickForm.tags.splice(index, 1);
  } else {
    quickForm.tags.push(tag);
  }
}

// ========== 方法 ==========

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return '今天';
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (dateStr === tomorrow) return '明天';
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (dateStr === yesterday) return '昨天';
  
  // 格式化为 MM-DD
  const date = new Date(dateStr);
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatDateShort(startDate);
  }
  
  const start = formatDateShort(startDate);
  const end = formatDateShort(endDate);
  return `${start} ~ ${end}`;
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

  // 验证日期范围
  if (quickForm.start_date > quickForm.end_date) {
    alert("开始日期不能晚于结束日期");
    return;
  }

  submitting.value = true;
  try {
    // 构建基础payload
    const basePayload = {
      plan_id: planId,
      user_id: userId,
      title: quickForm.title,
      start_date: quickForm.start_date,
      end_date: quickForm.end_date,
      start_time: null,
      end_time: null,
      status: 'pending' as const,
      note: null,
      repeat_type: quickForm.repeat_type,
      repeat_end_date: quickForm.end_date, // 使用结束日期作为重复结束日期
    };
    
    // 如果是重复任务，生成多个任务
    if (quickForm.repeat_type !== 'none') {
      const payloads = generateRepeatTaskPayloads(basePayload);
      
      // 批量创建所有任务
      for (const payload of payloads) {
        await taskStore.createTask(payload);
      }
    } else {
      // 非重复任务，创建单个任务
      await taskStore.createTask(basePayload);
    }
    
    // 重置
    quickForm.title = "";
    quickForm.start_date = new Date().toISOString().slice(0, 10);
    quickForm.end_date = new Date().toISOString().slice(0, 10);
    quickForm.repeat_type = "none";
    
    // 重新加载任务列表
    await taskStore.loadTasks(planId);
  } catch (e: any) {
    alert(e?.message || "添加失败");
  } finally {
    submitting.value = false;
  }
}

// 切换任务状态
async function toggleTask(task: any) {
  if (task.isMerged) {
    // 合并任务：切换今天的子任务，如果没有则切换第一个未完成的
    const today = new Date().toISOString().slice(0, 10);
    const todaySub = task.subTasks.find((st: any) => st.start_date === today);
    const target = todaySub || task.subTasks.find((st: any) => st.status !== 'done');
    if (target) {
      await taskStore.toggleTaskStatus(target.id);
    }
  } else {
    await taskStore.toggleTaskStatus(task.id);
  }
  await taskStore.loadTasks(planId);
}

// 开始编辑
function startEdit(task: any) {
  editingId.value = task.id;
  editForm.id = task.id;
  editForm.title = task.title;
  editForm.start_date = task.start_date;
  editForm.end_date = task.end_date;
}

// 取消编辑
function cancelEdit() {
  editingId.value = null;
}

// 保存编辑
async function saveEdit() {
  await taskStore.updateTask(editForm.id, {
    title: editForm.title,
    start_date: editForm.start_date,
    end_date: editForm.end_date,
  });
  editingId.value = null;
  await taskStore.loadTasks(planId);
}

// 删除任务
async function deleteTask(task: any) {
  if (task.isMerged) {
    const totalCount = task.totalCount;
    if (!confirm(`确认删除重复任务「${task.title}」及其所有 ${totalCount} 个子任务？`)) return;
    // 删除所有子任务
    for (const sub of task.subTasks) {
      await taskStore.deleteTask(sub.id);
    }
  } else {
    if (!confirm(`确认删除任务「${task.title}」？`)) return;
    await taskStore.deleteTask(task.id);
  }
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
  selectedTask.value = null; // 清除列表选中
}

// 列表视图选中任务
function selectTask(task: any) {
  selectedTask.value = task;
  selectedCalendarDay.value = null; // 清除日历选中
}

// ========== 计算天数方法 ==========

function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
  grid-template-columns: 220px 1fr auto;
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

/* 日期输入框组 */
.quick-date-group {
  display: flex;
  gap: var(--space-1);
  align-items: center;
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

/* 高级选项切换按钮 */
.advanced-toggle-btn {
  padding: var(--space-2) var(--space-3);
  background: var(--bg-main);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.advanced-toggle-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--ai-main);
}

.advanced-toggle-btn.active {
  background: var(--ai-bg);
  border-color: var(--ai-main);
  color: var(--ai-main);
}

.toggle-icon {
  font-size: 10px;
  transition: transform 0.2s;
}

/* 高级选项面板 */
.advanced-options {
  padding: var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  margin-top: var(--space-2);
}

.advanced-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.advanced-row:last-child {
  margin-bottom: 0;
}

.advanced-label {
  min-width: 70px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

/* 优先级芯片 */
.priority-chips {
  display: flex;
  gap: var(--space-2);
}

.priority-chip {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border-subtle);
  background: var(--bg-main);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.priority-chip:hover {
  border-color: var(--border-main);
  background: var(--bg-card-hover);
}

.priority-chip.active {
  border-color: var(--priority-color);
  background: var(--priority-color);
  color: white;
}

/* 时间输入 */
.advanced-time {
  padding: var(--space-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 13px;
  background: var(--bg-main);
  color: var(--text-main);
  width: 120px;
}

.time-separator {
  color: var(--text-muted);
  font-size: 14px;
}

/* 标签芯片 */
.tag-chips {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.tag-chip {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border-subtle);
  background: var(--bg-main);
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tag-chip:hover {
  border-color: var(--ai-main);
  color: var(--text-main);
}

.tag-chip.active {
  background: var(--ai-main);
  border-color: var(--ai-main);
  color: white;
}

/* 备注输入 */
.advanced-textarea {
  flex: 1;
  padding: var(--space-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 13px;
  background: var(--bg-main);
  color: var(--text-main);
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.advanced-textarea:focus {
  outline: none;
  border-color: var(--ai-main);
}

/* 展开动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
  position: relative;
  overflow: hidden;
}

/* 分组头部左侧色条 */
.group-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--text-muted);
  border-radius: 0 2px 2px 0;
}

.group-icon {
  font-size: 14px;
  margin-left: var(--space-1);
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
.group-today .group-header::before {
  background: var(--success);
}

.group-overdue .group-header {
  background: var(--error-bg);
}
.group-overdue .group-header::before {
  background: var(--error);
}

.group-future .group-header::before {
  background: var(--ai-main);
}

.group-week .group-header::before {
  background: var(--info);
}

/* ========== 任务项 ========== */
.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  transition: all var(--dur-normal) var(--ease-standard);
  border: 1px solid transparent;
}

.task-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-subtle);
  box-shadow: var(--shadow-xs);
}

.task-item.completed {
  opacity: 0.7;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
  text-decoration-color: var(--text-muted);
  text-decoration-thickness: 1.5px;
}

/* 自定义复选框 */
.task-checkbox {
  width: 20px;
  height: 20px;
  margin-top: 1px;
  cursor: pointer;
  flex-shrink: 0;
  appearance: none;
  -webkit-appearance: none;
  border: 2px solid var(--border-emphasis);
  border-radius: 6px;
  background: transparent;
  transition: all var(--dur-normal) var(--ease-standard);
  position: relative;
}

.task-checkbox:hover {
  border-color: var(--ai-main);
  background: var(--ai-bg);
}

.task-checkbox:checked {
  background: var(--success);
  border-color: var(--success);
}

.task-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* 状态点增强 */
.task-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
  transition: all var(--dur-normal) var(--ease-standard);
}

.task-status-dot.pending {
  background: var(--warning);
  box-shadow: 0 0 0 2px var(--warning-bg);
}

.task-status-dot.done {
  background: var(--success);
  box-shadow: 0 0 0 2px var(--success-bg);
}

.task-status-dot.partial {
  background: linear-gradient(135deg, var(--success), var(--warning));
  box-shadow: 0 0 0 2px var(--warning-bg);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 2px var(--warning-bg); }
  50% { box-shadow: 0 0 0 4px var(--warning-bg); }
}

/* ========== 合并任务样式 ========== */
.task-item.merged-task {
  padding: var(--space-3) var(--space-4);
  border-left: 3px solid transparent;
  border-image: linear-gradient(180deg, var(--ai-main), var(--success)) 1;
  background: var(--ai-bg);
  border-radius: 0;
  border-top: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.task-item.merged-task:hover {
  background: rgba(79, 70, 229, 0.08);
  border-color: var(--border-main);
  border-left-color: transparent;
  box-shadow: var(--shadow-sm);
}

.merged-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--ai-main);
  background: rgba(79, 70, 229, 0.1);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  margin-left: var(--space-2);
  vertical-align: middle;
  border: 1px solid rgba(79, 70, 229, 0.15);
}

/* 任务进度条 */
.task-progress {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
}

.progress-bar {
  width: 80px;
  height: 8px;
  background: rgba(120, 120, 120, 0.12);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--ai-main), var(--success));
  border-radius: var(--radius-full);
  transition: width 0.5s var(--ease-out);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: 12px;
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

.task-duration {
  color: var(--ai-main);
  font-weight: 500;
  background: var(--ai-bg);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  margin-left: var(--space-1);
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
  gap: 4px;
  opacity: 0;
  transition: opacity var(--dur-normal) var(--ease-standard);
  flex-shrink: 0;
}

.task-item:hover .task-actions {
  opacity: 1;
}

.action-btn {
  width: 30px;
  height: 30px;
  border: 1px solid transparent;
  background: var(--bg-main);
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--dur-normal) var(--ease-standard);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--border-main);
  transform: scale(1.08);
}

.action-btn.delete:hover {
  background: var(--error-bg);
  border-color: var(--error);
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

/* 导航栏 */
.month-nav-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  flex-shrink: 0;
}

.month-nav-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.nav-arrow-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-main);
  color: var(--text-main);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--dur-normal) var(--ease-standard);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-arrow-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--ai-main);
  color: var(--ai-main);
}

.month-label-compact {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-emphasis);
  min-width: 120px;
  text-align: center;
  letter-spacing: 0.02em;
}

.today-compact {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--ai-main);
  background: var(--ai-bg);
  color: var(--ai-main);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dur-normal) var(--ease-standard);
}

.today-compact:hover {
  background: var(--ai-main);
  color: white;
}

/* 月度进度条 */
.month-stats-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
}

.month-stats-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.month-stats-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.month-stats-numbers {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.month-progress-track {
  flex: 1;
  height: 6px;
  background: rgba(120, 120, 120, 0.1);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.month-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ai-main), var(--success));
  border-radius: var(--radius-full);
  transition: width 0.6s var(--ease-out);
}

.month-stats-percent {
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 40px;
  text-align: right;
}

.month-stats-percent.high { color: var(--success); }
.month-stats-percent.medium { color: var(--warning); }
.month-stats-percent.low { color: var(--error); }

/* 日历网格 */
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
  gap: 6px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-2);
}

.weekday {
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  color: var(--text-muted);
  padding: var(--space-2) 0;
  letter-spacing: 0.05em;
}

.weekday.is-weekend {
  color: var(--ai-main);
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  padding: var(--space-2);
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--dur-normal) var(--ease-standard);
  min-height: 60px;
}

.calendar-cell:hover {
  background: var(--bg-card-hover);
  border-color: var(--ai-main);
  box-shadow: var(--shadow-xs);
  transform: translateY(-1px);
}

.calendar-cell.blank-cell {
  background: transparent;
  border: none;
  cursor: default;
  opacity: 0;
  pointer-events: none;
  min-height: 0;
}

.calendar-cell.blank-cell:hover {
  transform: none;
  box-shadow: none;
}

/* 周末日期 */
.calendar-cell.is-weekend {
  background: rgba(79, 70, 229, 0.03);
}
.calendar-cell.is-weekend .cell-date {
  color: var(--ai-main);
}

/* 今天高亮 */
.calendar-cell.is-today {
  background: linear-gradient(135deg,
    rgba(79, 70, 229, 0.1),
    rgba(79, 70, 229, 0.05)
  );
  border: 2px solid var(--ai-main);
  box-shadow: 0 0 0 2px var(--ai-bg);
}

.calendar-cell.is-today .cell-date {
  background: var(--ai-main);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* 选中日期 */
.calendar-cell.is-selected {
  background: var(--ai-bg);
  border-color: var(--ai-main);
  box-shadow: 0 0 0 1px var(--ai-main);
}

.calendar-cell.has-tasks {
  background: var(--bg-card);
}

.calendar-cell.all-done {
  background: linear-gradient(135deg,
    rgba(34, 197, 94, 0.08),
    rgba(34, 197, 94, 0.03)
  );
  border-color: rgba(34, 197, 94, 0.25);
}

.calendar-cell.all-done .cell-date {
  color: var(--success);
  font-weight: 600;
}

.cell-date {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

/* 任务指示条（替代圆点） */
.task-bars {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

.task-bar-item {
  width: 100%;
  height: 16px;
  background: linear-gradient(90deg, rgba(79, 70, 229, 0.15), rgba(79, 70, 229, 0.08));
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 4px;
  border-left: 2px solid var(--ai-main);
}

.task-bar-item.task-done {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.05));
  border-left-color: var(--success);
}

.task-bar-text {
  font-size: 9px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
}

.task-bar-item.task-done .task-bar-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.task-bar-more {
  font-size: 9px;
  color: var(--text-muted);
  font-weight: 600;
  text-align: center;
  padding: 1px 0;
}

/* slide-up 动画 */
.slide-up-enter-active {
  transition: all 0.3s var(--ease-out);
}
.slide-up-leave-active {
  transition: all 0.2s var(--ease-in);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 选中日期详情面板 */
.selected-day-tasks {
  flex-shrink: 0;
  margin-top: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-main);
  max-height: 320px;
  overflow-y: auto;
}

.selected-day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
}

.selected-day-title {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.selected-day-date {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-emphasis);
}

.selected-day-count {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-main);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--dur-normal) var(--ease-standard);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--error-bg);
  border-color: var(--error);
  color: var(--error);
}

.selected-day-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.selected-task-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  transition: all var(--dur-normal) var(--ease-standard);
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
}

.selected-task-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-main);
  box-shadow: var(--shadow-xs);
}

.selected-task-item.completed .selected-task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.selected-task-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.selected-task-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-task-status {
  font-size: 14px;
  flex-shrink: 0;
}

.selected-task-status.done {
  color: var(--success);
}

.selected-task-status.pending {
  color: var(--text-muted);
}

/* 任务项选中态 */
.task-item.is-selected {
  background: var(--ai-bg);
  border-color: var(--ai-main);
  box-shadow: inset 3px 0 0 var(--ai-main);
}

.task-item.is-selected:hover {
  background: rgba(79, 70, 229, 0.1);
}

/* ========== 右侧详情栏 ========== */
.detail-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-left: 1px solid var(--border-main);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  animation: detail-slide-in 0.3s var(--ease-out);
}

@keyframes detail-slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.detail-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-emphasis);
}

.detail-body {
  flex: 1;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.detail-status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.detail-status-dot.done {
  background: var(--success);
  box-shadow: 0 0 0 3px var(--success-bg);
}

.detail-status-dot.pending {
  background: var(--warning);
  box-shadow: 0 0 0 3px var(--warning-bg);
}

.detail-status-dot.partial {
  background: linear-gradient(135deg, var(--success), var(--warning));
  box-shadow: 0 0 0 3px var(--warning-bg);
}

.detail-task-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.4;
  word-break: break-word;
}

.detail-field {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  flex-shrink: 0;
}

.detail-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
  text-align: right;
  word-break: break-word;
}

.detail-note {
  background: var(--bg-main);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  text-align: left;
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
}

.detail-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}

.detail-action-btn {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-subtle);
  background: var(--bg-main);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dur-normal) var(--ease-standard);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
}

.detail-action-btn.edit:hover {
  background: var(--ai-bg);
  border-color: var(--ai-main);
  color: var(--ai-main);
}

.detail-action-btn.delete:hover {
  background: var(--error-bg);
  border-color: var(--error);
  color: var(--error);
}

/* 月视图详情：日期摘要 */
.detail-date-summary {
  display: flex;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.detail-date-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.detail-date-done {
  font-size: 13px;
  color: var(--success);
  font-weight: 500;
}

.detail-day-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.detail-day-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  transition: all var(--dur-normal) var(--ease-standard);
}

.detail-day-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-main);
}

.detail-day-item.completed .selected-task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.detail-empty {
  text-align: center;
  padding: var(--space-6);
  color: var(--text-muted);
  font-size: 13px;
}

/* ========== 响应式 ========== */
@media (max-width: 1100px) {
  .detail-panel {
    width: 280px;
  }
}

@media (max-width: 900px) {
  .plan-tasks-layout {
    grid-template-columns: 1fr;
  }

  .sidebar-nav {
    display: none;
  }

  /* 详情栏在移动端变为底部浮动 */
  .detail-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 50vh;
    border-left: none;
    border-top: 1px solid var(--border-main);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    box-shadow: var(--shadow-lg);
    z-index: 100;
    animation: detail-slide-up 0.3s var(--ease-out);
  }

  @keyframes detail-slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
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
    padding: var(--space-2) var(--space-3);
  }

  .nav-arrow-btn {
    width: 28px;
    height: 28px;
  }

  .month-label-compact {
    font-size: 14px;
    min-width: 100px;
  }

  .month-stats-bar {
    padding: var(--space-2) var(--space-3);
    gap: var(--space-2);
  }

  .month-stats-label { display: none; }

  .calendar-grid {
    gap: 3px;
    padding: var(--space-1);
  }

  .calendar-cell {
    min-height: 44px;
    padding: 2px;
  }

  .cell-date {
    font-size: 11px;
  }

  .task-bar-item {
    height: 12px;
  }

  .task-bar-text {
    font-size: 7px;
  }

  .task-bar-more {
    font-size: 7px;
  }

  .selected-day-tasks {
    padding: var(--space-3);
    max-height: 250px;
  }

  .selected-day-date {
    font-size: 14px;
  }

  .selected-task-item {
    padding: var(--space-2);
  }
}
</style>