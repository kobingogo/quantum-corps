/**
 * 执行待处理任务
 * 
 * 这个脚本在 OpenClaw 环境中运行，实际调用 sessions_spawn 执行任务
 */

import { stateManager } from './shared/core/state-manager';
import { taskDispatcher, AgentType } from './orchestrator/router/dispatcher';
import { eventBus, EventTypes } from './shared/core/event-bus';
import { createLogger } from './shared/core/logger';

const logger = createLogger('executor');

/**
 * 执行单个任务
 */
async function executeTask(taskId: string): Promise<void> {
  const task = stateManager.getTask(taskId);
  
  if (!task) {
    logger.error(`任务不存在：${taskId}`);
    return;
  }

  if (task.status !== 'pending' && task.status !== 'queued' && task.status !== 'running') {
    logger.warn(`任务状态不是 pending/queued/running: ${task.status}`, { taskId });
    return;
  }

  logger.info(`开始执行任务：${task.title}`, { taskId, type: task.type });

  try {
    // 1. 准备 spawn 参数
    const { sessionId, agentType, spawnParams } = await taskDispatcher.dispatch(task);

    logger.info(`任务已分发到 ${agentType}`, { sessionId });

    // 2. 输出 spawn 参数（供 OpenClaw 调用）
    console.log('\n========== SESSIONS_SPAWN 参数 ==========');
    console.log(JSON.stringify({
      action: 'sessions_spawn',
      params: spawnParams
    }, null, 2));
    console.log('========================================\n');

    // 3. 监听完成事件
    const unsubscribe = eventBus.subscribe(EventTypes.AGENT_COMPLETED, async (event: any) => {
      if (event.data.sessionId === sessionId) {
        logger.info(`任务完成：${task.title}`, { result: event.data.result });
        unsubscribe();
      }
    });

    const errorUnsubscribe = eventBus.subscribe(EventTypes.AGENT_ERROR, async (event: any) => {
      if (event.data.sessionId === sessionId) {
        logger.error(`任务失败：${task.title}`, { error: event.data.error });
        errorUnsubscribe();
      }
    });

  } catch (error: any) {
    logger.error(`任务执行失败：${task.title}`, { error: error.message });
    stateManager.updateTask(taskId, {
      status: 'failed',
      error: error.message,
      completedAt: Date.now(),
    });
  }
}

/**
 * 执行所有 pending 任务
 */
async function executeAllPending(): Promise<void> {
  logger.info('查找待处理任务...');
  
  const pendingTasks = stateManager.queryTasks({ 
    status: ['pending', 'queued'] 
  });

  if (pendingTasks.length === 0) {
    logger.info('没有待处理任务');
    return;
  }

  logger.info(`找到 ${pendingTasks.length} 个待处理任务`);

  // 按优先级排序
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  pendingTasks.sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // 执行任务
  for (const task of pendingTasks) {
    await executeTask(task.id);
  }
}

// 主函数
async function main() {
  try {
    await stateManager.init();
    await executeAllPending();
  } catch (error: any) {
    logger.error('执行失败', error);
    process.exit(1);
  }
}

// 如果直接运行
if (require.main === module) {
  main();
}

export { executeTask, executeAllPending };
