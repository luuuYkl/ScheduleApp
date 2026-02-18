// src/store/__tests__/id-conflict-handling.spec.ts
// ID冲突处理策略测试

import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePlanStore } from "../plans";

// 模拟API服务
vi.mock("@/services/api", () => ({
  API: {
    addPlan: vi.fn(),
    fetchPlans: vi.fn(),
  },
}));

describe("ID冲突处理策略测试", () => {
  let planStore: ReturnType<typeof usePlanStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    planStore = usePlanStore();
    vi.clearAllMocks();
  });

  describe("createPlan ID冲突处理", () => {
    it("应该在ID冲突时更新现有计划而非新增", async () => {
      // 设置初始状态
      const existingPlan = {
        id: 1,
        user_id: 1,
        title: "原有计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        frequency: "daily",
      };

      planStore.plans = [existingPlan];

      // 模拟API返回相同ID的新计划
      const updatedPlan = {
        id: 1, // 相同ID
        user_id: 1,
        title: "更新后的计划",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
        frequency: "weekly",
      };

      const { API } = await import("@/services/api");
      (API.addPlan as any).mockResolvedValue(updatedPlan);

      // 执行创建操作
      const result = await planStore.createPlan({
        user_id: 1,
        title: "新计划",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
        frequency: "weekly",
      });

      // 验证结果
      expect(result).toEqual(updatedPlan);
      expect(planStore.plans).toHaveLength(1); // 应该仍然是1个计划
      expect(planStore.plans[0]).toEqual(updatedPlan); // 应该是更新后的计划
      expect(planStore.plans[0].title).toBe("更新后的计划");
    });

    it("应该在无ID冲突时正常新增计划", async () => {
      // 设置初始状态
      const existingPlan = {
        id: 1,
        user_id: 1,
        title: "计划1",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        frequency: "daily",
      };

      planStore.plans = [existingPlan];

      // 模拟API返回新ID的计划
      const newPlan = {
        id: 2, // 新ID
        user_id: 1,
        title: "计划2",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
        frequency: "weekly",
      };

      const { API } = await import("@/services/api");
      (API.addPlan as any).mockResolvedValue(newPlan);

      // 执行创建操作
      const result = await planStore.createPlan({
        user_id: 1,
        title: "计划2",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
        frequency: "weekly",
      });

      // 验证结果
      expect(result).toEqual(newPlan);
      expect(planStore.plans).toHaveLength(2); // 应该是2个计划
      expect(planStore.plans).toContainEqual(existingPlan);
      expect(planStore.plans).toContainEqual(newPlan);
    });

    it("应该正确处理多个计划的ID冲突", async () => {
      // 设置多个初始计划
      const plans = [
        {
          id: 1,
          user_id: 1,
          title: "计划1",
          start_date: "2024-01-01",
          end_date: "2024-01-31",
          frequency: "daily",
        },
        {
          id: 2,
          user_id: 1,
          title: "计划2",
          start_date: "2024-02-01",
          end_date: "2024-02-29",
          frequency: "weekly",
        },
        {
          id: 3,
          user_id: 1,
          title: "计划3",
          start_date: "2024-03-01",
          end_date: "2024-03-31",
          frequency: "monthly",
        },
      ];

      planStore.plans = [...plans];

      // 模拟API返回更新的计划（ID: 2被更新）
      const updatedPlan = {
        id: 2, // 更新现有ID
        user_id: 1,
        title: "计划2-已更新",
        start_date: "2024-04-01",
        end_date: "2024-04-30",
        frequency: "daily",
      };

      const { API } = await import("@/services/api");
      (API.addPlan as any).mockResolvedValue(updatedPlan);

      // 执行创建操作
      await planStore.createPlan({
        user_id: 1,
        title: "更新计划2",
        start_date: "2024-04-01",
        end_date: "2024-04-30",
        frequency: "daily",
      });

      // 验证结果
      expect(planStore.plans).toHaveLength(3); // 仍然是3个计划
      expect(planStore.plans.find((p) => p.id === 2)?.title).toBe(
        "计划2-已更新",
      );
      // 其他计划应该保持不变
      expect(planStore.plans.find((p) => p.id === 1)?.title).toBe("计划1");
      expect(planStore.plans.find((p) => p.id === 3)?.title).toBe("计划3");
    });
  });

  describe("边界情况测试", () => {
    it("应该正确处理空计划列表的ID冲突", async () => {
      planStore.plans = []; // 空列表

      const newPlan = {
        id: 1,
        user_id: 1,
        title: "新计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        frequency: "daily",
      };

      const { API } = await import("@/services/api");
      (API.addPlan as any).mockResolvedValue(newPlan);

      const result = await planStore.createPlan({
        user_id: 1,
        title: "新计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        frequency: "daily",
      });

      expect(result).toEqual(newPlan);
      expect(planStore.plans).toHaveLength(1);
      expect(planStore.plans[0]).toEqual(newPlan);
    });

    it("应该处理ID为0的特殊情况", async () => {
      planStore.plans = [
        {
          id: 0,
          user_id: 1,
          title: "零号计划",
          start_date: "2024-01-01",
          end_date: "2024-01-31",
          frequency: "daily",
        },
      ];

      const updatedPlan = {
        id: 0, // ID为0
        user_id: 1,
        title: "零号计划-更新",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
        frequency: "weekly",
      };

      const { API } = await import("@/services/api");
      (API.addPlan as any).mockResolvedValue(updatedPlan);

      await planStore.createPlan({
        user_id: 1,
        title: "更新零号计划",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
        frequency: "weekly",
      });

      expect(planStore.plans).toHaveLength(1);
      expect(planStore.plans[0].id).toBe(0);
      expect(planStore.plans[0].title).toBe("零号计划-更新");
    });
  });

  describe("性能考虑", () => {
    it("应该在大量计划情况下仍能正确处理", async () => {
      // 创建大量计划
      const manyPlans = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        user_id: 1,
        title: `计划${i + 1}`,
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        frequency: "daily",
      }));

      planStore.plans = manyPlans;

      // 更新中间的一个计划
      const updatedPlan = {
        id: 50,
        user_id: 1,
        title: "计划50-已更新",
        start_date: "2024-06-01",
        end_date: "2024-06-30",
        frequency: "weekly",
      };

      const { API } = await import("@/services/api");
      (API.addPlan as any).mockResolvedValue(updatedPlan);

      const startTime = Date.now();
      await planStore.createPlan({
        user_id: 1,
        title: "更新计划50",
        start_date: "2024-06-01",
        end_date: "2024-06-30",
        frequency: "weekly",
      });
      const endTime = Date.now();

      // 验证功能正确性
      expect(planStore.plans).toHaveLength(100);
      expect(planStore.plans.find((p) => p.id === 50)?.title).toBe(
        "计划50-已更新",
      );

      // 性能应该在合理范围内（查找100个元素应该很快）
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    });
  });
});
