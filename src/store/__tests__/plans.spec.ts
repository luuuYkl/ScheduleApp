// src/store/__tests__/plans.spec.ts
// Store层单元测试

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePlanStore } from "../plans";
import type {
  Plan,
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
} from "@/services/api.types";

// 模拟API服务
vi.mock("@/services/api", () => ({
  API: {
    fetchPlans: vi.fn(),
    addPlan: vi.fn(),
    updatePlan: vi.fn(),
    deletePlan: vi.fn(),
    fetchTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    updateTaskStatus: vi.fn(),
  },
}));

// 模拟日志store
vi.mock("@/store/log", () => ({
  useLogStore: vi.fn(() => ({
    generateTodayLog: vi.fn(),
  })),
}));

// 模拟用户store
vi.mock("@/store/user", () => ({
  useUserStore: vi.fn(() => ({
    user: { id: 1, username: "testuser" },
  })),
}));

describe("计划Store测试", () => {
  let planStore: ReturnType<typeof usePlanStore>;

  beforeEach(() => {
    // 创建新的Pinia实例
    setActivePinia(createPinia());
    planStore = usePlanStore();

    // 清理localStorage
    localStorage.clear();

    // 重置所有mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("计划状态管理测试", () => {
    it("应该初始化空的计划和任务列表", () => {
      expect(planStore.plans).toEqual([]);
      expect(planStore.tasks).toEqual([]);
    });

    it("应该能够加载计划列表", async () => {
      const mockPlans: Plan[] = [
        {
          id: 1,
          user_id: 1,
          title: "学习计划",
          description: "学习Vue.js",
          start_date: "2024-01-01",
          end_date: "2024-01-31",
          frequency: "daily",
        },
      ];

      const { API } = await import("@/services/api");
      (API.fetchPlans as any).mockResolvedValue(mockPlans);

      await planStore.loadPlans();

      expect(planStore.plans).toEqual(mockPlans);
      expect(API.fetchPlans).toHaveBeenCalled();
    });

    it("应该能够创建新计划", async () => {
      const newPlanData = {
        user_id: 1,
        title: "健身计划",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
        frequency: "daily",
      };

      const createdPlan: Plan = {
        id: 2,
        ...newPlanData,
      };

      const { API } = await import("@/services/api");
      (API.addPlan as any).mockResolvedValue(createdPlan);

      const result = await planStore.createPlan(newPlanData);

      expect(result).toEqual(createdPlan);
      expect(planStore.plans).toContainEqual(createdPlan);
      expect(API.addPlan).toHaveBeenCalledWith(newPlanData);
    });

    it("应该能够更新计划信息", async () => {
      const existingPlan: Plan = {
        id: 1,
        user_id: 1,
        title: "原计划",
        description: "原始描述",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        frequency: "daily",
      };

      planStore.plans = [existingPlan];

      const updateData = { title: "更新后的计划" };
      const updatedPlan: Plan = { ...existingPlan, ...updateData };

      const { API } = await import("@/services/api");
      (API.updatePlan as any).mockResolvedValue(updatedPlan);

      const result = await planStore.updatePlan(1, updateData);

      expect(result).toEqual(updatedPlan);
      expect(planStore.plans[0]).toEqual(updatedPlan);
      expect(API.updatePlan).toHaveBeenCalledWith(1, updateData);
    });

    it("应该能够删除计划", async () => {
      const planToDelete: Plan = {
        id: 1,
        user_id: 1,
        title: "要删除的计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        frequency: "daily",
      };

      planStore.plans = [planToDelete];

      const { API } = await import("@/services/api");
      (API.deletePlan as any).mockResolvedValue({ success: true });

      await planStore.removePlan(1);

      expect(planStore.plans).toHaveLength(0);
      expect(API.deletePlan).toHaveBeenCalledWith(1);
    });

    it("应该能够获取单个计划", () => {
      const plan: Plan = {
        id: 1,
        user_id: 1,
        title: "测试计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        frequency: "daily",
      };

      planStore.plans = [plan];

      const result = planStore.getPlan(1);
      const notFoundResult = planStore.getPlan(999);

      expect(result).toEqual(plan);
      expect(notFoundResult).toBeNull();
    });
  });

  describe("任务状态管理测试", () => {
    it("应该能够加载任务列表", async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          plan_id: 1,
          user_id: 1,
          title: "测试任务",
          task_date: "2024-01-15",
          status: "pending",
        },
      ];

      const { API } = await import("@/services/api");
      (API.fetchTasks as any).mockResolvedValue(mockTasks);

      const result = await planStore.loadTasks();

      expect(result).toEqual(mockTasks);
      expect(planStore.tasks).toEqual(mockTasks);
      expect(API.fetchTasks).toHaveBeenCalled();
    });

    it("应该能够按计划ID过滤任务", async () => {
      const planId = 1;
      const { API } = await import("@/services/api");
      (API.fetchTasks as any).mockResolvedValue([]);

      await planStore.loadTasks(planId);

      expect(API.fetchTasks).toHaveBeenCalledWith(planId);
    });

    it("应该能够创建新任务", async () => {
      const taskPayload: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: "新任务",
        task_date: "2024-01-15",
      };

      const createdTask: Task = {
        id: 1,
        ...taskPayload,
        status: "pending",
      };

      const { API } = await import("@/services/api");
      (API.createTask as any).mockResolvedValue(createdTask);

      const result = await planStore.createTask(taskPayload);

      expect(result).toEqual(createdTask);
      expect(planStore.tasks).toContainEqual(createdTask);
      expect(API.createTask).toHaveBeenCalledWith(taskPayload);
    });

    it("应该能够更新任务信息", async () => {
      const existingTask: Task = {
        id: 1,
        plan_id: 1,
        user_id: 1,
        title: "原任务",
        task_date: "2024-01-15",
        status: "pending",
      };

      planStore.tasks = [existingTask];

      const updateData: UpdateTaskPayload = { title: "更新后的任务" };
      const updatedTask: Task = { ...existingTask, ...updateData };

      const { API } = await import("@/services/api");
      (API.updateTask as any).mockResolvedValue(updatedTask);

      const result = await planStore.updateTask(1, updateData);

      expect(result).toEqual(updatedTask);
      expect(planStore.tasks[0]).toEqual(updatedTask);
      expect(API.updateTask).toHaveBeenCalledWith(1, updateData);
    });

    it("应该能够删除任务", async () => {
      const taskToDelete: Task = {
        id: 1,
        plan_id: 1,
        user_id: 1,
        title: "要删除的任务",
        task_date: "2024-01-15",
        status: "pending",
      };

      planStore.tasks = [taskToDelete];

      const { API } = await import("@/services/api");
      (API.deleteTask as any).mockResolvedValue({ success: true });

      await planStore.deleteTask(1);

      expect(planStore.tasks).toHaveLength(0);
      expect(API.deleteTask).toHaveBeenCalledWith(1);
    });
  });

  describe("任务状态切换测试", () => {
    it("应该能够切换任务完成状态", async () => {
      const task: Task = {
        id: 1,
        plan_id: 1,
        user_id: 1,
        title: "测试任务",
        task_date: "2024-01-15",
        status: "pending",
      };

      planStore.tasks = [task];

      const updatedTask: Task = { ...task, status: "done" };

      const { API } = await import("@/services/api");
      (API.updateTask as any).mockResolvedValue(updatedTask);

      const result = await planStore.toggleTaskStatus(1);

      expect(result).toEqual(updatedTask);
      expect(planStore.tasks[0].status).toBe("done");
      expect(API.updateTask).toHaveBeenCalledWith(1, { status: "done" });
    });

    it("应该能够从未完成切换到完成", async () => {
      const task: Task = {
        id: 1,
        plan_id: 1,
        user_id: 1,
        title: "待办任务",
        task_date: "2024-01-15",
        status: "pending",
      };

      planStore.tasks = [task];

      const { API } = await import("@/services/api");
      (API.updateTask as any).mockResolvedValue({ ...task, status: "done" });

      await planStore.toggleTaskStatus(1);

      expect(planStore.tasks[0].status).toBe("done");
    });

    it("应该能够从完成切换到未完成", async () => {
      const task: Task = {
        id: 1,
        plan_id: 1,
        user_id: 1,
        title: "已完成任务",
        task_date: "2024-01-15",
        status: "done",
      };

      planStore.tasks = [task];

      const { API } = await import("@/services/api");
      (API.updateTask as any).mockResolvedValue({ ...task, status: "pending" });

      await planStore.toggleTaskStatus(1);

      expect(planStore.tasks[0].status).toBe("pending");
    });

    it("应该处理不存在的任务", async () => {
      planStore.tasks = [];

      const result = await planStore.toggleTaskStatus(999);

      expect(result).toBeNull();
    });
  });

  describe("异步操作错误处理", () => {
    it("应该处理加载计划失败的情况", async () => {
      const { API } = await import("@/services/api");
      (API.fetchPlans as any).mockRejectedValue(new Error("网络错误"));

      await expect(planStore.loadPlans()).rejects.toThrow("网络错误");
      expect(planStore.plans).toEqual([]); // 状态应该保持不变
    });

    it("应该处理创建计划失败的情况", async () => {
      const planData = {
        user_id: 1,
        title: "测试计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        frequency: "daily",
      };

      const { API } = await import("@/services/api");
      (API.addPlan as any).mockRejectedValue(new Error("创建失败"));

      await expect(planStore.createPlan(planData)).rejects.toThrow("创建失败");
      expect(planStore.plans).toEqual([]); // 不应该添加到状态中
    });

    it("应该处理更新任务失败的情况", async () => {
      const existingTask: Task = {
        id: 1,
        plan_id: 1,
        user_id: 1,
        title: "原任务",
        task_date: "2024-01-15",
        status: "pending",
      };

      planStore.tasks = [existingTask];

      const updateData = { title: "新标题" };

      const { API } = await import("@/services/api");
      (API.updateTask as any).mockRejectedValue(new Error("更新失败"));

      await expect(planStore.updateTask(1, updateData)).rejects.toThrow(
        "更新失败",
      );

      // 状态应该保持不变
      expect(planStore.tasks[0].title).toBe("原任务");
    });
  });

  describe("状态持久化验证", () => {
    it("应该在操作后保持状态一致性", async () => {
      // 测试一系列操作后的状态一致性
      const planData = {
        user_id: 1,
        title: "测试计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        frequency: "daily",
      };

      const taskPayload: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: "测试任务",
        task_date: "2024-01-15",
      };

      const { API } = await import("@/services/api");
      (API.addPlan as any).mockResolvedValue({ id: 1, ...planData });
      (API.createTask as any).mockResolvedValue({
        id: 1,
        ...taskPayload,
        status: "pending",
      });

      // 创建计划
      await planStore.createPlan(planData);
      expect(planStore.plans).toHaveLength(1);

      // 创建任务
      await planStore.createTask(taskPayload);
      expect(planStore.tasks).toHaveLength(1);

      // 验证关联关系
      expect(planStore.tasks[0].plan_id).toBe(1);
      expect(planStore.tasks[0].user_id).toBe(1);
    });

    it("应该正确处理并发操作", async () => {
      const { API } = await import("@/services/api");

      // 模拟异步操作
      (API.fetchPlans as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([{ id: 1, title: "计划1" }]), 100),
          ),
      );

      (API.fetchTasks as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([{ id: 1, title: "任务1" }]), 50),
          ),
      );

      // 并发执行
      const [plans, tasks] = await Promise.all([
        planStore.loadPlans(),
        planStore.loadTasks(),
      ]);

      // 修复后：plans应该返回计划数组，不再为undefined
      expect(plans).toBeDefined();
      expect(plans).toHaveLength(1);
      expect(tasks).toHaveLength(1);
      expect(planStore.plans).toHaveLength(1);
      expect(planStore.tasks).toHaveLength(1);
    });
  });

  describe("边界条件测试", () => {
    it("应该处理空的数据列表", async () => {
      const { API } = await import("@/services/api");
      (API.fetchPlans as any).mockResolvedValue([]);
      (API.fetchTasks as any).mockResolvedValue([]);

      await planStore.loadPlans();
      await planStore.loadTasks();

      expect(planStore.plans).toEqual([]);
      expect(planStore.tasks).toEqual([]);
    });

    it("应该处理重复的ID", async () => {
      const plan1: Plan = {
        id: 1,
        user_id: 1,
        title: "计划1",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        frequency: "daily",
      };

      const plan2: Plan = {
        id: 1, // 相同ID
        user_id: 1,
        title: "计划2",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
        frequency: "daily",
      };

      planStore.plans = [plan1];

      const { API } = await import("@/services/api");
      (API.addPlan as any).mockResolvedValue(plan2);

      await planStore.createPlan({
        user_id: 1,
        title: "计划2",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
        frequency: "daily",
      });

      // 应该更新而不是添加
      expect(planStore.plans).toHaveLength(1);
      expect(planStore.plans[0].title).toBe("计划2");
    });
  });
});
