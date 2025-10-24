// src/services/api.ts
import axios from "axios";
import { APP_CONFIG } from "@/config";
import { ref } from "vue";
import type {
  APIInterface, User, Plan, Task, Streak,
  RegisterPayload, UpdatePlanPayload,
  CreateTaskPayload, UpdateTaskPayload
} from "./api.types";

// ================================
// 1) Mock 数据（本地假数据）
// ================================
const mockUsers = ref<User[]>([
  { id: 1, username: "demoUser", email: "demo@example.com", token: "mock-token-123456" },
]);

const mockPlans = ref<Plan[]>([
  {
    id: 1,
    user_id: 1,
    title: "学习 Vue3 框架",
    description: "每天学习 2 小时，持续 30 天",
    start_date: "2025-10-01",
    end_date: "2025-10-30",
    frequency: "daily",
    created_at: new Date().toISOString(),
  },
]);

const mockTasks = ref<Task[]>([
  {
    id: 1,
    plan_id: 1,
    user_id: 1,
    title: "学习 Vue3 第1天",
    task_date: "2025-10-09",
    status: "done",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    plan_id: 1,
    user_id: 1,
    title: "学习 Vue3 第2天",
    task_date: "2025-10-10",
    status: "pending",
    created_at: new Date().toISOString(),
  },
]);

const mockStreaks = ref<Streak[]>([
  { id: 1, user_id: 1, current_streak: 3, longest_streak: 10, last_checkin: "2025-10-09" },
]);

// ================================
// 2) Mock 接口函数 —— 严格对齐 APIInterface
// ================================
const mockAPI: APIInterface = {
  // 认证
  async login(username: string, _password: string): Promise<User> {
    const user = mockUsers.value.find(u => u.username === username);
    if (!user) throw new Error("用户名不存在");
    return { ...user };
  },
  async register(payload: RegisterPayload): Promise<User> {
    const exists = mockUsers.value.some(u => u.username === payload.username);
    if (exists) throw new Error("用户名已存在");
    const id = mockUsers.value.length + 1;
    const user: User = {
      id,
      username: payload.username,
      email: payload.email,
      token: `mock-token-${id}`,
    };
    mockUsers.value.push(user);
    return user;
  },
  async fetchUser(): Promise<User> {
    const u = mockUsers.value[0];
    if (!u) throw new Error("未登录");
    return { ...u };
  },

  // 计划
  async fetchPlans(): Promise<Plan[]> {
    return [...mockPlans.value];
  },
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
  async updatePlan(id: number, data: UpdatePlanPayload): Promise<Plan> {
    const i = mockPlans.value.findIndex(p => p.id === id);
    if (i === -1) throw new Error("计划不存在");
    mockPlans.value[i] = { ...mockPlans.value[i], ...data };
    return mockPlans.value[i];
  },
  async deletePlan(id: number): Promise<{ success: boolean }> {
    const i = mockPlans.value.findIndex(p => p.id === id);
    if (i === -1) throw new Error("计划不存在");
    mockPlans.value.splice(i, 1);
    // 同步清理该计划下任务
    for (let j = mockTasks.value.length - 1; j >= 0; j--) {
      if (mockTasks.value[j].plan_id === id) mockTasks.value.splice(j, 1);
    }
    return { success: true };
  },

  // 任务
  async fetchTasks(planId?: number): Promise<Task[]> {
    return planId
      ? mockTasks.value.filter(t => t.plan_id === planId)
      : [...mockTasks.value];
  },
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
      created_at: new Date().toISOString(),
    };
    mockTasks.value.push(task);
    return task;
  },
  async updateTask(id: number, payload: UpdateTaskPayload): Promise<Task> {
    const t = mockTasks.value.find(x => x.id === id);
    if (!t) throw new Error("任务不存在");
    Object.assign(t, payload);
    return { ...t };
  },
  async deleteTask(id: number): Promise<{ success: boolean }> {
    const i = mockTasks.value.findIndex(x => x.id === id);
    if (i >= 0) mockTasks.value.splice(i, 1);
    return { success: true };
  },

  // 兼容老方法（如果你还在用）
  async updateTaskStatus(taskId: number, status: Task["status"]): Promise<Task> {
    const task = mockTasks.value.find(t => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    task.status = status;
    return { ...task };
  },

  // 签到
  async fetchStreak(userId: number): Promise<Streak> {
    const s = mockStreaks.value.find(x => x.user_id === userId);
    if (!s) throw new Error("未找到签到记录");
    return { ...s };
  },
  async checkIn(userId: number): Promise<Streak> {
    const s = mockStreaks.value.find(x => x.user_id === userId);
    if (!s) throw new Error("未找到签到记录");
    s.current_streak += 1;
    s.last_checkin = new Date().toISOString().split("T")[0];
    if (s.current_streak > s.longest_streak) s.longest_streak = s.current_streak;
    return { ...s };
  },
};

// ================================
// 3) 实际后端接口（axios）
// ================================
const realAPI = axios.create({
  baseURL: APP_CONFIG.BASE_URL,
  timeout: 8000,
});

const backendAPI: APIInterface = {
  // 认证
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

  // 计划
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

  // 任务
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

  // 兼容：如果后端保留该端点
  async updateTaskStatus(taskId: number, status: Task["status"]): Promise<Task> {
    const { data } = await realAPI.put<Task>(`/tasks/${taskId}`, { status });
    return data;
  },

  // 签到
  async fetchStreak(userId: number): Promise<Streak> {
    const { data } = await realAPI.get<Streak>(`/streak/${userId}`);
    return data;
  },
  async checkIn(userId: number): Promise<Streak> {
    const { data } = await realAPI.post<Streak>(`/streak/checkin`, { userId });
    return data;
  },
};

// ================================
// 4) 导出自动切换接口（唯一导出）
// ================================
export const API: APIInterface = APP_CONFIG.USE_MOCK_API ? mockAPI : backendAPI;
