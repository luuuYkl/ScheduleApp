// src/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";

// Arco Design Vue
import ArcoVue from "@arco-design/web-vue";
import "@arco-design/web-vue/dist/arco.css";

// 设计系统样式（按顺序导入：tokens → base → components）
import "./style.css";

// PC端响应式缩放
import { initResponsive } from "./utils/responsive";

// AI复盘定时任务
import { initAIReviewScheduler } from "./services/ai-review";

const app = createApp(App);

app.use(createPinia()); // 必须先注册 Pinia
app.use(router);
app.use(ArcoVue);

app.mount("#app");

// 初始化响应式缩放（在 app mount 后执行，确保 DOM 已渲染）
initResponsive();

// 初始化AI复盘定时任务（每日凌晨1点自动执行）
initAIReviewScheduler();

// 调试：打印注册路由（此处应该能看到 /plan/:id/tasks）
console.log(
  "Registered routes:",
  router.getRoutes().map((r) => ({ name: r.name, path: r.path })),
);
