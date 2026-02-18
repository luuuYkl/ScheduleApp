<template>
  <PageScaffold 
    :title="`计划 #${planId}`" 
    :subtitle="currentPlan?.title || '任务管理'"
    class="layer-context"
  >
    
    <!-- Context Layer: 本周目标条 -->
    <div class="weekly-goal-bar card layer-context priority-high">
      <div class="goal-header">
        <h3>🎯 本周目标</h3>
        <span class="completion-rate">{{ weeklyStats.completionRate }}%</span>
      </div>
      <div class="goal-content">
        <div class="progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: weeklyStats.completionRate + '%' }">
            </div>
          </div>
          <div class="progress-text">
            {{ weeklyStats.completed }}/{{ weeklyStats.total }} 已完成
          </div>
        </div>
        <div class="remaining-tasks" v-if="weeklyStats.remaining > 0">
          <span class="task-count">{{ weeklyStats.remaining }}</span>
          <span class="task-label">个关键任务待完成</span>
        </div>
      </div>
    </div>

    <!-- Primary Layer: 任务添加表单 - 移动端默认折叠 -->
    <div 
      class="add-task-form card layer-primary priority-high"
      :class="{ 'mobile-collapsed': isMobile && !showAddForm }"
    >
      <div class="form-header" @click="toggleAddForm">
        <h3 class="form-title">添加任务</h3>
        <button 
          v-if="isMobile" 
          class="expand-toggle"
          type="button"
        >
          {{ showAddForm ? '▲' : '▼' }}
        </button>
      </div>
      <form v-show="!isMobile || showAddForm" class="add-form" @submit.prevent="addTask">
        <div class="form-row">
          <input
            v-model.trim="form.title"
            type="text"
            placeholder="任务标题"
            required
          />
          <input
            v-model="form.task_date"
            type="date"
            :min="planStartDate"
            :max="planEndDate"
            required
          />
          <input
            v-model.trim="form.note"
            type="text"
            placeholder="描述 (可选)"
          />
        </div>
        <div class="form-row repeat-row">
          <div class="field">
            <label>重复类型</label>
            <select v-model="form.repeat_type">
              <option value="none">不重复</option>
              <option value="daily">每日重复</option>
              <option value="monthly">每月重复</option>
            </select>
          </div>
          <div class="field" v-if="form.repeat_type !== 'none'">
            <label>重复结束日期</label>
            <input
              v-model="form.repeat_end_date"
              type="date"
              :min="form.task_date"
              :max="planEndDate"
              required
            />
          </div>
          <button type="submit" class="primary" :disabled="submitting">
            {{ submitting ? "添加中..." : "添加任务" }}
          </button>
        </div>
      </form>
    </div>

    <!-- Secondary Layer: 任务列表 - 桌面端左侧 -->
    <div class="task-list-container card layer-secondary priority-high">
      <div class="section-header">
        <h3 class="section-title">任务列表</h3>
        <div class="view-toggle">
          <button 
            :class="['toggle-btn', { active: viewMode === 'grouped' }]"
            @click="viewMode = 'grouped'">
            分组视图
          </button>
          <button 
            :class="['toggle-btn', { active: viewMode === 'flat' }]"
            @click="viewMode = 'flat'">
            列表视图
          </button>
        </div>
      </div>
      <div v-if="groupedTasks.length" class="task-groups">
        <div 
          v-for="group in groupedTasks" 
          :key="group.key" 
          class="task-group"
          :class="`group-${group.type}`">
          <div class="group-header">
            <h4 class="group-title">{{ group.title }}</h4>
            <span class="group-count">{{ group.tasks.length }} 项</span>
          </div>
          <ul class="group-list">
            <li v-for="t in group.tasks" :key="t.id" class="item">
          <!-- 编辑态：完整表单 -->
          <div v-if="editingId === t.id" class="edit-mode">
            <input v-model="edit.title" type="text" placeholder="标题" />
            <input
              v-model="edit.task_date"
              type="date"
              :min="planStartDate"
              :max="planEndDate"
            />
            <input v-model="edit.note" type="text" placeholder="描述(可选)" />
            <select v-model="edit.repeat_type">
              <option value="none">不重复</option>
              <option value="daily">每日</option>
              <option value="monthly">每月</option>
            </select>
            <input
              v-if="edit.repeat_type !== 'none'"
              v-model="edit.repeat_end_date"
              type="date"
              :min="edit.task_date"
              :max="planEndDate"
              placeholder="结束日期"
            />
            <div class="edit-actions">
              <button class="primary" @click="saveEdit">保存</button>
              <button class="secondary" @click="cancelEdit">取消</button>
            </div>
          </div>

          <!-- 展示态：5层信息结构 -->
          <template v-else>
            <!-- 左列：日期 -->
            <div class="time-col">
              <span>{{ formatDate(t.task_date) }}</span>
            </div>

            <!-- 右列：内容 -->
            <div class="content-col">
              <!-- 第一行：勾选 + 状态圆点 + 标题 -->
              <div class="row title-row">
                <input
                  type="checkbox"
                  class="checkbox"
                  :checked="
                    t._isGrouped
                      ? t._displayStatus === 'done'
                      : t.status === 'done'
                  "
                  @change="toggle(t)"
                />
                <span
                  class="status-dot"
                  :class="t._isGrouped ? t._displayStatus : t.status"
                ></span>
                <span
                  class="title"
                  :class="{
                    completed: t._isGrouped
                      ? t._displayStatus === 'done'
                      : t.status === 'done',
                  }"
                >
                  {{ t.title }}
                </span>
              </div>

              <!-- 第二行：副信息 -->
              <div class="row meta">
                <span v-if="t._isGrouped">
                  {{
                    t.repeat_type === "daily" ? "📅 每日重复" : "📆 每月重复"
                  }}
                </span>
                <span v-if="t._isGrouped"> · {{ t._dateRange }} </span>
                <span v-if="t.note"> · {{ t.note }} </span>
              </div>

              <!-- 第三行：标签与操作 -->
              <div class="row tags">
                <span v-if="t._isGrouped" class="tag progress-tag">
                  {{ t._doneCount }}/{{ t._totalCount }} 已完成
                </span>
                <span v-else class="tag" :class="t.status">
                  {{ statusLabel(t.status) }}
                </span>
                <span
                  v-if="t.repeat_type && t.repeat_type !== 'none'"
                  class="tag repeat-tag"
                >
                  {{ t.repeat_type === "daily" ? "每日" : "每月" }}
                </span>
                <div class="spacer"></div>
                <button class="op-btn edit-btn" @click="startEdit(t)">
                  编辑
                </button>
                <button class="op-btn delete-btn" @click="remove(t)">
                  删除
                </button>
              </div>
            </div>
          </template>
          </li>
          </ul>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-text">暂无任务</p>
        <p class="empty-hint">先添加一个任务开始吧</p>
      </div>
    </div>
    
    <!-- Utility Layer: 快捷操作浮层 -->
    <div class="quick-actions-fab layer-utility priority-low">
      <button class="fab-btn" @click="showQuickActions = !showQuickActions">
        <span class="fab-icon">⚡</span>
      </button>
      <div v-show="showQuickActions" class="quick-actions-menu">
        <button class="quick-action" @click="quickReschedule">
          <span class="action-icon">📅</span>
          <span class="action-text">批量改期</span>
        </button>
        <button class="quick-action" @click="quickPrioritize">
          <span class="action-icon">⭐</span>
          <span class="action-text">调整优先级</span>
        </button>
        <button class="quick-action" @click="quickSplit">
          <span class="action-icon">✂️</span>
          <span class="action-text">拆分子任务</span>
        </button>
      </div>
    </div>
    
    <!-- 桌面端右侧编辑面板 -->
    <div v-if="editingId && !isMobile" class="edit-panel desktop-sidebar layer-utility priority-medium">
      <div class="panel-header">
        <h3>编辑任务</h3>
        <button class="close-btn" @click="cancelEdit">✕</button>
      </div>
      <form class="edit-form" @submit.prevent="saveEdit">
        <input v-model="edit.title" type="text" placeholder="标题" required />
        <input
          v-model="edit.task_date"
          type="date"
          :min="planStartDate"
          :max="planEndDate"
          required
        />
        <input v-model="edit.note" type="text" placeholder="描述(可选)" />
        <select v-model="edit.repeat_type">
          <option value="none">不重复</option>
          <option value="daily">每日</option>
          <option value="monthly">每月</option>
        </select>
        <input
          v-if="edit.repeat_type !== 'none'"
          v-model="edit.repeat_end_date"
          type="date"
          :min="edit.task_date"
          :max="planEndDate"
          placeholder="结束日期"
        />
        <div class="edit-actions">
          <button class="primary" type="submit">保存</button>
          <button class="secondary" type="button" @click="cancelEdit">取消</button>
        </div>
      </form>
    </div>
    
    <!-- 包装布局容器 -->
    <div class="task-layout">
      <div class="task-main-content">
        <!-- 任务列表容器 -->
      </div>
      <!-- 编辑面板会自动定位到右侧 -->
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { useUserStore } from "@/store/user";
import { usePlanStore } from "@/store/plans";
import { generateRepeatTaskPayloads } from "@/services/repeat-task";
import PageScaffold from "@/components/common/PageScaffold.vue";

const route = useRoute();
const taskStore = useTaskStore();
const userStore = useUserStore();
const planStore = usePlanStore();
const planId = Number(route.params.id);

// 视图模式
const viewMode = ref<'grouped' | 'flat'>('grouped');
const showQuickActions = ref(false);
const showAddForm = ref(false);

// 设备检测
const isMobile = computed(() => {
  return window.innerWidth < 768;
});

function toggleAddForm() {
  if (isMobile.value) {
    showAddForm.value = !showAddForm.value;
  }
}

// 计算本周统计数据
const weeklyStats = computed(() => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // 本周日
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // 本周六
  
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
  
  return {
    completed,
    total,
    completionRate,
    remaining: total - completed
  };
});

// 按时间分组的任务
const groupedTasks = computed(() => {
  if (viewMode.value === 'flat') {
    return [{
      key: 'all',
      type: 'flat',
      title: '所有任务',
      tasks: taskStore.tasks.filter(x => x.plan_id === planId).sort((a, b) => 
        a.task_date.localeCompare(b.task_date)
      )
    }];
  }
  
  const tasks = taskStore.tasks.filter((x) => x.plan_id === planId);
  const groups: Array<{key: string; type: string; title: string; tasks: any[]}> = [];
  
  // 今天的任务
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(t => t.task_date === today);
  if (todayTasks.length > 0) {
    groups.push({
      key: 'today',
      type: 'today',
      title: '📅 今天',
      tasks: todayTasks
    });
  }
  
  // 明天的任务
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const tomorrowTasks = tasks.filter(t => t.task_date === tomorrow);
  if (tomorrowTasks.length > 0) {
    groups.push({
      key: 'tomorrow',
      type: 'future',
      title: '📅 明天',
      tasks: tomorrowTasks
    });
  }
  
  // 本周其他任务
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
      title: '📅 本周其他',
      tasks: weekTasks.sort((a, b) => a.task_date.localeCompare(b.task_date))
    });
  }
  
  // 逾期任务
  const overdueTasks = tasks.filter(t => {
    return t.task_date < today && t.status !== 'done';
  });
  
  if (overdueTasks.length > 0) {
    groups.push({
      key: 'overdue',
      type: 'overdue',
      title: '⚠️ 逾期任务',
      tasks: overdueTasks.sort((a, b) => a.task_date.localeCompare(b.task_date))
    });
  }
  
  // 未来任务
  const futureTasks = tasks.filter(t => {
    return t.task_date > weekEnd.toISOString().slice(0, 10);
  });
  
  if (futureTasks.length > 0) {
    groups.push({
      key: 'future',
      type: 'future',
      title: '🗓️ 未来任务',
      tasks: futureTasks.sort((a, b) => a.task_date.localeCompare(b.task_date))
    });
  }
  
  return groups;
});

// 获取当前计划信息
const currentPlan = computed(() =>
  planStore.plans.find((p: any) => p.id === planId),
);
const planStartDate = computed(() => currentPlan.value?.start_date || "");
const planEndDate = computed(() => currentPlan.value?.end_date || "");

const form = reactive({
  title: "",
  task_date: new Date().toISOString().slice(0, 10),
  note: "",
  repeat_type: "none" as "none" | "daily" | "monthly",
  repeat_end_date: "",
});

const submitting = ref(false);

async function addTask() {
  if (!form.title) return alert("请填写任务标题");
  if (!form.task_date) return alert("请选择任务日期");

  // 验证日期在计划范围内
  if (planStartDate.value && form.task_date < planStartDate.value) {
    return alert(`任务日期不能早于计划开始日期（${planStartDate.value}）`);
  }
  if (planEndDate.value && form.task_date > planEndDate.value) {
    return alert(`任务日期不能晚于计划结束日期（${planEndDate.value}）`);
  }

  if (form.repeat_type !== "none" && !form.repeat_end_date) {
    return alert("请选择重复结束日期");
  }

  // 验证重复结束日期在计划范围内
  if (
    form.repeat_type !== "none" &&
    planEndDate.value &&
    form.repeat_end_date > planEndDate.value
  ) {
    return alert(`重复结束日期不能晚于计划结束日期（${planEndDate.value}）`);
  }

  const userId =
    userStore.user?.id ?? Number(localStorage.getItem("user_id") || 0);
  if (!userId) return alert("请先登录");

  submitting.value = true;
  try {
    // 生成重复任务的 payload 数组
    const basePayload = {
      plan_id: planId,
      user_id: userId,
      title: form.title,
      task_date: form.task_date,
      note: form.note || undefined,
      repeat_type: form.repeat_type,
      repeat_end_date: form.repeat_end_date || undefined,
    };

    const payloads = generateRepeatTaskPayloads(basePayload);

    // 批量创建任务
    for (const payload of payloads) {
      await taskStore.createTask(payload);
    }

    // 重置表单
    form.title = "";
    form.task_date = new Date().toISOString().slice(0, 10);
    form.note = "";
    form.repeat_type = "none";
    form.repeat_end_date = "";

    // 刷新任务列表
    await taskStore.loadTasks(planId);
  } catch (e: any) {
    alert(e?.message || "添加失败，请重试");
  } finally {
    submitting.value = false;
  }
}

async function toggle(task: any) {
  // 如果是分组任务，切换所有关联任务的状态
  if (task._isGrouped && task._groupedIds) {
    const newStatus = task._displayStatus === "done" ? "pending" : "done";
    for (const taskId of task._groupedIds) {
      await taskStore.updateTask(taskId, { status: newStatus });
    }
  } else {
    // 单个任务直接切换
    await taskStore.toggleTaskStatus(task.id);
  }
  // 刷新列表
  await taskStore.loadTasks(planId);
}

async function remove(task: any) {
  const confirmMsg = task._isGrouped
    ? `确认删除该重复任务的所有 ${task._totalCount} 条记录？`
    : "确认删除该任务？";
  if (!confirm(confirmMsg)) return;

  // 如果是分组任务，删除所有关联任务
  if (task._isGrouped && task._groupedIds) {
    for (const taskId of task._groupedIds) {
      await taskStore.deleteTask(taskId);
    }
  } else {
    await taskStore.deleteTask(task.id);
  }

  // 刷新列表
  await taskStore.loadTasks(planId);
}

const editingId = ref<number | null>(null);
const edit = reactive({
  id: 0,
  title: "",
  task_date: "",
  note: "",
  repeat_type: "none" as "none" | "daily" | "monthly",
  repeat_end_date: "",
});

// 辅助函数
function formatDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return "今天";
  const d = new Date(dateStr + "T00:00:00");
  const todayDate = new Date(today + "T00:00:00");
  const diff = Math.floor(
    (d.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 1) return "明天";
  if (diff === -1) return "昨天";
  return dateStr.slice(5); // MM-DD
}

function statusLabel(status: string): string {
  if (status === "done") return "✔ 已完成";
  if (status === "missed") return "⚠ 逾期";
  return "○ 未开始";
}

function startEdit(t: any) {
  editingId.value = t.id;
  edit.id = t.id;
  edit.title = t.title;
  edit.task_date = t.task_date;
  edit.note = t.note || "";
  edit.repeat_type = t.repeat_type || "none";
  edit.repeat_end_date = t.repeat_end_date || "";
}

function cancelEdit() {
  editingId.value = null;
}

async function saveEdit() {
  await taskStore.updateTask(edit.id, {
    title: edit.title,
    task_date: edit.task_date,
    note: edit.note || undefined,
    repeat_type: edit.repeat_type,
    repeat_end_date: edit.repeat_end_date || undefined,
  });
  editingId.value = null;
}

// 快捷操作方法
function quickReschedule() {
  showQuickActions.value = false;
  alert('批量改期功能开发中...');
  // TODO: 实现批量改期逻辑
}

function quickPrioritize() {
  showQuickActions.value = false;
  alert('调整优先级功能开发中...');
  // TODO: 实现优先级调整逻辑
}

function quickSplit() {
  showQuickActions.value = false;
  alert('拆分子任务功能开发中...');
  // TODO: 实现任务拆分逻辑
}

onMounted(async () => {
  await Promise.all([taskStore.loadTasks(planId), planStore.loadPlans()]);
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    // 可以在这里处理响应式逻辑
  });
});

// 组件卸载时清理
// onUnmounted(() => {
//   window.removeEventListener('resize', () => {});
// });
</script>

<style scoped>
/* 4层结构布局 */
.task-layout {
  display: grid;
  gap: var(--space-4);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* 桌面端双列布局 */
@media (min-width: 1025px) {
  .task-layout {
    grid-template-columns: 2fr 1fr;
  }
}

/* 使用 PageScaffold 后不再需要这些样式 */
.plan-tasks-page {
  min-height: 100vh;
}

/* 本周目标条 */
.weekly-goal-bar {
  background: linear-gradient(135deg, var(--ai-bg) 0%, var(--bg-card) 100%);
  border-left: 4px solid var(--ai-main);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.goal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.completion-rate {
  font-size: 24px;
  font-weight: 700;
  color: var(--ai-main);
  font-variant-numeric: tabular-nums;
}

.goal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-main);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ai-main) 0%, var(--ai-light) 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.remaining-tasks {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--warning-bg);
  border-radius: 8px;
  border: 1px solid var(--warning-border);
}

.task-count {
  font-size: 20px;
  font-weight: 700;
  color: var(--warning);
  font-variant-numeric: tabular-nums;
}

.task-label {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 任务分组 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-subtle);
}

.view-toggle {
  display: flex;
  background: var(--bg-main);
  border-radius: 8px;
  padding: 2px;
  border: 1px solid var(--border-main);
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  color: var(--text-main);
  background: var(--bg-card);
}

.toggle-btn.active {
  background: var(--ai-main);
  color: white;
}

.task-groups {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.task-group {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.group-today {
  border-color: var(--success-border);
  background: var(--success-bg);
}

.group-overdue {
  border-color: var(--error-border);
  background: var(--error-bg);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
}

.group-today .group-header {
  background: var(--success-bg);
  border-bottom-color: var(--success-border);
}

.group-overdue .group-header {
  background: var(--error-bg);
  border-bottom-color: var(--error-border);
}

.group-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.group-count {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-main);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.group-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-main);
  margin: 0 0 0.5rem 0;
}

.empty-hint {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* 快捷操作浮层 */
.quick-actions-fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: var(--z-fixed);
}

/* 桌面端编辑面板 */
.edit-panel {
  position: sticky;
  top: calc(var(--header-height) + var(--space-4));
  height: fit-content;
  max-height: calc(100vh - var(--header-height) - var(--space-8));
  overflow-y: auto;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-main);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: all var(--dur-fast) var(--ease-standard);
}

.close-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.edit-form input,
.edit-form select {
  width: 100%;
}

.edit-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.fab-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--ai-main);
  color: white;
  border: none;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.fab-btn:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-xl);
}

.fab-icon {
  font-size: 24px;
}

.quick-actions-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-main);
  padding: 0.5rem;
  min-width: 180px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.quick-action:hover {
  background: var(--bg-card-hover);
}

.action-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.action-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

/* 添加表单 */
.add-task-form {
  transition: all var(--dur-normal) var(--ease-standard);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: var(--space-2) 0;
}

.form-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.expand-toggle {
  background: none;
  border: none;
  font-size: 16px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: all var(--dur-fast) var(--ease-standard);
}

.expand-toggle:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.mobile-collapsed .form-header {
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-3);
}

.add-form {
  margin-top: var(--space-3);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 0.75rem;
  align-items: start;
}

.repeat-row {
  grid-template-columns: 1fr 1fr auto;
  margin-top: 0.75rem;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

/* 任务列表 - 5层信息结构 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 1rem;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

/* 列表项两列网格：左时间（固定宽），右内容 */
.item {
  display: grid;
  grid-template-columns: 56px 1fr;
  column-gap: 12px;
  padding: 12px 0;
}

.item + .item {
  border-top: 1px solid var(--border-subtle);
}

/* 编辑模式：占据全宽 */
.edit-mode {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--border-main);
}

.edit-mode input,
.edit-mode select {
  width: 100%;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* 时间/日期列：左对齐，等宽数字，弱颜色 */
.time-col {
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

/* 内容列 */
.content-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-row {
  gap: 8px;
}

/* 勾选框 */
.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

/* 状态圆点 */
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  flex-shrink: 0;
}

.status-dot.pending {
  background: var(--warning);
}

.status-dot.done {
  background: var(--success);
}

.status-dot.missed {
  background: var(--error);
}

.status-dot.partial {
  background: var(--info);
}

/* 标题：视觉中心 */
.title {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.title.completed {
  text-decoration: line-through;
  opacity: 0.6;
}

/* 副信息：影响决策的内容 */
.meta {
  font-size: 12px;
  color: var(--text-secondary);
  gap: 6px;
  flex-wrap: wrap;
}

/* 标签：辅助感知 */
.tags {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.tag {
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
  font-size: 11px;
  border-radius: 6px;
  padding: 2px 6px;
  white-space: nowrap;
}

.tag.done {
  background: var(--success-bg);
  color: var(--success);
}

.tag.pending {
  background: var(--warning-bg);
  color: var(--warning);
}

.tag.missed {
  background: var(--error-bg);
  color: var(--error);
}

.tag.repeat-tag {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.tag.progress-tag {
  background: var(--info-bg);
  color: var(--info);
  font-weight: 500;
}

.spacer {
  flex: 1;
}

/* 操作按钮 */
.op-btn {
  background: transparent;
  border: 1px solid var(--border-main);
  color: var(--text-secondary);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.op-btn:hover {
  background: var(--bg-card);
  color: var(--text-main);
}

.delete-btn:hover {
  background: var(--error-bg);
  color: var(--error);
  border-color: var(--error);
}

/* 空状态 */
.empty {
  color: var(--text-muted);
  margin-top: 1rem;
  text-align: center;
  font-size: 14px;
}

/* 按钮样式 */
.primary {
  background: var(--ai-main);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.primary:hover {
  background: var(--ai-light);
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary {
  background: transparent;
  border: 1px solid var(--border-main);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary:hover {
  background: var(--bg-card);
  color: var(--text-main);
}

/* 响应式布局 */
.task-layout {
  display: grid;
  gap: var(--space-5);
}

/* 桌面端双列布局 */
@media (min-width: 1025px) {
  .task-layout {
    grid-template-columns: 2fr 1fr;
  }
  
  .task-list-container {
    /* 左侧任务列表 */
  }
  
  .edit-panel {
    /* 右侧编辑面板 */
    align-self: start;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .goal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .completion-rate {
    font-size: 20px;
  }
  
  .progress-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .view-toggle {
    width: 100%;
  }
  
  .toggle-btn {
    flex: 1;
    text-align: center;
  }
  
  .quick-actions-fab {
    bottom: 1rem;
    right: 1rem;
  }
  
  .quick-actions-menu {
    right: -10px;
    min-width: 160px;
  }
  
  /* 移动端优先显示今日和逾期任务 */
  .task-group.group-today,
  .task-group.group-overdue {
    order: -1;
  }
  
  /* 确保checkbox、状态、标题一行可见 */
  .title-row {
    flex-wrap: nowrap;
  }
  
  .title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .repeat-row {
    grid-template-columns: 1fr;
  }

  .item {
    grid-template-columns: 48px 1fr;
    column-gap: 8px;
  }

  .time-col {
    font-size: 11px;
  }

  .title {
    font-size: 13px;
  }

  .meta {
    font-size: 11px;
  }
  
  .group-header {
    padding: 0.75rem 1rem;
  }
  
  .group-title {
    font-size: 15px;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .weekly-goal-bar {
    background: linear-gradient(135deg, var(--ai-bg-dark) 0%, var(--bg-card-dark) 100%);
  }
  
  .task-group {
    border-color: var(--border-subtle-dark);
  }
  
  .group-header {
    background: var(--bg-card-dark);
    border-bottom-color: var(--border-subtle-dark);
  }
}
</style>
