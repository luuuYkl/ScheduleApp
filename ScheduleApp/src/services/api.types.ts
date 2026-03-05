// src/services/api.types.ts
// API 类型定义文件 - 定义所有数据模型和接口契约

/** 用户模型 */
export interface User {
  id: number;
  username: string;
  email?: string;
  token?: string; // 登录凭证
}

/** 计划模型 */
export interface Plan {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  start_date: string; // 格式: YYYY-MM-DD
  end_date: string; // 格式: YYYY-MM-DD
  frequency: string; // 频率: 'daily' | 'weekly' | 'custom'
  created_at?: string;
}

/** 任务状态枚举 */
export type TaskStatus = "pending" | "done" | "missed";

/** 任务重复类型 */
export type TaskRepeatType = "none" | "daily" | "weekly" | "monthly";

/** 任务模型 */
export interface Task {
  id: number;
  plan_id: number; // 所属计划ID
  user_id: number;
  title: string;
  task_date: string; // 格式: YYYY-MM-DD
  start_time?: string; // HH:MM 可选
  end_time?: string; // HH:MM 可选
  status: TaskStatus;
  note?: string; // 备注
  repeat_type?: TaskRepeatType; // 重复类型，默认 'none'
  repeat_end_date?: string; // 重复结束日期 (YYYY-MM-DD)，仅当 repeat_type 不为 'none' 时有效
  created_at?: string;
}

/** 独立日程（不属于计划） */
export interface ScheduleItem {
  id: number;
  user_id: number;
  title: string;
  date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM 可选
  end_time?: string; // HH:MM 可选
  description?: string;
  completed?: boolean; // 是否完成
  created_at?: string;
}

/** AI 优化建议项 */
export interface AISuggestion {
  type: "warning" | "suggestion" | "info";
  message: string;
  field?: string; // 相关的字段（如 'start_date', 'end_date'）
}

/** AI 优化计划请求 */
export interface AIOptimizePlanRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  user_context?: string; // 可选的用户上下文信息
}

/** AI 推荐任务（包含时间/重复/描述） */
export interface AIRecommendedTask {
  title: string;
  task_date?: string;
  start_time?: string; // HH:MM
  end_time?: string; // HH:MM
  note?: string; // 描述/备注
  repeat_type?: TaskRepeatType;
  repeat_end_date?: string;
}

/** AI 优化计划响应 */
export interface AIOptimizePlanResponse {
  suggestions: AISuggestion[];
  optimized_plan?: {
    title?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    recommended_tasks?: AIRecommendedTask[]; // 推荐的任务列表（含时间/重复/描述）
  };
  reasoning?: string; // AI 的推理过程说明
}

/** 任务修改类型 */
export type TaskModificationType = 
  | 'reschedule'      // 重新安排时间
  | 'reduce_priority' // 降低优先级
  | 'split'           // 拆分任务
  | 'delete'          // 删除任务
  | 'modify';         // 修改任务内容

/** 任务修改建议 */
export interface TaskModification {
  taskId: number;                    // 要修改的任务ID（-1表示新任务）
  type: TaskModificationType;        // 修改类型
  reason: string;                    // AI建议原因
  original: Task | null;             // 原任务数据（null表示新增）
  modified: Partial<Task> & { title: string }; // 修改后的字段
}

/** AI建议动作（可执行的） */
export interface AIActionSuggestion {
  id: number;
  title: string;
  description: string;
  action: string;                    // 动作类型标识
  modifications: TaskModification[]; // 具体的任务修改列表
}

/** 任务对比弹窗Props */
export interface TaskModificationModalProps {
  visible: boolean;
  modifications: TaskModification[];
  loading?: boolean;
}

/** 任务对比项（用于展示） */
export interface TaskComparisonItem {
  taskId: number;
  type: TaskModificationType;
  reason: string;
  original: Task | null;
  modified: Partial<Task>;
  fieldChanges: {
    field: string;
    fieldLabel: string;
    originalValue: string;
    modifiedValue: string;
    changed: boolean;
  }[];
}

/** 创建日程请求 */
export interface CreateSchedulePayload {
  user_id: number;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  completed?: boolean;
}

/** 更新日程请求 */
export interface UpdateSchedulePayload {
  title?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  completed?: boolean;
}

/** 连续签到记录模型 */
export interface Streak {
  id: number;
  user_id: number;
  current_streak: number; // 当前连续天数
  longest_streak: number; // 历史最长连续天数
  last_checkin: string | null; // 最后签到日期
}

/** 注册请求参数 */
export interface RegisterPayload {
  username: string;
  email?: string;
  password: string;
}

/** 计划更新请求参数 */
export interface UpdatePlanPayload {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  frequency?: string;
}

/** 任务创建请求参数 */
export interface CreateTaskPayload {
  plan_id: number;
  user_id: number;
  title: string;
  task_date: string; // 格式: YYYY-MM-DD
  start_time?: string; // HH:MM
  end_time?: string; // HH:MM
  status?: TaskStatus; // 默认为 pending
  note?: string;
  repeat_type?: TaskRepeatType; // 重复类型
  repeat_end_date?: string; // 重复结束日期
}

/** 任务更新请求参数 */
export interface UpdateTaskPayload {
  title?: string;
  task_date?: string;
  start_time?: string;
  end_time?: string;
  status?: TaskStatus;
  note?: string;
  repeat_type?: TaskRepeatType;
  repeat_end_date?: string;
}

/**
 * API 统一接口
 * Mock 和真实后端必须严格实现此接口，确保类型一致性
 */
export interface APIInterface {
  // ========== 用户认证 ==========
  /** 用户登录 */
  login(username: string, password: string): Promise<User>;
  /** 用户注册 */
  register(payload: RegisterPayload): Promise<User>;
  /** 获取当前用户信息 */
  fetchUser(): Promise<User>;

  // ========== 计划管理 ==========
  /** 获取用户所有计划 */
  fetchPlans(): Promise<Plan[]>;
  /** 创建新计划 */
  addPlan(plan: Partial<Plan>): Promise<Plan>;
  /** 更新计划信息 */
  updatePlan(id: number, payload: UpdatePlanPayload): Promise<Plan>;
  /** 删除计划（同时删除关联任务） */
  deletePlan(id: number): Promise<{ success: boolean }>;

  // ========== 任务管理 ==========
  /** 获取任务列表（可选：按计划ID过滤） */
  fetchTasks(planId?: number): Promise<Task[]>;
  /** 创建新任务 */
  createTask(payload: CreateTaskPayload): Promise<Task>;
  /** 更新任务信息 */
  updateTask(id: number, payload: UpdateTaskPayload): Promise<Task>;
  /** 删除任务 */
  deleteTask(id: number): Promise<{ success: boolean }>;
  /** 更新任务状态（快捷方法） */
  updateTaskStatus(taskId: number, status: TaskStatus): Promise<Task>;

  // ========== 签到系统 ==========
  /** 获取用户签到记录 */
  fetchStreak(userId: number): Promise<Streak>;
  /** 执行签到（增加连续天数） */
  checkIn(userId: number): Promise<Streak>;

  // ========== 日程管理（独立于计划） ==========
  /** 获取用户所有日程（可选按日期过滤） */
  fetchSchedules(date?: string): Promise<ScheduleItem[]>;
  /** 创建日程 */
  createSchedule(payload: CreateSchedulePayload): Promise<ScheduleItem>;
  /** 更新日程 */
  updateSchedule(
    id: number,
    payload: UpdateSchedulePayload,
  ): Promise<ScheduleItem>;
  /** 删除日程 */
  deleteSchedule(id: number): Promise<{ success: boolean }>;

  // ========== AI 功能 ==========
  /** AI 优化计划建议 */
  optimizePlanWithAI?(
    request: AIOptimizePlanRequest,
  ): Promise<AIOptimizePlanResponse>;
}
