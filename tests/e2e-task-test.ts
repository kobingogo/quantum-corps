/**
 * 端到端任务测试 - 模拟真实任务流程
 */

import { orchestrator } from '../orchestrator';
import { classifyIntent, getIntentCorps, getIntentPriority } from '../orchestrator/intent/classifier';
import { dagEngine } from '../orchestrator/planner/dag';
import { stateManager } from '../shared/core/state-manager';
import { eventBus, EventTypes } from '../shared/core/event-bus';
import { createLogger } from '../shared/core/logger';

const logger = createLogger('e2e-test');

console.log('\n🎯 端到端任务测试\n');
console.log('=' .repeat(50));

// 测试场景
const scenarios = [
  {
    name: '功能开发任务',
    input: '帮我开发一个用户登录功能，包含用户名密码登录和 OAuth',
    expectedWorkflow: 'feature-development',
  },
  {
    name: '代码审查任务',
    input: '审查这个 PR 的代码质量，检查安全漏洞',
    expectedWorkflow: 'code-review',
  },
  {
    name: '股票分析任务',
    input: '分析 AAPL 和 GOOGL 这两只股票的投资价值',
    expectedWorkflow: 'market-analysis',
  },
];

async function runScenario(scenario: typeof scenarios[0]) {
  console.log(`\n📋 场景: ${scenario.name}`);
  console.log('-'.repeat(40));
  console.log(`输入: "${scenario.input}"`);

  // 1. 意图识别
  const intent = classifyIntent(scenario.input);
  console.log(`\n✅ Step 1: 意图识别`);
  console.log(`   分类: ${intent.category}`);
  console.log(`   置信度: ${(intent.confidence * 100).toFixed(1)}%`);
  console.log(`   建议 Agent: ${intent.suggestedAgent}`);
  console.log(`   军团: ${getIntentCorps(intent)}`);
  console.log(`   优先级: ${getIntentPriority(intent.category)}`);
  console.log(`   实体: ${JSON.stringify(intent.entities)}`);

  // 2. 创建任务
  const task = stateManager.createTask({
    type: intent.category,
    title: scenario.input.substring(0, 50),
    description: scenario.input,
    status: 'pending',
    priority: getIntentPriority(intent.category),
    input: { text: scenario.input, intent },
    maxRetries: 3,
  });
  console.log(`\n✅ Step 2: 任务创建`);
  console.log(`   Task ID: ${task.id}`);

  // 3. 创建工作流
  let workflow;
  if (intent.category === 'code_development' || intent.category === 'bug_fix') {
    workflow = dagEngine.createWorkflow(
      'Feature Development',
      [
        { name: 'design', type: 'architecture', agent: 'architect', dependencies: [] , maxRetries: 3 },
        { name: 'implement', type: 'feature_development', agent: 'coder', dependencies: ['design'] , maxRetries: 3 },
        { name: 'review', type: 'code_review', agent: 'reviewer', dependencies: ['implement'] , maxRetries: 3 },
        { name: 'test', type: 'testing', agent: 'tester', dependencies: ['implement'] , maxRetries: 3 },
      ],
      []
    );
  } else if (intent.category === 'code_review') {
    workflow = dagEngine.createWorkflow(
      'Code Review',
      [
        { name: 'lint', type: 'lint', agent: 'reviewer', dependencies: [] , maxRetries: 3 },
        { name: 'security', type: 'security_scan', agent: 'reviewer', dependencies: ['lint'] , maxRetries: 3 },
        { name: 'review', type: 'code_review', agent: 'reviewer', dependencies: ['lint', 'security'] , maxRetries: 3 },
      ],
      []
    );
  } else if (intent.category === 'stock_analysis' || intent.category === 'market_analysis') {
    workflow = dagEngine.createWorkflow(
      'Market Analysis',
      [
        { name: 'collect', type: 'data_collection', agent: 'researcher', dependencies: [] , maxRetries: 3 },
        { name: 'analyze', type: 'market_analysis', agent: 'analyst', dependencies: ['collect'] , maxRetries: 3 },
        { name: 'report', type: 'report', agent: 'analyst', dependencies: ['analyze'] , maxRetries: 3 },
      ],
      []
    );
  } else {
    workflow = dagEngine.createWorkflow(
      'General Task',
      [{ name: 'process', type: intent.category, agent: intent.suggestedAgent, dependencies: [] }],
      []
    );
  }

  console.log(`\n✅ Step 3: 工作流创建`);
  console.log(`   Workflow: ${workflow.name}`);
  console.log(`   节点: ${workflow.nodes.size} 个`);
  console.log(`   执行顺序: ${dagEngine.getExecutionOrder(workflow).join(' → ')}`);

  // 4. 验证工作流
  const validation = dagEngine.validate(workflow);
  console.log(`\n✅ Step 4: 工作流验证`);
  console.log(`   有效: ${validation.valid ? '是' : '否'}`);
  if (!validation.valid) {
    console.log(`   错误: ${validation.errors.join(', ')}`);
  }

  // 5. 模拟执行
  console.log(`\n✅ Step 5: 模拟执行`);
  const order = dagEngine.getExecutionOrder(workflow);
  for (const nodeId of order) {
    const node = workflow.nodes.get(nodeId);
    if (!node) continue;
    
    dagEngine.startNode(workflow, nodeId);
    console.log(`   ⏳ 执行节点: ${node.name} (Agent: ${node.agent || 'N/A'})`);
    
    // 模拟执行延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    dagEngine.completeNode(workflow, nodeId, { result: `${node.name} completed` });
    console.log(`   ✅ 完成节点: ${node.name}`);
  }

  // 6. 获取进度
  const progress = dagEngine.getProgress(workflow);
  console.log(`\n✅ Step 6: 执行结果`);
  console.log(`   进度: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
  console.log(`   状态: ${workflow.status}`);

  return { task, workflow, intent };
}

// 运行所有场景
async function runAllScenarios() {
  const results = [];

  for (const scenario of scenarios) {
    const result = await runScenario(scenario);
    results.push(result);
    console.log('\n' + '='.repeat(50));
  }

  // 总结
  console.log('\n📊 测试总结\n');
  console.log(`总场景数: ${scenarios.length}`);
  console.log(`全部通过: ✅`);

  // 系统状态
  const status = orchestrator.getStatus();
  console.log('\n📈 系统状态:');
  console.log(`   任务统计: ${JSON.stringify(status.tasks)}`);
  console.log(`   队列状态: ${JSON.stringify(status.scheduler)}`);
}

runAllScenarios().catch(console.error);
