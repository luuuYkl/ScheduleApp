import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/pages/Home/HomePage.vue";
import PlanCreatePage from "@/pages/Plan/PlanCreatePage.vue";
import PlanOverviewPage from "@/pages/Plan/PlanOverviewPage.vue";
import DynamicCalendarPage from "@/pages/Calendar/DynamicCalendarPage.vue";
import PlanTasksPage from "@/pages/Plan/PlanTasksPage.vue";
import PlanCalendarPage from "@/pages/Plan/PlanCalendarPage.vue";
import LogPage from "@/pages/Log/LogPage.vue";
import TaskDetailPage from "@/pages/Task/TaskDetailPage.vue";
import TaskCreatePage from "@/pages/Task/TaskCreatePage.vue";
import LoginPage from "@/components/auth/LoginPage.vue";
import RegisterPage from "@/components/auth/RegisterPage.vue";
import SchedulePage from "@/pages/Schedule/SchedulePage.vue";
import ProfilePage from "@/pages/User/ProfilePage.vue";
import { useUserStore } from "@/store/user";

const routes = [
  { path: "/", redirect: "/home" },
  { path: "/home", component: HomePage, meta: { requiresAuth: true } },
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
    path: "/user/profile",
    component: ProfilePage,
    meta: { requiresAuth: true },
  },
  { path: "/schedule", component: SchedulePage, meta: { requiresAuth: true } },
  { path: "/login", component: LoginPage, meta: { showBottomNav: false } },
  {
    path: "/register",
    component: RegisterPage,
    meta: { showBottomNav: false },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from) => {
  try {
    const store = useUserStore();

    // 尝试恢复用户信息（从安全存储或后端）
    try {
      await store.restore();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[ROUTER] user restore failed:", e);
    }

    const token = store.token;
    const user = store.user;

    // 调试输出：路由目标 / token / user 状态
    // eslint-disable-next-line no-console
    console.log(
      `[ROUTER] to=${to.fullPath} requiresAuth=${!!to.meta.requiresAuth} token=${token ? "YES" : "NO"} user=${user ? "YES" : "NO"}`,
    );

    // 定义不需要认证的页面
    const publicPages = ["/login", "/register"];
    const isPublicPage = publicPages.includes(to.path);

    // 如果页面需要认证且用户未登录，重定向到登录页
    if (to.meta.requiresAuth && !token) {
      // eslint-disable-next-line no-console
      console.log(`[ROUTER] 未登录，重定向到登录页: ${to.fullPath}`);
      return { path: "/login", query: { redirect: to.fullPath } };
    }

    // 如果已登录用户访问登录/注册页，重定向到首页
    if (token && isPublicPage) {
      // eslint-disable-next-line no-console
      console.log(`[ROUTER] 已登录，重定向到首页`);
      return { path: "/home" };
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[ROUTER] guard error:", err);
    // 发生错误时，为了安全起见，重定向到登录页
    const publicPages = ["/login", "/register"];
    if (!publicPages.includes(to.path)) {
      return { path: "/login" };
    }
  }
  return true;
});

export default router;
