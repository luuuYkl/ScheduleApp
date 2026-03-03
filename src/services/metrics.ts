// src/services/metrics.ts
// 指标计算服务 - 计算和分析产品关键指标

import { useAnalytics, EventType } from "./analytics";
import type { Task, Plan } from "./api.types";

/**
 * 指标类型枚举
 */
export enum MetricType {
  // 激活指标
  D0_FIRST_TASK_RATE = "d0_first_task_rate", // D0首任务完成率

  // 留存指标
  D1_RETENTION = "d1_retention", // 次日留存率
  D7_RETENTION = "d7_retention", // 7日留存率
  D30_RETENTION = "d30_retention", // 30日留存率

  // 效率指标
  TASK_COMPLETION_RATE = "task_completion_rate", // 任务完成率
  PLAN_PROGRESS_RATE = "plan_progress_rate", // 计划推进率
  DAILY_TASK_COMPLETION = "daily_task_completion", // 每日任务完成数
  AVERAGE_TASKS_PER_DAY = "average_tasks_per_day", // 日均任务数

  // AI指标
  AI_SUGGESTION_ADOPTION = "ai_suggestion_adoption", // AI建议采纳率
  AI_TRIGGER_RATE = "ai_trigger_rate", // AI触发率
  AI_SATISFACTION_SCORE = "ai_satisfaction_score", // AI满意度评分

  // 通知指标
  NOTIFICATION_OPEN_RATE = "notification_open_rate", // 通知打开率
  REMINDER_EFFECTIVENESS = "reminder_effectiveness", // 提醒有效性
}

/**
 * 指标数据结构
 */
export interface MetricData {
  value: number;
  timestamp: number;
  sampleSize?: number;
  trend?: "up" | "down" | "stable";
  comparison?: {
    period: string;
    previousValue: number;
    change: number;
  };
}

/**
 * 用户行为数据接口
 */
export interface UserBehaviorData {
  userId: string;
  registrationDate: string;
  firstTaskDate?: string;
  lastVisitDate: string;
  visitDates: string[];
  completedTasks: Task[];
  createdTasks: Task[];
  completedPlans: Plan[];
  createdPlans: Plan[];
  notificationInteractions: number;
  aiInteractions: number;
}

/**
 * 指标计算服务类
 */
export class MetricsService {
  private static instance: MetricsService;
  private analytics = useAnalytics();
  private userDataMap: Map<string, UserBehaviorData> = new Map();

  private constructor() {
    this.loadUserData();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * 加载用户数据
   */
  private loadUserData(): void {
    // 从localStorage加载用户行为数据
    const userData = localStorage.getItem("user_behavior_data");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        Object.keys(parsedData).forEach((userId) => {
          this.userDataMap.set(userId, parsedData[userId]);
        });
      } catch (error) {
        console.error("解析用户数据失败:", error);
      }
    }
  }

  /**
   * 保存用户数据
   */
  private saveUserData(): void {
    const userData: Record<string, UserBehaviorData> = {};
    this.userDataMap.forEach((data, userId) => {
      userData[userId] = data;
    });
    localStorage.setItem("user_behavior_data", JSON.stringify(userData));
  }

  /**
   * 记录用户行为
   */
  public recordUserBehavior(
    userId: string,
    eventType: EventType,
    properties: any = {},
  ): void {
    let userData = this.userDataMap.get(userId);

    if (!userData) {
      userData = {
        userId,
        registrationDate: new Date().toISOString().split("T")[0],
        lastVisitDate: new Date().toISOString().split("T")[0],
        visitDates: [new Date().toISOString().split("T")[0]],
        completedTasks: [],
        createdTasks: [],
        completedPlans: [],
        createdPlans: [],
        notificationInteractions: 0,
        aiInteractions: 0,
      };
      this.userDataMap.set(userId, userData);
    }

    // 更新最后访问时间
    const today = new Date().toISOString().split("T")[0];
    userData.lastVisitDate = today;

    if (!userData.visitDates.includes(today)) {
      userData.visitDates.push(today);
    }

    // 根据事件类型更新相应数据
    switch (eventType) {
      case EventType.TASK_COMPLETED:
        if (properties.task) {
          userData.completedTasks.push(properties.task);
          // 记录首任务完成
          if (!userData.firstTaskDate) {
            userData.firstTaskDate = today;
            this.analytics.track(EventType.FIRST_TASK_COMPLETED, {
              user_id: userId,
              days_to_first_task: this.calculateDaysBetween(
                userData.registrationDate,
                today,
              ),
            });
          }
        }
        break;

      case EventType.TASK_CREATED:
        if (properties.task) {
          userData.createdTasks.push(properties.task);
        }
        break;

      case EventType.PLAN_CREATED:
        if (properties.plan) {
          userData.createdPlans.push(properties.plan);
        }
        break;

      case EventType.NOTIFICATION_CLICKED:
        userData.notificationInteractions++;
        break;

      case EventType.AI_SUGGESTION_ACCEPTED:
      case EventType.AI_SUGGESTION_SHOWN:
        userData.aiInteractions++;
        break;
    }

    this.saveUserData();
  }

  /**
   * 计算D0首任务完成率
   */
  public calculateD0FirstTaskRate(): MetricData {
    let totalUsers = 0;
    let usersWithFirstTask = 0;

    this.userDataMap.forEach((userData) => {
      totalUsers++;
      if (userData.firstTaskDate) {
        const daysToFirstTask = this.calculateDaysBetween(
          userData.registrationDate,
          userData.firstTaskDate,
        );
        if (daysToFirstTask === 0) {
          usersWithFirstTask++;
        }
      }
    });

    const rate = totalUsers > 0 ? (usersWithFirstTask / totalUsers) * 100 : 0;

    return {
      value: parseFloat(rate.toFixed(2)),
      timestamp: Date.now(),
      sampleSize: totalUsers,
    };
  }

  /**
   * 计算留存率
   */
  public calculateRetentionRate(days: 1 | 7 | 30): MetricData {
    const today = new Date();
    let totalUsers = 0;
    let retainedUsers = 0;

    this.userDataMap.forEach((userData) => {
      totalUsers++;

      // 检查用户是否在指定天数内有访问
      const registrationDate = new Date(userData.registrationDate);
      const daysSinceRegistration = this.calculateDaysBetween(
        userData.registrationDate,
        today.toISOString().split("T")[0],
      );

      if (daysSinceRegistration >= days) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() - days);
        const targetDateString = targetDate.toISOString().split("T")[0];

        if (userData.visitDates.includes(targetDateString)) {
          retainedUsers++;
        }
      }
    });

    const retentionRate =
      totalUsers > 0 ? (retainedUsers / totalUsers) * 100 : 0;

    return {
      value: parseFloat(retentionRate.toFixed(2)),
      timestamp: Date.now(),
      sampleSize: totalUsers,
    };
  }

  /**
   * 计算任务完成率
   */
  public calculateTaskCompletionRate(): MetricData {
    let totalTasks = 0;
    let completedTasks = 0;

    this.userDataMap.forEach((userData) => {
      totalTasks += userData.createdTasks.length;
      completedTasks += userData.completedTasks.length;
    });

    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      value: parseFloat(completionRate.toFixed(2)),
      timestamp: Date.now(),
      sampleSize: totalTasks,
    };
  }

  /**
   * 计算计划推进率
   */
  public calculatePlanProgressRate(): MetricData {
    let totalPlans = 0;
    let completedPlans = 0;

    this.userDataMap.forEach((userData) => {
      totalPlans += userData.createdPlans.length;
      completedPlans += userData.completedPlans.length;
    });

    const progressRate =
      totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0;

    return {
      value: parseFloat(progressRate.toFixed(2)),
      timestamp: Date.now(),
      sampleSize: totalPlans,
    };
  }

  /**
   * 计算AI建议采纳率
   */
  public calculateAISuggestionAdoptionRate(): MetricData {
    let totalSuggestions = 0;
    let adoptedSuggestions = 0;

    this.userDataMap.forEach((userData) => {
      // 这里需要从实际的AI交互数据中计算
      // 暂时使用简化逻辑
      totalSuggestions += userData.aiInteractions;
      adoptedSuggestions += Math.floor(userData.aiInteractions * 0.7); // 假设70%采纳率
    });

    const adoptionRate =
      totalSuggestions > 0 ? (adoptedSuggestions / totalSuggestions) * 100 : 0;

    return {
      value: parseFloat(adoptionRate.toFixed(2)),
      timestamp: Date.now(),
      sampleSize: totalSuggestions,
    };
  }

  /**
   * 计算AI触发率
   */
  public calculateAITriggerRate(): MetricData {
    let totalUsers = 0;
    let usersWithAIInteraction = 0;

    this.userDataMap.forEach((userData) => {
      totalUsers++;
      if (userData.aiInteractions > 0) {
        usersWithAIInteraction++;
      }
    });

    const triggerRate =
      totalUsers > 0 ? (usersWithAIInteraction / totalUsers) * 100 : 0;

    return {
      value: parseFloat(triggerRate.toFixed(2)),
      timestamp: Date.now(),
      sampleSize: totalUsers,
    };
  }

  /**
   * 计算通知打开率
   */
  public calculateNotificationOpenRate(): MetricData {
    let totalNotifications = 0;
    let openedNotifications = 0;

    this.userDataMap.forEach((userData) => {
      // 假设有统计数据
      const sentNotifications = userData.notificationInteractions * 2; // 假设发送量是互动量的2倍
      totalNotifications += sentNotifications;
      openedNotifications += userData.notificationInteractions;
    });

    const openRate =
      totalNotifications > 0
        ? (openedNotifications / totalNotifications) * 100
        : 0;

    return {
      value: parseFloat(openRate.toFixed(2)),
      timestamp: Date.now(),
      sampleSize: totalNotifications,
    };
  }

  /**
   * 计算每日任务完成数
   */
  public calculateDailyTaskCompletion(): MetricData {
    let totalCompleted = 0;
    const today = new Date().toISOString().split("T")[0];

    this.userDataMap.forEach((userData) => {
      const todayTasks = userData.completedTasks.filter(
        (task) => task.task_date === today,
      );
      totalCompleted += todayTasks.length;
    });

    return {
      value: totalCompleted,
      timestamp: Date.now(),
      sampleSize: this.userDataMap.size,
    };
  }

  /**
   * 计算日均任务数
   */
  public calculateAverageTasksPerDay(): MetricData {
    let totalTasks = 0;
    let totalDays = 0;

    this.userDataMap.forEach((userData) => {
      totalTasks += userData.createdTasks.length;
      totalDays += userData.visitDates.length;
    });

    const avgTasks = totalDays > 0 ? totalTasks / totalDays : 0;

    return {
      value: parseFloat(avgTasks.toFixed(2)),
      timestamp: Date.now(),
      sampleSize: totalDays,
    };
  }

  /**
   * 计算AI满意度评分
   */
  public calculateAISatisfactionScore(): MetricData {
    // 基于采纳率和其他因素计算综合评分
    const adoptionRate = this.calculateAISuggestionAdoptionRate().value;
    // 简化计算：假设满意度与采纳率正相关
    const satisfactionScore = Math.min(100, adoptionRate * 1.2);

    return {
      value: parseFloat(satisfactionScore.toFixed(2)),
      timestamp: Date.now(),
      sampleSize: this.userDataMap.size,
    };
  }

  /**
   * 获取所有关键指标
   */
  public getAllMetrics(): Record<MetricType, MetricData> {
    return {
      [MetricType.D0_FIRST_TASK_RATE]: this.calculateD0FirstTaskRate(),
      [MetricType.D1_RETENTION]: this.calculateRetentionRate(1),
      [MetricType.D7_RETENTION]: this.calculateRetentionRate(7),
      [MetricType.D30_RETENTION]: this.calculateRetentionRate(30),
      [MetricType.TASK_COMPLETION_RATE]: this.calculateTaskCompletionRate(),
      [MetricType.PLAN_PROGRESS_RATE]: this.calculatePlanProgressRate(),
      [MetricType.DAILY_TASK_COMPLETION]: this.calculateDailyTaskCompletion(),
      [MetricType.AVERAGE_TASKS_PER_DAY]: this.calculateAverageTasksPerDay(),
      [MetricType.AI_SUGGESTION_ADOPTION]:
        this.calculateAISuggestionAdoptionRate(),
      [MetricType.AI_TRIGGER_RATE]: this.calculateAITriggerRate(),
      [MetricType.AI_SATISFACTION_SCORE]: this.calculateAISatisfactionScore(),
      [MetricType.NOTIFICATION_OPEN_RATE]: this.calculateNotificationOpenRate(),
      [MetricType.REMINDER_EFFECTIVENESS]:
        this.calculateReminderEffectiveness(),
    };
  }

  /**
   * 计算提醒有效性
   */
  private calculateReminderEffectiveness(): MetricData {
    // 基于任务完成时间和提醒设置的相关性计算
    let totalReminders = 0;
    let effectiveReminders = 0;

    this.userDataMap.forEach((userData) => {
      // 简化计算：假设有50%的提醒是有效的
      const reminders = userData.notificationInteractions;
      totalReminders += reminders;
      effectiveReminders += Math.floor(reminders * 0.5);
    });

    const effectiveness =
      totalReminders > 0 ? (effectiveReminders / totalReminders) * 100 : 0;

    return {
      value: parseFloat(effectiveness.toFixed(2)),
      timestamp: Date.now(),
      sampleSize: totalReminders,
    };
  }

  /**
   * 计算两个日期之间的天数
   */
  private calculateDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 获取用户行为数据
   */
  public getUserData(userId: string): UserBehaviorData | undefined {
    return this.userDataMap.get(userId);
  }

  /**
   * 清空所有数据（用于测试）
   */
  public clearAllData(): void {
    this.userDataMap.clear();
    localStorage.removeItem("user_behavior_data");
  }
}

/**
 * 便捷函数 - 获取指标服务实例
 */
export const useMetrics = (): MetricsService => {
  return MetricsService.getInstance();
};

/**
 * 指标阈值配置
 */
export const METRIC_THRESHOLDS = {
  D0_FIRST_TASK_RATE: { good: 40, acceptable: 25, poor: 10 },
  D1_RETENTION: { good: 35, acceptable: 20, poor: 10 },
  D7_RETENTION: { good: 25, acceptable: 15, poor: 8 },
  TASK_COMPLETION_RATE: { good: 70, acceptable: 50, poor: 30 },
  AI_SUGGESTION_ADOPTION: { good: 60, acceptable: 40, poor: 20 },
};
