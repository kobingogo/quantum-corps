/**
 * 优先级调度器 - 智能任务调度
 */

import { stateManager, Task } from '../../shared/core/state-manager';
import { eventBus, EventTypes } from '../../shared/core/event-bus';
import { createLogger } from '../../shared/core/logger';
import { taskDispatcher } from '../router/dispatcher';

const logger = createLogger('priority-scheduler');

type Priority = 'urgent' | 'high' | 'medium' | 'low';

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  urgent: 100,
  high: 75,
  medium: 50,
  low: 25,
};

interface ScheduledTask extends Task {
  score: number;
  waitTime: number;
}

class PriorityScheduler {
  private schedulingInterval: NodeJS.Timeout | null = null;
  private maxConcurrentTasks = 10;

  startScheduling(checkIntervalMs = 5000) {
    logger.info('优先级调度器已启动', { interval: checkIntervalMs });
    this.schedulingInterval = setInterval(() => {
      this.scheduleNextTasks();
    }, checkIntervalMs);
  }

  stopScheduling() {
    if (this.schedulingInterval) {
      clearInterval(this.schedulingInterval);
      this.schedulingInterval = null;
    }
    logger.info('优先级调度器已停止');
  }

  private scheduleNextTasks() {
    const activeAgents = taskDispatcher.getActiveAgents();
    const availableSlots = this.maxConcurrentTasks - activeAgents.length;

    if (availableSlots <= 0) {
      logger.debug('无可用 Agent 槽位', { active: activeAgents.length, max: this.maxConcurrentTasks });
      return;
    }

    // 获取待处理任务
    const pendingTasks = stateManager.queryTasks({ 
      status: ['pending', 'queued'] 
    });

    if (pendingTasks.length === 0) {
      return;
    }

    // 计算优先级分数
    const scoredTasks = pendingTasks.map(task => ({
      ...task,
      score: this.calculatePriorityScore(task),
      waitTime: Date.now() - task.createdAt,
    }));

    // 按分数排序
    scoredTasks.sort((a, b) => b.score - a.score);

    // 调度前 N 个任务
    const tasksToSchedule = scoredTasks.slice(0, availableSlots);

    for (const task of tasksToSchedule) {
      this.executeTask(task);
    }
  }

  private calculatePriorityScore(task: Task): number {
    const priorityWeight = PRIORITY_WEIGHTS[task.priority] || 50;
    const waitTimeBonus = Math.min((Date.now() - task.createdAt) / (1000 * 60), 50); // 最多 50 分等待时间奖励
    const retryPenalty = task.retryCount * 10;

    return priorityWeight + waitTimeBonus - retryPenalty;
  }

  private async executeTask(task: ScheduledTask) {
    try {
      logger.info(`调度任务：${task.title}`, { 
        taskId: task.id, 
        priority: task.priority, 
        score: task.score.toFixed(1) 
      });

      const { sessionId, spawnParams } = await taskDispatcher.dispatch(task);

      // 输出 spawn 参数供 OpenClaw 使用
      console.log(`\n========== SPAWN COMMAND ==========`);
      console.log(JSON.stringify({
        action: 'sessions_spawn',
        params: spawnParams
      }, null, 2));
      console.log(`===================================\n`);

      await eventBus.emit(EventTypes.TASK_STARTED, { taskId: task.id, sessionId });

    } catch (error: any) {
      logger.error(`任务调度失败：${task.title}`, { error: error.message });
      stateManager.updateTask(task.id, { 
        status: 'failed', 
        error: error.message,
        completedAt: Date.now(),
      });
    }
  }

  getQueueStatus() {
    const tasks = stateManager.queryTasks();
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      queued: tasks.filter(t => t.status === 'queued').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      activeAgents: taskDispatcher.getActiveAgents().length,
      maxConcurrent: this.maxConcurrentTasks,
    };
  }
}

export const priorityScheduler = new PriorityScheduler();
