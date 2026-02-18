// src/services/analytics.ts
// 埋点系统 - 用户行为数据收集和分析

/**
 * 事件类型枚举
 */
export enum EventType {
  // 激活类事件
  FIRST_TASK_COMPLETED = "first_task_completed",
  PLAN_CREATED = "plan_created",
  USER_REGISTERED = "user_registered",
  FIRST_LOGIN = "first_login",

  // 留存类事件
  DAILY_VISIT = "daily_visit",
  WEEKLY_VISIT = "weekly_visit",
  MONTHLY_VISIT = "monthly_visit",
  SESSION_START = "session_start",
  SESSION_END = "session_end",

  // 效率类事件
  TASK_COMPLETED = "task_completed",
  TASK_CREATED = "task_created",
  TASK_DELETED = "task_deleted",
  PLAN_PROGRESS_UPDATED = "plan_progress_updated",
  SCHEDULE_COMPLETED = "schedule_completed",

  // AI类事件
  AI_SUGGESTION_SHOWN = "ai_suggestion_shown",
  AI_SUGGESTION_ACCEPTED = "ai_suggestion_accepted",
  AI_SUGGESTION_REJECTED = "ai_suggestion_rejected",
  AI_OPTIMIZE_PLAN = "ai_optimize_plan",

  // 通知类事件
  NOTIFICATION_PERMISSION_GRANTED = "notification_permission_granted",
  NOTIFICATION_PERMISSION_DENIED = "notification_permission_denied",
  NOTIFICATION_CLICKED = "notification_clicked",
  REMINDER_TRIGGERED = "reminder_triggered",

  // UI交互事件
  PAGE_VIEW = "page_view",
  BUTTON_CLICK = "button_click",
  FORM_SUBMIT = "form_submit",
  NAVIGATION = "navigation",

  // 错误类事件
  ERROR_OCCURRED = "error_occurred",
  API_ERROR = "api_error",
}

/**
 * 事件属性接口
 */
export interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * 埋点配置接口
 */
export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  userId?: string;
  sessionId?: string;
  appVersion?: string;
  environment?: "development" | "production" | "test";
}

/**
 * 埋点事件数据结构
 */
export interface AnalyticsEvent {
  event: EventType;
  properties: EventProperties;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

/**
 * 埋点服务类
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: number | null = null;
  private readonly FLUSH_INTERVAL = 5000; // 5秒刷新间隔
  private readonly MAX_QUEUE_SIZE = 50;

  private constructor() {
    this.config = {
      enabled: true,
      debug: process.env.NODE_ENV === "development",
      appVersion: "1.0.0",
      environment:
        (process.env.NODE_ENV as "development" | "production" | "test") ||
        "development",
    };

    this.initializeSession();
    this.setupAutoTracking();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * 初始化会话
   */
  private initializeSession(): void {
    // 生成会话ID
    const sessionId = this.generateSessionId();
    this.config.sessionId = sessionId;

    // 从localStorage获取用户ID
    const storedUserId = localStorage.getItem("analytics_user_id");
    if (storedUserId) {
      this.config.userId = storedUserId;
    } else {
      const newUserId = this.generateUserId();
      this.config.userId = newUserId;
      localStorage.setItem("analytics_user_id", newUserId);
    }

    // 设置会话开始时间
    this.track(EventType.SESSION_START, {
      session_id: sessionId,
      user_id: this.config.userId,
    });
  }

  /**
   * 设置配置
   */
  public configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 设置用户ID
   */
  public setUserId(userId: string): void {
    this.config.userId = userId;
    localStorage.setItem("analytics_user_id", userId);
  }

  /**
   * 跟踪事件
   */
  public track(event: EventType, properties: EventProperties = {}): void {
    if (!this.config.enabled) {
      return;
    }

    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        app_version: this.config.appVersion,
        environment: this.config.environment,
        url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
      },
      timestamp: Date.now(),
      userId: this.config.userId,
      sessionId: this.config.sessionId,
    };

    // 添加到队列
    this.eventQueue.push(eventData);

    // 调试模式下立即输出
    if (this.config.debug) {
      console.log("[Analytics]", event, properties);
    }

    // 检查队列大小，必要时立即发送
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flushEvents();
    } else {
      // 设置延迟发送
      this.scheduleFlush();
    }
  }

  /**
   * 页面浏览跟踪
   */
  public pageView(pageName: string, properties: EventProperties = {}): void {
    this.track(EventType.PAGE_VIEW, {
      page_name: pageName,
      ...properties,
    });
  }

  /**
   * 按钮点击跟踪
   */
  public buttonClick(
    buttonName: string,
    properties: EventProperties = {},
  ): void {
    this.track(EventType.BUTTON_CLICK, {
      button_name: buttonName,
      ...properties,
    });
  }

  /**
   * 表单提交跟踪
   */
  public formSubmit(
    formName: string,
    success: boolean,
    properties: EventProperties = {},
  ): void {
    this.track(EventType.FORM_SUBMIT, {
      form_name: formName,
      success,
      ...properties,
    });
  }

  /**
   * 导航跟踪
   */
  public navigation(
    from: string,
    to: string,
    properties: EventProperties = {},
  ): void {
    this.track(EventType.NAVIGATION, {
      from_page: from,
      to_page: to,
      ...properties,
    });
  }

  /**
   * 错误跟踪
   */
  public trackError(error: Error, properties: EventProperties = {}): void {
    this.track(EventType.ERROR_OCCURRED, {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...properties,
    });
  }

  /**
   * API错误跟踪
   */
  public trackApiError(
    url: string,
    status: number,
    error: string,
    properties: EventProperties = {},
  ): void {
    this.track(EventType.API_ERROR, {
      api_url: url,
      status_code: status,
      error_message: error,
      ...properties,
    });
  }

  /**
   * 刷新事件队列
   */
  public flushEvents(): void {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // 发送到分析服务（这里可以替换为实际的分析平台API）
    this.sendEvents(eventsToSend);
  }

  /**
   * 发送事件到分析服务
   */
  private sendEvents(events: AnalyticsEvent[]): void {
    try {
      // 在实际应用中，这里应该发送到分析平台
      // 例如：Google Analytics, Mixpanel, 自建分析服务等

      if (this.config.debug) {
        console.log("[Analytics] Sending events:", events);
      }

      // 模拟发送到后端
      fetch("/api/analytics/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events,
          batch_timestamp: Date.now(),
        }),
      }).catch((error) => {
        console.warn("[Analytics] Failed to send events:", error);
        // 发送失败时重新加入队列
        this.eventQueue.unshift(...events);
      });
    } catch (error) {
      console.error("[Analytics] Error sending events:", error);
    }
  }

  /**
   * 设置自动跟踪
   */
  private setupAutoTracking(): void {
    // 页面可见性变化跟踪
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.track(EventType.SESSION_END);
      } else {
        this.track(EventType.SESSION_START);
      }
    });

    // 页面卸载时刷新事件
    window.addEventListener("beforeunload", () => {
      this.flushEvents();
    });

    // 每日访问跟踪
    this.setupDailyVisitTracking();
  }

  /**
   * 设置每日访问跟踪
   */
  private setupDailyVisitTracking(): void {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem("last_visit_date");

    if (lastVisit !== today) {
      this.track(EventType.DAILY_VISIT, {
        is_returning_user: !!lastVisit,
      });

      localStorage.setItem("last_visit_date", today);

      // 每周访问检查
      const lastWeeklyVisit = localStorage.getItem("last_weekly_visit");
      const currentWeek = this.getWeekNumber(new Date());

      if (!lastWeeklyVisit || parseInt(lastWeeklyVisit) !== currentWeek) {
        this.track(EventType.WEEKLY_VISIT);
        localStorage.setItem("last_weekly_visit", currentWeek.toString());
      }
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成用户ID
   */
  private generateUserId(): string {
    const existingId = localStorage.getItem("user_id");
    if (existingId) {
      return existingId;
    }

    const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("user_id", newId);
    return newId;
  }

  /**
   * 获取周数
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * 调度事件刷新
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = window.setTimeout(() => {
      this.flushEvents();
      this.flushTimer = null;
    }, this.FLUSH_INTERVAL);
  }

  /**
   * 获取当前配置
   */
  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * 获取队列大小
   */
  public getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * 清空事件队列
   */
  public clearQueue(): void {
    this.eventQueue = [];
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

/**
 * 便捷函数 - 获取埋点服务实例
 */
export const useAnalytics = (): AnalyticsService => {
  return AnalyticsService.getInstance();
};

/**
 * 默认配置
 */
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: true,
  debug: process.env.NODE_ENV === "development",
  appVersion: "1.0.0",
  environment:
    (process.env.NODE_ENV as "development" | "production" | "test") ||
    "development",
};
