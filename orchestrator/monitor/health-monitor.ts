/**
 * 健康监控模块 - 实时监控系统状态
 */

import { createLogger } from '../../shared/core/logger';
import { stateManager } from '../../shared/core/state-manager';
import { eventBus, EventTypes } from '../../shared/core/event-bus';
import { taskDispatcher } from '../router/dispatcher';

const logger = createLogger('health-monitor');

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  activeTasks: number;
  queuedTasks: number;
  failedTasks: number;
  agentLoad: Record<string, number>;
  avgResponseTime: number;
  lastCheck: number;
}

class HealthMonitor {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private alertThresholds = {
    maxQueuedTasks: 50,
    maxFailedTasks: 10,
    maxAgentLoad: 0.8,
    maxResponseTime: 30000,
  };

  startMonitoring(checkIntervalMs = 30000) {
    logger.info('健康监控已启动', { interval: checkIntervalMs });

    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, checkIntervalMs);

    // 订阅关键事件
    eventBus.subscribe(EventTypes.TASK_FAILED, (event) => {
      this.handleTaskFailure(event.data);
    });

    eventBus.subscribe(EventTypes.AGENT_ERROR, (event) => {
      this.handleAgentError(event.data);
    });
  }

  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    logger.info('健康监控已停止');
  }

  getHealth(): SystemHealth {
    const tasks = stateManager.queryTasks();
    const activeTasks = tasks.filter(t => t.status === 'running').length;
    const queuedTasks = tasks.filter(t => t.status === 'queued' || t.status === 'pending').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;
    const agentLoad = taskDispatcher.getAgentLoad();

    let status: SystemHealth['status'] = 'healthy';
    if (queuedTasks > this.alertThresholds.maxQueuedTasks || failedTasks > this.alertThresholds.maxFailedTasks) {
      status = 'degraded';
    }
    if (failedTasks > this.alertThresholds.maxFailedTasks * 2) {
      status = 'critical';
    }

    return {
      status,
      activeTasks,
      queuedTasks,
      failedTasks,
      agentLoad,
      avgResponseTime: 0,
      lastCheck: Date.now(),
    };
  }

  private checkHealth() {
    const health = this.getHealth();
    logger.debug('健康检查', health);

    if (health.status === 'critical') {
      this.sendAlert('CRITICAL', `系统状态危急：${health.failedTasks} 个任务失败，${health.queuedTasks} 个任务排队`);
    } else if (health.status === 'degraded') {
      logger.warn('系统状态降级', { queuedTasks: health.queuedTasks, failedTasks: health.failedTasks });
    }
  }

  private handleTaskFailure(data: any) {
    logger.warn('任务失败', data);
    const health = this.getHealth();
    if (health.failedTasks > this.alertThresholds.maxFailedTasks) {
      this.sendAlert('WARNING', `任务失败数超过阈值：${health.failedTasks}`);
    }
  }

  private handleAgentError(data: any) {
    logger.error('Agent 错误', data);
  }

  private sendAlert(level: string, message: string) {
    logger.error(`[${level}] ${message}`);
    // 可以集成通知系统（飞书、邮件等）
    eventBus.emit(EventTypes.SYSTEM_ALERT, { level, message, timestamp: Date.now() });
  }
}

export const healthMonitor = new HealthMonitor();
