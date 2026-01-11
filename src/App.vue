<template>
  <div id="app">
    <!-- 固定顶部栏 -->
    <header class="app-fixed-header">
      <div class="inner">
        <div class="left">
          <h1 class="app-name">{{ APP_CONFIG.APP_NAME }}</h1>
        </div>
        <div class="right">
          <div class="user-info" v-if="user">
            <span class="username">{{ user.username }}</span>
          </div>
          <!-- 主题切换按钮 -->
          <button 
            class="theme-toggle"
            @click="userStore.toggleTheme()"
            :title="`切换到${userStore.theme === 'dark' ? '浅色' : '暗色'}模式`"
            aria-label="切换主题"
          >
            <span class="icon" v-if="userStore.theme === 'dark'">☀️</span>
            <span class="icon" v-else>🌙</span>
          </button>
          <img
            v-if="user?.username"
            :src="avatarUrl"
            class="avatar-header"
            alt="用户头像"
            @click="goProfile"
            title="点击查看个人资料"
          />
        </div>
      </div>
    </header>

    <!-- 路由视图 -->
    <main>
      <router-view />
    </main>

    <!-- 底部导航栏，只有在需要的页面中才显示 -->
    <footer v-if="showBottomNav" class="bottom-nav">
      <router-link to="/home" class="nav-item">首页</router-link>
      <router-link to="/plan/calendar/1" class="nav-item">日历</router-link>
      <router-link to="/log" class="nav-item">日志</router-link>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useUserStore } from "@/store/user";
import { APP_CONFIG } from "@/config";
import { useRoute, useRouter } from "vue-router";

// 计算属性：判断是否显示底部导航栏
const route = useRoute();
const router = useRouter();
const showBottomNav = computed(() => route.meta.showBottomNav ?? true);

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
});

// 监视主题变化（调试 + 备用的 JavaScript CSS 变量设置）
watch(() => userStore.theme, (newTheme) => {
  console.log('[App] 主题变化检测:');
  console.log('  - Pinia store:', newTheme);
  console.log('  - DOM属性:', document.documentElement.getAttribute('data-theme'));
  console.log('  - localStorage:', localStorage.getItem('theme'));
  console.log('  - CSS变量 --bg-main:', getComputedStyle(document.documentElement).getPropertyValue('--bg-main'));
  
  // 备用方案：直接通过 JavaScript 设置 CSS 变量（确保万无一失）
  const root = document.documentElement;
  if (newTheme === 'light') {
    root.style.setProperty('--bg-main', '#F5F5F5');
    root.style.setProperty('--bg-card', '#FAFAFA');
    root.style.setProperty('--bg-card-hover', '#F0F0F0');
    root.style.setProperty('--bg-input', '#FFFFFF');
    root.style.setProperty('--bg-elevated', '#F0F0F0');
    root.style.setProperty('--text-main', '#0F172A');
    root.style.setProperty('--text-secondary', '#475569');
    root.style.setProperty('--text-muted', '#94A3B8');
    root.style.setProperty('--text-emphasis', '#000000');
  } else {
    root.style.setProperty('--bg-main', '#0E1117');
    root.style.setProperty('--bg-card', '#161B22');
    root.style.setProperty('--bg-card-hover', '#1C2128');
    root.style.setProperty('--bg-input', '#0D1117');
    root.style.setProperty('--bg-elevated', '#21262D');
    root.style.setProperty('--text-main', '#E5E7EB');
    root.style.setProperty('--text-secondary', '#9CA3AF');
    root.style.setProperty('--text-muted', '#6B7280');
    root.style.setProperty('--text-emphasis', '#F3F4F6');
  }
  
  console.log('[App] JavaScript 直接设置 CSS 变量完成');
}, { immediate: true });

// 调试输出：在应用启动时打印本地存储的 token/user
// eslint-disable-next-line no-console
console.log("[APP] localStorage token:", localStorage.getItem("token"), "user:", localStorage.getItem("user"));
</script>

<style scoped>
/* 变量 */
:root { 
  --footer-height: 64px; 
  --header-height: 64px; 
}

/* 布局容器 */
#app { 
  min-height: 100vh; 
  display: flex; 
  flex-direction: column;
  background: var(--bg-main);
}

/* 固定顶部栏样式 - 自适应主题玻璃态 */
.app-fixed-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--header-height);
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-main);
  z-index: 1000;
  display: flex;
  align-items: center;
}

.app-fixed-header .inner {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.app-fixed-header .app-name { 
  font-size: 18px;
  margin: 0;
  color: var(--text-main);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.app-fixed-header .right { 
  display: flex; 
  align-items: center; 
  gap: .75rem; 
}

.username { 
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 头像样式 - AI 感强调 */
.avatar-header { 
  width: 40px; 
  height: 40px; 
  border-radius: 50%; 
  border: 2px solid var(--ai-main);
  background: var(--bg-card);
  cursor: pointer; 
  transition: box-shadow .2s, transform .2s, border-color .2s;
}

.avatar-header:hover { 
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
  transform: translateY(-2px);
  border-color: var(--ai-light);
}

/* 主题切换按钮 */
.theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid var(--border-main);
  color: var(--text-main);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: background-color 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: var(--bg-card);
  border-color: var(--ai-main);
  box-shadow: 0 0 0 4px var(--ai-bg);
  transform: rotate(20deg);
}

.theme-toggle:active {
  transform: rotate(20deg) scale(0.95);
}

.theme-toggle .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* 主内容偏移，避免被固定 header 遮挡 */
main { 
  flex: 1 1 auto; 
  padding-top: var(--header-height); 
  padding-bottom: calc(var(--footer-height) + 1rem); 
  box-sizing: border-box;
}

/* 固定底部导航 - 自适应主题风格 */
footer.bottom-nav { 
  position: fixed; 
  left: 0; 
  right: 0; 
  bottom: 0; 
  z-index: 999; 
  display: flex; 
  justify-content: space-around; 
  align-items: center; 
  height: var(--footer-height); 
  padding: 0 12px; 
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(12px);
  color: var(--text-main);
  border-top: 1px solid var(--border-main);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  padding-bottom: env(safe-area-inset-bottom, 0); 
}

.nav-item { 
  text-decoration: none; 
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: var(--ai-main);
  background: var(--ai-bg);
}
</style>
