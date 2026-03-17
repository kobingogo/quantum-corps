/**
 * 任务分发器 v3.0 - 增强版
 * 支持真实任务执行、自动重试、并发控制
 */

import { eventBus, EventTypes } from '../../shared/core/event-bus';
import { stateManager, Task } from '../../shared/core/state-manager';
import { createLogger } from '../../shared/core/logger';

const logger = createLogger('dispatcher');

export type AgentType = 
  | 'architect' | 'coder' | 'reviewer' | 'tester'
  | 'scout' | 'builder' | 'marketer' | 'operator'
  | 'analyst' | 'researcher' | 'strategist' | 'executor';

interface AgentConfig {
  runtime: 'acp' | 'subagent';
  agentId?: string;
  skills: string[];
  defaultTimeout: number;
  maxTimeout: number;
  maxConcurrency: number;
}

const AGENT_CONFIG: Record<AgentType, AgentConfig> = {
  architect: { runtime: 'acp', agentId: 'claude-code', skills: ['coding-agent'], defaultTimeout: 600, maxTimeout: 1800, maxConcurrency: 2 },
  coder: { runtime: 'acp', agentId: 'claude-code', skills: ['coding-agent'], defaultTimeout: 1800, maxTimeout: 3600, maxConcurrency: 3 },
  reviewer: { runtime: 'acp', agentId: 'claude-code', skills: ['coding-agent'], defaultTimeout: 600, maxTimeout: 1200, maxConcurrency: 5 },
  tester: { runtime: 'acp', agentId: 'claude-code', skills: ['coding-agent'], defaultTimeout: 900, maxTimeout: 1800, maxConcurrency: 3 },
  scout: { runtime: 'subagent', skills: ['blogwatcher'], defaultTimeout: 600, maxTimeout: 1200, maxConcurrency: 5 },
  builder: { runtime: 'acp', agentId: 'claude-code', skills: ['coding-agent'], defaultTimeout: 1800, maxTimeout: 3600, maxConcurrency: 2 },
  marketer: { runtime: 'subagent', skills: ['gog'], defaultTimeout: 600, maxTimeout: 900, maxConcurrency: 5 },
  operator: { runtime: 'subagent', skills: ['gog'], defaultTimeout: 600, maxTimeout: 900, maxConcurrency: 5 },
  analyst: { runtime: 'subagent', skills: ['gog'], defaultTimeout: 900, maxTimeout: 1800, maxConcurrency: 3 },
  researcher: { runtime: 'subagent', skills: ['gog'], defaultTimeout: 900, maxTimeout: 1800, maxConcurrency: 3 },
  strategist: { runtime: 'subagent', skills: ['gog'], defaultTimeout: 600, maxTimeout: 1200, maxConcurrency: 5 },
  executor: { runtime: 'subagent', skills: ['gog'], defaultTimeout: 300, maxTimeout: 600, maxConcurrency: 10 },
};

export class TaskDispatcher {
  private activeSessions = new Map<string, { taskId: string; agentType: AgentType; startTime: number }>();
  private agentLoad = new Map<AgentType, number>();

  async dispatch(task: Task, options?: { timeoutSeconds?: number; thread?: boolean; cwd?: string }) {
    const agentType = this.determineAgent(task);
    const config = AGENT_CONFIG[agentType];

    if (!config) throw new Error(`Unknown agent type: ${agentType}`);

    const currentLoad = this.agentLoad.get(agentType) || 0;
    if (currentLoad >= config.maxConcurrency) {
      logger.warn(`Agent ${agentType} 已达最大并发数`, { current: currentLoad, max: config.maxConcurrency });
      stateManager.updateTask(task.id, { status: 'queued' });
      throw new Error(`Agent ${agentType} busy`);
    }

    logger.info(`分发任务到 Agent: ${agentType}`, { taskId: task.id });

    const prompt = this.buildPrompt(agentType, task);
    const timeoutSeconds = Math.min(options?.timeoutSeconds || config.defaultTimeout, config.maxTimeout);
    const sessionId = `session_${agentType}_${Date.now()}`;

    const spawnParams = {
      runtime: config.runtime,
      agentId: config.agentId,
      task: prompt,
      mode: 'run' as const,
      label: `${agentType}-${task.id}`,
      timeoutSeconds,
      thread: options?.thread,
      cwd: options?.cwd || '/Users/bingo/openclaw_all',
    };

    this.activeSessions.set(sessionId, { taskId: task.id, agentType, startTime: Date.now() });
    this.agentLoad.set(agentType, currentLoad + 1);

    stateManager.updateTask(task.id, { agent: agentType, status: 'running', startedAt: Date.now() });
    await eventBus.emit(EventTypes.AGENT_SPAWNED, { sessionId, agentType, taskId: task.id, spawnParams });

    logger.info(`Agent 已启动`, { sessionId, agentType, timeoutSeconds });
    return { sessionId, agentType, spawnParams };
  }

  private determineAgent(task: Task): AgentType {
    const typeToAgent: Record<string, AgentType> = {
      'code_development': 'coder', 'code_review': 'reviewer', 'bug_fix': 'coder',
      'documentation': 'architect', 'refactoring': 'coder', 'testing': 'tester',
      'opportunity_scan': 'scout', 'product_idea': 'builder', 'market_analysis': 'analyst',
      'stock_analysis': 'analyst', 'crypto_analysis': 'analyst', 'investment_research': 'researcher',
    };
    return typeToAgent[task.type] || 'coder';
  }

  private buildPrompt(agentType: AgentType, task: Task): string {
    const templates: Record<AgentType, (t: Task) => string> = {
      architect: (t) => `作为架构师，请分析并设计：\n\n任务：${t.title}\n描述：${t.description || '无'}\n输入：${JSON.stringify(t.input || {}, null, 2)}\n\n请提供:\n1. 架构设计图\n2. 技术选型\n3. 模块划分\n4. 接口定义`,
      coder: (t) => `作为开发者，请实现：\n\n任务：${t.title}\n描述：${t.description || '无'}\n输入：${JSON.stringify(t.input || {}, null, 2)}\n\n请提供:\n1. 核心代码\n2. 单元测试\n3. 使用文档`,
      reviewer: (t) => `作为代码审查员，请审查：\n\n任务：${t.title}\n输入：${JSON.stringify(t.input || {}, null, 2)}\n\n请提供:\n1. 代码质量评分\n2. 潜在问题\n3. 改进建议`,
      tester: (t) => `作为测试工程师，请编写测试：\n\n任务：${t.title}\n描述：${t.description || '无'}\n\n请提供:\n1. 测试用例\n2. 测试代码\n3. 覆盖率分析`,
      scout: (t) => `作为机会侦察兵，请扫描机会：\n\n主题：${t.title}\n详情：${t.description || '无'}\n\n请提供:\n1. 市场机会列表\n2. 竞争分析\n3. 可行性评估\n4. 行动建议`,
      builder: (t) => `作为产品构建者，请构建 MVP：\n\n产品：${t.title}\n需求：${t.description || '无'}\n\n请提供实现方案。`,
      marketer: (t) => `作为营销专家，请制定策略：\n\n产品：${t.title}\n详情：${t.description || '无'}\n\n请提供营销方案。`,
      operator: (t) => `作为运营专家，请规划活动：\n\n活动：${t.title}\n目标：${t.description || '无'}\n\n请提供运营方案。`,
      analyst: (t) => `作为市场分析师，请分析：\n\n分析对象：${t.title}\n数据：${JSON.stringify(t.input || {}, null, 2)}\n\n请提供分析报告。`,
      researcher: (t) => `作为投资研究员，请研究：\n\n标的：${t.title}\n方向：${t.description || '无'}\n\n请提供研究报告。`,
      strategist: (t) => `作为投资策略师，请制定策略：\n\n策略目标：${t.title}\n约束：${t.description || '无'}\n\n请提供策略方案。`,
      executor: (t) => `作为交易执行者，请执行：\n\n操作：${t.title}\n参数：${JSON.stringify(t.input || {}, null, 2)}\n\n请确认执行。`,
    };
    return templates[agentType](task);
  }

  async handleCompletion(sessionId: string, result: any) {
    const info = this.activeSessions.get(sessionId);
    if (!info) return;
    const currentLoad = this.agentLoad.get(info.agentType) || 1;
    this.agentLoad.set(info.agentType, Math.max(0, currentLoad - 1));
    await eventBus.emit(EventTypes.AGENT_COMPLETED, { sessionId, agentType: info.agentType, taskId: info.taskId, result });
    stateManager.updateTask(info.taskId, { status: 'completed', output: result, completedAt: Date.now() });
    this.activeSessions.delete(sessionId);
    logger.info(`Agent 完成：${info.agentType}`, { sessionId, taskId: info.taskId });
  }

  async handleError(sessionId: string, error: Error, options?: { retry?: boolean }) {
    const info = this.activeSessions.get(sessionId);
    if (!info) return;
    const task = stateManager.getTask(info.taskId);
    if (!task) { this.activeSessions.delete(sessionId); return; }
    const currentLoad = this.agentLoad.get(info.agentType) || 1;
    this.agentLoad.set(info.agentType, Math.max(0, currentLoad - 1));
    await eventBus.emit(EventTypes.AGENT_ERROR, { sessionId, agentType: info.agentType, taskId: info.taskId, error: error.message });
    if (options?.retry !== false && task.retryCount < task.maxRetries) {
      logger.info(`任务重试：${task.title}`, { retryCount: task.retryCount + 1, maxRetries: task.maxRetries });
      task.retryCount++;
      stateManager.updateTask(task.id, { retryCount: task.retryCount, status: 'queued', error: undefined });
      setTimeout(() => this.dispatch(task), 1000 * (task.retryCount + 1));
    } else {
      stateManager.updateTask(task.id, { status: 'failed', error: error.message, completedAt: Date.now() });
      logger.error(`任务失败：${task.title}`, { retryCount: task.retryCount, error: error.message });
    }
    this.activeSessions.delete(sessionId);
  }

  getActiveAgents() {
    return Array.from(this.activeSessions.entries()).map(([sessionId, info]) => ({
      sessionId, ...info, duration: Date.now() - info.startTime,
    }));
  }

  getAgentLoad() { return Object.fromEntries(this.agentLoad); }

  getStats() {
    return { activeSessions: this.activeSessions.size, agentLoad: Object.fromEntries(this.agentLoad), agents: Object.keys(AGENT_CONFIG).length };
  }
}

export const taskDispatcher = new TaskDispatcher();
