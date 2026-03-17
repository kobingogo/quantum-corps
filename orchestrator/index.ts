/**
 * 编排层主入口
 */

export * from './intent/classifier';
export * from './planner/dag';
export * from './planner/scheduler';
export * from './router/dispatcher';

import { classifyIntent, getIntentCorps, getIntentPriority, IntentResult } from './intent/classifier';
import { dagEngine, DAGWorkflow } from './planner/dag';
import { taskScheduler } from './planner/scheduler';
import { taskDispatcher } from './router/dispatcher';
import { eventBus, EventTypes } from '../shared/core/event-bus';
import { stateManager, Task } from '../shared/core/state-manager';
import { createLogger } from '../shared/core/logger';

const logger = createLogger('orchestrator');

/**
 * 编排器主类 - 协调整个流程
 */
export class Orchestrator {
  /**
   * 处理用户请求（主入口）
   */
  async processRequest(text: string, context?: any): Promise<Task> {
    logger.info(`Processing request`, { text: text.substring(0, 100) });

    // 1. 意图识别
    const intent = classifyIntent(text);
    logger.info(`Intent classified`, { category: intent.category, confidence: intent.confidence });

    // 2. 创建任务
    const task = stateManager.createTask({
      type: intent.category,
      title: text.substring(0, 100),
      description: text,
      status: 'pending',
      priority: getIntentPriority(intent.category),
      input: { text, intent, context },
      maxRetries: 3,
    });

    // 3. 根据意图类型决定处理方式
    const corps = getIntentCorps(intent);
    
    if (corps === 'main') {
      // 直接处理（不需要派发给 Agent）
      return this.handleDirectly(task, intent);
    }

    // 4. 调度任务
    await taskScheduler.schedule(task);

    // 5. 分发给 Agent
    await taskDispatcher.dispatch(task);

    return task;
  }

  /**
   * 直接处理（不派发 Agent）
   */
  private async handleDirectly(task: Task, intent: IntentResult): Promise<Task> {
    task.status = 'running';
    task.startedAt = Date.now();

    // 这里可以直接调用 OpenClaw 主模型处理
    // 或者调用特定 skill

    task.status = 'completed';
    task.completedAt = Date.now();
    task.output = { response: '直接处理完成' };

    stateManager.updateTask(task.id, task);
    return task;
  }

  /**
   * 创建工作流
   */
  async createWorkflow(
    name: string,
    nodes: Array<{ name: string; type: string; agent?: string; dependencies?: string[] }>,
    edges?: Array<{ from: string; to: string }>
  ): Promise<DAGWorkflow> {
    logger.info(`Creating workflow: ${name}`, { nodeCount: nodes.length });

    // 自动生成边（基于依赖）
    const autoEdges = edges || [];
    if (!edges) {
      nodes.forEach((node, i) => {
        if (node.dependencies) {
          node.dependencies.forEach(dep => {
            autoEdges.push({ from: dep, to: node.name });
          });
        }
      });
    }

    const workflow = dagEngine.createWorkflow(
      name,
      nodes.map(n => ({ ...n, dependencies: n.dependencies || [] })),
      autoEdges
    );

    // 验证
    const validation = dagEngine.validate(workflow);
    if (!validation.valid) {
      throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
    }

    return workflow;
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(workflow: DAGWorkflow): Promise<void> {
    logger.info(`Executing workflow: ${workflow.name}`);
    workflow.status = 'running';
    workflow.startedAt = Date.now();

    await eventBus.emit(EventTypes.WORKFLOW_STARTED, { workflow });

    // 获取执行顺序
    const order = dagEngine.getExecutionOrder(workflow);

    for (const nodeId of order) {
      const node = workflow.nodes.get(nodeId);
      if (!node) continue;

      // 标记开始
      dagEngine.startNode(workflow, nodeId);
      await eventBus.emit(EventTypes.WORKFLOW_NODE_STARTED, { workflow, node });

      try {
        // 创建并调度任务
        const task = stateManager.createTask({
          type: node.type,
          title: node.name,
          status: 'pending',
          priority: 'medium',
          input: node.input,
          agent: node.agent,
          workflow: workflow.id,
          maxRetries: 3,
        });

        // 分发给 Agent
        await taskDispatcher.dispatch(task);

        // 等待完成（实际应该监听事件）
        // 这里简化处理
        dagEngine.completeNode(workflow, nodeId, { taskId: task.id });
        await eventBus.emit(EventTypes.WORKFLOW_NODE_COMPLETED, { workflow, node });

      } catch (error: any) {
        dagEngine.completeNode(workflow, nodeId, undefined, error.message);
      }
    }

    await eventBus.emit(EventTypes.WORKFLOW_COMPLETED, { workflow });
  }

  /**
   * 获取系统状态
   */
  getStatus(): {
    scheduler: ReturnType<typeof taskScheduler.getStatus>;
    activeAgents: ReturnType<typeof taskDispatcher.getActiveAgents>;
    tasks: {
      pending: number;
      running: number;
      completed: number;
      failed: number;
    };
  } {
    const allTasks = stateManager.queryTasks();
    
    return {
      scheduler: taskScheduler.getStatus(),
      activeAgents: taskDispatcher.getActiveAgents(),
      tasks: {
        pending: allTasks.filter(t => t.status === 'pending' || t.status === 'queued').length,
        running: allTasks.filter(t => t.status === 'running').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        failed: allTasks.filter(t => t.status === 'failed').length,
      },
    };
  }
}

// 单例
export const orchestrator = new Orchestrator();

/**
 * 监听子 Agent 完成事件并更新状态
 */
async function handleSubagentCompletion(sessionKey: string, result: any): Promise<void> {
  logger.info(`子 Agent 完成`, { sessionKey, result });
  
  // 从 sessionKey 提取任务 ID
  const match = sessionKey.match(/subagent:[^:]+:([^:]+)/);
  if (!match) return;
  
  // 更新任务状态
  const tasks = stateManager.queryTasks({ status: 'running' });
  if (tasks.length > 0) {
    const task = tasks[0]; // 简化：更新第一个运行中任务
    stateManager.updateTask(task.id, {
      status: 'completed',
      output: result,
      completedAt: Date.now(),
    });
    
    logger.info(`任务完成：${task.title}`, { taskId: task.id });
  }
}

// 导出供外部调用
export { handleSubagentCompletion };
