<template>
  <a-layout
    class="app-shell"
    :class="{ 'app-shell--no-nav': !showNavigation }"
    role="application"
    aria-label="日程管理应用"
  >
    <!-- 主体布局 -->
    <div class="app-body" :class="{ 'app-body--full': !showNavigation, 'app-body--collapsed': sidebarCollapsed }">
      <!-- 左侧导航 -->
      <aside
        class="app-sidebar"
        :class="{ 'app-sidebar--collapsed': sidebarCollapsed }"
        v-if="showNavigation"
        role="navigation"
        aria-label="主导航菜单"
      >
        <div class="sidebar-header">
          <h2 class="sidebar-title" v-show="!sidebarCollapsed">导航</h2>
        </div>
        <!-- 折叠按钮：纵向居中悬浮在侧边栏右边缘 -->
        <button
          class="sidebar-toggle"
          @click="toggleSidebar"
          :title="sidebarCollapsed ? '展开导航' : '收起导航'"
          :aria-label="sidebarCollapsed ? '展开导航' : '收起导航'"
        >
          <span class="toggle-icon">{{ sidebarCollapsed ? '▶' : '◀' }}</span>
        </button>
        <nav class="sidebar-nav" aria-label="主导航">
          <router-link
            to="/home"
            class="nav-item"
            :aria-current="route.path === '/home' ? 'page' : undefined"
            :title="sidebarCollapsed ? '今日' : undefined"
          >
            <span class="nav-icon" aria-hidden="true">📅</span>
            <span class="nav-label">今日</span>
          </router-link>
          <router-link
            to="/plan"
            class="nav-item"
            :aria-current="route.path === '/plan' ? 'page' : undefined"
            :title="sidebarCollapsed ? '计划' : undefined"
          >
            <span class="nav-icon" aria-hidden="true">📝</span>
            <span class="nav-label">计划</span>
          </router-link>
          <router-link
            to="/log"
            class="nav-item"
            :aria-current="route.path === '/log' ? 'page' : undefined"
            :title="sidebarCollapsed ? '复盘' : undefined"
          >
            <span class="nav-icon" aria-hidden="true">📊</span>
            <span class="nav-label">复盘</span>
          </router-link>
          <router-link
            to="/user/profile"
            class="nav-item"
            :aria-current="route.path === '/user/profile' ? 'page' : undefined"
            :title="sidebarCollapsed ? '个人' : undefined"
          >
            <span class="nav-icon" aria-hidden="true">👤</span>
            <span class="nav-label">个人</span>
          </router-link>
        </nav>

        <!-- 用户信息 -->
        <div class="sidebar-user" :class="{ 'sidebar-user--collapsed': sidebarCollapsed }" v-if="user">
          <a-avatar :size="32" class="avatar-sidebar" @click="goProfile">
            <img :src="avatarUrl" alt="用户头像" />
          </a-avatar>
          <span class="sidebar-username">{{ user.username }}</span>
        </div>
      </aside>

      <!-- 主内容区域 -->
      <main class="app-main" role="main" tabindex="-1" ref="mainContent" :class="{ 'app-main--full': !showNavigation }">
        <router-view v-slot="{ Component, route }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </router-view>
      </main>
    </div>
  </a-layout>

  <!-- 全局专注模式任务选择弹窗 -->
  <FocusTaskSelector
    v-model:visible="focusStore.showTaskSelector"
    :tasks="focusStore.todayTasks"
    @select="focusStore.selectTask"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref, nextTick } from "vue";
import { useUserStore } from "@/store/user";
import { useFocusStore } from "@/store/focus";
import { useRoute, useRouter } from "vue-router";

// 专注模式组件
import FocusTaskSelector from "@/components/focus/FocusTaskSelector.vue";

// 路由
const route = useRoute();
const router = useRouter();

// 计算属性：判断是否显示导航栏（登录/注册页隐藏）
const showNavigation = computed(() => !route.meta.hideNav);

// 侧边栏折叠状态
const sidebarCollapsed = ref(false);

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

// 主内容区域引用
const mainContent = ref<HTMLElement | null>(null);

const userStore = useUserStore();
const focusStore = useFocusStore();
const user = computed(() => userStore.user);
const avatarUrl = computed(() =>
  user.value?.username
    ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.value.username)}`
    : "https://api.dicebear.com/7.x/identicon/svg?seed=default",
);

function goProfile() {
  router.push("/user/profile");
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
   🎨 应用壳层样式
   ======================================== */

/* 应用壳层样式 */
.app-shell {
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  transition: background-color var(--dur-standard) var(--ease-standard);
}

/* 主体布局 */
.app-body {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  transition: grid-template-columns var(--dur-standard) var(--ease-standard);
}

/* 无导航时全宽布局 */
.app-body--full {
  grid-template-columns: 1fr;
}

/* 折叠时侧边栏变窄 */
.app-body--collapsed {
  grid-template-columns: 64px minmax(0, 1fr);
}

/* 左侧导航 */
.app-sidebar {
  background: var(--bg-card);
  border-right: 1px solid var(--border-main);
  width: 220px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow: visible;
  transition:
    width var(--dur-standard) var(--ease-standard);
}

/* 折叠状态 */
.app-sidebar--collapsed {
  width: 64px;
}

.sidebar-header {
  padding: var(--space-4) var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
}

/* 折叠按钮：纵向居中悬浮在侧边栏右边缘 */
.sidebar-toggle {
  position: absolute;
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-main);
  background: var(--bg-card);
  color: var(--text-secondary);
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  z-index: 10;
  box-shadow: var(--shadow-sm);
  transition:
    background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard);
}

.sidebar-toggle:hover {
  background: var(--ai-bg);
  color: var(--ai-main);
  box-shadow: var(--shadow-md);
}

.toggle-icon {
  font-size: 10px;
  line-height: 1;
}

/* 折叠时 header 居中 */
.app-sidebar--collapsed .sidebar-header {
  justify-content: center;
  padding: var(--space-4) var(--space-2) var(--space-2);
}

/* 折叠状态下按钮位置微调 */
.app-sidebar--collapsed .sidebar-toggle {
  right: -14px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  flex: 1;
  overflow-y: auto;
}

/* 折叠时导航项居中 */
.app-sidebar--collapsed .sidebar-nav {
  padding: var(--space-2);
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
  white-space: nowrap;
  transition:
    background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard);
}

/* 折叠时导航项居中显示图标 */
.app-sidebar--collapsed .nav-item {
  justify-content: center;
  padding: var(--space-3);
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
  min-width: 20px;
  text-align: center;
}

/* 导航文字标签 */
.nav-label {
  overflow: hidden;
  transition: opacity var(--dur-fast) var(--ease-standard);
}

/* 折叠时隐藏文字 */
.app-sidebar--collapsed .nav-label {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

/* 侧边栏底部用户信息 */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.sidebar-user--collapsed {
  justify-content: center;
  padding: var(--space-3);
}

.avatar-sidebar {
  border-radius: 50%;
  border: 2px solid var(--ai-main);
  background: var(--bg-card);
  flex-shrink: 0;
  cursor: pointer;
  transition:
    box-shadow var(--dur-fast) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard);
}

.avatar-sidebar:hover {
  box-shadow: 0 0 0 4px var(--ai-bg);
  transform: translateY(-1px);
}

.sidebar-username {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity var(--dur-fast) var(--ease-standard);
}

/* 折叠时隐藏用户名 */
.sidebar-user--collapsed .sidebar-username {
  opacity: 0;
  width: 0;
  overflow: hidden;
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
</style>
