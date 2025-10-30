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
  end_date: string;   // 格式: YYYY-MM-DD
  frequency: string;  // 频率: 'daily' | 'weekly' | 'custom'
  created_at?: string;
}

/** 任务状态枚举 */
export type TaskStatus = "pending" | "done" | "missed";

/** 任务重复类型 */
export type TaskRepeatType = "none" | "daily" | "monthly";

/** 任务模型 */
export interface Task {
  id: number;
  plan_id: number;    // 所属计划ID
  user_id: number;
  title: string;
  task_date: string;  // 格式: YYYY-MM-DD
  status: TaskStatus;
  note?: string;      // 备注
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
  end_time?: string;   // HH:MM 可选
  description?: string;
  completed?: boolean; // 是否完成
  created_at?: string;
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
  current_streak: number;  // 当前连续天数
  longest_streak: number;  // 历史最长连续天数
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
  task_date: string;      // 格式: YYYY-MM-DD
  status?: TaskStatus;    // 默认为 pending
  note?: string;
  repeat_type?: TaskRepeatType; // 重复类型
  repeat_end_date?: string; // 重复结束日期
}

/** 任务更新请求参数 */
export interface UpdateTaskPayload {
  title?: string;
  task_date?: string;
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
  updateSchedule(id: number, payload: UpdateSchedulePayload): Promise<ScheduleItem>;
  /** 删除日程 */
  deleteSchedule(id: number): Promise<{ success: boolean }>;
}
