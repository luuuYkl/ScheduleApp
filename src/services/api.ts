// src/services/api.ts
// API 服务层 - 提供 Mock 和真实后端的统一接口
// 通过 APP_CONFIG.USE_MOCK_API 开关自动切换数据源

import axios from "axios";
import { APP_CONFIG } from "@/config";
import { ref } from "vue";
import type {
  APIInterface, User, Plan, Task, Streak,
  RegisterPayload, UpdatePlanPayload,
  CreateTaskPayload, UpdateTaskPayload,
  ScheduleItem, CreateSchedulePayload, UpdateSchedulePayload
} from "./api.types";

// ================================
// Mock 数据存储（内存中的假数据）
// ================================

// 从 localStorage 加载用户数据,确保刷新后仍保留注册用户
function loadMockUsers(): User[] {
  const stored = localStorage.getItem('mockUsers');
  console.log('[Mock API] Loading users from localStorage:', stored);
  if (stored) {
    try {
      const users = JSON.parse(stored);
      console.log('[Mock API] Loaded users:', users);
      return users;
    } catch(e) {
      console.warn('Failed to parse mockUsers from localStorage:', e);
    }
  }
  // 默认用户
  const defaultUsers = [{ id: 1, username: "demoUser", email: "demo@example.com", token: "mock-token-123456" }];
  console.log('[Mock API] Using default users:', defaultUsers);
  return defaultUsers;
}

function saveMockUsers(users: User[]) {
  console.log('[Mock API] Saving users to localStorage:', users);
  localStorage.setItem('mockUsers', JSON.stringify(users));
}

/** Mock 用户数据（持久化到 localStorage） */
const mockUsers = ref<User[]>(loadMockUsers());

/** Mock 计划数据 */
const mockPlans = ref<Plan[]>([]);

/** Mock 任务数据（已清空示例） */
const mockTasks = ref<Task[]>([]);

/** Mock 日程数据（独立） */
const mockSchedules = ref<ScheduleItem[]>([]);

/** Mock 签到记录数据 */
const mockStreaks = ref<Streak[]>([
  { id: 1, user_id: 1, current_streak: 3, longest_streak: 10, last_checkin: "2025-10-09" },
]);

// ================================
// Mock API 实现（开发/测试用）
// 严格遵循 APIInterface 接口定义
// ================================
const mockAPI: APIInterface = {
  // ---------- 用户认证 ----------
  
  /** 登录验证 */
  async login(username: string, _password: string): Promise<User> {
    console.log('[Mock API] Login attempt for username:', username);
    console.log('[Mock API] Current mockUsers:', mockUsers.value);
    const user = mockUsers.value.find(u => u.username === username);
    if (!user) {
      console.error('[Mock API] User not found:', username);
      throw new Error("用户名不存在");
    }
    console.log('[Mock API] Login successful:', user);
    return { ...user };
  },
  
  /** 用户注册 */
  async register(payload: RegisterPayload): Promise<User> {
    const exists = mockUsers.value.some(u => u.username === payload.username);
    if (exists) throw new Error("用户名已存在");
    const id = (mockUsers.value.at(-1)?.id ?? 0) + 1;
    const user: User = {
      id,
      username: payload.username,
      email: payload.email,
      token: `mock-token-${id}`,
    };
    mockUsers.value.push(user);
    saveMockUsers(mockUsers.value); // 持久化到 localStorage
    return user;
  },
  
  /** 获取当前用户信息 */
  async fetchUser(): Promise<User> {
    const u = mockUsers.value[0];
    if (!u) throw new Error("未登录");
    return { ...u };
  },

  // ---------- 计划管理 ----------
  
  /** 获取所有计划 */
  async fetchPlans(): Promise<Plan[]> {
    return [...mockPlans.value];
  },
  
  /** 创建新计划 */
  async addPlan(plan: Partial<Plan>): Promise<Plan> {
    const id = (mockPlans.value.at(-1)?.id ?? 0) + 1;
    const newPlan: Plan = {
      id,
      user_id: plan.user_id ?? 1,
      title: plan.title ?? "未命名计划",
      description: plan.description ?? "",
      start_date: plan.start_date ?? new Date().toISOString().slice(0, 10),
      end_date: plan.end_date ?? new Date().toISOString().slice(0, 10),
      frequency: plan.frequency ?? "daily",
      created_at: new Date().toISOString(),
    };
    mockPlans.value.push(newPlan);
    return newPlan;
  },
  
  /** 更新计划 */
  async updatePlan(id: number, data: UpdatePlanPayload): Promise<Plan> {
    const i = mockPlans.value.findIndex(p => p.id === id);
    if (i === -1) throw new Error("计划不存在");
    mockPlans.value[i] = { ...mockPlans.value[i], ...data };
    return mockPlans.value[i];
  },
  
  /** 删除计划（级联删除关联任务） */
  async deletePlan(id: number): Promise<{ success: boolean }> {
    const i = mockPlans.value.findIndex(p => p.id === id);
    if (i === -1) throw new Error("计划不存在");
    mockPlans.value.splice(i, 1);
    // 级联删除该计划下的所有任务
    for (let j = mockTasks.value.length - 1; j >= 0; j--) {
      if (mockTasks.value[j].plan_id === id) mockTasks.value.splice(j, 1);
    }
    return { success: true };
  },

  // ---------- 任务管理 ----------
  
  /** 获取任务列表（可按计划过滤） */
  async fetchTasks(planId?: number): Promise<Task[]> {
    return planId
      ? mockTasks.value.filter(t => t.plan_id === planId)
      : [...mockTasks.value];
  },
  
  /** 创建新任务 */
  async createTask(payload: CreateTaskPayload): Promise<Task> {
    const id = (mockTasks.value.at(-1)?.id ?? 0) + 1;
    const task: Task = {
      id,
      plan_id: payload.plan_id,
      user_id: payload.user_id,
      title: payload.title,
      task_date: payload.task_date,
      status: payload.status ?? "pending",
      note: payload.note,
      repeat_type: payload.repeat_type ?? "none",
      repeat_end_date: payload.repeat_end_date,
      created_at: new Date().toISOString(),
    };
    mockTasks.value.push(task);
    return task;
  },
  
  /** 更新任务信息 */
  async updateTask(id: number, payload: UpdateTaskPayload): Promise<Task> {
    const t = mockTasks.value.find(x => x.id === id);
    if (!t) throw new Error("任务不存在");
    Object.assign(t, payload);
    return { ...t };
  },
  
  /** 删除任务 */
  async deleteTask(id: number): Promise<{ success: boolean }> {
    const i = mockTasks.value.findIndex(x => x.id === id);
    if (i >= 0) mockTasks.value.splice(i, 1);
    return { success: true };
  },

  /** 快捷更新任务状态 */
  async updateTaskStatus(taskId: number, status: Task["status"]): Promise<Task> {
    const task = mockTasks.value.find(t => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    task.status = status;
    return { ...task };
  },

  // ---------- 签到系统 ----------
  
  /** 获取用户签到记录 */
  async fetchStreak(userId: number): Promise<Streak> {
    const s = mockStreaks.value.find(x => x.user_id === userId);
    if (!s) throw new Error("未找到签到记录");
    return { ...s };
  },
  
  /** 执行签到（更新连续天数） */
  async checkIn(userId: number): Promise<Streak> {
    const s = mockStreaks.value.find(x => x.user_id === userId);
    if (!s) throw new Error("未找到签到记录");
    s.current_streak += 1;
    s.last_checkin = new Date().toISOString().split("T")[0];
    if (s.current_streak > s.longest_streak) s.longest_streak = s.current_streak;
    return { ...s };
  },

  // ---------- 日程管理 ----------
  async fetchSchedules(date?: string): Promise<ScheduleItem[]> {
    if (date) return mockSchedules.value.filter(s => s.date === date).map(s => ({ ...s }));
    return mockSchedules.value.map(s => ({ ...s }));
  },
  async createSchedule(payload: CreateSchedulePayload): Promise<ScheduleItem> {
    const id = (mockSchedules.value.at(-1)?.id ?? 0) + 1;
    const item: ScheduleItem = {
      id,
      user_id: payload.user_id,
      title: payload.title,
      date: payload.date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      description: payload.description,
      completed: payload.completed ?? false,
      created_at: new Date().toISOString()
    };
    mockSchedules.value.push(item);
    return { ...item };
  },
  async updateSchedule(id: number, payload: UpdateSchedulePayload): Promise<ScheduleItem> {
    const idx = mockSchedules.value.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('日程不存在');
    mockSchedules.value[idx] = { ...mockSchedules.value[idx], ...payload };
    return { ...mockSchedules.value[idx] };
  },
  async deleteSchedule(id: number): Promise<{ success: boolean }> {
    const idx = mockSchedules.value.findIndex(s => s.id === id);
    if (idx !== -1) mockSchedules.value.splice(idx,1);
    return { success: true };
  },
};

// ================================
// 真实后端 API 实现（使用 Axios）
// 需要配置 APP_CONFIG.BASE_URL 指向后端地址
// ================================

/** Axios 实例配置 */
const realAPI = axios.create({
  baseURL: APP_CONFIG.BASE_URL,
  timeout: 8000,
});

/** 真实后端接口实现 */
const backendAPI: APIInterface = {
  // ---------- 用户认证 ----------
  
  async login(username: string, password: string): Promise<User> {
    const { data } = await realAPI.post<User>("/auth/login", { username, password });
    return data;
  },
  
  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await realAPI.post<User>("/auth/register", payload);
    return data;
  },
  
  async fetchUser(): Promise<User> {
    const { data } = await realAPI.get<User>("/user/profile");
    return data;
  },

  // ---------- 计划管理 ----------
  
  async fetchPlans(): Promise<Plan[]> {
    const { data } = await realAPI.get<Plan[]>("/plans");
    return data;
  },
  
  async addPlan(plan: Partial<Plan>): Promise<Plan> {
    const { data } = await realAPI.post<Plan>("/plans", plan);
    return data;
  },
  
  async updatePlan(id: number, data: UpdatePlanPayload): Promise<Plan> {
    const { data: res } = await realAPI.put<Plan>(`/plans/${id}`, data);
    return res;
  },
  
  async deletePlan(id: number): Promise<{ success: boolean }> {
    const { data } = await realAPI.delete<{ success: boolean }>(`/plans/${id}`);
    return data;
  },

  // ---------- 任务管理 ----------
  
  async fetchTasks(planId?: number): Promise<Task[]> {
    const url = planId ? `/tasks?planId=${planId}` : "/tasks";
    const { data } = await realAPI.get<Task[]>(url);
    return data;
  },
  
  async createTask(payload: CreateTaskPayload): Promise<Task> {
    const { data } = await realAPI.post<Task>("/tasks", payload);
    return data;
  },
  
  async updateTask(id: number, payload: UpdateTaskPayload): Promise<Task> {
    const { data } = await realAPI.put<Task>(`/tasks/${id}`, payload);
    return data;
  },
  
  async deleteTask(id: number): Promise<{ success: boolean }> {
    const { data } = await realAPI.delete<{ success: boolean }>(`/tasks/${id}`);
    return data;
  },

  async updateTaskStatus(taskId: number, status: Task["status"]): Promise<Task> {
    const { data } = await realAPI.put<Task>(`/tasks/${taskId}`, { status });
    return data;
  },

  // ---------- 签到系统 ----------
  
  async fetchStreak(userId: number): Promise<Streak> {
    const { data } = await realAPI.get<Streak>(`/streak/${userId}`);
    return data;
  },
  
  async checkIn(userId: number): Promise<Streak> {
    const { data } = await realAPI.post<Streak>(`/streak/checkin`, { userId });
    return data;
  },

  // ---------- 日程管理 ----------
  async fetchSchedules(date?: string): Promise<ScheduleItem[]> {
    const url = date ? `/schedules?date=${date}` : '/schedules';
    const { data } = await realAPI.get<ScheduleItem[]>(url);
    return data;
  },
  async createSchedule(payload: CreateSchedulePayload): Promise<ScheduleItem> {
    const { data } = await realAPI.post<ScheduleItem>('/schedules', payload);
    return data;
  },
  async updateSchedule(id: number, payload: UpdateSchedulePayload): Promise<ScheduleItem> {
    const { data } = await realAPI.put<ScheduleItem>(`/schedules/${id}`, payload);
    return data;
  },
  async deleteSchedule(id: number): Promise<{ success: boolean }> {
    const { data } = await realAPI.delete<{ success: boolean }>(`/schedules/${id}`);
    return data;
  },
};

// ================================
// 导出统一 API 接口
// 根据配置自动切换 Mock/真实后端
// ================================

/**
 * 统一 API 导出
 * - 开发/测试：USE_MOCK_API = true，使用内存数据
 * - 生产环境：USE_MOCK_API = false，调用真实后端
 */
export const API: APIInterface = APP_CONFIG.USE_MOCK_API ? mockAPI : backendAPI;

// ================================
// 便捷认证工具函数
// ================================

/**
 * 登录助手
 * 自动将 token 和用户信息存储到 localStorage
 */
export async function login(username: string, password: string) {
  const user = await API.login(username, password);
  if (user?.token) localStorage.setItem("token", user.token);
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

/**
 * 注册助手
 * 自动将 token 和用户信息存储到 localStorage
 */
export async function register(payload: { username: string; email?: string; password: string }) {
  const user = await API.register(payload);
  if (user?.token) localStorage.setItem("token", user.token);
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

/**
 * 登出助手
 * 清除本地存储的认证信息
 */
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
