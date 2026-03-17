/**
 * AI 军团 - 主入口
 * 
 * 使用方式：
 * 
 * // 导入编排器
 * import { orchestrator } from './openclaw_all';
 * 
 * // 处理请求
 * const task = await orchestrator.processRequest('帮我开发一个用户登录功能');
 * 
 * // 创建工作流
 * const workflow = await orchestrator.createWorkflow('Code Review', [
 *   { name: 'lint', type: 'lint', agent: 'reviewer' },
 *   { name: 'security', type: 'security_scan', agent: 'reviewer', dependencies: ['lint'] , maxRetries: 3 },
 * ]);
 * 
 * // 执行工作流
 * await orchestrator.executeWorkflow(workflow);
 */

// 核心模块
export * from './shared/core';

// 编排层
export * from './orchestrator';

// Agent 注册
export * from './agents';

// 便捷导入
import { orchestrator } from './orchestrator';
import { agentRegistry } from './agents';
import { eventBus, EventTypes } from './shared/core/event-bus';
import { stateManager } from './shared/core/state-manager';
import { toolRegistry } from './shared/core/tool-registry';
import { logger, createLogger } from './shared/core/logger';

// 初始化函数
export async function initialize(): Promise<void> {
  logger.info('Initializing AI Corps...');
  
  // 加载 Agent 配置
  await agentRegistry.load();
  
  // 初始化状态管理
  await stateManager.init();
  
  logger.info('AI Corps initialized', {
    agents: agentRegistry.getAll().length,
    tools: toolRegistry.getAll().length,
  });
}

// 导出实例
export {
  orchestrator,
  agentRegistry,
  eventBus,
  EventTypes,
  stateManager,
  toolRegistry,
  logger,
  createLogger,
};

// 默认导出
export default {
  initialize,
  orchestrator,
  agentRegistry,
  eventBus,
  stateManager,
  toolRegistry,
  logger,
};
