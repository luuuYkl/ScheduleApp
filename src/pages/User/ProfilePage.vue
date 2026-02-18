<template>
  <PageScaffold 
    title="个人中心" 
    :show-back="false"
    class="layer-context"
  >
    <div class="profile-container layout-template-l">
      <!-- Context Layer: 精简用户概览 + 成就信息前置 -->
      <section class="user-overview layer-context priority-high">
        <div class="user-identity">
          <img :src="avatarUrl" class="user-avatar" alt="用户头像" />
          <div class="user-info">
            <h1 class="user-name">{{ user?.username || "未登录用户" }}</h1>
            <p class="user-level">Lv.{{ userLevel }}</p>
          </div>
          <div class="level-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: levelProgress + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ expCurrent }}/{{ expNext }} EXP</span>
          </div>
        </div>

        <!-- 成就徽章墙 - 前置显示 -->
        <div 
          class="achievements-wall"
          :class="{ 'collapsed': isMobile && !showAchievements }"
        >
          <div class="achievements-header" @click="toggleAchievements">
            <h3 class="section-title">🏆 我的成就</h3>
            <button 
              v-if="isMobile" 
              class="expand-toggle"
              type="button"
            >
              {{ showAchievements ? '收起' : '展开' }}
            </button>
          </div>
          <div v-show="!isMobile || showAchievements" class="badges-grid">
            <div 
              v-for="badge in unlockedBadges" 
              :key="badge.id"
              class="badge-item unlocked"
              :title="badge.description"
            >
              <span class="badge-icon">{{ badge.icon }}</span>
              <span class="badge-name">{{ badge.name }}</span>
            </div>
            <div 
              v-for="i in lockedBadgeCount" 
              :key="`locked-${i}`"
              class="badge-item locked"
              title="未解锁"
            >
              <span class="badge-icon">🔒</span>
            </div>
          </div>
        </div>

        <!-- 关键指标速览 -->
        <div class="key-metrics">
          <div class="metric-card">
            <div class="metric-value">{{ streakDays }}</div>
            <div class="metric-label">连续天数</div>
            <div class="metric-trend" :class="streakTrend">
              {{ streakChange >= 0 ? '+' : '' }}{{ streakChange }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ weeklyCompletion }}%</div>
            <div class="metric-label">周完成率</div>
            <div class="metric-trend positive">+{{ weeklyGrowth }}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ planCount }}</div>
            <div class="metric-label">活跃计划</div>
            <div class="metric-status" :class="planHealthStatus">
              {{ planHealthText }}
            </div>
          </div>
        </div>
      </section>

      <!-- Primary Layer: 成长轨迹与里程碑 -->
      <section class="growth-section layer-primary priority-high">
        <!-- 经验值增长趋势 -->
        <Card class="exp-trend-card">
          <template #header>
            <h3 class="card-title">📊 经验成长</h3>
          </template>
          <div class="trend-chart">
            <div class="chart-bars">
              <div 
                v-for="(point, index) in expTrendData" 
                :key="index"
                class="bar-container"
                :title="`${point.date}: ${point.exp} EXP`"
              >
                <div 
                  class="bar" 
                  :style="{ height: point.height + '%' }"
                ></div>
                <span class="bar-label">{{ point.label }}</span>
              </div>
            </div>
          </div>
          <div class="trend-summary">
            <div class="summary-item">
              <span class="summary-label">本周总计</span>
              <span class="summary-value positive">+{{ weeklyExpGain }} EXP</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">日均增长</span>
              <span class="summary-value">{{ dailyAvgExp }} EXP</span>
            </div>
          </div>
        </Card>

        <!-- 里程碑进度 -->
        <Card class="milestones-card">
          <template #header>
            <h3 class="card-title">🎯 里程碑进度</h3>
          </template>
          <div class="milestones-list">
            <div 
              v-for="milestone in milestones" 
              :key="milestone.id"
              class="milestone-item"
              :class="{ completed: milestone.completed, active: milestone.active }"
            >
              <div class="milestone-icon">
                <span v-if="milestone.completed">✓</span>
                <span v-else-if="milestone.active">📍</span>
                <span v-else>○</span>
              </div>
              <div class="milestone-content">
                <h4 class="milestone-title">{{ milestone.title }}</h4>
                <p class="milestone-desc">{{ milestone.description }}</p>
                <div class="milestone-progress" v-if="!milestone.completed">
                  <div class="progress-bar-small">
                    <div 
                      class="progress-fill-small" 
                      :style="{ width: milestone.progress + '%' }"
                    ></div>
                  </div>
                  <span class="progress-text-small">{{ milestone.current }}/{{ milestone.target }}</span>
                </div>
              </div>
              <div class="milestone-reward" v-if="milestone.reward">
                +{{ milestone.reward }} EXP
              </div>
            </div>
          </div>
        </Card>

        <!-- 深度数据分析 -->
        <Card class="analytics-card">
          <template #header>
            <h3 class="card-title">📈 深度洞察</h3>
          </template>
          <div class="analytics-grid">
            <div class="analytic-item">
              <div class="analytic-header">
                <span class="analytic-icon">🌅</span>
                <span class="analytic-title">黄金时段</span>
              </div>
              <div class="analytic-value">{{ peakHour }}:00-{{ peakHour + 2 }}:00</div>
              <div class="analytic-desc">效率最高时间段</div>
            </div>
            <div class="analytic-item">
              <div class="analytic-header">
                <span class="analytic-icon">🎯</span>
                <span class="analytic-title">专注峰值</span>
              </div>
              <div class="analytic-value">{{ focusPeak }}小时/天</div>
              <div class="analytic-desc">单日最长专注时间</div>
            </div>
            <div class="analytic-item">
              <div class="analytic-header">
                <span class="analytic-icon">🔄</span>
                <span class="analytic-title">习惯坚持</span>
              </div>
              <div class="analytic-value">{{ habitStreak }}天</div>
              <div class="analytic-desc">重复任务连续完成</div>
            </div>
            <div class="analytic-item">
              <div class="analytic-header">
                <span class="analytic-icon">⚡</span>
                <span class="analytic-title">冲刺记录</span>
              </div>
              <div class="analytic-value">{{ sprintRecord }}项</div>
              <div class="analytic-desc">单日最多完成任务</div>
            </div>
          </div>
        </Card>
      </section>

      <!-- Secondary Layer: 偏好与账户管理 - 移动端默认折叠 -->
      <section 
        class="preferences-section layer-secondary priority-low"
        :class="{ 'collapsed': isMobile && !showPreferences }"
      >
        <Card class="preferences-card">
          <template #header>
            <div class="card-header-clickable" @click="togglePreferences">
              <h3 class="card-title">⚙️ 使用偏好</h3>
              <button 
                v-if="isMobile" 
                class="expand-toggle"
                type="button"
              >
                {{ showPreferences ? '▲' : '▼' }}
              </button>
            </div>
          </template>
          <div v-show="!isMobile || showPreferences">
            <div class="preference-item">
              <div class="preference-info">
                <span class="preference-icon">🌗</span>
                <div class="preference-text">
                  <span class="preference-label">外观模式</span>
                  <span class="preference-desc">界面主题设置</span>
                </div>
              </div>
              <select
                v-model="themePreference"
                @change="handleThemeChange"
                class="preference-select"
              >
                <option value="auto">自动</option>
                <option value="light">明亮</option>
                <option value="dark">暗色</option>
              </select>
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <span class="preference-icon">🔔</span>
                <div class="preference-text">
                  <span class="preference-label">提醒偏好</span>
                  <span class="preference-desc">任务提醒时间</span>
                </div>
              </div>
              <select v-model="reminderPreference" class="preference-select">
                <option value="10">提前 10 分钟</option>
                <option value="30">提前 30 分钟</option>
                <option value="60">提前 1 小时</option>
              </select>
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <span class="preference-icon">🧠</span>
                <div class="preference-text">
                  <span class="preference-label">AI 参与程度</span>
                  <span class="preference-desc">智能助手活跃度</span>
                </div>
              </div>
              <select v-model="aiLevel" class="preference-select">
                <option value="minimal">最少</option>
                <option value="standard">标准</option>
                <option value="active">积极</option>
              </select>
            </div>
          </div>
        </Card>

        <Card class="account-card">
          <template #header>
            <div class="card-header-clickable" @click="toggleAccount">
              <h3 class="card-title">🔐 账户与数据</h3>
              <button 
                v-if="isMobile" 
                class="expand-toggle"
                type="button"
              >
                {{ showAccount ? '▲' : '▼' }}
              </button>
            </div>
          </template>
          <div v-show="!isMobile || showAccount">
            <Button 
              variant="outline" 
              size="medium"
              @click="exportData"
              class="account-btn"
            >
              <span class="btn-icon">📦</span>
              导出数据
            </Button>
            <Button 
              variant="outline" 
              size="medium"
              @click="showPrivacy"
              class="account-btn"
            >
              <span class="btn-icon">🔒</span>
              隐私设置
            </Button>
            <Button 
              variant="danger" 
              size="medium"
              @click="logout"
              class="account-btn logout-btn"
            >
              <span class="btn-icon">🚪</span>
              退出登录
            </Button>
          </div>
        </Card>
      </section>
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
import { useScheduleStore } from "@/store/schedules";
import PageScaffold from '@/components/common/PageScaffold.vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';

const router = useRouter();
const userStore = useUserStore();
const planStore = usePlanStore();
const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();

// 响应式状态
const isMobile = ref(window.innerWidth < 768);
const showAchievements = ref(true);
const showPreferences = ref(false);
const showAccount = ref(false);

function toggleAchievements() {
  if (isMobile.value) {
    showAchievements.value = !showAchievements.value;
  }
}

function togglePreferences() {
  if (isMobile.value) {
    showPreferences.value = !showPreferences.value;
  }
}

function toggleAccount() {
  if (isMobile.value) {
    showAccount.value = !showAccount.value;
  }
}

const user = computed(() => userStore.user);
const avatarUrl = computed(() =>
  user.value?.username
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.value.username)}`
    : "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
);

// 用户目标（可以从用户设置中获取，这里暂时硬编码）
const userGoal = computed(() => "专注完成长期计划，稳步前行");

// 今日状态
const today = new Date().toISOString().slice(0, 10);
const todayTasks = computed(() =>
  taskStore.tasks.filter((t) => t.task_date === today),
);
const todayTotal = computed(() => todayTasks.value.length);
const todayDone = computed(
  () => todayTasks.value.filter((t) => t.status === "done").length,
);
const todaySchedules = computed(
  () => scheduleStore.schedules.filter((s) => s.date === today).length,
);

// 用户等级系统
const userLevel = computed(() => Math.floor(totalExp.value / 100) + 1);
const expCurrent = computed(() => totalExp.value % 100);
const expNext = 100;
const levelProgress = computed(() => (expCurrent.value / expNext) * 100);
const totalExp = ref(1250); // 示例经验值

// 成就系统
const unlockedBadges = ref([
  { id: 1, name: '初学者', icon: '🌱', description: '完成第一个任务' },
  { id: 2, name: '坚持者', icon: '💪', description: '连续7天完成任务' },
  { id: 3, name: '高效者', icon: '⚡', description: '单日完成10个任务' },
  { id: 4, name: '规划师', icon: '📝', description: '创建第5个计划' },
]);

const lockedBadgeCount = 8; // 锁定的徽章数量

// 关键指标
const streakDays = computed(() => {
  // 计算最近连续完成任务的天数
  let streak = 0;
  const sortedDates = [
    ...new Set(
      taskStore.tasks
        .filter((t) => t.status === "done")
        .map((t) => t.task_date),
    ),
  ]
    .sort()
    .reverse();

  let currentDate = new Date();
  for (const dateStr of sortedDates) {
    const taskDate = new Date(dateStr + "T00:00:00");
    const diffDays = Math.floor(
      (currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === streak) {
      streak++;
      currentDate = taskDate;
    } else if (diffDays > streak) {
      break;
    }
  }
  return streak;
});

const streakTrend = computed(() => streakChange.value >= 0 ? 'positive' : 'negative');
const streakChange = ref(2); // 连续天数变化

const weeklyCompletion = computed(() => {
  const weekTasks = taskStore.tasks.filter(t => {
    const taskDate = new Date(t.task_date + "T00:00:00");
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return taskDate >= sevenDaysAgo;
  });
  if (weekTasks.length === 0) return 0;
  return Math.round((weekTasks.filter(t => t.status === 'done').length / weekTasks.length) * 100);
});

const weeklyGrowth = ref(15); // 周增长率

const planCount = computed(() => planStore.plans.length);
const planHealthStatus = computed(() => {
  const activePlans = planStore.plans.filter((p: any) => p.status === 'active');
  return activePlans.length > 3 ? 'good' : activePlans.length > 0 ? 'normal' : 'poor';
});
const planHealthText = computed(() => {
  const status = planHealthStatus.value;
  return status === 'good' ? '良好' : status === 'normal' ? '一般' : '需关注';
});

// 经验值趋势数据
const expTrendData = computed(() => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return days.map((day, index) => ({
    date: day,
    exp: 50 + index * 15,
    height: 30 + index * 10,
    label: day.charAt(0)
  }));
});

const weeklyExpGain = computed(() => 180);
const dailyAvgExp = computed(() => Math.round(weeklyExpGain.value / 7));

// 里程碑系统
const milestones = ref([
  {
    id: 1,
    title: '新手启航',
    description: '完成首次任务规划',
    completed: true,
    active: false,
    reward: 50
  },
  {
    id: 2,
    title: '习惯养成',
    description: '连续7天完成每日任务',
    completed: true,
    active: false,
    reward: 100
  },
  {
    id: 3,
    title: '效率提升',
    description: '单日完成15个任务',
    completed: false,
    active: true,
    current: 12,
    target: 15,
    progress: 80,
    reward: 150
  },
  {
    id: 4,
    title: '大师之路',
    description: '累计完成100个任务',
    completed: false,
    active: false,
    current: 68,
    target: 100,
    progress: 68,
    reward: 300
  }
]);

// 深度分析数据
const peakHour = computed(() => 9);
const focusPeak = computed(() => 6.5);
const habitStreak = computed(() => 23);
const sprintRecord = computed(() => 18);

// 近7天统计
const weekStats = computed(() => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekTasks = taskStore.tasks.filter((t) => {
    const taskDate = new Date(t.task_date + "T00:00:00");
    return taskDate >= sevenDaysAgo;
  });

  const completedTasks = weekTasks.filter((t) => t.status === "done").length;

  // 计算专注时间（基于任务时长）
  const focusMinutes = weekTasks
    .filter((t) => t.status === "done" && t.start_time && t.end_time)
    .reduce((sum, t) => {
      const [sh, sm] = t.start_time!.split(":").map(Number);
      const [eh, em] = t.end_time!.split(":").map(Number);
      return sum + (eh * 60 + em - (sh * 60 + sm));
    }, 0);
  const focusHours = (focusMinutes / 60).toFixed(1);

  // 日程准时率（这里简化为完成率）
  const weekSchedules = scheduleStore.schedules.filter((s) => {
    const scheduleDate = new Date(s.date + "T00:00:00");
    return scheduleDate >= sevenDaysAgo;
  });
  const scheduleRate =
    weekSchedules.length === 0
      ? 0
      : Math.round(
          (weekSchedules.filter((s) => s.completed).length /
            weekSchedules.length) *
            100,
        );

  return {
    completedTasks,
    focusHours,
    scheduleRate,
  };
});

// 计划健康度
const planHealth = computed(() => {
  const plans = planStore.plans;
  let healthy = 0,
    stalled = 0,
    risk = 0;

  plans.forEach((plan: any) => {
    const planTasks = taskStore.tasks.filter((t) => t.plan_id === plan.id);
    const recentTasks = planTasks.filter((t) => {
      const taskDate = new Date(t.task_date + "T00:00:00");
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= sevenDaysAgo && t.status === "done";
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
  let bestPlanName = "";

  plans.forEach((plan: any) => {
    const planTasks = taskStore.tasks.filter((t) => t.plan_id === plan.id);
    const recentTasks = planTasks.filter((t) => {
      const taskDate = new Date(t.task_date + "T00:00:00");
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= sevenDaysAgo && t.status === "done";
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
  const morningTasks = taskStore.tasks.filter((t) => {
    if (!t.start_time || t.status !== "done") return false;
    const hour = parseInt(t.start_time.split(":")[0]);
    return hour >= 6 && hour < 12;
  });

  const afternoonTasks = taskStore.tasks.filter((t) => {
    if (!t.start_time || t.status !== "done") return false;
    const hour = parseInt(t.start_time.split(":")[0]);
    return hour >= 12 && hour < 18;
  });

  if (morningTasks.length > afternoonTasks.length * 1.5) {
    return "你在上午的执行力明显高于下午，建议将重要任务前移。";
  }

  if (weekStats.value.completedTasks >= 15) {
    return "最近推进稳定，节奏把握得很好，继续保持！";
  }

  if (weekStats.value.completedTasks < 5) {
    return "本周推进较慢，建议重新评估任务难度和时间安排。";
  }

  return "保持当前节奏，适当增加任务密度可能会有更好效果。";
});

// 偏好设置
const themePreference = ref<"auto" | "light" | "dark">("auto");
const reminderPreference = ref("10");
const aiLevel = ref("standard");

function handleThemeChange() {
  if (themePreference.value === "auto") {
    // 自动模式：移除 data-theme 属性，让浏览器使用系统设置
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  } else {
    // 手动模式：使用 userStore 的 toggleTheme 方法
    userStore.toggleTheme(themePreference.value);
  }
}

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

onMounted(async () => {
  // 加载偏好设置 - 从 userStore 获取当前主题
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme === "light" || currentTheme === "dark") {
    themePreference.value = currentTheme;
  } else {
    themePreference.value = "auto";
  }

  // 加载数据
  await Promise.all([
    planStore.loadPlans(),
    taskStore.loadTasks(),
    scheduleStore.load(today),
  ]);
});
</script>

<style scoped>
.profile-container {
  padding: 1rem;
  display: grid;
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* 桌面端双列布局 */
@media (min-width: 1025px) {
  .profile-container {
    grid-template-columns: 2fr 1fr;
  }
  
  .user-overview {
    /* 左侧：用户概览 + 成就 */
    grid-column: 1 / -1;
  }
  
  .growth-section {
    /* 左侧：成长轨迹 */
  }
  
  .preferences-section {
    /* 右侧：偏好设置 */
    align-self: start;
    position: sticky;
    top: calc(var(--header-height) + var(--space-4));
  }
}

/* 用户概览 */
.user-overview {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.user-identity {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 3px solid var(--primary);
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 0.25rem 0;
}

.user-level {
  font-size: 14px;
  color: var(--primary);
  font-weight: 500;
  margin: 0;
}

.level-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 120px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* 成就系统 */
.achievements-wall {
  background: var(--bg-elevated);
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid var(--border-main);
  transition: all var(--dur-normal) var(--ease-standard);
}

.achievements-wall.collapsed {
  padding: 1rem;
}

.achievements-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
}

.achievements-wall.collapsed .achievements-header {
  margin-bottom: 0;
  border-bottom: 1px solid var(--border-subtle);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s;
}

.badge-item.unlocked {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
}

.badge-item.locked {
  background: var(--bg-subtle);
  border: 1px dashed var(--border-subtle);
  opacity: 0.6;
}

.badge-icon {
  font-size: 24px;
}

.badge-name {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 关键指标 */
.key-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.metric-card {
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-main);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.metric-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.metric-trend, .metric-status {
  font-size: 11px;
  font-weight: 500;
}

.metric-trend.positive, .metric-status.good {
  color: var(--success);
}

.metric-trend.negative, .metric-status.poor {
  color: var(--error);
}

.metric-status.normal {
  color: var(--warning);
}

/* 成长轨迹 */
.growth-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exp-trend-card, .milestones-card, .analytics-card {
  border: 1px solid var(--border-subtle);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

/* 经验趋势图 */
.trend-chart {
  padding: 1rem 0;
}

.chart-bars {
  display: flex;
  align-items: end;
  justify-content: space-between;
  height: 120px;
  gap: 0.5rem;
  padding: 0 0.5rem;
}

.bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.bar {
  width: 100%;
  background: linear-gradient(to top, var(--primary), var(--secondary));
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.trend-summary {
  display: flex;
  justify-content: space-around;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.summary-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.summary-value.positive {
  color: var(--success);
}

/* 里程碑 */
.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.milestone-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border-main);
  transition: all 0.2s;
}

.milestone-item.completed {
  background: var(--success-bg);
  border-color: var(--success);
  opacity: 0.8;
}

.milestone-item.active {
  background: var(--primary-bg);
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.milestone-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.milestone-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.milestone-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.milestone-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.milestone-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar-small {
  flex: 1;
  height: 4px;
  background: var(--bg-elevated);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill-small {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text-small {
  font-size: 11px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.milestone-reward {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-bg);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  flex-shrink: 0;
}

/* 深度分析 */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.analytic-item {
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-main);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.analytic-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.analytic-icon {
  font-size: 16px;
}

.analytic-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.analytic-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.analytic-desc {
  font-size: 11px;
  color: var(--text-muted);
}

/* 偏好设置 */
.preferences-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all var(--dur-normal) var(--ease-standard);
}

.preferences-section.collapsed {
  order: 2;
}

.preferences-card, .account-card {
  border: 1px solid var(--border-subtle);
}

.card-header-clickable {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  cursor: pointer;
}

.preferences-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--border-main);
}

.preference-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preference-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.preference-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.preference-desc {
  font-size: 12px;
  color: var(--text-secondary);
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
  min-width: 120px;
}

/* 账户操作 */
.account-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.account-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-icon {
  font-size: 16px;
}

.logout-btn {
  background: var(--error-bg) !important;
  border-color: var(--error) !important;
  color: var(--error) !important;
}

.expand-toggle {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  transition: all var(--dur-fast) var(--ease-standard);
  flex-shrink: 0;
}

.expand-toggle:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .profile-container {
    padding: 0.75rem;
    gap: 1rem;
  }
  
  .user-overview {
    padding: 1.25rem;
  }
  
  .user-identity {
    gap: 0.75rem;
  }
  
  .user-avatar {
    width: 56px;
    height: 56px;
  }
  
  .user-name {
    font-size: 18px;
  }
  
  .badges-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .key-metrics {
    grid-template-columns: 1fr;
  }
  
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .account-actions {
    gap: 0.5rem;
  }
  
  .account-btn {
    padding: 0.625rem;
  }
  
  /* 移动端默认折叠设置区域 */
  .preferences-section {
    order: 2;
  }
  
  .preferences-card, .account-card {
    margin-bottom: 0.5rem;
  }
}

/* 桌面端优化 */
@media (min-width: 769px) {
  /* 桌面端默认展开所有区域 */
  .achievements-wall,
  .preferences-card > div,
  .account-card > div {
    display: block !important;
  }
  
  .expand-toggle {
    display: none !important;
  }
}
</style>
