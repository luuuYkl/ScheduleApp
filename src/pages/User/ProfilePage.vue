<template>
  <PageScaffold 
    title="个人中心" 
    :show-back="false"
    class="layer-context"
  >
    <PullToRefresh @refresh="handleRefresh">
    <div class="profile-container">
      <!-- 1. 用户信息卡片 -->
      <section class="user-profile-card">
        <div class="user-main-info">
          <img :src="avatarUrl" class="user-avatar" alt="用户头像" />
          <div class="user-details">
            <h1 class="user-name">{{ user?.username || "未登录用户" }}</h1>
            <div class="user-meta">
              <span class="user-type">👤 个人用户</span>
              <span class="user-join-date">加入于 {{ joinDate }}</span>
            </div>
          </div>
        </div>
        <!-- 成就摘要 -->
        <div class="achievement-summary">
          <div class="achievement-item">
            <span class="achievement-icon">🔥</span>
            <div class="achievement-content">
              <span class="achievement-value">{{ streakDays }}天</span>
              <span class="achievement-label">连续打卡</span>
            </div>
          </div>
          <div class="achievement-divider"></div>
          <div class="achievement-item">
            <span class="achievement-icon">🔄</span>
            <div class="achievement-content">
              <span class="achievement-value">{{ habitStreakDays }}天</span>
              <span class="achievement-label">习惯坚持</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. 行为结果统计模块 -->
      <section class="behavior-stats-section">
        <div class="stat-card" v-for="stat in behaviorStats" :key="stat.key">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-name">{{ stat.name }}</div>
          <div class="stat-trend" :class="stat.trendClass">{{ stat.trend }}</div>
        </div>
      </section>

      <!-- 3. 行为分析模块 -->
      <section class="behavior-analysis-section">
        <h2 class="section-title">📊 行为分析</h2>
        <div class="analysis-grid">
          <div class="analysis-card" v-for="item in analysisItems" :key="item.key">
            <div class="analysis-header">
              <span class="analysis-icon">{{ item.icon }}</span>
              <span class="analysis-title">{{ item.title }}</span>
            </div>
            <div class="analysis-value">{{ item.value }}</div>
            <div class="analysis-desc">{{ item.description }}</div>
          </div>
          <!-- 行为趋势图 -->
          <div class="analysis-card trend-card">
            <div class="analysis-header">
              <span class="analysis-icon">📈</span>
              <span class="analysis-title">完成率趋势</span>
            </div>
            <div class="trend-chart">
              <div class="trend-bar" v-for="(bar, index) in trendData" :key="index" :style="{ height: bar.height + '%' }">
                <span class="trend-label">{{ bar.label }}</span>
              </div>
            </div>
            <div class="analysis-desc">最近7天完成率变化</div>
          </div>
        </div>
      </section>

      <!-- 4. 系统设置模块 -->
      <section class="system-settings-section">
        <h2 class="section-title">⚙️ 系统设置</h2>

        <!-- 4.1 提醒偏好 -->
        <div class="settings-group">
          <div class="settings-group-header" @click="toggleSection('reminder')">
            <div class="settings-group-left">
              <span class="setting-icon">🔔</span>
              <div class="setting-text">
                <span class="setting-name">提醒偏好</span>
                <span class="setting-hint">{{ reminderSummaryText }}</span>
              </div>
            </div>
            <div class="settings-group-right">
              <Switch
                :modelValue="userSettings.settings.value.reminderEnabled"
                @update:modelValue="(v: boolean) => userSettings.updateSetting('reminderEnabled', v)"
                @click.stop
              />
              <span class="setting-arrow" :class="{ expanded: expandedSections.reminder }">›</span>
            </div>
          </div>

          <Transition name="slide">
            <div v-if="expandedSections.reminder && userSettings.settings.value.reminderEnabled" class="settings-group-body">
              <!-- 提前提醒时间 -->
              <div class="sub-setting-row">
                <div class="sub-setting-text">
                  <span class="sub-setting-name">提前提醒时间</span>
                  <span class="sub-setting-desc">任务到期前多久发送提醒</span>
                </div>
                <select
                  class="setting-select"
                  :value="userSettings.settings.value.reminderAdvanceMinutes"
                  @change="userSettings.updateSetting('reminderAdvanceMinutes', Number(($event.target as HTMLSelectElement).value) as ReminderAdvance)"
                >
                  <option v-for="opt in userSettings.reminderAdvanceOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <!-- 提醒声音 -->
              <div class="sub-setting-row">
                <div class="sub-setting-text">
                  <span class="sub-setting-name">提醒声音</span>
                  <span class="sub-setting-desc">提醒时播放声音</span>
                </div>
                <Switch
                  :modelValue="userSettings.settings.value.reminderSoundEnabled"
                  @update:modelValue="(v: boolean) => userSettings.updateSetting('reminderSoundEnabled', v)"
                />
              </div>

              <!-- 每日签到提醒 -->
              <div class="sub-setting-row">
                <div class="sub-setting-text">
                  <span class="sub-setting-name">每日签到提醒</span>
                  <span class="sub-setting-desc">每天定时提醒签到</span>
                </div>
                <div class="sub-setting-control-inline">
                  <Switch
                    :modelValue="userSettings.settings.value.dailyCheckinEnabled"
                    @update:modelValue="(v: boolean) => userSettings.updateSetting('dailyCheckinEnabled', v)"
                  />
                  <input
                    v-if="userSettings.settings.value.dailyCheckinEnabled"
                    type="time"
                    class="setting-time-input"
                    :value="userSettings.settings.value.dailyCheckinTime"
                    @change="userSettings.updateSetting('dailyCheckinTime', ($event.target as HTMLInputElement).value)"
                  />
                </div>
              </div>

              <!-- 每周回顾提醒 -->
              <div class="sub-setting-row">
                <div class="sub-setting-text">
                  <span class="sub-setting-name">每周回顾提醒</span>
                  <span class="sub-setting-desc">每周定时提醒回顾总结</span>
                </div>
                <Switch
                  :modelValue="userSettings.settings.value.weeklyReviewEnabled"
                  @update:modelValue="(v: boolean) => userSettings.updateSetting('weeklyReviewEnabled', v)"
                />
              </div>
            </div>
          </Transition>
        </div>

        <!-- 4.2 AI 参与度 -->
        <div class="settings-group">
          <div class="settings-group-header" @click="toggleSection('ai')">
            <div class="settings-group-left">
              <span class="setting-icon">🧠</span>
              <div class="setting-text">
                <span class="setting-name">AI 参与度</span>
                <span class="setting-hint">{{ userSettings.aiLevelLabel.value }} · {{ aiLevelDescText }}</span>
              </div>
            </div>
            <div class="settings-group-right">
              <Switch
                :modelValue="userSettings.settings.value.aiEnabled"
                @update:modelValue="(v: boolean) => userSettings.updateSetting('aiEnabled', v)"
                @click.stop
              />
              <span class="setting-arrow" :class="{ expanded: expandedSections.ai }">›</span>
            </div>
          </div>

          <Transition name="slide">
            <div v-if="expandedSections.ai && userSettings.settings.value.aiEnabled" class="settings-group-body">
              <!-- 参与程度选择 -->
              <div class="ai-level-selector">
                <div
                  v-for="level in aiLevelOptions"
                  :key="level.value"
                  class="ai-level-option"
                  :class="{ active: userSettings.settings.value.aiLevel === level.value }"
                  @click="userSettings.updateSetting('aiLevel', level.value as AILevel)"
                >
                  <div class="ai-level-radio">
                    <div class="ai-level-radio-dot" :class="{ checked: userSettings.settings.value.aiLevel === level.value }"></div>
                  </div>
                  <div class="ai-level-text">
                    <span class="ai-level-name">{{ level.label }}</span>
                    <span class="ai-level-desc">{{ level.description }}</span>
                  </div>
                </div>
              </div>

              <!-- AI 功能预览 -->
              <div class="ai-feature-preview">
                <div class="ai-feature-tag" :class="{ enabled: userSettings.isAIFeatureEnabled('suggest') }">
                  💡 智能建议
                </div>
                <div class="ai-feature-tag" :class="{ enabled: userSettings.isAIFeatureEnabled('analysis') }">
                  📊 日志分析
                </div>
                <div class="ai-feature-tag" :class="{ enabled: userSettings.isAIFeatureEnabled('review') }">
                  📝 自动复盘
                </div>
                <div class="ai-feature-tag" :class="{ enabled: userSettings.isAIFeatureEnabled('smartReminder') }">
                  ⏰ 智能提醒
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </section>

      <!-- 5. 账户管理模块 -->
      <section class="account-management-section">
        <div class="account-actions">
          <Button variant="outline" size="small" @click="exportData" class="account-btn">
            <span class="btn-icon">📦</span> 导出数据
          </Button>
          <Button variant="outline" size="small" @click="showPrivacy" class="account-btn">
            <span class="btn-icon">🔒</span> 隐私设置
          </Button>
          <Button variant="danger" size="small" @click="logout" class="account-btn logout-btn">
            <span class="btn-icon">🚪</span> 退出登录
          </Button>
        </div>
      </section>
    </div>
    </PullToRefresh>
  </PageScaffold>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
import { useLogStore } from "@/store/log";
import { useStreakStore } from "@/store/streak";
import { useUserSettings } from "@/composables/useUserSettings";
import type { AILevel, ReminderAdvance } from "@/composables/useUserSettings";
import PageScaffold from '@/components/common/PageScaffold.vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Switch from '@/components/common/Switch.vue';
import PullToRefresh from '@/components/common/PullToRefresh.vue';

const router = useRouter();
const userStore = useUserStore();
const planStore = usePlanStore();
const taskStore = useTaskStore();
const logStore = useLogStore();
const streakStore = useStreakStore();

const user = computed(() => userStore.user);
const avatarUrl = computed(() =>
  user.value?.username
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.value.username)}`
    : "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
);

// 数据加载状态
const loading = ref(false);

// ========== 真实数据加载 ==========

const userId = computed(() =>
  user.value?.id ?? Number(localStorage.getItem("user_id")) ?? 1
);

/** 加载所有数据 */
async function loadAllData() {
  loading.value = true;
  try {
    await Promise.allSettled([
      planStore.loadPlans(),
      taskStore.loadTasks(),
      logStore.loadLogs(userId.value),
      streakStore.loadStreak(userId.value),
    ]);
  } catch (e) {
    console.warn("[ProfilePage] 加载数据失败:", e);
  } finally {
    loading.value = false;
  }
}

// ========== 从真实数据计算统计 ==========

/** 加入日期：从最早的计划/日志创建时间获取 */
const joinDate = computed(() => {
  const dates: string[] = [];

  // 从计划中获取最早创建时间
  planStore.plans.forEach((p) => {
    if (p.created_at) dates.push(p.created_at);
    if (p.start_date) dates.push(p.start_date);
  });

  // 从日志中获取最早日期
  logStore.logs.forEach((l) => {
    if (l.date) dates.push(l.date);
  });

  if (dates.length === 0) {
    // 没有任何数据时，显示当前日期
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  }

  const earliest = dates.sort()[0];
  const d = new Date(earliest);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
});

/** 连续打卡天数 */
const streakDays = computed(() => streakStore.streak?.current_streak ?? 0);

/** 最长连续天数 */
const longestStreak = computed(() => streakStore.streak?.longest_streak ?? 0);

/** 今日任务完成率 */
const todayCompletionRate = computed(() => {
  const tasks = taskStore.tasks;
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
});

/** 最近7天完成率（从日志中提取） */
const last7DaysCompletion = computed(() => {
  const logs = logStore.logs;
  if (!logs || logs.length === 0) return [];

  // 取最近7天的日志
  const recentLogs = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  // 获取最近7天的日期
  const days: { date: string; rate: number; label: string }[] = [];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const log = recentLogs.find((l) => l.date === dateStr);
    const rate = log && log.tasks_total > 0
      ? Math.round((log.tasks_done / log.tasks_total) * 100)
      : 0;
    days.push({
      date: dateStr,
      rate,
      label: weekDays[d.getDay()],
    });
  }
  return days;
});

/** 最近一次工作时长（专注时长） */
const recentWorkHours = computed(() => {
  const logs = logStore.logs;
  if (!logs || logs.length === 0) return 0;

  // 从最近的日志中获取工作时长
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  for (const log of sortedLogs) {
    if (log.work_hours && log.work_hours > 0) {
      return log.work_hours;
    }
  }

  // 如果日志中没有，从已完成且有时间的任务中计算
  const tasks = taskStore.tasks;
  const today = new Date().toISOString().slice(0, 10);
  let totalMinutes = 0;
  for (const t of tasks) {
    if (t.status === 'done' && t.start_date <= today && t.end_date >= today && t.start_time && t.end_time) {
      const [sh, sm] = t.start_time.split(':').map(Number);
      const [eh, em] = t.end_time.split(':').map(Number);
      totalMinutes += Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    }
  }
  return Number((totalMinutes / 60).toFixed(1));
});

/** 活跃计划数 */
const activePlanCount = computed(() => {
  const plans = planStore.plans;
  if (!plans || plans.length === 0) return 0;
  return plans.filter((p) => p.status === 'IN_PROGRESS' || (!p.status && p.end_date >= new Date().toISOString().slice(0, 10))).length;
});

/** 习惯坚持天数：从日志中计算连续有记录且完成任务的天数 */
const habitStreakDays = computed(() => {
  const logs = logStore.logs;
  if (!logs || logs.length === 0) return 0;

  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < sortedLogs.length; i++) {
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedDateStr = expectedDate.toISOString().slice(0, 10);

    const log = sortedLogs.find((l) => l.date === expectedDateStr);
    if (log && log.tasks_done > 0) {
      streak++;
    } else if (expectedDateStr < today) {
      // 如果不是今天（今天可能还没结束），遇到断链就停止
      break;
    }
  }
  return streak;
});

/** 黄金时段：从日志中统计最常出现的 efficiency_periods */
const peakPeriod = computed(() => {
  const logs = logStore.logs;
  if (!logs || logs.length === 0) return '暂无数据';

  const periodCounts = new Map<string, number>();
  for (const log of logs) {
    if (log.efficiency_periods) {
      for (const period of log.efficiency_periods) {
        periodCounts.set(period, (periodCounts.get(period) || 0) + 1);
      }
    }
  }

  if (periodCounts.size === 0) {
    // 从有时间的已完成任务中统计
    const tasks = taskStore.tasks;
    const hourCounts = new Map<number, number>();
    for (const t of tasks) {
      if (t.status === 'done' && t.start_time) {
        const hour = parseInt(t.start_time.split(':')[0]);
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      }
    }
    if (hourCounts.size > 0) {
      const peakHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return `${peakHour}:00-${peakHour + 2}:00`;
    }
    return '暂无数据';
  }

  const sorted = [...periodCounts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
});

/** 专注峰值：历史最长工作时长 */
const focusPeak = computed(() => {
  const logs = logStore.logs;
  if (!logs || logs.length === 0) return '暂无数据';

  let maxHours = 0;
  for (const log of logs) {
    if (log.work_hours && log.work_hours > maxHours) {
      maxHours = log.work_hours;
    }
  }
  return maxHours > 0 ? `${maxHours}小时/天` : '暂无数据';
});

/** 冲刺记录：单日最多完成任务数 */
const sprintRecord = computed(() => {
  const logs = logStore.logs;
  if (!logs || logs.length === 0) return 0;

  let maxDone = 0;
  for (const log of logs) {
    if (log.tasks_done > maxDone) {
      maxDone = log.tasks_done;
    }
  }
  return maxDone;
});

/** 完成率趋势（与上周对比） */
const completionTrend = computed(() => {
  const days = last7DaysCompletion.value;
  if (days.length < 7) return { value: '', class: 'positive' };

  // 前3天平均 vs 后3天平均
  const firstHalf = days.slice(0, 3).reduce((s, d) => s + d.rate, 0) / 3;
  const secondHalf = days.slice(4).reduce((s, d) => s + d.rate, 0) / 3;
  const diff = Math.round(secondHalf - firstHalf);

  if (diff > 0) return { value: `+${diff}%`, class: 'positive' };
  if (diff < 0) return { value: `${diff}%`, class: 'negative' };
  return { value: '持平', class: 'positive' };
});

// ========== 行为统计数据（基于真实数据） ==========

const behaviorStats = computed(() => [
  {
    key: 'streak',
    icon: '🔥',
    name: '连续天数',
    value: streakDays.value || '--',
    trend: streakDays.value > 0 ? `最长${longestStreak.value}天` : '开始打卡',
    trendClass: 'positive',
  },
  {
    key: 'completion',
    icon: '📊',
    name: '完成率',
    value: taskStore.tasks.length > 0 ? `${todayCompletionRate.value}%` : '--',
    trend: completionTrend.value.value || '本周',
    trendClass: completionTrend.value.class,
  },
  {
    key: 'focus',
    icon: '⏱️',
    name: '专注时长',
    value: recentWorkHours.value > 0 ? `${recentWorkHours.value}h` : '--',
    trend: recentWorkHours.value > 0 ? '最近' : '暂无',
    trendClass: 'positive',
  },
  {
    key: 'plans',
    icon: '📋',
    name: '活跃计划',
    value: activePlanCount.value || '--',
    trend: planStore.plans.length > 0 ? `共${planStore.plans.length}个` : '创建计划',
    trendClass: 'positive',
  },
]);

// ========== 行为分析数据（基于真实数据） ==========

const analysisItems = computed(() => [
  {
    key: 'peak',
    icon: '🌅',
    title: '黄金时段',
    value: peakPeriod.value,
    description: '效率最高时间段',
  },
  {
    key: 'focusPeak',
    icon: '🎯',
    title: '专注峰值',
    value: focusPeak.value,
    description: '单日最长专注时间',
  },
  {
    key: 'habit',
    icon: '🔄',
    title: '习惯坚持',
    value: habitStreakDays.value > 0 ? `${habitStreakDays.value}天` : '--',
    description: '连续有完成任务的天数',
  },
  {
    key: 'sprint',
    icon: '⚡',
    title: '冲刺记录',
    value: sprintRecord.value > 0 ? `${sprintRecord.value}项` : '--',
    description: '单日最多完成任务',
  },
]);

// ========== 趋势数据（基于真实数据） ==========

const trendData = computed(() => {
  const days = last7DaysCompletion.value;
  if (days.length === 0) {
    // 没有数据时显示空柱状图
    return [
      { label: '一', height: 5 },
      { label: '二', height: 5 },
      { label: '三', height: 5 },
      { label: '四', height: 5 },
      { label: '五', height: 5 },
      { label: '六', height: 5 },
      { label: '日', height: 5 },
    ];
  }
  return days.map((d) => ({
    label: d.label,
    height: Math.max(d.rate, 5), // 最低5%以显示柱子
  }));
});

// ========== 系统设置 ==========

const userSettings = useUserSettings();

// 展开/折叠控制
const expandedSections = ref({
  reminder: false,
  ai: false,
});

function toggleSection(section: 'reminder' | 'ai') {
  expandedSections.value[section] = !expandedSections.value[section];
}

// 提醒摘要文本
const reminderSummaryText = computed(() => {
  const s = userSettings.settings.value;
  if (!s.reminderEnabled) return '已关闭';
  const parts: string[] = [];
  const advanceOpt = userSettings.reminderAdvanceOptions.find(o => o.value === s.reminderAdvanceMinutes);
  if (advanceOpt) parts.push(`提前${advanceOpt.label}`);
  if (s.dailyCheckinEnabled) parts.push('签到');
  if (s.weeklyReviewEnabled) parts.push('周回顾');
  return parts.length > 0 ? parts.join(' · ') : '已开启';
});

// AI 参与度等级选项
const aiLevelOptions = [
  { value: 'minimal', label: '最少', description: '仅在主动请求时提供建议' },
  { value: 'standard', label: '标准', description: '主动分析日志 + 自动复盘' },
  { value: 'active', label: '积极', description: '主动分析日志 + 自动复盘 + 智能提醒' },
];

// AI 参与度描述文本
const aiLevelDescText = computed(() => {
  const level = userSettings.settings.value.aiLevel;
  const opt = aiLevelOptions.find(o => o.value === level);
  return opt ? opt.description : '';
});

function exportData() {
  alert("数据导出功能开发中...");
}

function showPrivacy() {
  alert("隐私政策：我们重视您的隐私，所有数据存储在本地。");
}

function logout() {
  userStore.logout();
  router.push("/login");
}

async function handleRefresh() {
  await loadAllData();
}

onMounted(async () => {
  // 加载真实数据
  await loadAllData();
});
</script>

<style scoped>
/* 主容器 */
.profile-container {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

/* 1. 用户信息卡片 */
.user-profile-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  transition: all 0.2s ease;
}

.user-profile-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.user-main-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 3px solid var(--ai-main);
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.user-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 12px;
  color: var(--text-secondary);
}

.user-type {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.user-join-date {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* 成就摘要 */
.achievement-summary {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  gap: var(--space-4);
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.achievement-icon {
  font-size: 20px;
}

.achievement-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.achievement-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.achievement-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.achievement-divider {
  width: 1px;
  height: 32px;
  background: var(--border-main);
}

/* 2. 行为结果统计模块 */
.behavior-stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.2s ease;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--ai-main);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: var(--space-1);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.stat-name {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.stat-trend {
  font-size: 11px;
  font-weight: 500;
  margin-top: var(--space-1);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.stat-trend.positive {
  color: var(--success);
  background: var(--success-bg);
}

.stat-trend.negative {
  color: var(--error);
  background: var(--error-bg);
}

/* 3. 行为分析模块 */
.behavior-analysis-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 var(--space-3) 0;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-3);
}

.analysis-card {
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid var(--border-main);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  transition: all 0.2s ease;
}

.analysis-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.analysis-icon {
  font-size: 16px;
}

.analysis-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.analysis-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  margin-top: var(--space-1);
}

.analysis-desc {
  font-size: 10px;
  color: var(--text-muted);
}

/* 趋势图卡片 */
.trend-card {
  grid-column: span 1;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 60px;
  gap: 4px;
  margin-top: var(--space-1);
}

.trend-bar {
  flex: 1;
  background: linear-gradient(to top, var(--ai-main), var(--ai-light));
  border-radius: 2px 2px 0 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  min-height: 20px;
}

.trend-label {
  font-size: 8px;
  color: white;
  padding: 2px;
}

/* 4. 系统设置模块 */
.system-settings-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
}

/* 设置分组 */
.settings-group {
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-main);
  margin-bottom: var(--space-3);
  overflow: hidden;
}

.settings-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  cursor: pointer;
  transition: background 0.2s;
}

.settings-group-header:hover {
  background: var(--bg-card-hover);
}

.settings-group-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.settings-group-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.setting-icon {
  font-size: 20px;
}

.setting-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.setting-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.setting-arrow {
  font-size: 16px;
  color: var(--text-muted);
  transition: transform 0.3s ease;
  display: inline-block;
}

.setting-arrow.expanded {
  transform: rotate(90deg);
}

/* 设置分组内容（展开区域） */
.settings-group-body {
  padding: var(--space-3);
  border-top: 1px solid var(--border-main);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* 子设置行 */
.sub-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.sub-setting-row:last-child {
  border-bottom: none;
}

.sub-setting-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sub-setting-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
}

.sub-setting-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.sub-setting-control-inline {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.setting-select {
  padding: 6px 10px;
  border: 1px solid var(--border-main);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-main);
  background: var(--bg-card);
  outline: none;
  cursor: pointer;
}

.setting-select:focus {
  border-color: var(--ai-main);
}

.setting-time-input {
  padding: 4px 8px;
  border: 1px solid var(--border-main);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-main);
  background: var(--bg-card);
  width: 90px;
}

/* AI 等级选择器 */
.ai-level-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ai-level-option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-main);
  cursor: pointer;
  transition: all 0.2s;
}

.ai-level-option:hover {
  background: var(--bg-card-hover);
}

.ai-level-option.active {
  border-color: var(--ai-main);
  background: var(--ai-subtle, rgba(99, 102, 241, 0.06));
}

.ai-level-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--border-main);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: border-color 0.2s;
}

.ai-level-option.active .ai-level-radio {
  border-color: var(--ai-main);
}

.ai-level-radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.2s;
}

.ai-level-radio-dot.checked {
  background: var(--ai-main);
}

.ai-level-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ai-level-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.ai-level-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

/* AI 功能预览标签 */
.ai-feature-preview {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-top: var(--space-2);
}

.ai-feature-tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--bg-muted);
  color: var(--text-muted);
  border: 1px solid var(--border-main);
  transition: all 0.2s;
}

.ai-feature-tag.enabled {
  background: var(--ai-subtle, rgba(99, 102, 241, 0.08));
  color: var(--ai-main);
  border-color: var(--ai-main);
}

/* 展开/折叠动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* 5. 账户管理模块 */
.account-management-section {
  margin-top: auto;
}

.account-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

.account-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  font-size: 13px;
}

.btn-icon {
  font-size: 14px;
}

.logout-btn {
  background: var(--error-bg) !important;
  border-color: var(--error) !important;
  color: var(--error) !important;
}
</style>