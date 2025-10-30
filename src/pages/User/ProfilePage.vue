<template>
  <div class="profile-page card" style="max-width:560px;margin:calc(var(--header-height, 64px) + 1.5rem) auto 2rem auto;">
    <div class="header-row">
      <h2>个人中心</h2>
      <button class="mini-btn" @click="toggleTheme" :title="`切换到${theme==='light'?'暗色':'浅色'}主题`">
        {{ theme === 'light' ? '🌙 暗色' : '☀️ 浅色' }}
      </button>
    </div>
    <div class="avatar-box">
      <img :src="avatarUrl" class="avatar" alt="用户头像" />
    </div>
    <div class="info">
      <p><strong>用户名：</strong>{{ user?.username }}</p>
      <p><strong>用户ID：</strong>{{ user?.id }}</p>
      <p v-if="user?.email"><strong>邮箱：</strong>{{ user.email }}</p>
    </div>

    <div class="stats-grid" v-if="loaded">
      <div class="stat-item">
        <span class="label">计划数量</span>
        <span class="value">{{ planCount }}</span>
      </div>
      <div class="stat-item">
        <span class="label">总任务数</span>
        <span class="value">{{ totalTasks }}</span>
      </div>
      <div class="stat-item">
        <span class="label">今日任务数</span>
        <span class="value">{{ todayTotal }}</span>
      </div>
      <div class="stat-item">
        <span class="label">今日完成度</span>
        <span class="value">{{ todayPercent }}%</span>
      </div>
    </div>

    <div class="actions">
      <button class="danger" @click="logout">退出登录</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter } from 'vue-router';
import { useUserStore } from "@/store/user";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
// 移除日志相关逻辑

const userStore = useUserStore();
const user = computed(() => userStore.user);
// 简单头像生成（可替换为后端头像字段）
const avatarUrl = computed(() =>
  user.value?.username
    ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.value.username)}`
    : 'https://api.dicebear.com/7.x/identicon/svg?seed=default'
);

// 主题切换
const theme = ref(localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');
function applyTheme() {
  const root = document.documentElement;
  if (theme.value === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('theme', theme.value);
}
function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  applyTheme();
}

// 统计相关
const planStore = usePlanStore();
const taskStore = useTaskStore();
const loaded = ref(false);

const planCount = computed(() => planStore.plans.length);
const totalTasks = computed(() => taskStore.tasks.length);
const today = new Date().toISOString().slice(0,10);
const todayTasks = computed(() => taskStore.tasks.filter(t => t.task_date === today));
const todayTotal = computed(() => todayTasks.value.length);
const todayDone = computed(() => todayTasks.value.filter(t => t.status === 'done').length);
const todayPercent = computed(() => todayTotal.value === 0 ? 0 : Math.round((todayDone.value / todayTotal.value) * 100));

const router = useRouter();
function logout(){ userStore.logout(); router.push('/login'); }

onMounted(async () => {
  applyTheme();
  await planStore.loadPlans();
  await taskStore.loadTasks();
  loaded.value = true;
});
</script>

<style scoped>
.profile-page {
  padding: 2rem 1.75rem 2.5rem;
  text-align: center;
}
.avatar-box {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}
.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px solid #3b82f6;
  background: #f3f4f6;
}
.info {
  margin: 1rem auto 1.5rem;
  text-align: left;
  max-width: 380px;
}
.stats-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(120px,1fr));
  gap: 0.75rem; 
  margin-bottom: 1.5rem;
}
.stat-item { 
  background: var(--color-gray-50); 
  border: 1px solid var(--color-border); 
  padding: 0.75rem 0.5rem; 
  border-radius: var(--radius-md); 
  display:flex;flex-direction:column;gap:0.25rem;
}
.stat-item .label { font-size: 0.75rem; color: var(--color-text-secondary); letter-spacing: .05em; }
.stat-item .value { font-size: 1.125rem; font-weight: 700; }
.actions { display:flex; flex-wrap:wrap; gap:.75rem; justify-content:center; }
.actions button { min-width:140px; }
.mini-btn { background: var(--color-gray-200); border:1px solid var(--color-border); border-radius:6px; padding:4px 10px; cursor:pointer; font-size:.75rem; }
.mini-btn:hover { background: var(--color-gray-300); }
@media (prefers-color-scheme: dark) {
  .stat-item { background: var(--color-surface); }
}
.header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom: .75rem; }
</style>
