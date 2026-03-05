/**
 * Electron 后台定时任务服务
 * 负责在主进程中执行定时任务，即使窗口关闭也能运行
 */
import { BrowserWindow, Notification } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// ============ 类型定义 ============

export interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string; // cron表达式或简单时间格式
  handler: string; // 处理函数名称
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface AIReviewResult {
  period: 'today' | 'week' | 'month';
  summary: string;
  insights: string[];
  suggestions: string[];
  metrics: {
    completion_rate: number;
    productivity_score: number;
    consistency_score: number;
  };
  generated_at: string;
}

export interface SchedulerConfig {
  apiBaseUrl: string; // 后端API地址（后续接入）
  useLocalExecution: boolean; // 是否本地执行（无服务器时）
}

// ============ 配置 ============

const DEFAULT_CONFIG: SchedulerConfig = {
  apiBaseUrl: 'https://api.example.com', // 后续替换为实际服务器
  useLocalExecution: true, // 默认使用本地执行
};

// ============ 定时任务服务类 ============

class SchedulerService {
  private static instance: SchedulerService;
  private config: SchedulerConfig;
  private tasks: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private mainWindow: BrowserWindow | null = null;
  private storagePath: string;

  private constructor() {
    this.config = DEFAULT_CONFIG;
    this.storagePath = path.join(app.getPath('userData'), 'scheduler-data.json');
    this.loadTasks();
  }

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * 设置主窗口引用（用于发送消息给渲染进程）
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveTasks();
  }

  /**
   * 加载任务配置
   */
  private loadTasks(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
        if (data.tasks) {
          data.tasks.forEach((task: ScheduledTask) => {
            this.tasks.set(task.id, task);
          });
        }
        if (data.config) {
          this.config = { ...this.config, ...data.config };
        }
      }
    } catch (error) {
      console.error('[Scheduler] 加载任务配置失败:', error);
    }

    // 确保有默认的AI复盘任务
    if (!this.tasks.has('ai-daily-review')) {
      this.tasks.set('ai-daily-review', {
        id: 'ai-daily-review',
        name: 'AI每日复盘',
        cronExpression: '0 1 * * *', // 每天凌晨1点
        handler: 'executeAIReview',
        enabled: true,
      });
    }
  }

  /**
   * 保存任务配置
   */
  private saveTasks(): void {
    try {
      const data = {
        tasks: Array.from(this.tasks.values()),
        config: this.config,
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('[Scheduler] 保存任务配置失败:', error);
    }
  }

  /**
   * 启动所有定时任务
   */
  public startAll(): void {
    console.log('[Scheduler] 启动所有定时任务...');
    
    this.tasks.forEach((task, id) => {
      if (task.enabled) {
        this.scheduleTask(id);
      }
    });
  }

  /**
   * 停止所有定时任务
   */
  public stopAll(): void {
    console.log('[Scheduler] 停止所有定时任务...');
    
    this.timers.forEach((timer, id) => {
      clearTimeout(timer);
      this.timers.delete(id);
    });
  }

  /**
   * 调度单个任务
   */
  private scheduleTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // 清除现有定时器
    if (this.timers.has(taskId)) {
      clearTimeout(this.timers.get(taskId)!);
    }

    const delay = this.getNextRunDelay(task.cronExpression);
    task.nextRun = new Date(Date.now() + delay).toISOString();
    this.saveTasks();

    console.log(`[Scheduler] 任务 "${task.name}" 将在 ${Math.round(delay / 1000 / 60)} 分钟后执行`);

    const timer = setTimeout(() => {
      this.executeTask(taskId);
    }, delay);

    this.timers.set(taskId, timer);
  }

  /**
   * 计算下次执行的延迟时间（毫秒）
   */
  private getNextRunDelay(cronExpression: string): number {
    // 简单解析：支持 "分 时 * * *" 格式
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) {
      console.error('[Scheduler] 无效的cron表达式:', cronExpression);
      return 24 * 60 * 60 * 1000; // 默认24小时
    }

    const [minute, hour] = parts;
    const now = new Date();
    const target = new Date();

    target.setHours(parseInt(hour), parseInt(minute), 0, 0);

    // 如果目标时间已过，设置为明天
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return target.getTime() - now.getTime();
  }

  /**
   * 执行任务
   */
  private async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    console.log(`[Scheduler] 开始执行任务: ${task.name}`);
    task.lastRun = new Date().toISOString();

    try {
      switch (task.handler) {
        case 'executeAIReview':
          await this.executeAIReview();
          break;
        default:
          console.warn('[Scheduler] 未知的任务处理器:', task.handler);
      }
    } catch (error) {
      console.error(`[Scheduler] 任务执行失败: ${task.name}`, error);
    }

    // 重新调度
    this.scheduleTask(taskId);
  }

  /**
   * 执行AI复盘
   */
  private async executeAIReview(): Promise<void> {
    console.log('[Scheduler] 执行AI复盘...');

    try {
      // 读取用户数据
      const userDataPath = path.join(app.getPath('userData'), 'user-data.json');
      let tasks: any[] = [];
      let schedules: any[] = [];
      let userId = 1;

      if (fs.existsSync(userDataPath)) {
        try {
          const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
          tasks = userData.tasks || [];
          schedules = userData.schedules || [];
          userId = userData.userId || 1;
        } catch (e) {
          console.error('[Scheduler] 解析用户数据失败:', e);
        }
      }

      // 选择执行方式：本地或服务器
      if (this.config.useLocalExecution) {
        await this.executeLocalAIReview(tasks, schedules, userId);
      } else {
        await this.executeServerAIReview(tasks, schedules, userId);
      }

    } catch (error) {
      console.error('[Scheduler] AI复盘执行失败:', error);
    }
  }

  /**
   * 本地执行AI复盘（调用DeepSeek API）
   */
  private async executeLocalAIReview(
    tasks: any[],
    schedules: any[],
    userId: number
  ): Promise<void> {
    const apiKey = process.env.VITE_OPENAI_API_KEY || '';
    
    if (!apiKey) {
      console.warn('[Scheduler] API Key未配置，使用Mock数据');
      this.saveAIReviewResult(this.generateMockReview());
      return;
    }

    try {
      // 过滤今日数据
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      
      const todayTasks = tasks.filter(t => t.task_date === todayStr);
      const todaySchedules = schedules.filter(s => s.date === todayStr);

      // 计算指标
      const metrics = this.calculateMetrics(todayTasks, todaySchedules);

      // 构建提示词
      const prompt = this.buildAIPrompt(todayTasks, todaySchedules, metrics);

      // 调用DeepSeek API
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的生产力顾问，善于分析用户的任务完成情况并提供建设性的建议。',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // 解析响应
      const review = this.parseAIResponse(content, metrics);
      this.saveAIReviewResult(review);

      // 发送通知
      this.sendNotification('📊 每日复盘已完成', review.summary);

      // 通知渲染进程
      this.notifyRenderer('ai-review-complete', review);

    } catch (error) {
      console.error('[Scheduler] 本地AI复盘失败:', error);
      this.saveAIReviewResult(this.generateMockReview());
    }
  }

  /**
   * 服务器执行AI复盘（预留接口）
   */
  private async executeServerAIReview(
    tasks: any[],
    schedules: any[],
    userId: number
  ): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/ai-review/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 后续添加认证token
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          period: 'today',
          tasks,
          schedules,
        }),
      });

      if (!response.ok) {
        throw new Error(`服务器错误: ${response.status}`);
      }

      const review = await response.json();
      this.saveAIReviewResult(review);

      // 发送通知
      this.sendNotification('📊 每日复盘已完成', review.summary);

      // 通知渲染进程
      this.notifyRenderer('ai-review-complete', review);

    } catch (error) {
      console.error('[Scheduler] 服务器AI复盘失败:', error);
      // 降级到本地执行
      console.log('[Scheduler] 降级到本地执行...');
      await this.executeLocalAIReview(tasks, schedules, userId);
    }
  }

  /**
   * 计算复盘指标
   */
  private calculateMetrics(tasks: any[], schedules: any[]): AIReviewResult['metrics'] {
    const tasksDone = tasks.filter(t => t.status === 'done').length;
    const tasksTotal = tasks.length;
    const schedulesDone = schedules.filter(s => s.completed).length;
    const schedulesTotal = schedules.length;

    const totalItems = tasksTotal + schedulesTotal;
    const totalDone = tasksDone + schedulesDone;

    const completion_rate = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;
    const productivity_score = Math.min(100, Math.round(completion_rate * (0.5 + tasksTotal / 20)));
    const consistency_score = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

    return { completion_rate, productivity_score, consistency_score };
  }

  /**
   * 构建AI提示词
   */
  private buildAIPrompt(
    tasks: any[],
    schedules: any[],
    metrics: AIReviewResult['metrics']
  ): string {
    const tasksList = tasks
      .map(t => `- ${t.title} (状态: ${t.status === 'done' ? '✓已完成' : '✗未完成'})`)
      .join('\n');

    const schedulesList = schedules
      .map(s => `- ${s.title} (状态: ${s.completed ? '✓已完成' : '✗未完成'})`)
      .join('\n');

    return `请为用户生成一份今天的工作和生活复盘总结。

【完成指标】
- 完成率: ${metrics.completion_rate}%
- 生产力评分: ${metrics.productivity_score}/100
- 坚持度评分: ${metrics.consistency_score}/100

【任务完成情况】
${tasksList || '暂无任务'}

【日程完成情况】
${schedulesList || '暂无日程'}

请提供：
1. 一段简洁的总结（2-3句）
2. 3个关键洞察
3. 3个改进建议

格式要求：返回 JSON 格式，包含 summary, insights (数组), suggestions (数组) 三个字段`;
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(
    content: string,
    metrics: AIReviewResult['metrics']
  ): AIReviewResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          period: 'today',
          summary: parsed.summary || '无法生成总结',
          insights: Array.isArray(parsed.insights) ? parsed.insights : [],
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
          metrics,
          generated_at: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error('[Scheduler] 解析AI响应失败:', e);
    }

    return {
      period: 'today',
      summary: content,
      insights: [],
      suggestions: [],
      metrics,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * 生成Mock复盘结果
   */
  private generateMockReview(): AIReviewResult {
    return {
      period: 'today',
      summary: '今天你完成了大部分任务，表现出色。继续保持这样的势头，相信你能达到更多目标。',
      insights: [
        '你的时间管理能力逐渐提升，任务完成率达到了新的高度',
        '早晨的任务完成率最高，建议保持这个时间段的产出',
        '下午容易出现效率下降，可以尝试在此时安排一些简单的任务',
      ],
      suggestions: [
        '建议为重要任务预留充足的准备时间',
        '尝试使用番茄工作法来管理长任务',
        '定期审视你的目标，确保与当前的优先级保持一致',
      ],
      metrics: {
        completion_rate: 75,
        productivity_score: 80,
        consistency_score: 70,
      },
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * 保存复盘结果
   */
  private saveAIReviewResult(review: AIReviewResult): void {
    try {
      const dataPath = path.join(app.getPath('userData'), 'ai-review-cache.json');
      fs.writeFileSync(dataPath, JSON.stringify(review, null, 2), 'utf-8');
      console.log('[Scheduler] AI复盘结果已保存');
    } catch (error) {
      console.error('[Scheduler] 保存复盘结果失败:', error);
    }
  }

  /**
   * 发送系统通知
   */
  private sendNotification(title: string, body: string): void {
    if (Notification.isSupported()) {
      const notification = new Notification({ title, body });
      notification.show();
    }
  }

  /**
   * 通知渲染进程
   */
  private notifyRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * 手动触发复盘（用于测试）
   */
  public async triggerReview(): Promise<AIReviewResult | null> {
    console.log('[Scheduler] 手动触发AI复盘...');
    
    const userDataPath = path.join(app.getPath('userData'), 'user-data.json');
    let tasks: any[] = [];
    let schedules: any[] = [];
    let userId = 1;

    if (fs.existsSync(userDataPath)) {
      try {
        const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
        tasks = userData.tasks || [];
        schedules = userData.schedules || [];
        userId = userData.userId || 1;
      } catch (e) {
        console.error('[Scheduler] 解析用户数据失败:', e);
      }
    }

    if (this.config.useLocalExecution) {
      await this.executeLocalAIReview(tasks, schedules, userId);
    } else {
      await this.executeServerAIReview(tasks, schedules, userId);
    }

    // 读取保存的结果
    const dataPath = path.join(app.getPath('userData'), 'ai-review-cache.json');
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    return null;
  }

  /**
   * 获取缓存的复盘结果
   */
  public getCachedReview(): AIReviewResult | null {
    try {
      const dataPath = path.join(app.getPath('userData'), 'ai-review-cache.json');
      if (fs.existsSync(dataPath)) {
        const review = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        
        // 检查是否过期（超过24小时）
        const generatedAt = new Date(review.generated_at);
        const hoursDiff = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return review;
        }
      }
    } catch (error) {
      console.error('[Scheduler] 读取缓存失败:', error);
    }
    return null;
  }

  /**
   * 获取任务列表
   */
  public getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 更新任务状态
   */
  public updateTask(taskId: string, updates: Partial<ScheduledTask>): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    Object.assign(task, updates);
    this.saveTasks();

    // 如果任务已启用，重新调度
    if (task.enabled) {
      this.scheduleTask(taskId);
    } else {
      // 清除定时器
      if (this.timers.has(taskId)) {
        clearTimeout(this.timers.get(taskId)!);
        this.timers.delete(taskId);
      }
    }

    return true;
  }
}

// 导出单例
export const schedulerService = SchedulerService.getInstance();