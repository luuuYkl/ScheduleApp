<template>
  <a-layout
    class="app-shell"
    :class="{ 'app-shell--no-nav': !showNavigation }"
    role="application"
    aria-label="日程管理应用"
  >
    <!-- 主体布局 -->
    <div class="app-body" :class="{ 'app-body--full': !showNavigation }">
      <!-- 左侧导航（始终折叠：仅图标） -->
      <aside
        class="app-sidebar"
        v-if="showNavigation"
        role="navigation"
        aria-label="主导航菜单"
      >
        <div class="sidebar-header">
          <span class="sidebar-logo" aria-hidden="true">📋</span>
        </div>

        <nav class="sidebar-nav" aria-label="主导航">
          <router-link
            to="/home"
            class="nav-item"
            :aria-current="route.path === '/home' ? 'page' : undefined"
            title="今日"
          >
            <span class="nav-icon" aria-hidden="true">📅</span>
          </router-link>
          <router-link
            to="/plan"
            class="nav-item"
            :aria-current="route.path === '/plan' ? 'page' : undefined"
            title="计划"
          >
            <span class="nav-icon" aria-hidden="true">📝</span>
          </router-link>
          <router-link
            to="/log"
            class="nav-item"
            :aria-current="route.path === '/log' ? 'page' : undefined"
            title="复盘"
          >
            <span class="nav-icon" aria-hidden="true">📊</span>
          </router-link>
          <router-link
            to="/user/profile"
            class="nav-item"
            :aria-current="route.path === '/user/profile' ? 'page' : undefined"
            title="个人"
          >
            <span class="nav-icon" aria-hidden="true">👤</span>
          </router-link>
        </nav>

        <!-- 用户信息 -->
        <div class="sidebar-user" v-if="user">
          <a-avatar :size="32" class="avatar-sidebar" @click="goProfile">
            <img :src="avatarUrl" alt="用户头像" />
          </a-avatar>
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

/* 主体布局 — 侧边栏始终 64px */
.app-body {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
}

/* 无导航时全宽布局 */
.app-body--full {
  grid-template-columns: 1fr;
}

/* 左侧导航 — 始终折叠（仅图标） */
.app-sidebar {
  background: var(--bg-card);
  border-right: 1px solid var(--border-main);
  width: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow: visible;
}

.sidebar-header {
  padding: var(--space-4) 0 var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-logo {
  font-size: 22px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  flex: 1;
  overflow-y: auto;
  width: 100%;
}

.sidebar-nav .nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3);
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
  font-size: 20px;
  text-align: center;
}

/* 侧边栏底部用户信息 */
.sidebar-user {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3);
  border-top: 1px solid var(--border-subtle);
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