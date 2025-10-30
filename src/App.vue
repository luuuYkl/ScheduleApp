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
import { computed } from "vue";
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

// 调试输出：在应用启动时打印本地存储的 token/user
// eslint-disable-next-line no-console
console.log("[APP] localStorage token:", localStorage.getItem("token"), "user:", localStorage.getItem("user"));
</script>

<style scoped>
/* 变量 */
:root { --footer-height: 64px; --header-height: 64px; }

/* 布局容器 */
#app { min-height: 100vh; display: flex; flex-direction: column; }

/* 固定顶部栏样式 */
.app-fixed-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--header-height);
  background: #ffffffcc;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid #e5e7eb;
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
.app-fixed-header .app-name { font-size: 1.25rem; margin: 0; }
.app-fixed-header .right { display: flex; align-items: center; gap: .75rem; }
.username { font-size: .9rem; color: var(--color-muted); }

/* 头像样式 */
.avatar-header { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--color-primary); background: #f3f4f6; cursor: pointer; transition: box-shadow .2s, transform .2s; }
.avatar-header:hover { box-shadow: 0 0 0 2px #2563eb44; transform: translateY(-2px); }

/* 主内容偏移，避免被固定 header 遮挡 */
main { flex: 1 1 auto; padding-top: var(--header-height); padding-bottom: calc(var(--footer-height) + 1rem); box-sizing: border-box; }

/* 固定底部导航 - 始终固定在视口底部 */
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
  background: var(--color-primary); 
  color: #fff; 
  box-shadow: 0 -4px 18px rgba(16,24,40,0.06); 
  padding-bottom: env(safe-area-inset-bottom, 0); 
}
.nav-item { text-decoration: none; color: #fff; font-weight: 600; }

/* 暗色主题适配 */
html.dark .app-fixed-header { background: #1f2937cc; border-bottom-color: #374151; }
html.dark .app-fixed-header .app-name { color: #f3f4f6; }
html.dark .username { color: #9ca3af; }
html.dark .avatar-header { background: #374151; border-color: #3b82f6; }
</style>
