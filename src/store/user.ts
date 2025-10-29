// src/store/user.ts
// 用户状态管理 - 处理用户认证、登录、注册和会话恢复

import { defineStore } from "pinia";
import { ref } from "vue";
import * as API from "@/services/api";

const APIAny = API as any;

/**
 * 用户 Store
 * 管理用户登录状态、token 和用户信息
 */
export const useUserStore = defineStore("user", () => {
  // ========== 状态 ==========
  
  /** 当前登录用户信息 */
  const user = ref<any>(JSON.parse(localStorage.getItem("user") || "null"));
  
  /** 认证令牌 */
  const token = ref<string | null>(localStorage.getItem("token"));

  // ========== 方法 ==========
  
  /**
   * 恢复用户会话
   * 优先从内存读取，其次从 localStorage，最后尝试调用后端
   * @returns 用户信息或 null
   */
  async function restore() {
    try {
      // 已有用户和 token，直接返回（避免重复请求）
      if (user.value && token.value) return user.value;

      // 获取 token
      const tk = token.value ?? localStorage.getItem("token");
      if (!tk) return null;

      // 优先从 localStorage 恢复用户信息
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

      // 如果已经有用户信息，直接返回
      if (user.value) return user.value;

      // 尝试调用后端获取用户信息（兼容多种 API 命名）
      const fn = APIAny.me || APIAny.getProfile || APIAny.fetchProfile;
      if (fn) {
        const resp = await fn(tk);
        user.value = resp?.user ?? resp ?? null;
        if (user.value) {
          // 同步到 localStorage
          localStorage.setItem("user", JSON.stringify(user.value));
          localStorage.setItem("token", tk);
        } else {
          // 后端返回空，清理本地数据
          token.value = null;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        return user.value;
      }

      // 无可用的后端接口，返回 null
      return null;
    } catch (e) {
      // 发生错误时清理所有数据
      token.value = null;
      user.value = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // eslint-disable-next-line no-console
      console.error("[user.store] restore error:", e);
      return null;
    }
  }

  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   * @returns 用户信息
   */
  async function login(username: string, password: string) {
    if (APIAny.login) {
      const res = await APIAny.login({ username, password });
      token.value = res?.token ?? res?.data?.token ?? null;
      user.value = res?.user ?? res?.data?.user ?? null;
    } else {
      // Fallback：Mock 登录
      token.value = "mock-token-123456";
      user.value = { id: Date.now(), username };
    }
    // 持久化到 localStorage
    if (token.value) localStorage.setItem("token", token.value);
    if (user.value) localStorage.setItem("user", JSON.stringify(user.value));
    return user.value;
  }

  /**
   * 用户注册
   * @param payload 注册信息（用户名、邮箱、密码）
   * @returns 用户信息
   */
  async function register(payload: any) {
    if (APIAny.register) {
      const res = await APIAny.register(payload);
      token.value = res?.token ?? res?.data?.token ?? null;
      user.value = res?.user ?? res?.data?.user ?? null;
    } else {
      // Fallback：Mock 注册
      token.value = "mock-token-123456";
      user.value = { id: Date.now(), username: payload.username };
    }
    // 持久化到 localStorage
    if (token.value) localStorage.setItem("token", token.value);
    if (user.value) localStorage.setItem("user", JSON.stringify(user.value));
    return user.value;
  }

  /**
   * 用户登出
   * 清除内存和本地存储的所有用户数据
   */
  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // ========== 导出 ==========
  
  return {
    user,
    token,
    restore,
    login,
    register,
    logout,
  };
});
