// src/store/user.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import * as API from "@/services/api";

const APIAny = API as any;

export const useUserStore = defineStore("user", () => {
  const user = ref<any>(JSON.parse(localStorage.getItem("user") || "null"));
  const token = ref<string | null>(localStorage.getItem("token"));

  // 恢复用户：从 localStorage 尝试恢复，若只有 token 则调用后端获取 profile
  async function restore() {
    try {
      // 已有 user 和 token，直接返回（避免重复请求）
      if (user.value && token.value) return user.value;

      // 若有 token，但 user 为空，尝试通过后端获取用户信息
      const tk = token.value ?? localStorage.getItem("token");
      if (!tk) return null;

      // 尝试从 localStorage 恢复用户信息
      const storedUser = localStorage.getItem("user");
      if (storedUser && !user.value) {
        try {
          user.value = JSON.parse(storedUser);
          token.value = tk;
          if (user.value) return user.value;
        } catch (e) {
          // JSON 解析失败，继续尝试后端
        }
      }

      // 如果已经有 user，直接返回
      if (user.value) return user.value;

      // 尝试常见的 profile 接口名
      const fn = APIAny.me || APIAny.getProfile || APIAny.fetchProfile;
      if (fn) {
        const resp = await fn(tk);
        user.value = resp?.user ?? resp ?? null;
        if (user.value) {
          // 同步 localStorage
          localStorage.setItem("user", JSON.stringify(user.value));
          localStorage.setItem("token", tk);
        } else {
          // 如果后端返回空，清理
          token.value = null;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        return user.value;
      }

      // 无后端 profile：回退为 null（不自动 mock 登录）
      return null;
    } catch (e) {
      // 发生错误时清理并返回 null
      token.value = null;
      user.value = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // eslint-disable-next-line no-console
      console.error("[user.store] restore error:", e);
      return null;
    }
  }

  async function login(username: string, password: string) {
    if (APIAny.login) {
      const res = await APIAny.login({ username, password });
      token.value = res?.token ?? res?.data?.token ?? null;
      user.value = res?.user ?? res?.data?.user ?? null;
    } else {
      token.value = "mock-token-123456";
      user.value = { id: Date.now(), username };
    }
    if (token.value) localStorage.setItem("token", token.value);
    if (user.value) localStorage.setItem("user", JSON.stringify(user.value));
    return user.value;
  }

  async function register(payload: any) {
    if (APIAny.register) {
      const res = await APIAny.register(payload);
      token.value = res?.token ?? res?.data?.token ?? null;
      user.value = res?.user ?? res?.data?.user ?? null;
    } else {
      token.value = "mock-token-123456";
      user.value = { id: Date.now(), username: payload.username };
    }
    if (token.value) localStorage.setItem("token", token.value);
    if (user.value) localStorage.setItem("user", JSON.stringify(user.value));
    return user.value;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  return {
    user,
    token,
    restore,
    login,
    register,
    logout,
  };
});
