<template>
  <div class="card">
    <div class="header">
      <h2>今日任务与日程</h2>
      <small v-if="planId">仅显示计划 #{{ planId }} 的任务</small>
    </div>

    <!-- 今日日程 -->
    <section v-if="schedules.length > 0" class="section">
      <h3 class="section-title">📅 日程</h3>
      <ul class="list">
        <li v-for="s in schedules" :key="'s'+s.id" class="item">
          <!-- 左列：时间 -->
          <div class="time-col">
            <span v-if="s.start_time">{{ s.start_time }}</span>
            <span v-if="s.end_time">– {{ s.end_time }}</span>
          </div>

          <!-- 右列：内容 -->
          <div class="content-col">
            <!-- 第一行：勾选 + 状态圆点 + 标题 -->
            <div class="row title-row">
              <input type="checkbox" :checked="s.completed" @change="toggleSchedule(s.id)" class="checkbox" />
              <span class="status-dot" :class="{ completed: s.completed }"></span>
              <span class="title" :class="{ completed: s.completed }">{{ s.title }}</span>
            </div>

            <!-- 第二行：副信息 -->
            <div class="row meta" v-if="s.description && s.description.length <= 40">
              <span>📝 {{ s.description }}</span>
            </div>

            <!-- 第三行：标签 -->
            <div class="row tags">
              <span class="tag schedule-tag">日程</span>
              <span class="tag" v-if="s.completed">✔ 已完成</span>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <!-- 今日任务（若今日为空则显示最近未来任务） -->
    <section v-if="tasks.length > 0" class="section">
      <h3 class="section-title">✅ 任务 <small v-if="tasks[0].task_date !== todayStr" class="hint">(即将开始)</small></h3>
      <ul class="list">
        <li v-for="t in tasks" :key="'t'+t.id" class="item">
          <!-- 左列：日期 -->
          <div class="time-col">
            <span>{{ formatDate(t.task_date) }}</span>
          </div>

          <!-- 右列：内容 -->
          <div class="content-col">
            <!-- 第一行：勾选 + 状态圆点 + 标题 -->
            <div class="row title-row">
              <input type="checkbox" :checked="t.status === 'done'" @change="toggle(t.id)" class="checkbox" />
              <span class="status-dot" :class="t.status"></span>
              <span class="title" :class="{ completed: t.status === 'done' }">{{ t.title }}</span>
            </div>

            <!-- 第二行：副信息 -->
            <div class="row meta">
              <span v-if="t.start_time && t.end_time">⏱ {{ calcDuration(t) }} 分钟</span>
              <span v-if="t.note && t.note.length <= 30">· {{ t.note }}</span>
            </div>

            <!-- 第三行：标签与详情按钮 -->
            <div class="row tags">
              <span class="tag" v-if="t.task_date === todayStr">今日任务</span>
              <span class="tag" :class="t.status">{{ statusLabel(t.status) }}</span>
              <button class="detail-btn" @click="open(t.id)">详情</button>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <p v-if="tasks.length === 0 && schedules.length === 0" class="empty">今天暂无任务与日程</p>
  </div>
</template>

<script setup lang="ts">

import { computed, onMounted } from "vue";
import { useTaskStore } from "@/store/tasks";
import { useScheduleStore } from "@/store/schedules";
import { useLogStore } from "@/store/log";
import { useUserStore } from "@/store/user";
import { useRouter } from "vue-router";

const props = defineProps<{ planId?: number }>();


const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();
const logStore = useLogStore();
const userStore = useUserStore();
const router = useRouter();


const todayStr = new Date().toISOString().slice(0, 10);

// 辅助函数：日期格式化、时长计算、状态标签
function formatDate(dateStr: string): string {
  if (dateStr === todayStr) return '今天';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');
  const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 1) return '明天';
  if (diff === -1) return '昨天';
  return dateStr.slice(5); // MM-DD
}

function calcDuration(t: { start_time?: string; end_time?: string }): number {
  if (!t.start_time || !t.end_time) return 0;
  const [sh, sm] = t.start_time.split(':').map(Number);
  const [eh, em] = t.end_time.split(':').map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

function statusLabel(status: string): string {
  if (status === 'done') return '✔ 已完成';
  if (status === 'missed') return '⚠ 逾期';
  return '○ 未开始';
}

const tasks = computed(() => {
  // 今日任务列表
  const todayList = taskStore.tasks.filter((t: any) => t.task_date === todayStr);
  const filteredToday = props.planId ? todayList.filter((t: any) => t.plan_id === props.planId) : todayList;
  if (filteredToday.length > 0) return filteredToday;
  // 回退：未来任务（日期 >= 今天），按日期升序取前 5 条
  const future = taskStore.tasks
    .filter((t: any) => t.task_date >= todayStr && (!props.planId || t.plan_id === props.planId))
    .sort((a: any, b: any) => a.task_date.localeCompare(b.task_date))
    .slice(0, 5);
  return future;
});
const schedules = computed(() => scheduleStore.schedules.filter(s => s.date === todayStr));

onMounted(async () => {
  await taskStore.loadTasks(props.planId);
  await scheduleStore.load(todayStr);
});


async function toggle(taskId: number) {
  await taskStore.toggleTaskStatus(taskId);
  // 勾选后生成日志（包含任务和日程）
  const userId = userStore.user?.id;
  if (userId) {
    await logStore.generateTodayLog(userId, taskStore.tasks, schedules.value);
  }
}

async function toggleSchedule(scheduleId: number) {
  await scheduleStore.toggleComplete(scheduleId);
  // 勾选日程后也更新日志（包含任务和日程）
  const userId = userStore.user?.id;
  if (userId) {
    await logStore.generateTodayLog(userId, taskStore.tasks, schedules.value);
  }
}

function open(id: number) {
  router.push(`/task/${id}`);
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: baseline;
  gap: .5rem;
  margin-bottom: .5rem;
}

.section { 
  margin-bottom: 1.5rem; 
}

.section-title { 
  font-size: 14px; 
  font-weight: 600; 
  color: var(--text-main); 
  margin-bottom: 12px; 
  letter-spacing: 0.02em;
}

.section-title .hint {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
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
  border-top: 1px solid var(--border-soft, var(--border-subtle));
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
.status-dot.pending { background: var(--color-warning); }
.status-dot.done { background: var(--color-success); }
.status-dot.missed { background: var(--color-danger); }
.status-dot.completed { background: var(--color-success); }

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
}

/* 标签：辅助感知 */
.tags {
  display: flex;
  gap: 6px;
  align-items: center;
}

.tag {
  background: rgba(99,102,241,0.08);
  color: #6366F1;
  font-size: 11px;
  border-radius: 6px;
  padding: 2px 6px;
}
.tag.done { background: rgba(16,185,129,0.10); color: var(--color-success); }
.tag.pending { background: rgba(234,179,8,0.12); color: var(--color-warning); }
.tag.missed { background: rgba(239,68,68,0.10); color: var(--color-danger); }
.tag.schedule-tag { background: rgba(250,204,21,0.15); color: #d97706; }

/* 详情按钮 */
.detail-btn {
  background: transparent;
  border: 1px solid var(--border-main);
  color: var(--text-secondary);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-btn:hover {
  background: var(--bg-card);
  color: var(--text-main);
}

.empty { 
  color: var(--text-muted); 
  margin-top: 1rem; 
  text-align: center;
  font-size: 14px;
}
</style>
