// src/main.ts
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import pinia from "./store";
import "./assets/style.css";

const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount("#app");

// 调试：打印注册路由（此处应该能看到 /plan/:id/tasks）
console.log(
  "Registered routes:",
  router.getRoutes().map(r => ({ name: r.name, path: r.path }))
);
