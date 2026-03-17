/**
 * 监控告警系统 v1.0
 * 
 * 功能:
 * 1. 任务执行监控
 * 2. Agent 状态监控
 * 3. 性能指标收集
 * 4. 告警通知
 */

import { eventBus, EventTypes } from './event-bus';
import { createLogger } from './logger';

const logger = createLogger('monitor');

// 指标类型
interface Metrics {
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
  tasksRunning: number;
  avgExecutionTime: number;
  successRate: number;
  agentsActive: number;
  queueLength: number;
}

// 告警规则
interface AlertRule {
  name: string;
  condition: (metrics: Metrics) => boolean;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  cooldown: number; // 冷却时间（毫秒）
  lastTriggered?: number;
}

// 默认告警规则
const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    name: 'high_failure_rate',
    condition: (m) => m.tasksTotal > 10 && m.successRate < 0.8,
    severity: 'warning',
    message: '任务失败率过高 (>20%)',
    cooldown: 300000, // 5 分钟
  },
  {
    name: 'long_running_task',
    condition: (m) => m.avgExecutionTime > 600000, // 10 分钟
    severity: 'info',
    message: '平均任务执行时间过长',
    cooldown: 600000,
  },
  {
    name: 'queue_backlog',
    condition: (m) => m.queueLength > 20,
    severity: 'warning',
    message: '任务队列积压严重',
    cooldown: 300000,
  },
  {
    name: 'no_active_agents',
    condition: (m) => m.agentsActive === 0 && m.tasksRunning > 0,
    severity: 'critical',
    message: '没有活跃的 Agent 但有运行中的任务',
    cooldown: 60000,
  },
];

class Monitor {
  private metrics: Metrics = {
    tasksTotal: 0,
    tasksCompleted: 0,
    tasksFailed: 0,
    tasksRunning: 0,
    avgExecutionTime: 0,
    successRate: 1,
    agentsActive: 0,
    queueLength: 0,
  };
  
  private alertRules: AlertRule[] = DEFAULT_ALERT_RULES;
  private executionTimes: number[] = [];
  private maxExecutionTimes = 100; // 保留最近 100 个

  constructor() {
    this.setupEventListeners();
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    eventBus.subscribe(EventTypes.TASK_CREATED, () => {
      this.metrics.tasksTotal++;
      this.metrics.queueLength++;
    });

    eventBus.subscribe(EventTypes.TASK_STARTED, () => {
      this.metrics.queueLength = Math.max(0, this.metrics.queueLength - 1);
      this.metrics.tasksRunning++;
    });

    eventBus.subscribe(EventTypes.TASK_COMPLETED, (event: any) => {
      this.metrics.tasksRunning = Math.max(0, this.metrics.tasksRunning - 1);
      this.metrics.tasksCompleted++;
      this.updateSuccessRate();
      if (event.data?.duration) {
        this.recordExecutionTime(event.data.duration);
      }
    });

    eventBus.subscribe(EventTypes.TASK_FAILED, () => {
      this.metrics.tasksRunning = Math.max(0, this.metrics.tasksRunning - 1);
      this.metrics.tasksFailed++;
      this.updateSuccessRate();
    });

    eventBus.subscribe(EventTypes.AGENT_SPAWNED, () => {
      this.metrics.agentsActive++;
    });

    eventBus.subscribe(EventTypes.AGENT_COMPLETED, () => {
      this.metrics.agentsActive = Math.max(0, this.metrics.agentsActive - 1);
    });

    logger.info('监控系统已启动');
  }

  /**
   * 更新成功率
   */
  private updateSuccessRate(): void {
    const total = this.metrics.tasksCompleted + this.metrics.tasksFailed;
    if (total > 0) {
      this.metrics.successRate = this.metrics.tasksCompleted / total;
    }
  }

  /**
   * 记录执行时间
   */
  private recordExecutionTime(time: number): void {
    this.executionTimes.push(time);
    if (this.executionTimes.length > this.maxExecutionTimes) {
      this.executionTimes.shift();
    }
    this.metrics.avgExecutionTime = 
      this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length;
  }

  /**
   * 获取当前指标
   */
  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  /**
   * 检查告警规则
   */
  checkAlerts(): Array<{ rule: string; severity: string; message: string }> {
    const alerts: Array<{ rule: string; severity: string; message: string }> = [];
    const now = Date.now();

    for (const rule of this.alertRules) {
      // 检查冷却时间
      if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldown) {
        continue;
      }

      if (rule.condition(this.metrics)) {
        rule.lastTriggered = now;
        alerts.push({
          rule: rule.name,
          severity: rule.severity,
          message: rule.message,
        });

        logger.warn(`告警触发: ${rule.name}`, { severity: rule.severity });
      }
    }

    return alerts;
  }

  /**
   * 添加自定义告警规则
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * 获取健康状态
   */
  getHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const alerts = this.checkAlerts();
    
    if (alerts.some(a => a.severity === 'critical')) {
      return 'unhealthy';
    }
    if (alerts.some(a => a.severity === 'warning')) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * 重置指标
   */
  reset(): void {
    this.metrics = {
      tasksTotal: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      tasksRunning: 0,
      avgExecutionTime: 0,
      successRate: 1,
      agentsActive: 0,
      queueLength: 0,
    };
    this.executionTimes = [];
    logger.info('监控指标已重置');
  }
}

export const monitor = new Monitor();
export type { Metrics, AlertRule };
