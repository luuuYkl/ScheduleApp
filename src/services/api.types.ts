// src/services/api.types.ts

export interface User {
  id: number;
  username: string;
  email?: string;
  token?: string;
}

export interface Plan {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  frequency: string;  // 'daily' | 'weekly' | 'custom'
  created_at?: string;
}

export type TaskStatus = "pending" | "done" | "missed";

export interface Task {
  id: number;
  plan_id: number;
  user_id: number;
  title: string;
  task_date: string; // YYYY-MM-DD
  status: TaskStatus;
  note?: string;
  created_at?: string;
}

export interface Streak {
  id: number;
  user_id: number;
  current_streak: number;
  longest_streak: number;
  last_checkin: string | null;
}

/** 🔐 认证 */
export interface RegisterPayload {
  username: string;
  email?: string;
  password: string;
}

/** 🗓️ 计划修改 */
export interface UpdatePlanPayload {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  frequency?: string;
}

/** ✅ 任务：新增/修改 payload */
export interface CreateTaskPayload {
  plan_id: number;
  user_id: number;
  title: string;
  task_date: string;      // YYYY-MM-DD
  status?: TaskStatus;    // 默认 pending
  note?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  task_date?: string;
  status?: TaskStatus;
  note?: string;
}

/** 🌐 API 统一接口 */
export interface APIInterface {
  // 用户 / 认证
  login(username: string, password: string): Promise<User>;
  register(payload: RegisterPayload): Promise<User>;
  fetchUser(): Promise<User>;

  // 计划
  fetchPlans(): Promise<Plan[]>;
  addPlan(plan: Partial<Plan>): Promise<Plan>;
  updatePlan(id: number, payload: UpdatePlanPayload): Promise<Plan>;
  deletePlan(id: number): Promise<{ success: boolean }>;

  // 任务
  fetchTasks(planId?: number): Promise<Task[]>;
  createTask(payload: CreateTaskPayload): Promise<Task>;
  updateTask(id: number, payload: UpdateTaskPayload): Promise<Task>;
  deleteTask(id: number): Promise<{ success: boolean }>;
  updateTaskStatus(taskId: number, status: TaskStatus): Promise<Task>; // ✅ 改为必需

  // 签到
  fetchStreak(userId: number): Promise<Streak>;
  checkIn(userId: number): Promise<Streak>;
}
