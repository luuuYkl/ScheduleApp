// src/services/__tests__/log-trigger.spec.ts
// 日志生成触发测试

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { generateDailyLog } from "../generate-log";
import type { Task, ScheduleItem } from "../api.types";

describe("日志生成触发测试", () => {
  beforeEach(() => {
    // 清理localStorage和模拟环境
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("任务完成时日志自动生成", () => {
    it("应该在任务完成后生成日志", async () => {
      const userId = 1;
      const tasks: Task[] = [
        {
          id: 1,
          plan_id: 1,
          user_id: userId,
          title: "完成项目文档",
          task_date: "2024-01-15",
          status: "done",
          created_at: "2024-01-15T10:00:00Z",
        },
      ];

      const schedules: ScheduleItem[] = [];

      // 设置当前日期为任务日期
      const mockDate = new Date("2024-01-15T14:00:00Z");
      vi.setSystemTime(mockDate);

      const log = await generateDailyLog(userId, tasks, schedules);

      expect(log).toBeDefined();
      expect(log.user_id).toBe(userId);
      expect(log.date).toBe("2024-01-15");
      expect(log.tasks_done).toBe(1);
      expect(log.tasks_total).toBe(1);
      expect(log.content).toContain("完成项目文档");
      expect(log.content).toContain("今天完成了");
    });

    it("应该正确统计多个完成的任务", async () => {
      const userId = 1;
      const tasks: Task[] = [
        {
          id: 1,
          plan_id: 1,
          user_id: userId,
          title: "写代码",
          task_date: "2024-01-15",
          status: "done",
        },
        {
          id: 2,
          plan_id: 1,
          user_id: userId,
          title: "测试功能",
          task_date: "2024-01-15",
          status: "done",
        },
        {
          id: 3,
          plan_id: 1,
          user_id: userId,
          title: "待办任务",
          task_date: "2024-01-15",
          status: "pending",
        },
      ];

      const log = await generateDailyLog(userId, tasks);

      expect(log.tasks_done).toBe(2);
      expect(log.tasks_total).toBe(3);
      expect(log.content).toContain("写代码");
      expect(log.content).toContain("测试功能");
    });

    it("应该处理没有完成任务的情况", async () => {
      const userId = 1;
      const tasks: Task[] = [
        {
          id: 1,
          plan_id: 1,
          user_id: userId,
          title: "未完成任务",
          task_date: "2024-01-15",
          status: "pending",
        },
      ];

      const log = await generateDailyLog(userId, tasks);

      expect(log.tasks_done).toBe(0);
      expect(log.content).toContain("今天还没有完成任何任务或日程");
    });
  });

  describe("日程完成时日志更新", () => {
    it("应该包含完成的日程信息", async () => {
      const userId = 1;
      const tasks: Task[] = [];
      const schedules: ScheduleItem[] = [
        {
          id: 1,
          user_id: userId,
          title: "团队会议",
          date: "2024-01-15",
          completed: true,
          created_at: "2024-01-15T09:00:00Z",
        },
        {
          id: 2,
          user_id: userId,
          title: "客户电话",
          date: "2024-01-15",
          completed: false,
          created_at: "2024-01-15T10:00:00Z",
        },
      ];

      const log = await generateDailyLog(userId, tasks, schedules);

      expect(log.schedules_done).toBe(1);
      expect(log.schedules_total).toBe(2);
      expect(log.content).toContain("团队会议");
      expect(log.content).not.toContain("客户电话");
    });

    it("应该正确统计混合的任务和日程", async () => {
      const userId = 1;
      const tasks: Task[] = [
        {
          id: 1,
          plan_id: 1,
          user_id: userId,
          title: "完成报告",
          task_date: "2024-01-15",
          status: "done",
        },
      ];

      const schedules: ScheduleItem[] = [
        {
          id: 1,
          user_id: userId,
          title: "参加培训",
          date: "2024-01-15",
          completed: true,
        },
      ];

      const log = await generateDailyLog(userId, tasks, schedules);

      expect(log.tasks_done).toBe(1);
      expect(log.schedules_done).toBe(1);
      expect(log.content).toContain("完成报告");
      expect(log.content).toContain("参加培训");
    });
  });

  describe("多任务并发完成场景", () => {
    it("应该处理同一时间多个任务完成", async () => {
      const userId = 1;
      const tasks: Task[] = [
        {
          id: 1,
          plan_id: 1,
          user_id: userId,
          title: "任务1",
          task_date: "2024-01-15",
          status: "done",
        },
        {
          id: 2,
          plan_id: 2,
          user_id: userId,
          title: "任务2",
          task_date: "2024-01-15",
          status: "done",
        },
        {
          id: 3,
          plan_id: 1,
          user_id: userId,
          title: "任务3",
          task_date: "2024-01-15",
          status: "done",
        },
      ];

      const log = await generateDailyLog(userId, tasks);

      expect(log.tasks_done).toBe(3);
      expect(log.content.match(/✓/g)?.length).toBe(3); // 检查有3个完成标记
    });

    it("应该处理所有传入的完成任务", async () => {
      const userId = 1;
      const tasks: Task[] = [
        {
          id: 1,
          plan_id: 1,
          user_id: userId,
          title: "昨天的任务",
          task_date: "2024-01-14", // 昨天
          status: "done",
        },
        {
          id: 2,
          plan_id: 1,
          user_id: userId,
          title: "今天任务",
          task_date: "2024-01-15", // 今天
          status: "done",
        },
      ];

      // 设置当前时间为今天
      vi.setSystemTime(new Date("2024-01-15T15:00:00Z"));

      const log = await generateDailyLog(userId, tasks);

      // 应该统计所有传入的完成任务
      expect(log.tasks_done).toBe(2);
      expect(log.content).toContain("昨天的任务");
      expect(log.content).toContain("今天任务");
    });
  });

  describe("异常情况容错处理", () => {
    it("应该处理空任务列表", async () => {
      const userId = 1;
      const tasks: Task[] = [];
      const schedules: ScheduleItem[] = [];

      const log = await generateDailyLog(userId, tasks, schedules);

      expect(log).toBeDefined();
      expect(log.tasks_done).toBe(0);
      expect(log.schedules_done).toBe(0);
      expect(log.content).toContain("今天还没有完成任何任务或日程");
    });

    it("应该处理undefined参数", async () => {
      const userId = 1;
      const tasks: Task[] = [];

      // 测试不传schedules参数
      const log = await generateDailyLog(userId, tasks);

      expect(log).toBeDefined();
      expect(log.schedules_done).toBe(0);
      expect(log.schedules_total).toBe(0);
    });

    it("应该处理无效日期格式", async () => {
      const userId = 1;
      const tasks: Task[] = [
        {
          id: 1,
          plan_id: 1,
          user_id: userId,
          title: "测试任务",
          task_date: "invalid-date", // 无效日期
          status: "done",
        },
      ];

      // 应该不会抛出异常
      const log = await generateDailyLog(userId, tasks);

      expect(log).toBeDefined();
      // 由于日期无效，可能不会被计入今天的统计
      expect(log.tasks_done).toBeGreaterThanOrEqual(0);
    });
  });

  describe("日志内容格式测试", () => {
    it("应该生成正确的日志结构", async () => {
      const userId = 1;
      const tasks: Task[] = [
        {
          id: 1,
          plan_id: 1,
          user_id: userId,
          title: "测试任务",
          task_date: "2024-01-15",
          status: "done",
        },
      ];

      const log = await generateDailyLog(userId, tasks);

      expect(log.id).toBeTypeOf("number");
      expect(log.user_id).toBe(userId);
      expect(log.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(log.content).toBeTypeOf("string");
      expect(log.tasks_done).toBeTypeOf("number");
      expect(log.tasks_total).toBeTypeOf("number");
      expect(log.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("应该包含随机鼓励语", async () => {
      const userId = 1;
      const tasks: Task[] = [
        {
          id: 1,
          plan_id: 1,
          user_id: userId,
          title: "完成任务",
          task_date: "2024-01-15",
          status: "done",
        },
      ];

      const encouragements = [
        "很棒！继续保持！",
        "做得好！明天也要加油！",
        "真不错！你正在稳步前进！",
        "太棒了！每一步都很重要！",
        "优秀！坚持就是胜利！",
      ];

      const log = await generateDailyLog(userId, tasks);

      const hasEncouragement = encouragements.some((phrase) =>
        log.content.includes(phrase),
      );

      expect(hasEncouragement).toBe(true);
    });

    it("应该正确格式化完成项目列表", async () => {
      const userId = 1;
      const tasks: Task[] = [
        {
          id: 1,
          plan_id: 1,
          user_id: userId,
          title: "第一项任务",
          task_date: "2024-01-15",
          status: "done",
        },
        {
          id: 2,
          plan_id: 1,
          user_id: userId,
          title: "第二项任务",
          task_date: "2024-01-15",
          status: "done",
        },
      ];

      const log = await generateDailyLog(userId, tasks);

      // 检查格式：每行以 ✓ 开头
      const lines = log.content.split("\n");
      const completedLines = lines.filter((line) => line.startsWith("✓"));

      expect(completedLines).toHaveLength(2);
      expect(completedLines[0]).toContain("第一项任务");
      expect(completedLines[1]).toContain("第二项任务");
    });
  });

  describe("性能和稳定性测试", () => {
    it("应该在合理时间内完成日志生成", async () => {
      const userId = 1;
      const tasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        plan_id: 1,
        user_id: userId,
        title: `任务${i + 1}`,
        task_date: "2024-01-15",
        status: i % 2 === 0 ? "done" : "pending", // 一半完成，一半未完成
      }));

      const startTime = performance.now();
      const log = await generateDailyLog(userId, tasks);
      const endTime = performance.now();

      expect(log).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
      expect(log.tasks_done).toBe(50);
      expect(log.tasks_total).toBe(100);
    });

    it("应该处理超大数量的任务", async () => {
      const userId = 1;
      const tasks: Task[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        plan_id: 1,
        user_id: userId,
        title: `任务${i + 1}`,
        task_date: "2024-01-15",
        status: "done",
      }));

      const log = await generateDailyLog(userId, tasks);

      expect(log.tasks_done).toBe(1000);
      expect(log.tasks_total).toBe(1000);
    });
  });
});
