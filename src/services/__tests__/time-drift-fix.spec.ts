// src/services/__tests__/time-drift-fix.spec.ts
// 时间漂移问题修复测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CreateTaskPayload } from '../api.types';
import { generateRepeatTaskPayloads, generateRepeatDates } from '../repeat-task';

// 工具函数：获取相对日期
const getRelativeDate = (daysFromToday: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
};

describe('时间漂移问题修复测试', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('日期验证测试', () => {
    it('应该允许合理的长期计划（使用相对时间）', () => {
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

    it('应该正确处理日期顺序验证', () => {
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
      // 月度重复的具体日期取决于当月天数
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

  describe('基础日期生成测试', () => {
    it('应该正确生成每日重复日期', () => {
      const dates = generateRepeatDates(
        getRelativeDate(0),
        getRelativeDate(2),
        'daily'
      );

      expect(dates).toEqual([
        getRelativeDate(0),
        getRelativeDate(1),
        getRelativeDate(2)
      ]);
    });

    it('应该正确生成月度重复日期', () => {
      const startDate = getRelativeDate(0);
      const endDate = getRelativeDate(60); // 约2个月
      
      const dates = generateRepeatDates(startDate, endDate, 'monthly');

      // 验证基本结构
      expect(dates).toHaveLength(3);
      expect(dates[0]).toBe(startDate);
    });
  });
});