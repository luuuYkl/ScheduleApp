<template>
  <div id="app">
    <!-- 顶部导航 -->
    <header class="app-header">
      <nav class="container flex-between">
        <h1 class="logo">{{ APP_CONFIG.APP_NAME }}</h1>
        <div v-if="userStore.isLoggedIn" class="user-area">
          <span>👋 {{ userStore.user?.username }}</span>
          <button class="danger" @click="logout">退出</button>
        </div>
      </nav>
    </header>

    <!-- 路由页面 -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- 底部信息 -->
    <footer class="app-footer text-center">
      <small>
        {{ APP_CONFIG.APP_NAME }} — v{{ APP_CONFIG.APP_VERSION }}
      </small>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { APP_CONFIG } from "@/config";

const router = useRouter();
const userStore = useUserStore();

function logout() {
  userStore.logout();
  router.push("/login");
}
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg-light);
}

/* 顶部导航 */
.app-header {
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  padding: 0.75rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
}
.logo {
  font-size: 1.2rem;
  color: var(--color-primary);
  font-weight: 600;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.user-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 主内容 */
.app-main {
  flex: 1;
  padding: 1.5rem;
}

/* 底部 */
.app-footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 0.5rem 0;
  color: var(--color-gray);
}
</style>
