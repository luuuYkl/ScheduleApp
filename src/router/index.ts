import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/pages/Home/HomePage.vue";
import PlanCreatePage from "@/pages/Plan/PlanCreatePage.vue";
import PlanOverviewPage from "@/pages/Plan/PlanOverviewPage.vue";
import DynamicCalendarPage from "@/pages/Calendar/DynamicCalendarPage.vue";
import PlanTasksPage from "@/pages/Plan/PlanTasksPage.vue";
import PlanCalendarPage from "@/pages/Plan/PlanCalendarPage.vue";
import LogPage from "@/pages/Log/LogPage.vue";
import TaskDetailPage from "@/pages/Task/TaskDetailPage.vue";
import TaskEditPage from "@/pages/Task/TaskEditPage.vue";
import TaskCreatePage from "@/pages/Task/TaskCreatePage.vue";
import LoginPage from "@/pages/Auth/LoginPage.vue";
import RegisterPage from "@/pages/Auth/RegisterPage.vue";
import SchedulePage from "@/pages/Schedule/SchedulePage.vue";
import ProfilePage from "@/pages/User/ProfilePage.vue";
import FocusPage from "@/pages/Focus/FocusPage.vue";
import { useUserStore } from "@/store/user";

const routes = [
  { path: "/", redirect: "/home" },
  { path: "/home", component: HomePage, meta: { requiresAuth: true } },
  { path: "/focus", component: FocusPage, meta: { requiresAuth: true, hideNav: true } },
  { path: "/plan", component: PlanOverviewPage, meta: { requiresAuth: true } },
  {
    path: "/plan/create",
    component: PlanCreatePage,
    meta: { requiresAuth: true },
  },
  {
    path: "/plan/:id/tasks",
    component: PlanTasksPage,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/calendar",
    component: DynamicCalendarPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/plan/calendar/:id",
    component: PlanCalendarPage,
    props: true,
    meta: { requiresAuth: true },
  },
  { path: "/log", component: LogPage, meta: { requiresAuth: true } },
  {
    path: "/task/create",
    component: TaskCreatePage,
    meta: { requiresAuth: true },
  },
  {
    path: "/task/:id",
    component: TaskDetailPage,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/task/:id/edit",
    component: TaskEditPage,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/user/profile",
    component: ProfilePage,
    meta: { requiresAuth: true },
  },
  { path: "/schedule", component: SchedulePage, meta: { requiresAuth: true } },
  { path: "/login", component: LoginPage, meta: { hideNav: true } },
  {
    path: "/register",
    component: RegisterPage,
    meta: { hideNav: true },
  },
];
const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from) => {
  const store = useUserStore();

  // 尝试恢复用户信息（从安全存储或后端）
  try {
    await store.restore();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[ROUTER] user restore failed:", e);
  }

  const token = store.token;

  // 需要认证但未登录 → 跳转登录页
  if (to.meta.requiresAuth && !token) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  // 已登录访问登录/注册页 → 跳转首页
  if ((to.path === "/login" || to.path === "/register") && token) {
    return { path: "/home" };
  }

  return true;
});

export default router;