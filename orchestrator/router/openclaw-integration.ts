/**
 * OpenClaw 集成模块 - 真实调用 sessions_spawn
 * 
 * 使用方式:
 * 1. 通过 NEXUS 主会话调用
 * 2. 或在 Dashboard API 中集成
 */

import { createLogger } from '../../shared/core/logger';
import { eventBus, EventTypes } from '../../shared/core/event-bus';

const logger = createLogger('openclaw-integration');

type AgentType = 'architect' | 'coder' | 'reviewer' | 'tester' | 
                 'scout' | 'builder' | 'marketer' | 'operator' |
                 'analyst' | 'researcher' | 'strategist' | 'executor';

// Agent 配置 - 对应 OpenClaw sessions_spawn 参数
const AGENT_CONFIG: Record<AgentType, {
  runtime: 'acp' | 'subagent';
  agentId?: string;
  model?: string;
  skills: string[];
  timeout: number;
  cwd?: string;
}> = {
  // ============ 开发军团 - 使用 ACP (claude-code) ============
  architect: { 
    runtime: 'acp', 
    agentId: 'claude-code', 
    skills: ['coding-agent', 'github'],
    timeout: 600000,  // 10 分钟
    cwd: '/Users/bingo/openclaw_all'
  },
  coder: { 
    runtime: 'acp', 
    agentId: 'claude-code', 
    skills: ['coding-agent', 'github'],
    timeout: 1800000,  // 30 分钟
    cwd: '/Users/bingo/openclaw_all'
  },
  reviewer: { 
    runtime: 'acp', 
    agentId: 'claude-code', 
    skills: ['coding-agent', 'github'],
    timeout: 600000,
    cwd: '/Users/bingo/openclaw_all'
  },
  tester: { 
    runtime: 'acp', 
    agentId: 'claude-code', 
    skills: ['coding-agent'],
    timeout: 900000,  // 15 分钟
    cwd: '/Users/bingo/openclaw_all'
  },
  
  // ============ 创业军团 ============
  scout: { 
    runtime: 'subagent', 
    skills: ['blogwatcher', 'summarize', 'gog'],
    timeout: 600000
  },
  builder: { 
    runtime: 'acp', 
    agentId: 'claude-code', 
    skills: ['coding-agent'],
    timeout: 1800000,
    cwd: '/Users/bingo/openclaw_all'
  },
  marketer: { 
    runtime: 'subagent', 
    skills: ['gog', 'summarize'],
    timeout: 600000
  },
  operator: { 
    runtime: 'subagent', 
    skills: ['gog', 'himalaya'],
    timeout: 600000
  },
  
  // ============ 投资军团 ============
  analyst: { 
    runtime: 'subagent', 
    skills: ['gog', 'summarize'],
    timeout: 900000
  },
  researcher: { 
    runtime: 'subagent', 
    skills: ['gog', 'summarize'],
    timeout: 900000
  },
  strategist: { 
    runtime: 'subagent', 
    skills: ['gog', 'summarize'],
    timeout: 600000
  },
  executor: { 
    runtime: 'subagent', 
    skills: ['gog'],
    timeout: 300000
  },
};

// Prompt 模板
const PROMPT_TEMPLATES: Record<AgentType, (task: any) => string> = {
  architect: (task) => `作为架构师，请分析并设计以下需求：

任务: ${task.title}
描述: ${task.description || '无'}
输入: ${JSON.stringify(task.input || {}, null, 2)}

请提供:
1. 架构设计图 (使用 Mermaid 或 ASCII)
2. 技术选型建议
3. 模块划分
4. 接口定义

工作目录: ${AGENT_CONFIG.architect.cwd}`,

  coder: (task) => `作为开发者，请实现以下功能：

任务: ${task.title}
描述: ${task.description || '无'}
输入: ${JSON.stringify(task.input || {}, null, 2)}

请提供完整的代码实现，包括:
1. 核心代码
2. 单元测试
3. 使用文档

工作目录: ${AGENT_CONFIG.coder.cwd}`,

  reviewer: (task) => `作为代码审查员，请审查以下内容：

任务: ${task.title}
描述: ${task.description || '无'}
输入: ${JSON.stringify(task.input || {}, null, 2)}

请提供:
1. 代码质量评分 (1-10)
2. 潜在问题列表
3. 改进建议
4. 安全检查结果

工作目录: ${AGENT_CONFIG.reviewer.cwd}`,

  tester: (task) => `作为测试工程师，请为以下功能编写测试：

任务: ${task.title}
描述: ${task.description || '无'}
输入: ${JSON.stringify(task.input || {}, null, 2)}

请提供:
1. 测试用例列表
2. 边界条件分析
3. 测试代码实现
4. 覆盖率目标

工作目录: ${AGENT_CONFIG.tester.cwd}`,

  scout: (task) => `作为机会侦察兵，请扫描以下领域的机会：

主题: ${task.title}
详情: ${task.description || '无'}

请提供:
1. 市场机会列表 (至少 5 个)
2. 每个机会的市场规模估算
3. 竞争分析
4. 可行性评估
5. 行动建议`,

  builder: (task) => `作为产品构建者，请快速构建以下 MVP：

产品: ${task.title}
需求: ${task.description || '无'}

请提供:
1. 最小功能集定义
2. 技术实现方案
3. 快速上线计划
4. 预计开发时间`,

  marketer: (task) => `作为营销专家，请制定以下产品的营销策略：

产品: ${task.title}
详情: ${task.description || '无'}

请提供:
1. 目标用户画像
2. 营销渠道选择
3. 推广计划
4. 预算分配建议`,

  operator: (task) => `作为运营专家，请规划以下运营活动：

活动: ${task.title}
目标: ${task.description || '无'}

请提供:
1. 运营方案
2. 执行步骤
3. 关键指标 (KPIs)
4. 风险预案`,

  analyst: (task) => `作为市场分析师，请分析以下内容：

分析对象: ${task.title}
数据: ${JSON.stringify(task.input || {}, null, 2)}

请提供:
1. 市场趋势分析
2. 关键指标解读
3. 投资建议
4. 风险评估`,

  researcher: (task) => `作为投资研究员，请深入研究以下标的：

标的: ${task.title}
方向: ${task.description || '无'}

请提供:
1. 基本信息
2. 财务分析
3. 竞争优势
4. 风险因素
5. 投资建议`,

  strategist: (task) => `作为投资策略师，请制定以下策略：

策略目标: ${task.title}
约束条件: ${task.description || '无'}

请提供:
1. 策略框架
2. 资产配置建议
3. 风险控制措施
4. 执行计划`,

  executor: (task) => `作为交易执行者，请执行以下操作：

操作: ${task.title}
参数: ${JSON.stringify(task.input || {}, null, 2)}

请确认执行并报告结果。`,
};

/**
 * OpenClaw 集成类
 */
class OpenClawIntegration {
  private activeSessions: Map<string, {
    agentType: AgentType;
    taskId: string;
    startTime: number;
  }> = new Map();

  /**
   * 生成 Agent 并执行任务
   * 
   * 注意: 这个方法需要在 OpenClaw 环境中调用
   * 通过 sessions_spawn 工具生成 Agent
   */
  async spawnAgent(
    agentType: AgentType,
    task: { id: string; title: string; description?: string; input?: any },
    options?: { thread?: boolean }
  ): Promise<{ sessionId: string; spawnParams: any }> {
    const config = AGENT_CONFIG[agentType];
    const prompt = PROMPT_TEMPLATES[agentType](task);
    
    logger.info(`准备生成 Agent: ${agentType}`, { 
      runtime: config.runtime, 
      taskId: task.id 
    });

    // 构建 sessions_spawn 参数
    const spawnParams = {
      runtime: config.runtime,
      agentId: config.agentId,
      task: prompt,
      mode: 'run' as const,
      label: `${agentType}-${task.id}`,
      cwd: config.cwd,
      thread: options?.thread,
      timeoutSeconds: Math.floor(config.timeout / 1000),
    };

    // 生成 session ID
    const sessionId = `session_${agentType}_${Date.now()}`;

    // 记录活跃 session
    this.activeSessions.set(sessionId, {
      agentType,
      taskId: task.id,
      startTime: Date.now(),
    });

    // 触发事件
    await eventBus.emit(EventTypes.AGENT_SPAWNED, {
      sessionId,
      agentType,
      taskId: task.id,
    });

    logger.info(`Agent 参数已准备`, { sessionId, spawnParams });

    return { sessionId, spawnParams };
  }

  /**
   * 获取 spawn 命令（用于手动调用）
   */
  getSpawnCommand(agentType: AgentType, task: any): string {
    const config = AGENT_CONFIG[agentType];
    const prompt = PROMPT_TEMPLATES[agentType](task);
    
    if (config.runtime === 'acp') {
      return `sessions_spawn with:
  runtime: "acp"
  agentId: "${config.agentId}"
  task: "${prompt.replace(/"/g, '\\"').substring(0, 200)}..."
  mode: "run"`;
    } else {
      return `sessions_spawn with:
  runtime: "subagent"
  task: "${prompt.replace(/"/g, '\\"').substring(0, 200)}..."
  mode: "run"`;
    }
  }

  /**
   * 处理 Agent 完成回调
   */
  async handleCompletion(sessionId: string, result: any): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`未知的 session: ${sessionId}`);
      return;
    }

    logger.info(`Agent 完成: ${session.agentType}`, { 
      sessionId, 
      taskId: session.taskId,
      duration: Date.now() - session.startTime 
    });

    await eventBus.emit(EventTypes.AGENT_COMPLETED, {
      sessionId,
      agentType: session.agentType,
      taskId: session.taskId,
      result,
    });

    this.activeSessions.delete(sessionId);
  }

  /**
   * 处理 Agent 错误回调
   */
  async handleError(sessionId: string, error: Error): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    logger.error(`Agent 失败: ${session.agentType}`, error, { 
      sessionId, 
      taskId: session.taskId 
    });

    await eventBus.emit(EventTypes.AGENT_ERROR, {
      sessionId,
      agentType: session.agentType,
      taskId: session.taskId,
      error: error.message,
    });

    this.activeSessions.delete(sessionId);
  }

  /**
   * 获取活跃 Agent 列表
   */
  getActiveSessions(): Array<{
    sessionId: string;
    agentType: AgentType;
    taskId: string;
    duration: number;
  }> {
    const now = Date.now();
    return Array.from(this.activeSessions.entries()).map(([sessionId, session]) => ({
      sessionId,
      ...session,
      duration: now - session.startTime,
    }));
  }

  /**
   * 获取 Agent 配置
   */
  getAgentConfig(agentType: AgentType) {
    return AGENT_CONFIG[agentType];
  }

  /**
   * 获取所有 Agent 类型
   */
  getAllAgentTypes(): AgentType[] {
    return Object.keys(AGENT_CONFIG) as AgentType[];
  }
}

export const openclawIntegration = new OpenClawIntegration();
export { AGENT_CONFIG, PROMPT_TEMPLATES };
export type { AgentType };
