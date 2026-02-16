<template>
  <div 
    class="app-shell" 
    :class="{ 'app-shell--desktop': isDesktop, 'app-shell--mobile': !isDesktop }"
    role="application"
    aria-label="日程管理应用"
  >
    <!-- 响应式头部 -->
    <header class="app-header" role="banner">
      <div class="header-inner">
        <div class="header-left">
          <h1 class="app-name">{{ APP_CONFIG.APP_NAME }}</h1>
        </div>
        <div class="header-right">
          <div class="user-info" v-if="user">
            <span class="username">{{ user.username }}</span>
          </div>
          <img
            v-if="user?.username"
            :src="avatarUrl"
            class="avatar-header"
            alt="用户头像"
            @click="goProfile"
            title="点击查看个人资料"
            role="button"
            tabindex="0"
            @keydown.enter="goProfile"
            @keydown.space.prevent="goProfile"
          />
        </div>
      </div>
    </header>

    <!-- 响应式主体布局 -->
    <div class="app-body">
      <!-- 桌面端左侧导航 -->
      <aside 
        class="app-sidebar" 
        v-if="isDesktop"
        role="navigation"
        aria-label="主导航菜单"
      >
        <div class="sidebar-header">
          <h2 class="sidebar-title">导航</h2>
        </div>
        <nav class="sidebar-nav" aria-label="主导航">
          <router-link 
            to="/home" 
            class="nav-item" 
            :aria-current="route.path === '/home' ? 'page' : undefined"
          >
            <span class="nav-icon" aria-hidden="true">🏠</span>
            <span>首页</span>
          </router-link>
          <router-link 
            to="/plan" 
            class="nav-item" 
            :aria-current="route.path === '/plan' ? 'page' : undefined"
          >
            <span class="nav-icon" aria-hidden="true">📝</span>
            <span>计划</span>
          </router-link>
          <router-link 
            to="/calendar" 
            class="nav-item"
            :aria-current="route.path === '/calendar' ? 'page' : undefined"
          >
            <span class="nav-icon" aria-hidden="true">📅</span>
            <span>日历</span>
          </router-link>
          <router-link 
            to="/log" 
            class="nav-item"
            :aria-current="route.path === '/log' ? 'page' : undefined"
          >
            <span class="nav-icon" aria-hidden="true">📊</span>
            <span>复盘</span>
          </router-link>
          <router-link 
            to="/schedule" 
            class="nav-item"
            :aria-current="route.path === '/schedule' ? 'page' : undefined"
          >
            <span class="nav-icon" aria-hidden="true">⏰</span>
            <span>日程</span>
          </router-link>
        </nav>
      </aside>
      
      <!-- 主内容区域 -->
      <main 
        class="app-main" 
        role="main"
        tabindex="-1"
        ref="mainContent"
      >
        <router-view />
      </main>
    </div>

    <!-- 移动端底部导航 -->
    <footer 
      class="app-bottom-nav" 
      v-if="!isDesktop && showBottomNav"
      role="navigation" 
      aria-label="底部导航菜单"
    >
      <router-link 
        to="/home" 
        class="nav-item" 
        :class="{ active: isActive('/home') }"
        :aria-current="route.path === '/home' ? 'page' : undefined"
      >
        <span class="nav-icon" aria-hidden="true">🏠</span>
        <span class="nav-label">首页</span>
      </router-link>
      <router-link 
        to="/plan" 
        class="nav-item" 
        :class="{ active: isActive('/plan') }"
        :aria-current="route.path === '/plan' ? 'page' : undefined"
      >
        <span class="nav-icon" aria-hidden="true">📝</span>
        <span class="nav-label">计划</span>
      </router-link>
      <router-link 
        to="/calendar" 
        class="nav-item" 
        :class="{ active: isActive('/calendar') }"
        :aria-current="route.path === '/calendar' ? 'page' : undefined"
      >
        <span class="nav-icon" aria-hidden="true">📅</span>
        <span class="nav-label">日历</span>
      </router-link>
      <router-link 
        to="/log" 
        class="nav-item" 
        :class="{ active: isActive('/log') }"
        :aria-current="route.path === '/log' ? 'page' : undefined"
      >
        <span class="nav-icon" aria-hidden="true">📊</span>
        <span class="nav-label">复盘</span>
      </router-link>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref, nextTick } from "vue";
import { useUserStore } from "@/store/user";
import { APP_CONFIG } from "@/config";
import { useRoute, useRouter } from "vue-router";

// 计算属性：判断是否显示底部导航栏
const route = useRoute();
const router = useRouter();
const showBottomNav = computed(() => route.meta.showBottomNav ?? true);

// 响应式断点计算
const isDesktop = ref(window.matchMedia('(min-width: 1024px)').matches);

// 主内容区域引用
const mainContent = ref<HTMLElement | null>(null);

// 监听屏幕尺寸变化
function handleResize() {
  isDesktop.value = window.matchMedia('(min-width: 1024px)').matches;
}

// 导航激活状态判断
function isActive(path: string): boolean {
  return route.path.startsWith(path);
}

const userStore = useUserStore();
const user = computed(() => userStore.user);
const avatarUrl = computed(() =>
  user.value?.username
    ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.value.username)}`
    : 'https://api.dicebear.com/7.x/identicon/svg?seed=default'
);

function goProfile() {
  router.push("/user/profile");
}

// 应用启动时初始化主题
onMounted(() => {
  userStore.initTheme();
  window.addEventListener('resize', handleResize);
  
  // 路由变化时聚焦到主内容区域
  router.afterEach(() => {
    nextTick(() => {
      if (mainContent.value) {
        mainContent.value.focus();
      }
    });
  });
});

// 组件卸载时清理事件监听器
// 注意：在Vue 3 Composition API中，通常不需要手动清理，但为了完整性保留

// 监视主题变化并应用到DOM
watch(() => userStore.theme, (newTheme) => {
  // 仅设置data-theme属性，让CSS Tokens自动生效
  document.documentElement.setAttribute('data-theme', newTheme);
}, { immediate: true });

// 调试输出：在应用启动时打印本地存储的 token/user
// eslint-disable-next-line no-console
console.log("[APP] theme from localStorage:", localStorage.getItem("theme"));
</script>

<style scoped>
/* 响应式壳层样式 */
.app-shell {
  min-height: 100dvh;
  background: var(--bg-main);
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  transition: background-color var(--dur-standard) var(--ease-standard);
}

/* 语义化状态类 */
.app-shell--desktop {
  /* 桌面端特定样式 */
}

.app-shell--mobile {
  /* 移动端特定样式 */
}

/* 响应式头部 */
.app-header {
  position: sticky;
  top: 0;
  height: var(--header-height);
  background: var(--bg-main);
  border-bottom: 1px solid var(--border-main);
  backdrop-filter: blur(10px);
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  transition: all var(--dur-standard) var(--ease-standard);
}

.header-inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.app-name {
  font-size: 18px;
  margin: 0;
  color: var(--text-main);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.username {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.avatar-header {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--ai-main);
  background: var(--bg-card);
  cursor: pointer;
  transition: 
    box-shadow var(--dur-fast) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard);
}

.avatar-header:hover,
.avatar-header:focus {
  box-shadow: 0 0 0 4px var(--ai-bg);
  transform: translateY(-2px);
  border-color: var(--ai-light);
  outline: none;
}

.avatar-header:focus-visible {
  box-shadow: 0 0 0 4px var(--ai-bg), 0 0 0 6px var(--focus-ring);
}

/* 响应式主体布局 */
.app-body {
  display: grid;
  grid-template-columns: 1fr;
  flex: 1;
  min-height: 0;
}

/* 桌面端左侧导航 */
.app-sidebar {
  background: var(--bg-card);
  border-right: 1px solid var(--border-main);
  width: 220px;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all var(--dur-standard) var(--ease-standard);
}

.sidebar-header {
  padding: var(--space-4) var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  flex: 1;
  overflow-y: auto;
}

.sidebar-nav .nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: 
    background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard);
}

.sidebar-nav .nav-item:hover,
.sidebar-nav .nav-item:focus {
  background: var(--bg-card-hover);
  color: var(--text-main);
  outline: none;
}

.sidebar-nav .nav-item:focus-visible {
  box-shadow: inset 0 0 0 2px var(--focus-ring);
}

.sidebar-nav .nav-item.router-link-active {
  background: var(--ai-bg);
  color: var(--ai-main);
  box-shadow: inset 3px 0 0 var(--ai-main);
}

.nav-icon {
  font-size: 18px;
  width: 20px;
  text-align: center;
}

/* 主内容区域 */
.app-main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  outline: none;
}

/* 移动端底部导航 */
.app-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background: var(--bg-main);
  border-top: 1px solid var(--border-main);
  backdrop-filter: blur(10px);
  z-index: var(--z-fixed);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 var(--space-2);
  padding-bottom: env(safe-area-inset-bottom, 0);
  transition: all var(--dur-standard) var(--ease-standard);
}

.app-bottom-nav .nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 12px;
  transition: 
    color var(--dur-fast) var(--ease-standard),
    background-color var(--dur-fast) var(--ease-standard);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
}

.app-bottom-nav .nav-item:hover,
.app-bottom-nav .nav-item:focus {
  color: var(--text-main);
  background: var(--bg-card);
  outline: none;
}

.app-bottom-nav .nav-item:focus-visible {
  box-shadow: inset 0 0 0 2px var(--focus-ring);
}

.app-bottom-nav .nav-item.active,
.app-bottom-nav .nav-item.router-link-active {
  color: var(--ai-main);
  background: var(--ai-bg);
  box-shadow: inset 0 -2px 0 var(--ai-main);
}

.nav-label {
  margin-top: 2px;
}

/* 响应式断点 */
@media (min-width: 1024px) {
  .app-body {
    grid-template-columns: 220px minmax(0, 1fr);
  }
  
  .app-main {
    padding: var(--space-6) var(--space-8);
  }
  
  /* 桌面端主要内容区域增加内边距 */
  .app-main > * {
    flex: 1;
    padding: 0 var(--space-6);
  }
  
  /* 移动端导航在桌面端隐藏 */
  .app-bottom-nav {
    display: none;
  }
}

/* 移动端优化 */
@media (max-width: 1023px) {
  .header-inner {
    padding: 0 var(--space-3);
  }
  
  .app-main {
    padding: var(--space-4) var(--space-3);
    padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  }
  
  /* 移动端主要内容区域 */
  .app-main > * {
    flex: 1;
    padding: 0 var(--space-3);
  }
  
  /* 桌面端侧边栏在移动端隐藏 */
  .app-sidebar {
    display: none;
  }
}

/* 小屏幕优化 */
@media (max-width: 480px) {
  .header-inner {
    padding: 0 var(--space-2);
  }
  
  .app-name {
    font-size: 16px;
  }
  
  .username {
    font-size: 12px;
  }
  
  .avatar-header {
    width: 32px;
    height: 32px;
  }
}
</style>
