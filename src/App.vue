<template>
  <!-- 缩放包装器 - 全屏容器 -->
  <div class="scale-wrapper">
    <!-- 缩放容器 - 固定 1920px 宽度，动态 scale -->
    <div class="scale-container">
      <a-layout
        class="app-shell"
        :class="{
          'app-shell--desktop': isDesktop,
          'app-shell--mobile': !isDesktop,
          'app-shell--no-nav': !showNavigation,
        }"
        role="application"
        aria-label="日程管理应用"
      >
        <!-- 响应式头部 - 使用 Arco Layout -->
        <a-layout-header class="app-header" role="banner" v-if="showNavigation">
          <div class="header-inner">
            <div class="header-left">
              <h1 class="app-name">{{ APP_CONFIG.APP_NAME }}</h1>
            </div>
            <div class="header-right">
              <a-space align="center" :size="12">
                <span class="username" v-if="user">{{ user.username }}</span>
                <a-dropdown v-if="user?.username" trigger="click">
                  <a-avatar :size="40" class="avatar-header">
                    <img :src="avatarUrl" alt="用户头像" />
                  </a-avatar>
                  <template #content>
                    <a-doption @click="goProfile">
                      <template #icon><icon-user /></template>
                      个人资料
                    </a-doption>
                    <a-doption @click="handleLogout">
                      <template #icon><icon-export /></template>
                      退出登录
                    </a-doption>
                  </template>
                </a-dropdown>
              </a-space>
            </div>
          </div>
        </a-layout-header>

        <!-- 响应式主体布局 -->
        <div class="app-body" :class="{ 'app-body--full': !showNavigation }">
          <!-- 桌面端左侧导航 -->
          <aside
            class="app-sidebar"
            v-if="isDesktop && showNavigation"
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
                <span class="nav-icon" aria-hidden="true">📅</span>
                <span>今日</span>
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
                to="/log"
                class="nav-item"
                :aria-current="route.path === '/log' ? 'page' : undefined"
              >
                <span class="nav-icon" aria-hidden="true">📊</span>
                <span>复盘</span>
              </router-link>
              <router-link
                to="/user/profile"
                class="nav-item"
                :aria-current="route.path === '/user/profile' ? 'page' : undefined"
              >
                <span class="nav-icon" aria-hidden="true">👤</span>
                <span>个人</span>
              </router-link>
            </nav>
          </aside>

          <!-- 主内容区域 -->
          <main class="app-main" role="main" tabindex="-1" ref="mainContent" :class="{ 'app-main--full': !showNavigation }">
            <router-view />
          </main>
        </div>

        <!-- 移动端底部导航 - 使用 Arco Menu -->
        <a-layout-footer
          class="app-bottom-nav"
          v-if="!isDesktop && showBottomNav && showNavigation"
          role="navigation"
          aria-label="底部导航菜单"
        >
          <a-menu
            mode="horizontal"
            :selected-keys="[currentNavKey]"
            @menu-item-click="handleNavClick"
          >
            <a-menu-item key="home">
              <template #icon><icon-home /></template>
              今日
            </a-menu-item>
            <a-menu-item key="plan">
              <template #icon><icon-calendar /></template>
              计划
            </a-menu-item>
            <a-menu-item key="log">
              <template #icon><icon-bar-chart /></template>
              复盘
            </a-menu-item>
            <a-menu-item key="profile">
              <template #icon><icon-user /></template>
              个人
            </a-menu-item>
          </a-menu>
        </a-layout-footer>
      </a-layout>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref, nextTick } from "vue";
import { useUserStore } from "@/store/user";
import { APP_CONFIG } from "@/config";
import { useRoute, useRouter } from "vue-router";
import { useResponsive } from "@/utils/responsive";
// Arco Design 图标
import {
  IconUser,
  IconExport,
  IconHome,
  IconCalendar,
  IconBarChart,
} from "@arco-design/web-vue/es/icon";

// 路由
const route = useRoute();
const router = useRouter();

// 计算属性：判断是否显示底部导航栏
const showBottomNav = computed(() => route.meta.showBottomNav ?? true);

// 计算属性：判断是否显示导航栏（登录/注册页隐藏）
const showNavigation = computed(() => !route.meta.hideNav);

// 响应式断点计算
const isDesktop = ref(window.matchMedia("(min-width: 1024px)").matches);

// 响应式状态
const { scale } = useResponsive();

// 主内容区域引用
const mainContent = ref<HTMLElement | null>(null);

// 监听屏幕尺寸变化
function handleResize() {
  isDesktop.value = window.matchMedia("(min-width: 1024px)").matches;
}

// 当前导航键（用于 Arco Menu）
const currentNavKey = computed(() => {
  const path = route.path;
  if (path.startsWith("/home")) return "home";
  if (path.startsWith("/plan")) return "plan";
  if (path.startsWith("/calendar")) return "calendar";
  if (path.startsWith("/log")) return "log";
  if (path.startsWith("/user")) return "profile";
  return "home";
});

// 导航点击处理
function handleNavClick(key: string) {
  if (key === "profile") {
    router.push("/user/profile");
  } else {
    router.push(`/${key}`);
  }
}

const userStore = useUserStore();
const user = computed(() => userStore.user);
const avatarUrl = computed(() =>
  user.value?.username
    ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.value.username)}`
    : "https://api.dicebear.com/7.x/identicon/svg?seed=default",
);

function goProfile() {
  router.push("/user/profile");
}

// 退出登录
function handleLogout() {
  userStore.logout();
  router.push("/login");
}

// 应用启动时初始化主题和恢复用户状态
onMounted(async () => {
  userStore.initTheme();
  
  // 尝试恢复用户登录状态
  try {
    console.log("[App] 尝试恢复用户登录状态...");
    const user = await userStore.restore();
    console.log("[App] 用户状态恢复结果:", user);
  } catch (e) {
    console.warn("[App] 用户状态恢复失败:", e);
  }
  
  // 注意：不再监听 resize 事件来改变 isDesktop
  // 因为 transform: scale() 方案下，内部始终是 1920px 布局，应保持桌面模式

  // 路由变化时聚焦到主内容区域
  router.afterEach(() => {
    nextTick(() => {
      if (mainContent.value) {
        mainContent.value.focus();
      }
    });
  });
});

// 监视主题变化并应用到DOM
watch(
  () => userStore.theme,
  (newTheme) => {
    // 仅设置data-theme属性，让CSS Tokens自动生效
    document.documentElement.setAttribute("data-theme", newTheme);
  },
  { immediate: true },
);
</script>

<style scoped>
/* ========================================
   🎨 Scale 缩放容器样式
   ======================================== */

/* 缩放包装器 - 全屏容器，允许垂直滚动 */
.scale-wrapper {
  width: 100vw;
  min-height: 100vh;
  background: var(--bg-main);
  /* 隐藏水平溢出，允许垂直滚动 */
  overflow-x: hidden;
  overflow-y: auto;
}

/* 缩放容器 - 固定 1920px 宽度，使用 zoom 缩放填满屏幕 */
.scale-container {
  width: 1920px;
  height: 100vh;
  /* zoom 缩放会自动调整实际占用空间 */
  transform-origin: left top;
}

/* ========================================
   🎨 应用壳层样式
   ======================================== */

/* 响应式壳层样式 */
.app-shell {
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  transition: background-color var(--dur-standard) var(--ease-standard);
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
  margin: 0 auto;
  padding: 0 var(--space-6);
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
  box-shadow:
    0 0 0 4px var(--ai-bg),
    0 0 0 6px var(--focus-ring);
}

/* 响应式主体布局 */
.app-body {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
}

/* 无导航时全宽布局 */
.app-body--full {
  grid-template-columns: 1fr;
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
  padding: var(--space-6) var(--space-8) var(--space-8);
}

/* 无导航时全宽无padding */
.app-main--full {
  padding: 0;
}

.app-main > * {
  flex: 1;
  width: 100%;
}

/* 移动端底部导航 - 使用 sticky 替代 fixed 以配合 zoom */
.app-bottom-nav {
  position: sticky;
  bottom: 0;
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
</style>