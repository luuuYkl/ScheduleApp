// src/services/notification.ts
// 浏览器通知服务 - 提供系统级通知和提醒功能

/**
 * 通知选项接口
 */
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  timestamp?: number;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * 提醒配置接口
 */
export interface ReminderConfig {
  enabled: boolean;
  timeBefore?: number; // 提前多少毫秒提醒
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

/**
 * 浏览器通知服务类
 */
export class NotificationService {
  private static instance: NotificationService;
  private permissionGranted: boolean = false;
  private reminders: Map<string, number> = new Map(); // 存储定时器ID

  private constructor() {
    this.initialize();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * 初始化通知服务
   */
  private async initialize(): Promise<void> {
    if (!this.isSupported()) {
      console.warn("浏览器不支持通知功能");
      return;
    }

    // 检查当前权限状态
    if (Notification.permission === "granted") {
      this.permissionGranted = true;
    } else if (Notification.permission === "denied") {
      console.warn("用户已拒绝通知权限");
    }
  }

  /**
   * 检查浏览器是否支持通知
   */
  public isSupported(): boolean {
    return "Notification" in window;
  }

  /**
   * 请求通知权限
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    if (this.permissionGranted) {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === "granted";
      return this.permissionGranted;
    } catch (error) {
      console.error("请求通知权限失败:", error);
      return false;
    }
  }

  /**
   * 显示通知
   */
  public showNotification(options: NotificationOptions): void {
    if (!this.permissionGranted || !this.isSupported()) {
      console.warn("无法显示通知：权限未授予或不支持");
      return;
    }

    try {
      // 创建通知选项对象
      const notificationOptions: any = {
        body: options.body,
        icon: options.icon || "/favicon.ico",
      };

      // 可选参数
      if (options.tag) {
        notificationOptions.tag = options.tag;
      }
      if (options.requireInteraction) {
        notificationOptions.requireInteraction = options.requireInteraction;
      }

      const notification = new Notification(options.title, notificationOptions);

      // 添加点击事件处理
      notification.addEventListener("click", () => {
        // 聚焦到应用窗口
        window.focus();
        notification.close();
      });

      // 自动关闭（除非要求交互）
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000); // 5秒后自动关闭
      }
    } catch (error) {
      console.error("显示通知失败:", error);
    }
  }

  /**
   * 调度提醒
   */
  public scheduleReminder(
    id: string,
    time: Date,
    options: NotificationOptions,
    config: ReminderConfig = {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
    },
  ): void {
    if (!config.enabled) {
      return;
    }

    const now = new Date();
    const delay = time.getTime() - now.getTime();

    if (delay <= 0) {
      console.warn("提醒时间已过期");
      return;
    }

    // 清除已存在的相同提醒
    this.clearReminder(id);

    // 设置定时器
    const timerId = window.setTimeout(() => {
      this.showNotification(options);
      this.reminders.delete(id);

      // 触发回调（如果需要）
      this.triggerReminderCallback(id);
    }, delay);

    this.reminders.set(id, timerId);
    console.log(`提醒已调度: ${id} (${delay}ms后)`);
  }

  /**
   * 清除指定提醒
   */
  public clearReminder(id: string): void {
    const timerId = this.reminders.get(id);
    if (timerId) {
      clearTimeout(timerId);
      this.reminders.delete(id);
      console.log(`提醒已清除: ${id}`);
    }
  }

  /**
   * 清除所有提醒
   */
  public clearAllReminders(): void {
    this.reminders.forEach((timerId) => {
      clearTimeout(timerId);
    });
    this.reminders.clear();
    console.log("所有提醒已清除");
  }

  /**
   * 获取当前提醒数量
   */
  public getPendingRemindersCount(): number {
    return this.reminders.size;
  }

  /**
   * 检查是否有通知权限
   */
  public hasPermission(): boolean {
    return this.permissionGranted;
  }

  /**
   * 提醒回调触发器（可被扩展）
   */
  private triggerReminderCallback(id: string): void {
    // 可以在这里添加自定义回调逻辑
    console.log(`提醒触发: ${id}`);
  }
}

/**
 * 便捷函数 - 获取通知服务实例
 */
export const useNotification = (): NotificationService => {
  return NotificationService.getInstance();
};

/**
 * 默认提醒配置
 */
export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: true,
  timeBefore: 3600000, // 1小时前
  soundEnabled: true,
  vibrationEnabled: true,
};
