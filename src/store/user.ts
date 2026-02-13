// src/store/user.ts
// 用户状态管理 - 处理用户认证、登录、注册和会话恢复

import { defineStore } from "pinia";
import { ref } from "vue";
import * as API from "@/services/api";
import {
  getSecureAuthJson,
  getSecureAuthValue,
  migrateLegacyAuthStorageIfNeeded,
  removeSecureAuthValue,
  setSecureAuthJson,
  setSecureAuthValue,
} from "@/services/secure-storage";

const APIAny = API as any;

/**
 * 用户 Store
 * 管理用户登录状态、token 和用户信息
 */
export const useUserStore = defineStore("user", () => {
  // ========== 状态 ==========
  
  /** 当前登录用户信息 */
  const user = ref<any>(null);
  
  /** 认证令牌 */
  const token = ref<string | null>(null);

  /** 主题模式：dark 或 light */
  const theme = ref<"dark" | "light">(
    (localStorage.getItem("theme") as "dark" | "light") || "dark"
  );

  async function hydrateAuthFromStorage() {
    await migrateLegacyAuthStorageIfNeeded();

    if (!token.value) {
      const tokenResult = await getSecureAuthValue("token");
      if (tokenResult.ok) token.value = tokenResult.data.value;
    }

    if (!user.value) {
      user.value = await getSecureAuthJson("user");
    }
  }

  async function persistAuth() {
    if (token.value) {
      await setSecureAuthValue("token", token.value);
    } else {
      await removeSecureAuthValue("token");
    }

    if (user.value) {
      await setSecureAuthJson("user", user.value);
    } else {
      await removeSecureAuthValue("user");
    }
  }

  // ========== 方法 ==========
  
  /**
   * 恢复用户会话
   * 优先从内存读取，其次从 Bridge 安全存储回填，最后尝试调用后端
   * @returns 用户信息或 null
   */
  async function restore() {
    try {
      // 已有用户和 token，直接返回（避免重复请求）
      if (user.value && token.value) return user.value;

      await hydrateAuthFromStorage();
      const tk = token.value;
      if (!tk) return null;

      if (user.value) return user.value;


      // 尝试调用后端获取用户信息（兼容多种 API 命名）
      const fn = APIAny.me || APIAny.getProfile || APIAny.fetchProfile;
      if (fn) {
        const resp = await fn(tk);
        user.value = resp?.user ?? resp ?? null;
        if (user.value) {
          // 同步到安全存储
          await persistAuth();
        } else {
          // 后端返回空，清理本地数据
          token.value = null;
          await persistAuth();
        }
        return user.value;
      }

      // 无可用的后端接口，返回 null
      return null;
    } catch (e) {
      // 发生错误时清理所有数据
      token.value = null;
      user.value = null;
      await persistAuth();
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
      // 正确调用签名 login(username, password)
      const res = await APIAny.login(username, password);
      // mockAPI 直接返回 User 对象
      if (res && typeof res === 'object' && 'id' in res) {
        token.value = res.token ?? null;
        user.value = res;
      } else {
        // 兼容后端返回 { user, token }
        token.value = res?.token ?? res?.data?.token ?? null;
        user.value = res?.user ?? res?.data?.user ?? null;
      }
    } else {
      // Fallback：Mock 登录
      token.value = "mock-token-123456";
      user.value = { id: Date.now(), username };
    }
    await persistAuth();
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
      if (res && typeof res === 'object' && 'id' in res) {
        token.value = res.token ?? null;
        user.value = res;
      } else {
        token.value = res?.token ?? res?.data?.token ?? null;
        user.value = res?.user ?? res?.data?.user ?? null;
      }
    } else {
      // Fallback：Mock 注册
      token.value = "mock-token-123456";
      user.value = { id: Date.now(), username: payload.username };
    }
    await persistAuth();
    return user.value;
  }

  /**
   * 用户登出
   * 清除内存和本地存储的所有用户数据
   */
  async function logout() {
    token.value = null;
    user.value = null;
    await persistAuth();
  }

  /**
   * 切换主题模式
   * @param newTheme 新的主题模式（可选，不指定则切换）
   */
  function toggleTheme(newTheme?: "dark" | "light") {
    if (newTheme) {
      theme.value = newTheme;
    } else {
      theme.value = theme.value === "dark" ? "light" : "dark";
    }
    // 持久化到 localStorage
    localStorage.setItem("theme", theme.value);
    // eslint-disable-next-line no-console
    console.log("[Theme] 切换到:", theme.value);
  }



  /**
   * 初始化主题
   * 在应用启动时调用，应用保存的主题设置
   */
  function initTheme() {
    const savedTheme = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    theme.value = savedTheme;
    // eslint-disable-next-line no-console
    console.log("[Theme] 初始化主题:", savedTheme);
  }

  // ========== 导出 ==========
  
  return {
    user,
    token,
    theme,
    restore,
    login,
    register,
    logout,
    toggleTheme,
    initTheme,
  };
});
