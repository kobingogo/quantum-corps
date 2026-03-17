/**
 * 事件总线 - Agent 间异步通信
 *
 * 支持发布/订阅模式，实现 Agent 间解耦通信
 */

type EventHandler<T = any> = (event: T) => void | Promise<void>;

interface EventSubscription {
  id: string;
  event: string;
  handler: EventHandler;
}

interface EventPayload {
  type: string;
  data: any;
  timestamp: number;
  source?: string;
  target?: string;
}

class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventLog: EventPayload[] = [];
  private maxLogSize = 1000;

  /**
   * 订阅事件
   */
  subscribe<T = any>(event: string, handler: EventHandler<T>): () => void {
    const id = `sub_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}`;

    const subscription: EventSubscription = {
      id,
      event,
      handler: handler as EventHandler,
    };

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }
    this.subscriptions.get(event)!.push(subscription);

    return () => {
      const subs = this.subscriptions.get(event);
      if (subs) {
        const index = subs.findIndex((s) => s.id === id);
        if (index !== -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  /**
   * 发布事件
   */
  async emit(type: string, data: any, options?: { source?: string; target?: string }): Promise<void> {
    const payload: EventPayload = {
      type,
      data,
      timestamp: Date.now(),
      source: options?.source,
      target: options?.target,
    };

    this.eventLog.push(payload);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    const handlers = this.subscriptions.get(type) || [];
    const wildcardHandlers = this.subscriptions.get("*") || [];
    const allHandlers = [...handlers, ...wildcardHandlers];

    await Promise.all(
      allHandlers.map(async (sub) => {
        try {
          await sub.handler(payload);
        } catch (error) {
          console.error(`[EventBus] Handler error for \${type}:`, error);
        }
      }),
    );
  }

  getEventLog(filter?: { type?: string; since?: number }): EventPayload[] {
    let log = this.eventLog;
    if (filter?.type) log = log.filter((e) => e.type === filter.type);
    if (filter?.since) log = log.filter((e) => e.timestamp >= (filter.since || 0));
    return log;
  }

  clear(): void {
    this.subscriptions.clear();
  }
}

export const eventBus = new EventBus();

export const EventTypes = {
  TASK_CREATED: "task:created",
  TASK_STARTED: "task:started",
  TASK_PROGRESS: "task:progress",
  TASK_COMPLETED: "task:completed",
  TASK_FAILED: "task:failed",
  AGENT_SPAWNED: "agent:spawned",
  AGENT_MESSAGE: "agent:message",
  AGENT_ERROR: "agent:error",
  AGENT_COMPLETED: "agent:completed",
  WORKFLOW_STARTED: "workflow:started",
  WORKFLOW_NODE_STARTED: "workflow:node:started",
  WORKFLOW_NODE_COMPLETED: "workflow:node:completed",
  WORKFLOW_COMPLETED: "workflow:completed",
  SYSTEM_ALERT: "system:alert",
  SYSTEM_ERROR: "system:error",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];
