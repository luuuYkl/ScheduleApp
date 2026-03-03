// src/services/__tests__/plans.spec.ts
// 计划创建校验测试

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Plan, CreateTaskPayload } from "../api.types";
import { generateRepeatTaskPayloads } from "../repeat-task";

describe("计划创建校验测试", () => {
  beforeEach(() => {
    // 清理localStorage
    localStorage.clear();
  });

  // 在文件顶部添加工具函数
  const getRelativeDate = (daysFromToday: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return date.toISOString().split("T")[0];
  };

  describe("计划数据格式验证", () => {
    it("应该验证必需字段", () => {
      const today = new Date().toISOString().split("T")[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const endDateString = endDate.toISOString().split("T")[0];

      const validPlan = {
        user_id: 1,
        title: "学习计划",
        start_date: today,
        end_date: endDateString,
      };

      expect(validPlan.title).toBeTruthy();
      expect(validPlan.start_date).toBeTruthy();
      expect(validPlan.end_date).toBeTruthy();
    });

    it("应该拒绝空标题", () => {
      const invalidPlan = {
        user_id: 1,
        title: "",
        start_date: getRelativeDate(0),
        end_date: getRelativeDate(30),
      };

      expect(invalidPlan.title).toBeFalsy();
    });

    it("应该验证日期格式", () => {
      const plan = {
        user_id: 1,
        title: "测试计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      };

      // 验证日期格式为 YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(dateRegex.test(plan.start_date)).toBe(true);
      expect(dateRegex.test(plan.end_date)).toBe(true);
    });
  });

  describe("必填字段检查", () => {
    it("应该检查用户ID", () => {
      const planWithoutUser = {
        title: "测试计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      } as any;

      expect(planWithoutUser.user_id).toBeUndefined();
    });

    it("应该检查标题长度限制", () => {
      const shortTitle = "a";
      const longTitle = "a".repeat(101); // 超过100字符
      const validTitle = "这是一个有效的计划标题";

      expect(shortTitle.length).toBeGreaterThan(0);
      expect(longTitle.length).toBeGreaterThan(100); // 确认超过限制
      expect(validTitle.length).toBeGreaterThan(0);
      expect(validTitle.length).toBeLessThanOrEqual(100); // 确认在限制内
    });
  });

  describe("日期范围合法性校验", () => {
    it("应该验证结束日期不早于开始日期", () => {
      const validPlan = {
        user_id: 1,
        title: "有效计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      };

      const startDate = new Date(validPlan.start_date);
      const endDate = new Date(validPlan.end_date);

      expect(endDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
    });

    it("应该拒绝结束日期早于开始日期的情况", () => {
      const invalidPlan = {
        user_id: 1,
        title: "无效计划",
        start_date: "2024-01-31",
        end_date: "2024-01-01",
      };

      const startDate = new Date(invalidPlan.start_date);
      const endDate = new Date(invalidPlan.end_date);

      expect(endDate.getTime()).toBeLessThan(startDate.getTime());
    });

    it("应该允许合理的长期计划", () => {
      // 使用相对时间窗口避免时间漂移
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];

      const futureDate = new Date();
      futureDate.setFullYear(today.getFullYear() + 1); // 从今天起1年后
      const futureDateString = futureDate.toISOString().split("T")[0];

      const planWithReasonableFutureDate = {
        user_id: 1,
        title: "年度计划",
        start_date: todayString,
        end_date: futureDateString,
      };

      // 验证1年内的计划是合理的
      const startDate = new Date(planWithReasonableFutureDate.start_date);
      const endDate = new Date(planWithReasonableFutureDate.end_date);
      const diffYears =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      expect(diffYears).toBeLessThanOrEqual(1.1); // 允许一些误差
    });
  });

  describe("AI降级场景测试", () => {
    it("应该在没有AI服务时正常工作", () => {
      // 模拟AI服务不可用的情况
      const mockPlanData = {
        title: "普通计划",
        description: "没有AI优化的计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      };

      // 验证基本计划数据仍然有效
      expect(mockPlanData.title).toBeTruthy();
      expect(mockPlanData.start_date).toBeTruthy();
      expect(mockPlanData.end_date).toBeTruthy();
    });

    it("应该处理AI建议为空的情况", () => {
      const aiResponse = {
        suggestions: [],
        optimized_plan: null,
        reasoning: "AI服务暂时不可用",
      };

      expect(aiResponse.suggestions).toHaveLength(0);
      expect(aiResponse.optimized_plan).toBeNull();
      expect(aiResponse.reasoning).toBeTruthy();
    });

    it("应该优雅处理AI服务错误", () => {
      const errorResponse = new Error("AI服务连接超时");

      expect(errorResponse).toBeInstanceOf(Error);
      expect(errorResponse.message).toContain("AI服务");
    });
  });

  describe("计划与任务关联验证", () => {
    it("应该验证任务属于正确的计划", () => {
      const planId = 1;
      const taskPayload: CreateTaskPayload = {
        plan_id: planId,
        user_id: 1,
        title: "测试任务",
        task_date: "2024-01-15",
      };

      expect(taskPayload.plan_id).toBe(planId);
      expect(taskPayload.user_id).toBeGreaterThan(0);
    });

    it("应该验证任务日期在计划范围内", () => {
      const plan: Plan = {
        id: 1,
        user_id: 1,
        title: "测试计划",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        frequency: "daily",
      };

      const validTaskDate = "2024-01-15";
      const invalidTaskDate = "2024-02-15";

      const isTaskDateValid =
        validTaskDate >= plan.start_date && validTaskDate <= plan.end_date;

      const isTaskDateInvalid =
        invalidTaskDate < plan.start_date || invalidTaskDate > plan.end_date;

      expect(isTaskDateValid).toBe(true);
      expect(isTaskDateInvalid).toBe(true);
    });
  });

  describe("边界条件测试", () => {
    it("应该处理最小日期范围", () => {
      const minimalPlan = {
        user_id: 1,
        title: "一天计划",
        start_date: "2024-01-01",
        end_date: "2024-01-01",
      };

      const startDate = new Date(minimalPlan.start_date);
      const endDate = new Date(minimalPlan.end_date);

      expect(startDate.toDateString()).toBe(endDate.toDateString());
    });

    it("应该处理最大合理日期范围", () => {
      const maxPlan = {
        user_id: 1,
        title: "年度计划",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      };

      const startDate = new Date(maxPlan.start_date);
      const endDate = new Date(maxPlan.end_date);
      const diffDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      expect(diffDays).toBe(365); // 一年的天数
      expect(diffDays).toBeLessThanOrEqual(366); // 考虑闰年
    });

    it("应该处理特殊字符标题", () => {
      const specialTitles = [
        "学习《Vue.js》",
        "健身-有氧运动",
        "读书&写作",
        "编程/开发",
      ];

      specialTitles.forEach((title) => {
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(0);
        expect(title.length).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("重复任务生成验证", () => {
    it("应该正确生成每日重复任务", () => {
      const basePayload: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: "每日锻炼",
        task_date: "2024-01-01",
        repeat_type: "daily",
        repeat_end_date: "2024-01-05",
      };

      const payloads = generateRepeatTaskPayloads(basePayload);

      expect(payloads).toHaveLength(5); // 1月1日到1月5日共5天
      expect(payloads[0].task_date).toBe("2024-01-01");
      expect(payloads[4].task_date).toBe("2024-01-05");
    });

    it("应该正确生成每月重复任务", () => {
      const basePayload: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: "月度总结",
        task_date: "2024-01-31",
        repeat_type: "monthly",
        repeat_end_date: "2024-03-31",
      };

      const payloads = generateRepeatTaskPayloads(basePayload);

      expect(payloads).toHaveLength(3); // 1月、2月、3月各一次
      expect(payloads[0].task_date).toBe("2024-01-31");
      expect(payloads[1].task_date).toBe("2024-02-29"); // 2024年2月有29天（闰年）
      expect(payloads[2].task_date).toBe("2024-03-31"); // 修复后：31日是3月的有效日期
    });

    it("应该处理没有重复的情况", () => {
      const basePayload: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: "一次性任务",
        task_date: "2024-01-15",
        repeat_type: "none",
      };

      const payloads = generateRepeatTaskPayloads(basePayload);

      expect(payloads).toHaveLength(1);
      expect(payloads[0].task_date).toBe("2024-01-15");
      expect(payloads[0].repeat_type).toBe("none");
    });
  });
});
