// src/store/user.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import * as API from "@/services/api";

const APIAny = API as any;

export const useUserStore = defineStore("user", () => {
  // 从 localStorage 恢复
  const user = ref<any>(JSON.parse(localStorage.getItem("user") || "null"));
  const token = ref<string | null>(localStorage.getItem("token"));

  // 登录：优先使用后端 API，如无则使用简单 mock（便于本地开发）
  async function login(username: string, password: string) {
    if (APIAny.login) {
      const res = await APIAny.login({ username, password });
      token.value = res.token;
      user.value = res.user;
    } else {
      // mock 登录：接受任何账户
      token.value = "mock-token";
      user.value = { id: 1, username };
    }
    localStorage.setItem("token", token.value as string);
    localStorage.setItem("user", JSON.stringify(user.value));
    return user.value;
  }

  // 注册：优先调用后端 register 接口，否则 mock
  async function register(payload: { username: string; email?: string; password: string }) {
    if (APIAny.register) {
      const res = await APIAny.register(payload);
      token.value = res.token;
      user.value = res.user;
    } else {
      token.value = "mock-token";
      user.value = { id: Date.now(), username: payload.username, email: payload.email };
    }
    localStorage.setItem("token", token.value as string);
    localStorage.setItem("user", JSON.stringify(user.value));
    return user.value;
  }

  // 登出
  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  return {
    user,
    token,
    login,
    register,
    logout,
  };
});
