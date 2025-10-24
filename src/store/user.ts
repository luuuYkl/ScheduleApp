// src/store/user.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { API } from "@/services/api";
import type { User, RegisterPayload } from "@/services/api.types";

export const useUserStore = defineStore("user", () => {
  // 当前登录用户
  const user = ref<User | null>(null);

  // 登录 token
  const token = ref<string | null>(localStorage.getItem("token"));

  // 是否已登录
  const isLoggedIn = computed(() => !!token.value);

  /**
   * 保存认证状态
   */
  function setAuth(u: User) {
    user.value = u;
    if (u?.token) {
      token.value = u.token;
      localStorage.setItem("token", u.token);
    }
  }

  /**
   * 登录
   */
  async function login(username: string, password: string) {
    const u = await API.login(username, password);
    setAuth(u);
    return u;
  }

  /**
   * 注册
   */
  async function register(payload: RegisterPayload) {
    const u = await API.register(payload);
    setAuth(u);
    return u;
  }

  /**
   * 获取当前用户资料
   * 若后端 profile 接口不返回 token，不覆盖现有 token
   */
  async function fetchProfile() {
    const u = await API.fetchUser();
    user.value = { ...u, token: token.value ?? u.token };
  }

  /**
   * 登出
   */
  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem("token");
  }

  /**
   * 自动恢复会话
   * （在 App.vue 中调用）
   */
  async function restoreSession() {
    const t = localStorage.getItem("token");
    if (t && !user.value) {
      try {
        await fetchProfile();
      } catch {
        logout();
      }
    }
  }

  // ✅ 保留兼容别名（防止旧页面调用报错）
  const loginUser = login;
  const registerUser = register;

  return {
    user,
    token,
    isLoggedIn,
    login,
    register,
    loginUser,
    registerUser,
    fetchProfile,
    logout,
    restoreSession,
  };
});
