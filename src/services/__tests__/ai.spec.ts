// src/services/__tests__/ai.spec.ts
// AI 服务模块测试

import { describe, it, expect } from 'vitest';
import { quickValidatePlan } from '../ai';

describe('AI Service', () => {
  describe('quickValidatePlan', () => {
    it('应该检测到标题过短', () => {
      const result = quickValidatePlan({
        title: 'A',
        description: '',
        start_date: '2026-03-01',
        end_date: '2026-03-31',
      });

      const titleWarning = result.find(s => s.field === 'title');
      expect(titleWarning).toBeDefined();
      expect(titleWarning?.type).toBe('warning');
    });

    it('应该检测到日期逻辑错误', () => {
      const result = quickValidatePlan({
        title: '测试计划',
        description: '',
        start_date: '2026-01-20',
        end_date: '2026-01-15',
      });

      const dateError = result.find(s => s.field === 'start_date');
      expect(dateError).toBeDefined();
      expect(dateError?.type).toBe('warning');
    });

    it('应该检测到过期的结束日期', () => {
      const result = quickValidatePlan({
        title: '测试计划',
        description: '',
        start_date: '2020-01-01',
        end_date: '2020-12-31',
      });

      const dateError = result.find(s => s.field === 'end_date');
      expect(dateError).toBeDefined();
      expect(dateError?.type).toBe('warning');
    });

    it('合理的计划应该通过验证', () => {
      const result = quickValidatePlan({
        title: '每日学习计划',
        description: '提升技能',
        start_date: '2026-02-01',
        end_date: '2026-02-28',
      });

      expect(result).toHaveLength(0);
    });
  });
});
