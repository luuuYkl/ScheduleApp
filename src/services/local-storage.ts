// src/services/local-storage.ts
// 本地 JSON 存储服务 - 提供统一的数据持久化接口
// 支持 Electron (fs) 和 Web (localStorage) 双环境

/** 存储数据版本号 - 用于数据迁移 */
const STORAGE_VERSION = 1;

/** 存储键前缀 - 避免与其他应用冲突 */
const STORAGE_PREFIX = "scheduleapp_";

/** 存储键常量 */
export const STORAGE_KEYS = {
  USERS: "users",
  PLANS: "plans",
  TASKS: "tasks",
  SCHEDULES: "schedules",
  STREAKS: "streaks",
  SETTINGS: "settings",
  LOGS_PREFIX: "logs_",
  REVIEWS_PREFIX: "reviews_",
} as const;

/** 带版本的数据结构 */
interface StorageData<T> {
  version: number;
  data: T;
  updatedAt: string;
}

/** 存储服务配置 */
interface StorageConfig {
  prefix: string;
  version: number;
}

/** 默认配置 */
const defaultConfig: StorageConfig = {
  prefix: STORAGE_PREFIX,
  version: STORAGE_VERSION,
};

/**
 * 本地存储服务类
 * 提供统一的 JSON 数据读写接口
 */
class LocalStorageService {
  private config: StorageConfig;
  private cache: Map<string, unknown> = new Map();
  private saveDebouncers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 生成完整的存储键名
   */
  private getKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  /**
   * 从 localStorage 读取数据
   */
  private readFromStorage<T>(key: string): StorageData<T> | null {
    try {
      const fullKey = this.getKey(key);
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as StorageData<T>;

      // 版本检查和迁移
      if (parsed.version !== this.config.version) {
        return this.migrateData(parsed);
      }

      return parsed;
    } catch (error) {
      console.warn(`[LocalStorage] 读取失败 (${key}):`, error);
      return null;
    }
  }

  /**
   * 写入数据到 localStorage
   */
  private writeToStorage<T>(key: string, data: T): boolean {
    try {
      const fullKey = this.getKey(key);
      const wrapped: StorageData<T> = {
        version: this.config.version,
        data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(fullKey, JSON.stringify(wrapped));
      return true;
    } catch (error) {
      console.error(`[LocalStorage] 写入失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 数据迁移处理
   */
  private migrateData<T>(oldData: StorageData<T>): StorageData<T> | null {
    // 目前版本为 1，无需迁移
    // 未来版本升级时可在此添加迁移逻辑
    console.log("[LocalStorage] 数据版本迁移:", oldData.version, "->", this.config.version);
    return {
      ...oldData,
      version: this.config.version,
    };
  }

  /**
   * 获取数据
   * @param key 存储键
   * @param defaultValue 默认值（可选）
   * @returns 数据或 null
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | null> {
    // 优先从缓存读取
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    const stored = this.readFromStorage<T>(key);
    if (stored) {
      this.cache.set(key, stored.data);
      return stored.data;
    }

    return defaultValue ?? null;
  }

  /**
   * 同步获取数据（用于非异步上下文）
   */
  getSync<T>(key: string, defaultValue?: T): T | null {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    const stored = this.readFromStorage<T>(key);
    if (stored) {
      this.cache.set(key, stored.data);
      return stored.data;
    }

    return defaultValue ?? null;
  }

  /**
   * 保存数据
   * @param key 存储键
   * @param value 数据值
   * @param debounce 是否防抖（默认 false）
   */
  async set<T>(key: string, value: T, debounce = false): Promise<void> {
    // 更新缓存
    this.cache.set(key, value);

    if (debounce) {
      // 防抖写入，避免频繁 IO
      this.debouncedSet(key, value);
    } else {
      this.writeToStorage(key, value);
    }
  }

  /**
   * 同步保存数据
   */
  setSync<T>(key: string, value: T): void {
    this.cache.set(key, value);
    this.writeToStorage(key, value);
  }

  /**
   * 防抖写入
   */
  private debouncedSet<T>(key: string, value: T): void {
    const existing = this.saveDebouncers.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timeoutId = setTimeout(() => {
      this.writeToStorage(key, value);
      this.saveDebouncers.delete(key);
    }, 300);

    this.saveDebouncers.set(key, timeoutId);
  }

  /**
   * 删除数据
   */
  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    const fullKey = this.getKey(key);
    localStorage.removeItem(fullKey);
  }

  /**
   * 检查数据是否存在
   */
  async has(key: string): Promise<boolean> {
    if (this.cache.has(key)) return true;
    const fullKey = this.getKey(key);
    return localStorage.getItem(fullKey) !== null;
  }

  /**
   * 清空所有应用数据
   */
  async clear(): Promise<void> {
    this.cache.clear();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.config.prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log("[LocalStorage] 已清空所有数据");
  }

  /**
   * 导出所有数据（用于备份）
   */
  async exportAll(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.config.prefix)) {
        const shortKey = key.replace(this.config.prefix, "");
        const data = this.readFromStorage(shortKey);
        if (data) {
          result[shortKey] = data.data;
        }
      }
    }

    return result;
  }

  /**
   * 导入数据（用于恢复）
   */
  async importAll(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
    console.log("[LocalStorage] 数据导入完成");
  }

  /**
   * 获取存储使用情况
   */
  getUsageInfo(): { used: number; quota: number; keys: number } {
    let used = 0;
    let keys = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.config.prefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
        keys++;
      }
    }

    // localStorage 通常限制 5MB
    const quota = 5 * 1024 * 1024;

    return {
      used: used * 2, // UTF-16 编码，每字符 2 字节
      quota,
      keys,
    };
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 强制保存所有待写入数据
   */
  flush(): void {
    this.saveDebouncers.forEach((timeoutId, key) => {
      clearTimeout(timeoutId);
      const value = this.cache.get(key);
      if (value !== undefined) {
        this.writeToStorage(key, value);
      }
    });
    this.saveDebouncers.clear();
  }
}

/** 导出单例实例 */
export const localStorageService = new LocalStorageService();

/** 便捷函数导出 */
export const getStorage = <T>(key: string, defaultValue?: T) =>
  localStorageService.get<T>(key, defaultValue);

export const setStorage = <T>(key: string, value: T, debounce = false) =>
  localStorageService.set<T>(key, value, debounce);

export const removeStorage = (key: string) =>
  localStorageService.remove(key);

export const hasStorage = (key: string) =>
  localStorageService.has(key);

export const clearStorage = () =>
  localStorageService.clear();

export const exportStorage = () =>
  localStorageService.exportAll();

export const importStorage = (data: Record<string, unknown>) =>
  localStorageService.importAll(data);

/** 同步版本便捷函数 */
export const getStorageSync = <T>(key: string, defaultValue?: T) =>
  localStorageService.getSync<T>(key, defaultValue);

export const setStorageSync = <T>(key: string, value: T) =>
  localStorageService.setSync<T>(key, value);