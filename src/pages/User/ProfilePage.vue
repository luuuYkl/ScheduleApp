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
              <span class="achievement-value">{{ habitStreak }}天</span>
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
        <div class="settings-list">
          <div class="setting-row" v-for="setting in systemSettings" :key="setting.key" @click="setting.action">
            <div class="setting-info">
              <span class="setting-icon">{{ setting.icon }}</span>
              <div class="setting-text">
                <span class="setting-name">{{ setting.name }}</span>
                <span class="setting-hint">{{ setting.hint }}</span>
              </div>
            </div>
            <div class="setting-control">
              <a-select
                v-if="setting.type === 'select'"
                v-model="setting.value"
                size="small"
                style="width: 100px"
              >
                <a-option v-for="opt in setting.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </a-option>
              </a-select>
              <span v-else class="setting-status">{{ setting.status }}</span>
            </div>
            <span class="setting-arrow">›</span>
          </div>
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
import PageScaffold from '@/components/common/PageScaffold.vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import PullToRefresh from '@/components/common/PullToRefresh.vue';

const router = useRouter();
const userStore = useUserStore();

const user = computed(() => userStore.user);
const avatarUrl = computed(() =>
  user.value?.username
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.value.username)}`
    : "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
);

// 用户信息
const joinDate = computed(() => {
  const date = new Date();
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
});

// 关键指标数据
const streakDays = ref(7);
const habitStreak = ref(23);

// 行为统计数据
const behaviorStats = computed(() => [
  { key: 'streak', icon: '🔥', name: '连续天数', value: streakDays.value, trend: '+2', trendClass: 'positive' },
  { key: 'completion', icon: '📊', name: '完成率', value: '85%', trend: '+15%', trendClass: 'positive' },
  { key: 'focus', icon: '⏱️', name: '专注时长', value: '6.5h', trend: '峰值', trendClass: 'positive' },
  { key: 'plans', icon: '📋', name: '活跃计划', value: 3, trend: '良好', trendClass: 'positive' }
]);

// 行为分析数据
const analysisItems = computed(() => [
  { key: 'peak', icon: '🌅', title: '黄金时段', value: '9:00-11:00', description: '效率最高时间段' },
  { key: 'focusPeak', icon: '🎯', title: '专注峰值', value: '6.5小时/天', description: '单日最长专注时间' },
  { key: 'habit', icon: '🔄', title: '习惯坚持', value: '23天', description: '重复任务连续完成' },
  { key: 'sprint', icon: '⚡', title: '冲刺记录', value: '18项', description: '单日最多完成任务' }
]);

// 趋势数据
const trendData = ref([
  { label: '一', height: 60 },
  { label: '二', height: 75 },
  { label: '三', height: 55 },
  { label: '四', height: 85 },
  { label: '五', height: 70 },
  { label: '六', height: 90 },
  { label: '日', height: 80 }
]);

// 系统设置
const themePreference = ref<"auto" | "light" | "dark">("auto");
const reminderPreference = ref("30");
const aiLevel = ref("standard");

interface SettingOption {
  value: string;
  label: string;
}

interface SystemSetting {
  key: string;
  icon: string;
  name: string;
  hint: string;
  type: 'select' | 'link';
  value: string;
  options?: SettingOption[];
  status?: string;
  action?: () => void;
}

const systemSettings = computed<SystemSetting[]>(() => [
  {
    key: 'theme',
    icon: '🌗',
    name: '外观模式',
    hint: '界面主题设置',
    type: 'select',
    value: themePreference.value,
    options: [
      { value: 'auto', label: '自动' },
      { value: 'light', label: '明亮' },
      { value: 'dark', label: '暗色' }
    ]
  },
  {
    key: 'reminder',
    icon: '🔔',
    name: '提醒偏好',
    hint: '任务提醒时间',
    type: 'select',
    value: reminderPreference.value,
    options: [
      { value: '10', label: '10分钟' },
      { value: '30', label: '30分钟' },
      { value: '60', label: '1小时' }
    ]
  },
  {
    key: 'ai',
    icon: '🧠',
    name: 'AI 辅助',
    hint: '智能助手参与度',
    type: 'select',
    value: aiLevel.value,
    options: [
      { value: 'minimal', label: '最少' },
      { value: 'standard', label: '标准' },
      { value: 'active', label: '积极' }
    ]
  }
]);

function handleThemeChange() {
  if (themePreference.value === "auto") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  } else {
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

async function handleRefresh() {
  // 简单刷新
}

onMounted(() => {
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme === "light" || currentTheme === "dark") {
    themePreference.value = currentTheme;
  } else {
    themePreference.value = "auto";
  }
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

.settings-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.setting-row {
  display: flex;
  align-items: center;
  padding: var(--space-3);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-main);
  cursor: pointer;
  transition: all 0.2s ease;
}

.setting-row:hover {
  background: var(--bg-card-hover);
  border-color: var(--ai-main);
}

.setting-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
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

.setting-control {
  margin-right: var(--space-2);
}

.setting-status {
  font-size: 12px;
  color: var(--text-secondary);
}

.setting-arrow {
  font-size: 16px;
  color: var(--text-muted);
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