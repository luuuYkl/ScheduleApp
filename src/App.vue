<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <header>
      <h1>{{ APP_CONFIG.APP_NAME }}</h1>
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
import { computed } from "vue";  // <!-- 导入 computed -->
import { useUserStore } from "@/store/user";
import { APP_CONFIG } from "@/config";
import { useRoute } from "vue-router";

// 计算属性：判断是否显示底部导航栏
const route = useRoute();
const showBottomNav = computed(() => route.meta.showBottomNav ?? true);
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
header {
  padding: 10px;
  text-align: center;
  background-color: #f5f5f5;
}
footer {
  display: flex;
  justify-content: space-around;
  padding: 10px;
  background-color: #3b82f6;
}
.nav-item {
  text-decoration: none;
  color: white;
  font-weight: bold;
}
</style>
