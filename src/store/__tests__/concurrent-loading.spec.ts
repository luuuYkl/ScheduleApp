// src/store/__tests__/concurrent-loading.spec.ts
// 并发加载测试 - 验证 loadPlans 和 loadTasks 返回值一致性

import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePlanStore } from "../plans";

// 模拟API服务
vi.mock("@/services/api", () => ({
  API: {
    fetchPlans: vi.fn(),
    fetchTasks: vi.fn(),
  },
}));

describe("并发加载测试", () => {
  let planStore: ReturnType<typeof usePlanStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    planStore = usePlanStore();
    vi.clearAllMocks();
  });

  describe("loadPlans 和 loadTasks 返回值一致性", () => {
    it("应该都返回相应的数据数组", async () => {
      const mockPlans = [{ id: 1, title: "计划1" }];
      const mockTasks = [{ id: 1, title: "任务1" }];

      const { API } = await import("@/services/api");
      (API.fetchPlans as any).mockResolvedValue(mockPlans);
      (API.fetchTasks as any).mockResolvedValue(mockTasks);

      const plansResult = await planStore.loadPlans();
      const tasksResult = await planStore.loadTasks();

      // 验证返回值类型
      expect(Array.isArray(plansResult)).toBe(true);
      expect(Array.isArray(tasksResult)).toBe(true);

      // 验证返回值内容
      expect(plansResult).toEqual(mockPlans);
      expect(tasksResult).toEqual(mockTasks);

      // 验证状态也被正确更新
      expect(planStore.plans).toEqual(mockPlans);
      expect(planStore.tasks).toEqual(mockTasks);
    });

    it("应该处理空数据情况", async () => {
      const { API } = await import("@/services/api");
      (API.fetchPlans as any).mockResolvedValue([]);
      (API.fetchTasks as any).mockResolvedValue([]);

      const plansResult = await planStore.loadPlans();
      const tasksResult = await planStore.loadTasks();

      expect(plansResult).toEqual([]);
      expect(tasksResult).toEqual([]);
      expect(planStore.plans).toEqual([]);
      expect(planStore.tasks).toEqual([]);
    });
  });

  describe("并发调用测试", () => {
    it("Promise.all 应该正确处理两个异步调用", async () => {
      const mockPlans = [
        { id: 1, title: "计划1" },
        { id: 2, title: "计划2" },
      ];

      const mockTasks = [
        { id: 1, title: "任务1" },
        { id: 2, title: "任务2" },
        { id: 3, title: "任务3" },
      ];

      const { API } = await import("@/services/api");
      (API.fetchPlans as any).mockResolvedValue(mockPlans);
      (API.fetchTasks as any).mockResolvedValue(mockTasks);

      // 测试并发执行
      const [plans, tasks] = await Promise.all([
        planStore.loadPlans(),
        planStore.loadTasks(),
      ]);

      // 验证返回值
      expect(plans).toBeDefined();
      expect(plans).toHaveLength(2);
      expect(tasks).toHaveLength(3);

      // 验证内容正确性
      expect(plans).toEqual(mockPlans);
      expect(tasks).toEqual(mockTasks);

      // 验证store状态
      expect(planStore.plans).toEqual(mockPlans);
      expect(planStore.tasks).toEqual(mockTasks);
    });

    it("应该正确处理不同延迟的并发调用", async () => {
      const mockPlans = [{ id: 1, title: "慢加载计划" }];
      const mockTasks = [{ id: 1, title: "快加载任务" }];

      const { API } = await import("@/services/api");

      // 模拟不同的加载时间
      (API.fetchPlans as any).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockPlans), 100)),
      );

      (API.fetchTasks as any).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockTasks), 50)),
      );

      const startTime = Date.now();
      const [plans, tasks] = await Promise.all([
        planStore.loadPlans(),
        planStore.loadTasks(),
      ]);
      const totalTime = Date.now() - startTime;

      // 应该等待最长时间的操作完成（约100ms）
      expect(totalTime).toBeGreaterThanOrEqual(100);
      expect(totalTime).toBeLessThan(200); // 不应该超过200ms

      expect(plans).toHaveLength(1);
      expect(tasks).toHaveLength(1);
      expect(plans[0].title).toBe("慢加载计划");
      expect(tasks[0].title).toBe("快加载任务");
    });
  });

  describe("链式调用测试", () => {
    it("应该支持链式调用模式", async () => {
      const mockPlans = [{ id: 1, title: "计划1" }];
      const mockTasks = [{ id: 1, title: "任务1" }];

      const { API } = await import("@/services/api");
      (API.fetchPlans as any).mockResolvedValue(mockPlans);
      (API.fetchTasks as any).mockResolvedValue(mockTasks);

      // 链式调用测试
      const plans = await planStore.loadPlans();
      const tasks = await planStore.loadTasks();

      expect(plans).toHaveLength(1);
      expect(tasks).toHaveLength(1);

      // 验证可以基于返回值进行后续操作
      const planTitles = plans.map((p) => p.title);
      const taskTitles = tasks.map((t) => t.title);

      expect(planTitles).toContain("计划1");
      expect(taskTitles).toContain("任务1");
    });
  });

  describe("错误处理一致性", () => {
    it("两个方法应该有一致的错误处理行为", async () => {
      const errorMessage = "网络错误";

      const { API } = await import("@/services/api");
      (API.fetchPlans as any).mockRejectedValue(new Error(errorMessage));
      (API.fetchTasks as any).mockRejectedValue(new Error(errorMessage));

      // 测试 loadPlans 错误处理
      await expect(planStore.loadPlans()).rejects.toThrow(errorMessage);

      // 测试 loadTasks 错误处理
      await expect(planStore.loadTasks()).rejects.toThrow(errorMessage);

      // 状态应该保持不变
      expect(planStore.plans).toEqual([]);
      expect(planStore.tasks).toEqual([]);
    });
  });
});
