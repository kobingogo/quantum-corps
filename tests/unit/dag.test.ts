/**
 * DAG 工作流引擎单元测试
 */

import { dagEngine } from '../../orchestrator/planner/dag';

describe('DAG Engine', () => {
  it('should create a valid workflow', () => {
    const workflow = dagEngine.createWorkflow('Test', [
      { name: 'a', type: 'task', dependencies: [], maxRetries: 3 },
      { name: 'b', type: 'task', dependencies: ['a'], maxRetries: 3 },
    ], []);
    expect(workflow.nodes.size).toBe(2);
  });

  it('should validate correctly', () => {
    const workflow = dagEngine.createWorkflow('Test', [
      { name: 'a', type: 'task', dependencies: [], maxRetries: 3 },
    ], []);
    const result = dagEngine.validate(workflow);
    expect(result.valid).toBe(true);
  });

  it('should return correct execution order', () => {
    const workflow = dagEngine.createWorkflow('Test', [
      { name: 'first', type: 'task', dependencies: [], maxRetries: 3 },
      { name: 'second', type: 'task', dependencies: ['first'], maxRetries: 3 },
    ], []);
    const order = dagEngine.getExecutionOrder(workflow);
    expect(order[0]).toBe('first');
    expect(order[1]).toBe('second');
  });
});
