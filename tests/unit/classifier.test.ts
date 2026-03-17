/**
 * 意图分类器单元测试
 */

import { classifyIntent, getIntentCorps, getIntentPriority } from '../../orchestrator/intent/classifier';

describe('Intent Classifier', () => {
  describe('classifyIntent', () => {
    it('should classify code development intent', () => {
      const result = classifyIntent('帮我开发一个用户登录功能');
      expect(result.category).toBe('code_development');
      expect(result.suggestedAgent).toBe('coder');
    });

    it('should classify code review intent', () => {
      const result = classifyIntent('审查这个 PR 的代码');
      expect(result.category).toBe('code_review');
      expect(result.suggestedAgent).toBe('reviewer');
    });

    it('should classify bug fix intent', () => {
      const result = classifyIntent('修复这个 bug');
      expect(result.category).toBe('bug_fix');
    });

    it('should classify stock analysis intent', () => {
      const result = classifyIntent('分析 AAPL 这只股票');
      expect(result.category).toBe('stock_analysis');
      expect(result.entities.stocks).toContain('AAPL');
    });
  });

  describe('getIntentCorps', () => {
    it('should return work corps for coder', () => {
      const result = classifyIntent('开发一个功能');
      expect(getIntentCorps(result)).toBe('work');
    });
  });

  describe('getIntentPriority', () => {
    it('should return urgent for bug_fix', () => {
      expect(getIntentPriority('bug_fix')).toBe('urgent');
    });
  });
});
