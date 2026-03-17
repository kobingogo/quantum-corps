/**
 * 任务调度器 - 管理任务队列和执行
 */

import { eventBus, EventTypes } from '../../shared/core/event-bus';
import { stateManager, Task, TaskStatus } from '../../shared/core/state-manager';
import { createLogger } from '../../shared/core/logger';
import { dagEngine, DAGWorkflow } from './dag';

const logger = createLogger('scheduler');

export interface ScheduledTask extends Task {
  scheduledAt?: number;
  executionTimeout?: number;
}

class TaskScheduler {
  private queue: ScheduledTask[] = [];
  private running: Map<string, ScheduledTask> = new Map();
  private maxConcurrent: number;
  private isProcessing: boolean = false;

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * 添加任务到队列
   */
  async schedule(task: ScheduledTask): Promise<string> {
    const scheduledTask: ScheduledTask = {
      ...task,
      scheduledAt: Date.now(),
      status: 'queued',
    };

    // 根据优先级插入队列
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.queue.findIndex(
      t => priorityOrder[t.priority] > priorityOrder[task.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(scheduledTask);
    } else {
      this.queue.splice(insertIndex, 0, scheduledTask);
    }

    logger.info(`Task scheduled: ${task.id}`, { priority: task.priority, queuePosition: insertIndex === -1 ? this.queue.length : insertIndex + 1 });

    // 触发事件
    await eventBus.emit(EventTypes.TASK_CREATED, { task: scheduledTask });

    // 尝试处理队列
    this.processQueue();

    return task.id;
  }

  /**
   * 处理任务队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
      const task = this.queue.shift();
      if (task) {
        this.executeTask(task);
      }
    }

    this.isProcessing = false;
  }

  /**
   * 执行任务
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    this.running.set(task.id, task);
    task.status = 'running';
    task.startedAt = Date.now();

    logger.info(`Task started: ${task.id}`, { type: task.type, agent: task.agent });
    await eventBus.emit(EventTypes.TASK_STARTED, { task });

    try {
      // 这里实际执行由 Router 分发给 Agent
      // Scheduler 只负责调度，不负责具体执行

      // 设置超时
      const timeout = task.executionTimeout || 5 * 60 * 1000; // 默认 5 分钟
      const timeoutId = setTimeout(() => {
        if (this.running.has(task.id)) {
          this.failTask(task, new Error('Task execution timeout'));
        }
      }, timeout);

      // 存储 timeout ID 以便取消
      (task as any).timeoutId = timeoutId;

    } catch (error: any) {
      await this.failTask(task, error);
    }
  }

  /**
   * 完成任务
   */
  async completeTask(taskId: string, output: any): Promise<void> {
    const task = this.running.get(taskId);
    if (!task) {
      logger.warn(`Attempted to complete unknown task: ${taskId}`);
      return;
    }

    // 清除超时
    if ((task as any).timeoutId) {
      clearTimeout((task as any).timeoutId);
    }

    task.status = 'completed';
    task.completedAt = Date.now();
    task.output = output;

    this.running.delete(taskId);

    logger.info(`Task completed: ${taskId}`, { duration: task.completedAt - (task.startedAt || 0) });
    await eventBus.emit(EventTypes.TASK_COMPLETED, { task, output });

    // 继续处理队列
    this.processQueue();
  }

  /**
   * 任务失败
   */
  async failTask(task: ScheduledTask, error: Error): Promise<void> {
    // 清除超时
    if ((task as any).timeoutId) {
      clearTimeout((task as any).timeoutId);
    }

    task.status = 'failed';
    task.completedAt = Date.now();
    task.error = error.message;

    // 检查是否需要重试
    if (task.retryCount < task.maxRetries) {
      task.retryCount++;
      task.status = 'queued';
      logger.warn(`Task failed, retrying: ${task.id}`, { retryCount: task.retryCount, error: error.message });
      this.queue.push(task);
    } else {
      this.running.delete(task.id);
      logger.error(`Task failed: ${task.id}`, error);
      await eventBus.emit(EventTypes.TASK_FAILED, { task, error: error.message });
    }

    this.processQueue();
  }

  /**
   * 获取队列状态
   */
  getStatus(): {
    queueLength: number;
    runningCount: number;
    maxConcurrent: number;
    queueByPriority: Record<string, number>;
  } {
    const queueByPriority: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 };

    for (const task of this.queue) {
      queueByPriority[task.priority]++;
    }

    return {
      queueLength: this.queue.length,
      runningCount: this.running.size,
      maxConcurrent: this.maxConcurrent,
      queueByPriority,
    };
  }

  /**
   * 取消任务
   */
  cancel(taskId: string): boolean {
    // 从队列中移除
    const queueIndex = this.queue.findIndex(t => t.id === taskId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      logger.info(`Task cancelled from queue: ${taskId}`);
      return true;
    }

    // 如果正在运行，标记为取消
    const running = this.running.get(taskId);
    if (running) {
      running.status = 'cancelled';
      if ((running as any).timeoutId) {
        clearTimeout((running as any).timeoutId);
      }
      this.running.delete(taskId);
      logger.info(`Running task cancelled: ${taskId}`);
      return true;
    }

    return false;
  }
}

export const taskScheduler = new TaskScheduler();
