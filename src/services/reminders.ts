// src/services/reminders.ts
// 日内提醒策略服务 - 基于用户行为和任务状态的智能提醒

import {
  useNotification,
  NotificationOptions,
  ReminderConfig,
} from "./notification";
import { getUserSettingsSnapshot } from "@/composables/useUserSettings";
import type { Task } from "./api.types";

/**
 * 提醒类型枚举
 */
export enum ReminderType {
  TASK_DUE = "task_due", // 任务到期提醒
  DAILY_CHECKIN = "daily_checkin", // 每日签到提醒
  WEEKLY_REVIEW = "weekly_review", // 每周回顾提醒
  PLAN_PROGRESS = "plan_progress", // 计划进度提醒
}

/**
 * 用户活跃时间段配置
 */
export interface ActiveTimeConfig {
  morningStart: string; // 上午开始时间 (HH:mm)
  morningEnd: string; // 上午结束时间 (HH:mm)
  afternoonStart: string; // 下午开始时间 (HH:mm)
  afternoonEnd: string; // 下午结束时间 (HH:mm)
  eveningStart: string; // 晚上开始时间 (HH:mm)
  eveningEnd: string; // 晚上结束时间 (HH:mm)
}

/**
 * 提前提醒时间配置
 */
export interface AdvanceNoticeConfig {
  taskDue: number[]; // 任务到期前提醒时间（毫秒）[3600000, 86400000] 表示1小时和1天
  dailyCheckin: string; // 每日签到提醒时间 (HH:mm)
  weeklyReview: string; // 每周回顾提醒时间 (星期几 HH:mm)
  planProgress: number; // 计划进度阈值（百分比）
}

/**
 * 智能提醒服务类
 */
export class ReminderService {
  private static instance: ReminderService;
  private notificationService = useNotification();
  private activeTimes: ActiveTimeConfig = {
    morningStart: "08:00",
    morningEnd: "12:00",
    afternoonStart: "14:00",
    afternoonEnd: "18:00",
    eveningStart: "19:00",
    eveningEnd: "22:00",
  };

  private advanceNotice: AdvanceNoticeConfig = {
    taskDue: [3600000, 86400000], // 1小时和1天前提醒
    dailyCheckin: "20:00",
    weeklyReview: "Sunday 20:00",
    planProgress: 80,
  };

  private constructor() {
    // 初始化时同步用户设置
    this.syncWithUserSettings();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  /**
   * 从 useUserSettings 同步提醒配置
   * 应在设置变更后调用，以保持提醒行为与用户偏好一致
   */
  public syncWithUserSettings(): void {
    const settings = getUserSettingsSnapshot();

    // 同步提前提醒时间（将分钟转为毫秒）
    const advanceMs = settings.reminderAdvanceMinutes * 60 * 1000;
    this.advanceNotice.taskDue = [advanceMs];

    // 同步每日签到提醒时间
    if (settings.dailyCheckinTime) {
      this.advanceNotice.dailyCheckin = settings.dailyCheckinTime;
    }

    // 同步声音配置到 ReminderConfig 默认
    this._defaultSoundEnabled = settings.reminderSoundEnabled;

    // 根据开关状态决定是否启用签到/周回顾提醒
    this._dailyCheckinEnabled = settings.dailyCheckinEnabled;
    this._weeklyReviewEnabled = settings.weeklyReviewEnabled;
    this._reminderGlobalEnabled = settings.reminderEnabled;
  }

  /** 用户设置缓存 */
  private _defaultSoundEnabled = true;
  private _dailyCheckinEnabled = true;
  private _weeklyReviewEnabled = true;
  private _reminderGlobalEnabled = true;

  /**
   * 设置用户活跃时间段
   */
  public setActiveTimes(config: Partial<ActiveTimeConfig>): void {
    this.activeTimes = { ...this.activeTimes, ...config };
  }

  /**
   * 设置提前提醒配置
   */
  public setAdvanceNotice(config: Partial<AdvanceNoticeConfig>): void {
    this.advanceNotice = { ...this.advanceNotice, ...config };
  }

  /**
   * 为任务设置到期提醒
   */
  public scheduleTaskDueReminder(
    task: Task,
    config: ReminderConfig = {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
    },
  ): void {
    if (!task.task_date || !config.enabled) {
      return;
    }

    const dueDate = new Date(task.task_date);
    const taskId = `task_${task.id}`;

    // 为每个预设时间点创建提醒
    this.advanceNotice.taskDue.forEach((advanceTime, index) => {
      const reminderTime = new Date(dueDate.getTime() - advanceTime);

      if (reminderTime > new Date()) {
        const options: NotificationOptions = {
          title: "任务提醒",
          body: `任务 "${task.title}" 将在 ${this.formatTimeDiff(advanceTime)}后到期`,
          tag: taskId,
          requireInteraction: advanceTime <= 3600000, // 1小时内到期的重要提醒
        };

        this.notificationService.scheduleReminder(
          `${taskId}_advance_${index}`,
          reminderTime,
          options,
          config,
        );
      }
    });
  }

  /**
   * 为重复任务设置定期提醒
   */
  public scheduleRecurringTaskReminder(
    task: Task,
    config: ReminderConfig = {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
    },
  ): void {
    if (!task.repeat_type || task.repeat_type === "none" || !config.enabled) {
      return;
    }

    const today = new Date();
    const taskDate = new Date(task.task_date);

    // 如果是今天的任务，设置提醒
    if (taskDate.toDateString() === today.toDateString()) {
      const remindTime = this.getNextActiveTime(today);

      const options: NotificationOptions = {
        title: "今日任务提醒",
        body: `别忘了完成任务: ${task.title}`,
        tag: `recurring_${task.id}`,
      };

      this.notificationService.scheduleReminder(
        `recurring_${task.id}`,
        remindTime,
        options,
        config,
      );
    }
  }

  /**
   * 设置每日签到提醒
   */
  public scheduleDailyCheckinReminder(
    config?: ReminderConfig,
  ): void {
    const mergedConfig = this.mergeConfig(config);
    if (!mergedConfig.enabled || !this._dailyCheckinEnabled) {
      return;
    }

    const [hour, minute] = this.advanceNotice.dailyCheckin
      .split(":")
      .map(Number);
    const remindTime = this.getTodayTime(hour, minute);

    // 如果今天的时间已过，设置明天的提醒
    const now = new Date();
    if (remindTime <= now) {
      remindTime.setDate(remindTime.getDate() + 1);
    }

    const options: NotificationOptions = {
      title: "每日签到提醒",
      body: "记录今天的进步，完成你的日常任务吧！",
      tag: "daily_checkin",
    };

    this.notificationService.scheduleReminder(
      "daily_checkin",
      remindTime,
      options,
      config,
    );
  }

  /**
   * 设置每周回顾提醒
   */
  public scheduleWeeklyReviewReminder(
    config?: ReminderConfig,
  ): void {
    const mergedConfig = this.mergeConfig(config);
    if (!mergedConfig.enabled || !this._weeklyReviewEnabled) {
      return;
    }

    const [day, time] = this.advanceNotice.weeklyReview.split(" ");
    const [hour, minute] = time.split(":").map(Number);

    const remindTime = this.getNextWeekday(day as any, hour, minute);

    const options: NotificationOptions = {
      title: "每周回顾",
      body: "回顾本周进展，为下周制定更好的计划！",
      tag: "weekly_review",
      requireInteraction: true,
    };

    this.notificationService.scheduleReminder(
      "weekly_review",
      remindTime,
      options,
      config,
    );
  }

  /**
   * 根据计划进度设置提醒
   */
  public schedulePlanProgressReminder(
    plan: any,
    progress: number,
    config: ReminderConfig = {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
    },
  ): void {
    if (!config.enabled || progress < this.advanceNotice.planProgress) {
      return;
    }

    const options: NotificationOptions = {
      title: "计划进度提醒",
      body: `计划 "${plan.title}" 已完成 ${progress}%，继续保持！`,
      tag: `plan_${plan.id}_progress`,
    };

    // 立即显示进度提醒
    this.notificationService.showNotification(options);
  }

  /**
   * 清除特定任务的所有提醒
   */
  public clearTaskReminders(taskId: number): void {
    this.notificationService.clearReminder(`task_${taskId}`);
    this.notificationService.clearReminder(`recurring_${taskId}`);

    // 清除提前提醒
    for (let i = 0; i < this.advanceNotice.taskDue.length; i++) {
      this.notificationService.clearReminder(`task_${taskId}_advance_${i}`);
    }
  }

  /**
   * 清除所有提醒
   */
  public clearAllReminders(): void {
    this.notificationService.clearAllReminders();
  }

  /**
   * 获取下一个活跃时间段
   */
  private getNextActiveTime(baseTime: Date): Date {
    const currentTime = new Date(baseTime);
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    // 检查当前时间是否在活跃时段内
    if (this.isInActiveTime(timeStr)) {
      return new Date(currentTime.getTime() + 30 * 60000); // 30分钟后
    }

    // 找到下一个活跃时段
    const timeSlots = [
      {
        start: this.activeTimes.morningStart,
        end: this.activeTimes.morningEnd,
      },
      {
        start: this.activeTimes.afternoonStart,
        end: this.activeTimes.afternoonEnd,
      },
      {
        start: this.activeTimes.eveningStart,
        end: this.activeTimes.eveningEnd,
      },
    ];

    for (const slot of timeSlots) {
      if (timeStr < slot.start) {
        const [hour, minute] = slot.start.split(":").map(Number);
        return this.getTodayTime(hour, minute);
      }
    }

    // 如果当前时间晚于所有时段，设置明天的第一个时段
    const [hour, minute] = this.activeTimes.morningStart.split(":").map(Number);
    const nextDay = new Date(currentTime);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(hour, minute, 0, 0);
    return nextDay;
  }

  /**
   * 检查时间是否在活跃时段内
   */
  private isInActiveTime(time: string): boolean {
    return (
      (time >= this.activeTimes.morningStart &&
        time <= this.activeTimes.morningEnd) ||
      (time >= this.activeTimes.afternoonStart &&
        time <= this.activeTimes.afternoonEnd) ||
      (time >= this.activeTimes.eveningStart &&
        time <= this.activeTimes.eveningEnd)
    );
  }

  /**
   * 获取今天的指定时间
   */
  private getTodayTime(hour: number, minute: number): Date {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  /**
   * 获取下一个指定星期几的时间
   */
  private getNextWeekday(
    weekday:
      | "Monday"
      | "Tuesday"
      | "Wednesday"
      | "Thursday"
      | "Friday"
      | "Saturday"
      | "Sunday",
    hour: number,
    minute: number,
  ): Date {
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const targetDayIndex = weekdays.indexOf(weekday);
    const today = new Date();
    const currentDayIndex = today.getDay();

    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    targetDate.setHours(hour, minute, 0, 0);

    return targetDate;
  }

  /**
   * 合并用户设置到 ReminderConfig
   */
  private mergeConfig(config?: Partial<ReminderConfig>): ReminderConfig {
    return {
      enabled: this._reminderGlobalEnabled && (config?.enabled ?? true),
      soundEnabled: this._defaultSoundEnabled && (config?.soundEnabled ?? true),
      vibrationEnabled: config?.vibrationEnabled ?? true,
    };
  }

  /**
   * 格式化时间差为可读文本
   */
  private formatTimeDiff(milliseconds: number): string {
    const hours = Math.floor(milliseconds / 3600000);
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}天`;
    }
    if (hours >= 1) {
      return `${hours}小时`;
    }
    const minutes = Math.floor(milliseconds / 60000);
    return `${minutes}分钟`;
  }
}

/**
 * 便捷函数 - 获取提醒服务实例
 */
export const useReminders = (): ReminderService => {
  return ReminderService.getInstance();
};

/**
 * 默认活跃时间配置
 */
export const DEFAULT_ACTIVE_TIMES: ActiveTimeConfig = {
  morningStart: "08:00",
  morningEnd: "12:00",
  afternoonStart: "14:00",
  afternoonEnd: "18:00",
  eveningStart: "19:00",
  eveningEnd: "22:00",
};

/**
 * 默认提前提醒配置
 */
export const DEFAULT_ADVANCE_NOTICE: AdvanceNoticeConfig = {
  taskDue: [3600000, 86400000], // 1小时和1天
  dailyCheckin: "20:00",
  weeklyReview: "Sunday 20:00",
  planProgress: 80,
};
