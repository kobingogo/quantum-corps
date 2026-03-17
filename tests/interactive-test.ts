/**
 * 交互式测试 - 测试意图识别和工作流
 */

import * as readline from 'readline';
import { classifyIntent, getIntentCorps, getIntentPriority } from '../orchestrator/intent/classifier';
import { dagEngine } from '../orchestrator/planner/dag';
import { stateManager } from '../shared/core/state-manager';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🪄 AI 军团 - 交互式测试');
console.log('='.repeat(50));
console.log('输入任意文本测试意图识别');
console.log('输入 "quit" 退出');
console.log('='.repeat(50));
console.log('');

function processInput(input: string) {
  if (input.toLowerCase() === 'quit') {
    console.log('\n👋 再见！');
    rl.close();
    return;
  }

  // 1. 意图识别
  console.log('\n📋 意图识别结果:');
  console.log('-'.repeat(40));
  
  const intent = classifyIntent(input);
  
  console.log(`   分类: ${intent.category}`);
  console.log(`   置信度: ${(intent.confidence * 100).toFixed(1)}%`);
  console.log(`   军团: ${getIntentCorps(intent)}`);
  console.log(`   建议 Agent: ${intent.suggestedAgent}`);
  console.log(`   建议工作流: ${intent.suggestedWorkflow}`);
  console.log(`   优先级: ${getIntentPriority(intent.category)}`);
  console.log(`   推理: ${intent.reasoning}`);
  
  if (Object.keys(intent.entities).length > 0) {
    console.log(`   实体: ${JSON.stringify(intent.entities)}`);
  }

  // 2. 创建任务
  const task = stateManager.createTask({
    type: intent.category,
    title: input.substring(0, 50),
    description: input,
    status: 'pending',
    priority: getIntentPriority(intent.category),
    input: { text: input, intent },
    maxRetries: 3,
  });
  
  console.log('\n📝 任务创建:');
  console.log(`   Task ID: ${task.id}`);
  console.log(`   状态: ${task.status}`);

  // 3. 创建对应工作流
  let workflow;
  switch (intent.suggestedWorkflow) {
    case 'feature-development':
      workflow = dagEngine.createWorkflow('Feature Development', [
        { name: 'design', type: 'architecture', agent: 'architect', dependencies: [] , maxRetries: 3 },
        { name: 'implement', type: 'feature_development', agent: 'coder', dependencies: ['design'] , maxRetries: 3 },
        { name: 'review', type: 'code_review', agent: 'reviewer', dependencies: ['implement'] , maxRetries: 3 },
        { name: 'test', type: 'testing', agent: 'tester', dependencies: ['implement'] , maxRetries: 3 },
      ], []);
      break;
    case 'code-review':
      workflow = dagEngine.createWorkflow('Code Review', [
        { name: 'lint', type: 'lint', agent: 'reviewer', dependencies: [] , maxRetries: 3 },
        { name: 'security', type: 'security_scan', agent: 'reviewer', dependencies: ['lint'] , maxRetries: 3 },
        { name: 'review', type: 'code_review', agent: 'reviewer', dependencies: ['lint', 'security'] , maxRetries: 3 },
      ], []);
      break;
    case 'bug-fix':
      workflow = dagEngine.createWorkflow('Bug Fix', [
        { name: 'diagnose', type: 'diagnosis', agent: 'coder', dependencies: [] , maxRetries: 3 },
        { name: 'fix', type: 'bug_fix', agent: 'coder', dependencies: ['diagnose'] , maxRetries: 3 },
        { name: 'test', type: 'testing', agent: 'tester', dependencies: ['fix'] , maxRetries: 3 },
      ], []);
      break;
    case 'stock-analysis':
      workflow = dagEngine.createWorkflow('Stock Analysis', [
        { name: 'collect', type: 'data_collection', agent: 'researcher', dependencies: [] , maxRetries: 3 },
        { name: 'analyze', type: 'stock_analysis', agent: 'analyst', dependencies: ['collect'] , maxRetries: 3 },
        { name: 'report', type: 'report', agent: 'analyst', dependencies: ['analyze'] , maxRetries: 3 },
      ], []);
      break;
    case 'opportunity-scan':
      workflow = dagEngine.createWorkflow('Opportunity Scan', [
        { name: 'scan', type: 'opportunity_scan', agent: 'scout', dependencies: [] , maxRetries: 3 },
        { name: 'filter', type: 'filtering', agent: 'scout', dependencies: ['scan'] , maxRetries: 3 },
        { name: 'report', type: 'report', agent: 'scout', dependencies: ['filter'] , maxRetries: 3 },
      ], []);
      break;
    default:
      workflow = dagEngine.createWorkflow('General Task', [
        { name: 'process', type: intent.category, agent: intent.suggestedAgent, dependencies: [] },
      ], []);
  }

  console.log('\n🔄 工作流:');
  console.log(`   名称: ${workflow.name}`);
  console.log(`   节点: ${workflow.nodes.size} 个`);
  console.log(`   执行顺序: ${dagEngine.getExecutionOrder(workflow).join(' → ')}`);

  const validation = dagEngine.validate(workflow);
  console.log(`   验证: ${validation.valid ? '✅ 有效' : '❌ 无效'}`);

  console.log('\n' + '='.repeat(50));
  console.log('');

  prompt();
}

function prompt() {
  rl.question('🧪 输入测试文本: ', (answer) => {
    processInput(answer.trim());
  });
}

prompt();
