<template>
  <PageScaffold 
    title="个人中心" 
    :show-back="false"
    class="layer-context"
  >
    <PullToRefresh @refresh="handleRefresh">
    <div class="profile-container layout-template-l">
      <!-- Context Layer: 用户概览 -->
      <section class="user-overview layer-context priority-high">
        <div class="user-identity">
          <img :src="avatarUrl" class="user-avatar" alt="用户头像" />
          <div class="user-info">
            <h1 class="user-name">{{ user?.username || "未登录用户" }}</h1>
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

      <!-- Primary Layer: 数据洞察 -->
      <section class="growth-section layer-primary priority-high">
        <!-- 深度数据分析 -->
        <Card class="analytics-card">
          <template #header>
            <h3 class="card-title">📈 完成情况洞察</h3>
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
              <a-select
                v-model="themePreference"
                @change="handleThemeChange"
                size="small"
                style="width: 120px"
              >
                <a-option value="auto">自动</a-option>
                <a-option value="light">明亮</a-option>
                <a-option value="dark">暗色</a-option>
              </a-select>
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <span class="preference-icon">🔔</span>
                <div class="preference-text">
                  <span class="preference-label">提醒偏好</span>
                  <span class="preference-desc">任务提醒时间</span>
                </div>
              </div>
              <a-select
                v-model="reminderPreference"
                @change="handleReminderChange"
                size="small"
                style="width: 120px"
              >
                <a-option value="10">提前 10 分钟</a-option>
                <a-option value="30">提前 30 分钟</a-option>
                <a-option value="60">提前 1 小时</a-option>
              </a-select>
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <span class="preference-icon">🧠</span>
                <div class="preference-text">
                  <span class="preference-label">AI 参与程度</span>
                  <span class="preference-desc">智能助手活跃度</span>
                </div>
              </div>
              <a-select
                v-model="aiLevel"
                @change="handleAiLevelChange"
                size="small"
                style="width: 120px"
              >
                <a-option value="minimal">最少</a-option>
                <a-option value="standard">标准</a-option>
                <a-option value="active">积极</a-option>
              </a-select>
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

// 响应式状态
const isMobile = ref(window.innerWidth < 768);
const showPreferences = ref(false);
const showAccount = ref(false);

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

// 关键指标数据
const streakDays = ref(7);
const streakChange = ref(2);
const streakTrend = computed(() => streakChange.value >= 0 ? 'positive' : 'negative');
const weeklyCompletion = ref(85);
const weeklyGrowth = ref(15);
const planCount = ref(3);
const planHealthStatus = computed(() => 'good');
const planHealthText = computed(() => '良好');

// 深度洞察数据
const peakHour = ref(9);
const focusPeak = ref(6.5);
const habitStreak = ref(23);
const sprintRecord = ref(18);

// 偏好设置
const themePreference = ref<"auto" | "light" | "dark">("auto");
const reminderPreference = ref("10");
const aiLevel = ref("standard");

// 偏好设置的存储 Key
const PREFERENCES_KEY = "user_preferences";

// 用户偏好设置接口
interface UserPreferences {
  theme: "auto" | "light" | "dark";
  reminderMinutes: number;
  aiLevel: "minimal" | "standard" | "active";
}

// 加载偏好设置
function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("加载偏好设置失败:", e);
  }
  return {
    theme: "auto",
    reminderMinutes: 10,
    aiLevel: "standard"
  };
}

// 保存偏好设置
function savePreferences(prefs: Partial<UserPreferences>) {
  try {
    const current = loadPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("保存偏好设置失败:", e);
  }
}

function handleThemeChange() {
  if (themePreference.value === "auto") {
    // 自动模式：移除 data-theme 属性，让浏览器使用系统设置
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  } else {
    // 手动模式：使用 userStore 的 toggleTheme 方法
    userStore.toggleTheme(themePreference.value);
  }
  // 保存到偏好设置
  savePreferences({ theme: themePreference.value });
}

function handleReminderChange(value: string | number | undefined) {
  const minutes = typeof value === 'string' ? parseInt(value, 10) : (value || 10);
  reminderPreference.value = String(minutes);
  savePreferences({ reminderMinutes: minutes });
  console.log(`提醒偏好已更新: 提前 ${minutes} 分钟`);
}

function handleAiLevelChange(value: string | number | undefined) {
  const level = String(value || 'standard') as "minimal" | "standard" | "active";
  aiLevel.value = level;
  savePreferences({ aiLevel: level });
  console.log(`AI 参与程度已更新: ${level}`);
}

function exportData() {
  try {
    // 收集所有用户数据
    const userData = {
      preferences: loadPreferences(),
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
    
    // 创建下载
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("数据导出成功");
  } catch (e) {
    console.error("数据导出失败:", e);
    alert("数据导出失败，请重试");
  }
}

function showPrivacy() {
  alert("隐私政策：我们重视您的隐私，所有数据存储在本地。");
}

function logout() {
  userStore.logout();
  router.push("/login");
}

// 下拉刷新处理
async function handleRefresh() {
  // 重新加载偏好设置
  const prefs = loadPreferences();
  themePreference.value = prefs.theme;
  reminderPreference.value = String(prefs.reminderMinutes);
  aiLevel.value = prefs.aiLevel;
}

onMounted(() => {
  // 加载所有偏好设置
  const prefs = loadPreferences();
  themePreference.value = prefs.theme;
  reminderPreference.value = String(prefs.reminderMinutes);
  aiLevel.value = prefs.aiLevel;
  
  // 同步主题到 DOM（如果之前保存过）
  if (prefs.theme !== "auto") {
    document.documentElement.setAttribute("data-theme", prefs.theme);
  }
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

/* 桌面端布局 */
@media (min-width: 1025px) {
  .preferences-section {
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
  margin: 0;
}

/* 关键指标 */
.key-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
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

/* 数据洞察 */
.growth-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.analytics-card {
  border: 1px solid var(--border-subtle);
}

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

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.card-header-clickable {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  cursor: pointer;
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

/* 账户操作 */
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
  
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .account-btn {
    padding: 0.625rem;
  }
  
  .preferences-section {
    order: 2;
  }
  
  .preferences-card, .account-card {
    margin-bottom: 0.5rem;
  }
}

/* 桌面端优化 */
@media (min-width: 769px) {
  .preferences-card > div,
  .account-card > div {
    display: block !important;
  }
  
  .expand-toggle {
    display: none !important;
  }
}
</style>
