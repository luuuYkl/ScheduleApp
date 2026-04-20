<!--
  ═══════════════════════════════════════════════════════════════
  任务详情弹窗 (TaskDetailPopover.vue)
  ═══════════════════════════════════════════════════════════════
  
  【组件定位】
  在时间轴视图 hover 任务块时弹出的详情弹窗，替代跳转到详情页。
  
  【Props】
  - taskId: 任务ID
  
  【Events】
  - close: 请求关闭弹窗
-->
<template>
  <div
    class="task-popover"
    ref="popoverRef"
    @mouseenter="$emit('popoverEnter')"
    @mouseleave="$emit('popoverLeave')"
  >
    <!-- 头部：标题 + 状态 + 关闭 -->
    <div class="popover-header">
      <div class="header-left">
        <span class="status-dot" :class="task?.status"></span>
        <h3 class="task-title" :class="{ 'task-done': isTaskDone }">
          {{ task?.title }}
        </h3>
      </div>
      <div class="header-right">
        <span class="status-tag" :class="task?.status">{{ statusText }}</span>
        <button class="close-btn" @click="$emit('close')" title="关闭">✕</button>
      </div>
    </div>

    <!-- 元信息 -->
    <div class="popover-meta" v-if="task">
      <div class="meta-item" v-if="task.start_date">
        <span class="meta-icon">📅</span>
        <span class="meta-value">{{ dateRangeText }}</span>
      </div>
      <div class="meta-item" v-if="task.start_time && task.end_time">
        <span class="meta-icon">🕐</span>
        <span class="meta-value">{{ task.start_time }} – {{ task.end_time }}</span>
      </div>
      <div class="meta-item" v-if="durationMinutes > 0">
        <span class="meta-icon">⏱</span>
        <span class="meta-value">{{ durationText }}</span>
      </div>
      <div class="meta-item" v-if="task.repeat_type && task.repeat_type !== 'none'">
        <span class="meta-icon">🔁</span>
        <span class="meta-value">{{ repeatTypeLabel }}</span>
      </div>
    </div>

    <!-- 备注 -->
    <div class="popover-section" v-if="task?.note">
      <div class="section-label">📝 备注</div>
      <div class="note-content">
        <p>{{ task.note }}</p>
      </div>
    </div>

    <!-- 计划关联 -->
    <div class="popover-section" v-if="planInfo">
      <div class="section-label">📋 所属计划</div>
      <div class="plan-info">
        <span class="plan-emoji">{{ planEmoji }}</span>
        <div class="plan-details">
          <span class="plan-title">{{ planInfo.title }}</span>
          <div class="plan-progress-bar" v-if="planProgress !== null">
            <div class="progress-fill" :class="getProgressClass(planProgress || 0)" :style="{ width: (planProgress || 0) + '%' }"></div>
          </div>
          <small class="plan-hint">{{ planDoneCount }}/{{ planTotalCount }} 已完成</small>
        </div>
      </div>
    </div>

    <!-- AI 建议（精简） -->
    <div class="popover-section ai-section" v-if="aiInsight">
      <div class="section-label">🤖 智能建议</div>
      <p class="ai-insight">{{ aiInsight }}</p>
    </div>

    <!-- 操作按钮 -->
    <div class="popover-actions">
      <button
        class="action-btn primary"
        :class="{ 'secondary': isTaskDone }"
        @click="toggleTaskStatus"
        :disabled="toggling"
      >
        {{ isTaskDone ? '↩ 撤销完成' : '✅ 标记完成' }}
      </button>
      <button class="action-btn outline" @click="startFocus" :disabled="isTaskDone">
        🎯 专注
      </button>
      <button class="action-btn outline" @click="editTask">
        ✏️ 编辑
      </button>
      <button class="action-btn danger-outline" @click="confirmDelete" :disabled="deleting">
        🗑 删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/store/tasks'
import { usePlanStore } from '@/store/plans'

const props = defineProps<{
  taskId: number
  activeDate?: string  // 当前查看的日期（用于跨天任务的单日标记完成）
}>()

defineEmits<{
  close: []
  popoverEnter: []
  popoverLeave: []
}>()

const router = useRouter()
const taskStore = useTaskStore()
const planStore = usePlanStore()
const popoverRef = ref<HTMLElement | null>(null)
const toggling = ref(false)
const deleting = ref(false)

// 当前任务
const task = computed(() => taskStore.tasks.find(t => t.id === props.taskId))

// 状态
const isTaskDone = computed(() => task.value?.status === 'done')

const statusText = computed(() => {
  if (!task.value) return ''
  const map: Record<string, string> = {
    done: '✔ 已完成',
    missed: '⚠ 已逾期',
    pending: '● 进行中',
  }
  return map[task.value.status] || '● 进行中'
})

// 日期范围
const dateRangeText = computed(() => {
  if (!task.value) return ''
  const { start_date, end_date } = task.value
  if (start_date === end_date) return formatDateReadable(start_date)
  return `${formatDateReadable(start_date)} ~ ${formatDateReadable(end_date)}`
})

// 时长
const durationMinutes = computed(() => {
  if (!task.value?.start_time || !task.value?.end_time) return 0
  const [sh, sm] = task.value.start_time.split(':').map(Number)
  const [eh, em] = task.value.end_time.split(':').map(Number)
  return Math.max(0, eh * 60 + em - (sh * 60 + sm))
})

const durationText = computed(() => {
  const m = durationMinutes.value
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const r = m % 60
    return r > 0 ? `${h}小时${r}分钟` : `${h}小时`
  }
  return `${m}分钟`
})

// 重复类型
const repeatTypeLabel = computed(() => {
  if (!task.value?.repeat_type) return ''
  const labels: Record<string, string> = {
    daily: '每日重复',
    weekly: '每周重复',
    monthly: '每月重复',
  }
  return labels[task.value.repeat_type] || ''
})

// 计划信息
const planInfo = computed(() => {
  return planStore.plans.find((p: any) => p.id === task.value?.plan_id)
})

const planEmoji = computed(() => {
  const emojis = ['🎯', '🚀', '📚', '💪', '💰', '🎨']
  const index = planInfo.value?.id ? planInfo.value.id % emojis.length : 0
  return emojis[index]
})

const planProgressData = computed(() => {
  if (!task.value || !planInfo.value) return null
  const planId = task.value.plan_id
  const planTasks = taskStore.tasks.filter((t: any) => t.plan_id === planId)

  // 按 repeat_group_id 去重：同一组重复任务视为一个单元
  // 无 repeat_group_id 的独立任务正常计数
  const groupMap = new Map<number | null, { done: boolean }>()
  for (const t of planTasks) {
    const key = t.repeat_group_id ?? t.id // 独立任务用 id 作为 key
    const existing = groupMap.get(key)
    if (!existing) {
      groupMap.set(key, { done: t.status === 'done' })
    } else if (t.status === 'done') {
      // 组内任一完成则标记为完成
      existing.done = true
    }
  }

  const total = groupMap.size
  const done = [...groupMap.values()].filter(g => g.done).length
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
})

const planProgress = computed(() => planProgressData.value?.pct ?? null)
const planDoneCount = computed(() => planProgressData.value?.done ?? 0)
const planTotalCount = computed(() => planProgressData.value?.total ?? 0)

// AI 精简建议
const aiInsight = computed(() => {
  if (!task.value) return ''
  const duration = durationMinutes.value
  const today = new Date().toISOString().slice(0, 10)
  const { start_date, end_date, status } = task.value

  if (status === 'done') return '任务已完成，做得好！'
  if (status === 'missed') return '该任务已逾期，建议尽快调整。'
  if (duration > 120) return '预计耗时较长（>2h），建议分解为子任务。'
  if (end_date < today) return '截止日期已过，建议尽快处理。'
  if (start_date > today) return '任务尚未开始，提前做好准备。'
  return '任务安排合理，按计划执行即可。'
})

// 判断是否为跨天任务
const isMultiDay = computed(() => {
  if (!task.value) return false
  return task.value.start_date !== task.value.end_date
})

// 操作函数
async function toggleTaskStatus() {
  if (!task.value) return
  toggling.value = true
  try {
    // 跨天任务 + 有 activeDate → 拆分并只标记当前日期
    if (isMultiDay.value && props.activeDate) {
      await taskStore.splitAndToggleMultiDayTask(task.value.id, props.activeDate)
    } else {
      // 单天任务，正常切换
      await taskStore.toggleTaskStatus(task.value.id)
    }
  } catch (err) {
    console.error('更新任务状态失败:', err)
  } finally {
    toggling.value = false
  }
}

function editTask() {
  if (task.value) {
    router.push(`/task/${task.value.id}/edit`)
  }
}

function startFocus() {
  if (task.value) {
    router.push({ path: '/focus', query: { taskId: String(task.value.id) } })
  }
}

async function confirmDelete() {
  if (!task.value) return
  if (!confirm(`确定要删除任务「${task.value.title}」吗？此操作不可撤销。`)) return
  deleting.value = true
  try {
    await taskStore.deleteTask(task.value.id)
  } catch (err) {
    console.error('删除任务失败:', err)
  } finally {
    deleting.value = false
  }
}

// 辅助函数
function formatDateReadable(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10)
  if (dateStr === today) return '今天'
  const d = new Date(dateStr + 'T00:00:00')
  const t = new Date(today + 'T00:00:00')
  const diff = Math.floor((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 1) return '明天'
  if (diff === -1) return '昨天'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function getProgressClass(progress: number): string {
  if (progress >= 80) return 'good'
  if (progress >= 50) return 'warning'
  return 'danger'
}
</script>

<style scoped>
.task-popover {
  width: 340px;
  max-height: 480px;
  overflow-y: auto;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-main, #e5e7eb);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 1000;
}

/* 头部 */
.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.done { background: var(--success, #22c55e); }
.status-dot.pending { background: var(--color-brand-500, #2563eb); }
.status-dot.missed { background: var(--error, #ef4444); }

.task-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-emphasis, #111827);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-title.task-done {
  text-decoration: line-through;
  color: var(--text-muted, #9ca3af);
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.status-tag.done { background: var(--success-bg, #dcfce7); color: var(--success, #22c55e); }
.status-tag.pending { background: var(--info-bg, #dbeafe); color: var(--info, #2563eb); }
.status-tag.missed { background: var(--error-bg, #fee2e2); color: var(--error, #ef4444); }

.close-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--text-muted, #9ca3af);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}
.close-btn:hover {
  background: var(--bg-elevated, #f3f4f6);
  color: var(--text-main, #374151);
}

/* 元信息 */
.popover-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--bg-elevated, #f3f4f6);
  border-radius: var(--radius-sm, 6px);
  font-size: 12px;
  color: var(--text-main, #374151);
}

.meta-icon {
  font-size: 13px;
  flex-shrink: 0;
}

.meta-value {
  font-weight: 500;
  white-space: nowrap;
}

/* 分区 */
.popover-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
}

.note-content {
  padding: 8px 10px;
  background: var(--bg-elevated, #f3f4f6);
  border-radius: var(--radius-sm, 6px);
  border-left: 3px solid var(--ai-main, #8b5cf6);
  max-height: 80px;
  overflow-y: auto;
}

.note-content p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-main, #374151);
}

/* 计划信息 */
.plan-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--ai-bg, #f5f3ff);
  border-radius: var(--radius-sm, 6px);
  border-left: 3px solid var(--ai-main, #8b5cf6);
}

.plan-emoji {
  font-size: 22px;
  flex-shrink: 0;
}

.plan-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.plan-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main, #374151);
}

.plan-progress-bar {
  height: 4px;
  background: var(--bg-elevated, #e5e7eb);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}
.progress-fill.good { background: var(--success, #22c55e); }
.progress-fill.warning { background: var(--warning, #f59e0b); }
.progress-fill.danger { background: var(--error, #ef4444); }

.plan-hint {
  font-size: 11px;
  color: var(--text-muted, #9ca3af);
}

/* AI 建议 */
.ai-section .ai-insight {
  margin: 0;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary, #6b7280);
  background: var(--bg-elevated, #f3f4f6);
  border-radius: var(--radius-sm, 6px);
}

/* 操作按钮 */
.popover-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px solid var(--border-main, #e5e7eb);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 7px 12px;
  border-radius: var(--radius-sm, 6px);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.primary {
  background: var(--color-brand-500, #2563eb);
  color: #fff;
  border-color: var(--color-brand-500, #2563eb);
}
.action-btn.primary:hover:not(:disabled) {
  background: var(--color-brand-600, #1d4ed8);
}

.action-btn.secondary {
  background: var(--bg-elevated, #f3f4f6);
  color: var(--text-main, #374151);
  border-color: var(--border-main, #e5e7eb);
}
.action-btn.secondary:hover:not(:disabled) {
  background: var(--bg-hover, #e5e7eb);
}

.action-btn.outline {
  background: transparent;
  color: var(--text-main, #374151);
  border-color: var(--border-main, #d1d5db);
}
.action-btn.outline:hover:not(:disabled) {
  background: var(--bg-elevated, #f3f4f6);
}

.action-btn.danger-outline {
  background: transparent;
  color: var(--error, #ef4444);
  border-color: var(--error, #fca5a5);
}
.action-btn.danger-outline:hover:not(:disabled) {
  background: var(--error-bg, #fee2e2);
}

/* 滚动条 */
.task-popover::-webkit-scrollbar {
  width: 4px;
}
.task-popover::-webkit-scrollbar-track {
  background: transparent;
}
.task-popover::-webkit-scrollbar-thumb {
  background: var(--border-main, #d1d5db);
  border-radius: 2px;
}
</style>