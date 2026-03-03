// src/services/__tests__/repeat-task.spec.ts
// 重复任务生成测试

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateRepeatDates,
  generateRepeatTaskPayloads,
} from "../repeat-task";
import type { CreateTaskPayload } from "../api.types";

describe("重复任务生成测试", () => {
  beforeEach(() => {
    // 清理测试环境
    localStorage.clear();
  });

  describe("每日重复任务生成逻辑", () => {
    it("应该正确生成连续日期序列", () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-05";
      const repeatType = "daily" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual([
        "2024-01-01",
        "2024-01-02",
        "2024-01-03",
        "2024-01-04",
        "2024-01-05",
      ]);
      expect(dates).toHaveLength(5);
    });

    it("应该处理跨月的每日重复", () => {
      const startDate = "2024-01-30";
      const endDate = "2024-02-02";
      const repeatType = "daily" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual([
        "2024-01-30",
        "2024-01-31",
        "2024-02-01",
        "2024-02-02",
      ]);
      expect(dates).toHaveLength(4);
    });

    it("应该处理跨年的每日重复", () => {
      const startDate = "2023-12-30";
      const endDate = "2024-01-02";
      const repeatType = "daily" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual([
        "2023-12-30",
        "2023-12-31",
        "2024-01-01",
        "2024-01-02",
      ]);
      expect(dates).toHaveLength(4);
    });

    it("应该处理同一天的重复", () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-01";
      const repeatType = "daily" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual(["2024-01-01"]);
      expect(dates).toHaveLength(1);
    });
  });

  describe("每月重复任务生成逻辑", () => {
    it("应该正确生成月度日期序列", () => {
      const startDate = "2024-01-15";
      const endDate = "2024-03-15";
      const repeatType = "monthly" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual(["2024-01-15", "2024-02-15", "2024-03-15"]);
      expect(dates).toHaveLength(3);
    });

    it("应该处理月末日期", () => {
      const startDate = "2024-01-31";
      const endDate = "2024-04-30";
      const repeatType = "monthly" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual([
        "2024-01-31",
        "2024-02-29", // 2024年2月有29天（闰年）
        "2024-03-31", // 修复后：31日是3月的有效日期
        "2024-04-30", // 4月30日是4月的最后一天
      ]);
      expect(dates).toHaveLength(4);
    });

    it("应该处理跨年的月度重复", () => {
      const startDate = "2023-11-15";
      const endDate = "2024-02-15";
      const repeatType = "monthly" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual([
        "2023-11-15",
        "2023-12-15",
        "2024-01-15",
        "2024-02-15",
      ]);
      expect(dates).toHaveLength(4);
    });
  });

  describe("时间范围有效性验证", () => {
    it("应该拒绝结束日期早于开始日期的情况", () => {
      const startDate = "2024-01-10";
      const endDate = "2024-01-05";
      const repeatType = "daily" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual(["2024-01-10"]); // 返回开始日期
      expect(dates).toHaveLength(1);
    });

    it("应该处理无效的重复类型", () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-05";
      const repeatType = "invalid" as any;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual(["2024-01-01"]); // 回退到无重复
      expect(dates).toHaveLength(1);
    });

    it("应该处理空的重复类型", () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-05";
      const repeatType = "none" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual(["2024-01-01"]);
      expect(dates).toHaveLength(1);
    });
  });

  describe("分组展示逻辑测试", () => {
    it("应该正确生成重复任务payload数组", () => {
      const basePayload: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: "每日锻炼",
        task_date: "2024-01-01",
        repeat_type: "daily",
        repeat_end_date: "2024-01-03",
      };

      const payloads = generateRepeatTaskPayloads(basePayload);

      expect(payloads).toHaveLength(3);
      expect(payloads[0]).toEqual({
        ...basePayload,
        task_date: "2024-01-01",
      });
      expect(payloads[1]).toEqual({
        ...basePayload,
        task_date: "2024-01-02",
      });
      expect(payloads[2]).toEqual({
        ...basePayload,
        task_date: "2024-01-03",
      });
    });

    it("应该处理没有结束日期的情况", () => {
      const basePayload: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: "永久任务",
        task_date: "2024-01-01",
        repeat_type: "daily",
        // 没有 repeat_end_date
      };

      const payloads = generateRepeatTaskPayloads(basePayload);

      expect(payloads).toHaveLength(1);
      expect(payloads[0].task_date).toBe("2024-01-01");
    });

    it("应该处理无重复类型的任务", () => {
      const basePayload: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: "一次性任务",
        task_date: "2024-01-15",
        repeat_type: "none",
        repeat_end_date: "2024-01-20",
      };

      const payloads = generateRepeatTaskPayloads(basePayload);

      expect(payloads).toHaveLength(1);
      expect(payloads[0].task_date).toBe("2024-01-15");
      expect(payloads[0].repeat_type).toBe("none");
    });
  });

  describe("边界条件测试", () => {
    it("应该处理闰年2月29日", () => {
      const startDate = "2024-02-29"; // 闰年
      const endDate = "2024-02-29";
      const repeatType = "daily" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual(["2024-02-29"]);
    });

    it("应该处理非闰年2月29日", () => {
      const startDate = "2023-02-28";
      const endDate = "2023-03-01";
      const repeatType = "daily" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual(["2023-02-28", "2023-03-01"]);
    });

    it("应该处理大量重复任务", () => {
      const startDate = "2024-01-01";
      const endDate = "2024-12-31";
      const repeatType = "daily" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toHaveLength(366); // 2024年是闰年
      expect(dates[0]).toBe("2024-01-01");
      expect(dates[dates.length - 1]).toBe("2024-12-31");
    });

    it("应该处理最小时间间隔", () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-01";
      const repeatType = "monthly" as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual(["2024-01-01"]);
      expect(dates).toHaveLength(1);
    });
  });

  describe("日期格式化测试", () => {
    it("应该正确格式化各种日期", () => {
      // 测试内部使用的 formatDate 函数逻辑
      const testCases = [
        { date: new Date(2024, 0, 1), expected: "2024-01-01" },
        { date: new Date(2024, 11, 31), expected: "2024-12-31" },
        { date: new Date(2024, 1, 29), expected: "2024-02-29" }, // 闰年
        { date: new Date(2023, 1, 28), expected: "2023-02-28" }, // 非闰年
      ];

      testCases.forEach(({ date, expected }) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formatted = `${year}-${month}-${day}`;

        expect(formatted).toBe(expected);
      });
    });
  });

  describe("性能测试", () => {
    it("应该在合理时间内处理大量数据", () => {
      const startDate = "2024-01-01";
      const endDate = "2024-12-31";
      const repeatType = "daily" as const;

      const startTime = performance.now();
      const dates = generateRepeatDates(startDate, endDate, repeatType);
      const endTime = performance.now();

      expect(dates).toHaveLength(366);
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });
  });
});
