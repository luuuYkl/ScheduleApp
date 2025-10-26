<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <header>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;">
        <h1>{{ APP_CONFIG.APP_NAME }}</h1>
        <div style="display:flex;align-items:center;gap:.75rem;">
          <div style="font-size:.9rem;color:var(--color-muted)">
            <span v-if="user?.username">已登录：{{ user.username }}</span>
            <span v-else>未登录</span>
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
/* 头像样式 */
.avatar-header {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #3b82f6;
  background: #f3f4f6;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.avatar-header:hover {
  box-shadow: 0 0 0 2px #2563eb44;
}
:root {
  --footer-height: 64px; /* 可根据需要调整 */
}

/* 容器布局：确保主内容占满剩余高度 */
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* 保证内容不会遮挡 footer（兼容 fixed footer） */
  box-sizing: border-box;
}

/* 顶部 header 固定样式 */
header {
  padding: 10px;
  text-align: center;
  background-color: #f5f5f5;
}

/* 主区域占据剩余空间，便于将 footer 保持在页面底部 */
main {
  flex: 1 1 auto;
  padding-bottom: calc(var(--footer-height) + env(safe-area-inset-bottom, 12px));
  box-sizing: border-box;
}

/* 底部导航的通用样式 */
/* 修改：footer 固定显示在视口底部，始终可见，不会被页面内容挤下去 */
footer.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: var(--footer-height);
  padding: 0 12px;
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 -4px 18px rgba(16,24,40,0.06);
  /* 兼容刘海屏安全区 */
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* 导航链接样式 */
.nav-item {
  text-decoration: none;
  color: white;
  font-weight: bold;
}

/* 小屏（移动端）：固定在视口底部，主区域增加底部内边距以避免遮挡 */
@media (max-width: 640px) {
  footer.bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: 0 -4px 18px rgba(16,24,40,0.06);
  }
  main {
    padding-bottom: calc(var(--footer-height) + 12px); /* 额外留白 */
  }
}

/* 中大屏（桌面）：footer 在文档流内，始终在页面底部（由于 main flex:1），适配更大视口 */
@media (min-width: 641px) {
  footer.bottom-nav {
    position: relative;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
}
</style>
