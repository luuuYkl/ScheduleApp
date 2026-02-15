// src/services/__tests__/monthly-repeat-fix.spec.ts
// 月度重复任务算法修复验证测试

import { describe, it, expect } from 'vitest';
import { generateRepeatDates } from '../repeat-task';

describe('月度重复任务算法修复测试', () => {
  describe('月末日期处理', () => {
    it('应该正确处理1月31日的月度重复', () => {
      const startDate = '2024-01-31';
      const endDate = '2024-04-30';
      const repeatType = 'monthly' as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual([
        '2024-01-31',
        '2024-02-29', // 2024年2月有29天（闰年）
        '2024-03-31', // 3月有31天
        '2024-04-30'  // 4月只有30天，裁剪到30日
      ]);
      expect(dates).toHaveLength(4);
    });

    it('应该正确处理跨年月末日期', () => {
      const startDate = '2023-12-31';
      const endDate = '2024-03-31';
      const repeatType = 'monthly' as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual([
        '2023-12-31',
        '2024-01-31', // 1月有31天
        '2024-02-29', // 2024年2月有29天（闰年）
        '2024-03-31'  // 3月有31天
      ]);
      expect(dates).toHaveLength(4);
    });

    it('应该处理平年2月28日的情况', () => {
      const startDate = '2023-01-31'; // 平年
      const endDate = '2023-03-31';
      const repeatType = 'monthly' as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual([
        '2023-01-31',
        '2023-02-28', // 平年2月只有28天
        '2023-03-31'  // 3月有31天
      ]);
      expect(dates).toHaveLength(3);
    });
  });

  describe('月中日期处理', () => {
    it('应该正确处理月中日期的重复', () => {
      const startDate = '2024-01-15';
      const endDate = '2024-04-15';
      const repeatType = 'monthly' as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual([
        '2024-01-15',
        '2024-02-15',
        '2024-03-15',
        '2024-04-15'
      ]);
      expect(dates).toHaveLength(4);
    });

    it('应该处理不同月份天数差异', () => {
      const startDate = '2024-01-30';
      const endDate = '2024-04-30';
      const repeatType = 'monthly' as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual([
        '2024-01-30',
        '2024-02-29', // 2月闰年29天
        '2024-03-30', // 3月有31天，所以30日有效
        '2024-04-30'  // 4月有30天
      ]);
      expect(dates).toHaveLength(4);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理月初日期', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-03-01';
      const repeatType = 'monthly' as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual([
        '2024-01-01',
        '2024-02-01',
        '2024-03-01'
      ]);
      expect(dates).toHaveLength(3);
    });

    it('应该处理连续月末的情况', () => {
      const startDate = '2024-01-31';
      const endDate = '2024-01-31'; // 同一天
      const repeatType = 'monthly' as const;

      const dates = generateRepeatDates(startDate, endDate, repeatType);

      expect(dates).toEqual(['2024-01-31']);
      expect(dates).toHaveLength(1);
    });
  });

  describe('算法正确性验证', () => {
    it('应该避免产生不存在的日期', () => {
      // 测试各种可能导致错误日期的场景
      const testCases = [
        { start: '2024-01-31', end: '2024-02-28', expectedLength: 2 },
        { start: '2023-01-31', end: '2023-02-28', expectedLength: 2 }, // 平年
        { start: '2024-03-31', end: '2024-04-30', expectedLength: 2 },
        { start: '2024-05-31', end: '2024-06-30', expectedLength: 2 }
      ];

      testCases.forEach(({ start, end, expectedLength }) => {
        const dates = generateRepeatDates(start, end, 'monthly');
        expect(dates).toHaveLength(expectedLength);
        
        // 验证所有生成的日期都是有效的
        dates.forEach(date => {
          const dateObj = new Date(date);
          expect(dateObj instanceof Date).toBe(true);
          expect(!isNaN(dateObj.getTime())).toBe(true);
        });
      });
    });
  });
});