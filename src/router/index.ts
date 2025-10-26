import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/pages/Home/HomePage.vue";
import PlanCreatePage from "@/pages/Plan/PlanCreatePage.vue";
import PlanTasksPage from "@/pages/Plan/PlanTasksPage.vue";
import PlanCalendarPage from "@/pages/Plan/PlanCalendarPage.vue";
import LogPage from "@/pages/Log/LogPage.vue";
import TaskDetailPage from "@/pages/Task/TaskDetailPage.vue";
import LoginPage from "@/components/auth/LoginPage.vue";
import RegisterPage from "@/components/auth/RegisterPage.vue";
import { useUserStore } from "@/store/user";

const routes = [
  { path: "/", redirect: "/home" },
  { path: "/home", component: HomePage, meta: { requiresAuth: true } },
  { path: "/plan/create", component: PlanCreatePage, meta: { requiresAuth: true } },
  { path: "/plan/:id/tasks", component: PlanTasksPage, props: true, meta: { requiresAuth: true } },
  { path: "/plan/calendar/:id", component: PlanCalendarPage, props: true, meta: { requiresAuth: true } },
  { path: "/log", component: LogPage, meta: { requiresAuth: true } },
  { path: "/task/:id", component: TaskDetailPage, props: true, meta: { requiresAuth: true } },
  { path: "/login", component: LoginPage, meta: { showBottomNav: false } },
  { path: "/register", component: RegisterPage, meta: { showBottomNav: false } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const store = useUserStore();
  const token = store.token || localStorage.getItem("token");

  if (to.meta.requiresAuth && !token) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  return true;
});

export default router;
