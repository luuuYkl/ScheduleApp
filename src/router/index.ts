// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "@/pages/Auth/LoginPage.vue";
import RegisterPage from "@/pages/Auth/RegisterPage.vue";
import HomePage from "@/pages/Home/HomePage.vue";
import PlanCreatePage from "@/pages/Plan/PlanCreatePage.vue";
import TaskDetailPage from "@/pages/Task/TaskDetailPage.vue";
import LogPage from "@/pages/Log/LogPage.vue";
import { useUserStore } from "@/store/user";

const routes = [
  { path: "/", redirect: "/login" },

  { path: "/login", component: LoginPage, meta: { guestOnly: true } },
  { path: "/register", component: RegisterPage, meta: { guestOnly: true } },

  { path: "/home", component: HomePage, meta: { requiresAuth: true } },

  // 计划创建/编辑（用 ?edit=ID 方式）
  { path: "/plan/create", component: PlanCreatePage, meta: { requiresAuth: true } },

  // ✅ 关键：计划→任务管理页（必须存在）
  {
    name: "plan-tasks",
    path: "/plan/:id/tasks",
    component: () => import("@/pages/Plan/PlanTasksPage.vue"),
    props: true,
    meta: { requiresAuth: true },
  },

  { path: "/task/:id", component: TaskDetailPage, props: true, meta: { requiresAuth: true } },
  { path: "/log", component: LogPage, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(), // 如果你站点有子目录，改成 createWebHistory('/子目录/')
  routes,
});

router.beforeEach((to) => {
  const store = useUserStore();
  const token = store.token || localStorage.getItem("token");

  if (to.meta.requiresAuth && !token) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && token) {
    return { path: "/home" };
  }
  return true;
});

export default router;
