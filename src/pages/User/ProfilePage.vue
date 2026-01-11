<template>
  <div class="profile-page">
    <div class="profile-container">
      
      <!-- 第一部分：用户概览 -->
      <section class="user-overview">
        <div class="user-identity">
          <img :src="avatarUrl" class="user-avatar" alt="用户头像" />
          <div class="user-info">
            <h1 class="user-name">{{ user?.username || '未登录用户' }}</h1>
            <p class="user-goal">{{ userGoal }}</p>
          </div>
        </div>

        <!-- 今日状态快照 -->
        <div class="today-snapshot">
          <h3 class="snapshot-title">📅 今日状态</h3>
          <div class="snapshot-stats">
            <div class="snapshot-item">
              <span class="snapshot-label">任务</span>
              <span class="snapshot-value">{{ todayDone }} / {{ todayTotal }}</span>
            </div>
            <div class="snapshot-divider"></div>
            <div class="snapshot-item">
              <span class="snapshot-label">日程</span>
              <span class="snapshot-value">{{ todaySchedules }} 个</span>
            </div>
          </div>
          <div class="streak-info" v-if="streakDays > 0">
            <span class="streak-icon">🔥</span>
            <span class="streak-text">连续专注 {{ streakDays }} 天</span>
          </div>
        </div>
      </section>

      <!-- 第二部分：行为与成长反馈 -->
      <section class="growth-section">
        
        <!-- 使用统计 -->
        <div class="stats-card">
          <h3 class="card-title">近 7 天</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-icon">✔</span>
              <div class="stat-content">
                <span class="stat-label">完成任务</span>
                <span class="stat-value">{{ weekStats.completedTasks }} 个</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">⏱</span>
              <div class="stat-content">
                <span class="stat-label">专注时间</span>
                <span class="stat-value">{{ weekStats.focusHours }} 小时</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📆</span>
              <div class="stat-content">
                <span class="stat-label">日程准时率</span>
                <span class="stat-value">{{ weekStats.scheduleRate }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 计划健康度 -->
        <div class="plan-health-card">
          <h3 class="card-title">📈 我的计划状态</h3>
          <div class="health-stats">
            <div class="health-item healthy">
              <span class="health-dot">●</span>
              <span class="health-label">健康</span>
              <span class="health-count">{{ planHealth.healthy }}</span>
            </div>
            <div class="health-item stalled">
              <span class="health-dot">●</span>
              <span class="health-label">停滞</span>
              <span class="health-count">{{ planHealth.stalled }}</span>
            </div>
            <div class="health-item risk">
              <span class="health-dot">●</span>
              <span class="health-label">高风险</span>
              <span class="health-count">{{ planHealth.risk }}</span>
            </div>
          </div>
          <div class="best-plan" v-if="bestPlan">
            <p class="best-plan-label">🎯 当前最稳定的计划</p>
            <p class="best-plan-name">「{{ bestPlan }}」</p>
          </div>
        </div>

        <!-- AI 个人总结 -->
        <details class="ai-summary-card" open>
          <summary class="ai-summary-header">
            🤖 AI 本周观察
          </summary>
          <div class="ai-summary-content">
            <p>{{ aiSummary }}</p>
          </div>
        </details>
      </section>

      <!-- 第三部分：偏好与设置 -->
      <section class="settings-section">
        <h3 class="section-title">使用偏好</h3>
        
        <div class="preference-list">
          <div class="preference-item">
            <div class="preference-label">
              <span class="preference-icon">🌗</span>
              <span>外观模式</span>
            </div>
            <select v-model="themePreference" @change="handleThemeChange" class="preference-select">
              <option value="auto">自动</option>
              <option value="light">明亮</option>
              <option value="dark">暗色</option>
            </select>
          </div>

          <div class="preference-item">
            <div class="preference-label">
              <span class="preference-icon">🔔</span>
              <span>提醒偏好</span>
            </div>
            <select v-model="reminderPreference" class="preference-select">
              <option value="10">提前 10 分钟</option>
              <option value="30">提前 30 分钟</option>
              <option value="60">提前 1 小时</option>
            </select>
          </div>

          <div class="preference-item">
            <div class="preference-label">
              <span class="preference-icon">🧠</span>
              <span>AI 参与程度</span>
            </div>
            <select v-model="aiLevel" class="preference-select">
              <option value="minimal">最少</option>
              <option value="standard">标准</option>
              <option value="active">积极</option>
            </select>
          </div>
        </div>
      </section>

      <!-- 数据与安全 -->
      <section class="data-section">
        <details class="data-details">
          <summary class="data-summary">数据 & 安全</summary>
          <div class="data-content">
            <button class="data-btn" @click="exportData">
              <span class="data-icon">📦</span>
              <span>导出我的数据</span>
            </button>
            <button class="data-btn" @click="showPrivacy">
              <span class="data-icon">🔒</span>
              <span>隐私与权限</span>
            </button>
          </div>
        </details>
      </section>

      <!-- 退出登录 -->
      <section class="logout-section">
        <button class="btn-logout" @click="logout">退出登录</button>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter } from 'vue-router';
import { useUserStore } from "@/store/user";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
import { useScheduleStore } from "@/store/schedules";

const router = useRouter();
const userStore = useUserStore();
const planStore = usePlanStore();
const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();

const user = computed(() => userStore.user);
const avatarUrl = computed(() =>
  user.value?.username
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.value.username)}`
    : 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
);

// 用户目标（可以从用户设置中获取，这里暂时硬编码）
const userGoal = computed(() => '专注完成长期计划，稳步前行');

// 今日状态
const today = new Date().toISOString().slice(0, 10);
const todayTasks = computed(() => taskStore.tasks.filter(t => t.task_date === today));
const todayTotal = computed(() => todayTasks.value.length);
const todayDone = computed(() => todayTasks.value.filter(t => t.status === 'done').length);
const todaySchedules = computed(() => scheduleStore.schedules.filter(s => s.date === today).length);

// 连续天数（简化版，实际应该从后端或 localStorage 计算）
const streakDays = computed(() => {
  // 计算最近连续完成任务的天数
  let streak = 0;
  const sortedDates = [...new Set(
    taskStore.tasks
      .filter(t => t.status === 'done')
      .map(t => t.task_date)
  )].sort().reverse();
  
  let currentDate = new Date();
  for (const dateStr of sortedDates) {
    const taskDate = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.floor((currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === streak) {
      streak++;
      currentDate = taskDate;
    } else if (diffDays > streak) {
      break;
    }
  }
  return streak;
});

// 近7天统计
const weekStats = computed(() => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekTasks = taskStore.tasks.filter(t => {
    const taskDate = new Date(t.task_date + 'T00:00:00');
    return taskDate >= sevenDaysAgo;
  });
  
  const completedTasks = weekTasks.filter(t => t.status === 'done').length;
  
  // 计算专注时间（基于任务时长）
  const focusMinutes = weekTasks
    .filter(t => t.status === 'done' && t.start_time && t.end_time)
    .reduce((sum, t) => {
      const [sh, sm] = t.start_time!.split(':').map(Number);
      const [eh, em] = t.end_time!.split(':').map(Number);
      return sum + ((eh * 60 + em) - (sh * 60 + sm));
    }, 0);
  const focusHours = (focusMinutes / 60).toFixed(1);
  
  // 日程准时率（这里简化为完成率）
  const weekSchedules = scheduleStore.schedules.filter(s => {
    const scheduleDate = new Date(s.date + 'T00:00:00');
    return scheduleDate >= sevenDaysAgo;
  });
  const scheduleRate = weekSchedules.length === 0 
    ? 0 
    : Math.round((weekSchedules.filter(s => s.completed).length / weekSchedules.length) * 100);
  
  return {
    completedTasks,
    focusHours,
    scheduleRate
  };
});

// 计划健康度
const planHealth = computed(() => {
  const plans = planStore.plans;
  let healthy = 0, stalled = 0, risk = 0;
  
  plans.forEach((plan: any) => {
    const planTasks = taskStore.tasks.filter(t => t.plan_id === plan.id);
    const recentTasks = planTasks.filter(t => {
      const taskDate = new Date(t.task_date + 'T00:00:00');
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= sevenDaysAgo && t.status === 'done';
    });
    
    if (recentTasks.length >= 3) healthy++;
    else if (recentTasks.length === 0) risk++;
    else stalled++;
  });
  
  return { healthy, stalled, risk };
});

// 最稳定的计划
const bestPlan = computed(() => {
  const plans = planStore.plans;
  let maxRecent = 0;
  let bestPlanName = '';
  
  plans.forEach((plan: any) => {
    const planTasks = taskStore.tasks.filter(t => t.plan_id === plan.id);
    const recentTasks = planTasks.filter(t => {
      const taskDate = new Date(t.task_date + 'T00:00:00');
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= sevenDaysAgo && t.status === 'done';
    });
    
    if (recentTasks.length > maxRecent) {
      maxRecent = recentTasks.length;
      bestPlanName = plan.title;
    }
  });
  
  return maxRecent > 0 ? bestPlanName : null;
});

// AI 观察
const aiSummary = computed(() => {
  const morningTasks = taskStore.tasks.filter(t => {
    if (!t.start_time || t.status !== 'done') return false;
    const hour = parseInt(t.start_time.split(':')[0]);
    return hour >= 6 && hour < 12;
  });
  
  const afternoonTasks = taskStore.tasks.filter(t => {
    if (!t.start_time || t.status !== 'done') return false;
    const hour = parseInt(t.start_time.split(':')[0]);
    return hour >= 12 && hour < 18;
  });
  
  if (morningTasks.length > afternoonTasks.length * 1.5) {
    return '你在上午的执行力明显高于下午，建议将重要任务前移。';
  }
  
  if (weekStats.value.completedTasks >= 15) {
    return '最近推进稳定，节奏把握得很好，继续保持！';
  }
  
  if (weekStats.value.completedTasks < 5) {
    return '本周推进较慢，建议重新评估任务难度和时间安排。';
  }
  
  return '保持当前节奏，适当增加任务密度可能会有更好效果。';
});

// 偏好设置
const themePreference = ref<'auto' | 'light' | 'dark'>('auto');
const reminderPreference = ref('10');
const aiLevel = ref('standard');

function handleThemeChange() {
  if (themePreference.value === 'auto') {
    // 自动模式：移除 data-theme 属性，让浏览器使用系统设置
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
  } else {
    // 手动模式：使用 userStore 的 toggleTheme 方法
    userStore.toggleTheme(themePreference.value);
  }
}

function exportData() {
  alert('数据导出功能开发中...');
}

function showPrivacy() {
  alert('隐私政策：我们重视您的隐私，所有数据存储在本地。');
}

function logout() {
  userStore.logout();
  router.push('/login');
}

onMounted(async () => {
  // 加载偏好设置 - 从 userStore 获取当前主题
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'light' || currentTheme === 'dark') {
    themePreference.value = currentTheme;
  } else {
    themePreference.value = 'auto';
  }
  
  // 加载数据
  await Promise.all([
    planStore.loadPlans(),
    taskStore.loadTasks(),
    scheduleStore.load(today)
  ]);
});
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding-top: calc(var(--header-height, 64px) + 1rem);
  padding-bottom: calc(var(--footer-height, 64px) + 2rem);
  background: var(--bg-main);
}

.profile-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 用户概览 */
.user-overview {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 2rem 1.5rem;
  border: 1px solid var(--border-subtle);
}

.user-identity {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--ai-main);
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 0.5rem 0;
}

.user-goal {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  font-style: italic;
}

/* 今日状态 */
.today-snapshot {
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid var(--border-main);
}

.snapshot-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 1rem 0;
}

.snapshot-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.snapshot-item {
  flex: 1;
  text-align: center;
}

.snapshot-label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.snapshot-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.snapshot-divider {
  width: 1px;
  height: 40px;
  background: var(--border-main);
}

.streak-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.streak-icon {
  font-size: 18px;
}

.streak-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 成长部分 */
.growth-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stats-card,
.plan-health-card,
.ai-summary-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border-subtle);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 1.25rem 0;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 20px;
  width: 32px;
  text-align: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

/* 计划健康度 */
.health-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
}

.health-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 13px;
}

.health-dot {
  font-size: 12px;
}

.health-item.healthy .health-dot {
  color: var(--success);
}

.health-item.stalled .health-dot {
  color: var(--warning);
}

.health-item.risk .health-dot {
  color: var(--error);
}

.health-label {
  color: var(--text-secondary);
}

.health-count {
  font-weight: 600;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.best-plan {
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.best-plan-label {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 0 0.5rem 0;
}

.best-plan-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  margin: 0;
}

/* AI 总结 */
.ai-summary-card {
  border-color: var(--ai-border);
  background: var(--ai-bg);
}

.ai-summary-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--ai-main);
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.ai-summary-header::-webkit-details-marker {
  display: none;
}

.ai-summary-content {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ai-border);
}

.ai-summary-content p {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

/* 设置部分 */
.settings-section {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border-subtle);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 1.25rem 0;
}

.preference-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
}

.preference-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 14px;
  color: var(--text-main);
}

.preference-icon {
  font-size: 18px;
}

.preference-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 13px;
  cursor: pointer;
  min-width: 140px;
}

/* 数据与安全 */
.data-section {
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.data-details {
  border: none;
}

.data-summary {
  padding: 1.25rem 1.5rem;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.data-summary::-webkit-details-marker {
  display: none;
}

.data-summary::before {
  content: '›';
  display: inline-block;
  margin-right: 0.5rem;
  transition: transform 0.2s;
}

.data-details[open] .data-summary::before {
  transform: rotate(90deg);
}

.data-content {
  padding: 0 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.data-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  color: var(--text-main);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.data-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-emphasis);
}

.data-icon {
  font-size: 16px;
}

/* 退出登录 */
.logout-section {
  text-align: center;
  padding: 1rem 0;
}

.btn-logout {
  padding: 0.75rem 2rem;
  background: transparent;
  border: 1px solid var(--error);
  border-radius: 10px;
  color: var(--error);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: var(--error-bg);
}

/* 响应式 */
@media (max-width: 640px) {
  .profile-container {
    padding: 0 0.75rem;
    gap: 1rem;
  }

  .user-overview {
    padding: 1.5rem 1rem;
  }

  .user-identity {
    gap: 1rem;
  }

  .user-avatar {
    width: 64px;
    height: 64px;
  }

  .user-name {
    font-size: 18px;
  }

  .snapshot-stats {
    flex-direction: column;
    gap: 0.75rem;
  }

  .snapshot-divider {
    width: 100%;
    height: 1px;
  }

  .health-stats {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
