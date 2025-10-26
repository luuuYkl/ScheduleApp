// src/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";
import "./assets/style.css";

const app = createApp(App);

app.use(createPinia()); // 必须先注册 Pinia
app.use(router);

app.mount("#app");

// 调试：打印注册路由（此处应该能看到 /plan/:id/tasks）
console.log(
  "Registered routes:",
  router.getRoutes().map(r => ({ name: r.name, path: r.path }))
);
