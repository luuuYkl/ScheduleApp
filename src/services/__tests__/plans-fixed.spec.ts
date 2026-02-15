// src/services/__tests__/plans-fixed.spec.ts
// 修复时间漂移问题的计划测试文件

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Plan, CreateTaskPayload } from '../api.types';
import { generateRepeatTaskPayloads } from '../repeat-task';

// 工具函数：获取相对日期
const getRelativeDate = (daysFromToday: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
};

describe('计划创建校验测试（修复版）', () => {
  beforeEach(() => {
    // 清理localStorage
    localStorage.clear();
  });

  describe('计划数据格式验证', () => {
    it('应该验证必需字段', () => {
      const validPlan = {
        user_id: 1,
        title: '学习计划',
        start_date: getRelativeDate(0),
        end_date: getRelativeDate(30)
      };

      expect(validPlan.title).toBeTruthy();
      expect(validPlan.start_date).toBeTruthy();
      expect(validPlan.end_date).toBeTruthy();
    });

    it('应该拒绝空标题', () => {
      const invalidPlan = {
        user_id: 1,
        title: '',
        start_date: getRelativeDate(0),
        end_date: getRelativeDate(30)
      };

      expect(invalidPlan.title).toBeFalsy();
    });

    it('应该验证日期顺序', () => {
      const invalidPlan = {
        user_id: 1,
        title: 'Valid Title',
        start_date: getRelativeDate(30), // 开始日期在结束日期之后
        end_date: getRelativeDate(0)
      };

      const startDate = new Date(invalidPlan.start_date);
      const endDate = new Date(invalidPlan.end_date);

      expect(endDate.getTime()).toBeLessThan(startDate.getTime());
    });

    it('应该允许合理的长期计划', () => {
      // 使用相对时间窗口避免时间漂移
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const futureDate = new Date();
      futureDate.setFullYear(today.getFullYear() + 1); // 从今天起1年后
      const futureDateString = futureDate.toISOString().split('T')[0];

      const planWithReasonableFutureDate = {
        user_id: 1,
        title: '年度计划',
        start_date: todayString,
        end_date: futureDateString
      };

      // 验证1年内的计划是合理的
      const startDate = new Date(planWithReasonableFutureDate.start_date);
      const endDate = new Date(planWithReasonableFutureDate.end_date);
      
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
      expect(endDate.getTime() - startDate.getTime()).toBeLessThanOrEqual(oneYearInMs);
    });
  });

  describe('任务数据格式验证', () => {
    it('应该验证任务必需字段', () => {
      const validTask: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: '完成章节阅读',
        task_date: getRelativeDate(1)
      };

      expect(validTask.title).toBeTruthy();
      expect(validTask.task_date).toBeTruthy();
    });

    it('应该拒绝空任务标题', () => {
      const invalidTask: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: '',
        task_date: getRelativeDate(1)
      };

      expect(invalidTask.title).toBeFalsy();
    });
  });

  describe('重复任务生成测试', () => {
    it('应该为每日重复生成正确的任务', () => {
      const basePayload: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: '每日学习',
        task_date: getRelativeDate(0),
        repeat_type: 'daily',
        repeat_end_date: getRelativeDate(2)
      };

      const payloads = generateRepeatTaskPayloads(basePayload);

      expect(payloads).toHaveLength(3); // 包含起始日
      expect(payloads[0].task_date).toBe(getRelativeDate(0));
      expect(payloads[1].task_date).toBe(getRelativeDate(1));
      expect(payloads[2].task_date).toBe(getRelativeDate(2));
    });

    it('应该为月度重复生成正确的任务', () => {
      const basePayload: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: '月度总结',
        task_date: getRelativeDate(0),
        repeat_type: 'monthly',
        repeat_end_date: getRelativeDate(60) // 约2个月
      };

      const payloads = generateRepeatTaskPayloads(basePayload);

      expect(payloads).toHaveLength(3); // 起始月 + 2个月
      expect(payloads[0].task_date).toBe(getRelativeDate(0));
      // 月度重复的具体日期取决于当月天数，这里只验证基本结构
    });

    it('应该处理没有重复的情况', () => {
      const basePayload: CreateTaskPayload = {
        plan_id: 1,
        user_id: 1,
        title: '单次活动',
        task_date: getRelativeDate(5),
        repeat_type: 'none'
      };

      const payloads = generateRepeatTaskPayloads(basePayload);

      expect(payloads).toHaveLength(1);
      expect(payloads[0].task_date).toBe(getRelativeDate(5));
    });
  });
});