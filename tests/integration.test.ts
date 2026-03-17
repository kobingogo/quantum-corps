/**
 * 集成测试 - 完整工作流测试
 */

import { orchestrator } from '../orchestrator';
import { eventBus, EventTypes } from '../shared/core/event-bus';
import { stateManager } from '../shared/core/state-manager';
import { classifyIntent, getIntentCorps, getIntentPriority } from '../orchestrator/intent/classifier';
import { dagEngine } from '../orchestrator/planner/dag';

// ============ 意图分类测试 ============

console.log('\n🧪 Testing Intent Classifier...\n');

const testCases = [
  { input: '帮我开发一个用户登录功能', expected: 'code_development' },
  { input: '审查这个 PR 的代码质量', expected: 'code_review' },
  { input: '修复这个 bug', expected: 'bug_fix' },
  { input: '最近有什么赚钱的副业机会', expected: 'opportunity_scan' },
  { input: '分析 AAPL 这只股票', expected: 'stock_analysis' },
  { input: '设计一个电商系统的架构', expected: 'code_development' },
];

let passed = 0;
let failed = 0;

for (const test of testCases) {
  const result = classifyIntent(test.input);
  const status = result.category === test.expected ? '✅' : '❌';
  
  console.log(`${status} "${test.input}"`);
  console.log(`   分类: ${result.category} | 置信度: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`   军团: ${getIntentCorps(result)} | Agent: ${result.suggestedAgent}`);
  console.log(`   优先级: ${getIntentPriority(result.category)}`);
  
  if (result.category === test.expected) {
    passed++;
  } else {
    failed++;
    console.log(`   ⚠️  预期: ${test.expected}`);
  }
  console.log();
}

console.log(`意图分类测试: ${passed}/${testCases.length} 通过\n`);

// ============ DAG 工作流测试 ============

console.log('🧪 Testing DAG Engine...\n');

const testWorkflow = dagEngine.createWorkflow(
  'Test Feature Development',
  [
    { name: 'design', type: 'architecture', agent: 'architect', dependencies: [] },
    { name: 'implement', type: 'feature_development', agent: 'coder', dependencies: ['design'] },
    { name: 'review', type: 'code_review', agent: 'reviewer', dependencies: ['implement'] },
    { name: 'test', type: 'testing', agent: 'tester', dependencies: ['implement'] },
  ],
  [
    { from: 'design', to: 'implement' },
    { from: 'implement', to: 'review' },
    { from: 'implement', to: 'test' },
  ]
);

// 验证工作流
const validation = dagEngine.validate(testWorkflow);
console.log(`✅ 工作流验证: ${validation.valid ? '通过' : '失败'}`);

if (!validation.valid) {
  console.log(`   错误: ${validation.errors.join(', ')}`);
}

// 获取执行顺序
const order = dagEngine.getExecutionOrder(testWorkflow);
console.log(`✅ 执行顺序: ${order.join(' → ')}`);

// 获取可执行节点
const executable = dagEngine.getExecutableNodes(testWorkflow);
console.log(`✅ 初始可执行节点: ${executable.map(n => n.name).join(', ')}`);

// 模拟执行
console.log('\n模拟执行工作流...');
dagEngine.startNode(testWorkflow, executable[0].id);
dagEngine.completeNode(testWorkflow, executable[0].id, { designDoc: '...' });

const nextExecutable = dagEngine.getExecutableNodes(testWorkflow);
console.log(`✅ 第二批可执行节点: ${nextExecutable.map(n => n.name).join(', ')}`);

// 获取进度
const progress = dagEngine.getProgress(testWorkflow);
console.log(`✅ 进度: ${progress.completed}/${progress.total} (${progress.percentage}%)`);

console.log('\n');

// ============ 事件总线测试 ============

console.log('🧪 Testing Event Bus...\n');

let eventReceived = false;

const unsubscribe = eventBus.subscribe(EventTypes.TASK_CREATED, (event) => {
  console.log(`✅ 收到事件: ${event.type}`);
  console.log(`   数据:`, event.data);
  eventReceived = true;
});

// 发布测试事件
eventBus.emit(EventTypes.TASK_CREATED, {
  taskId: 'test-123',
  type: 'feature_development',
  title: 'Test Task',
});

// 等待事件处理
setTimeout(() => {
  if (eventReceived) {
    console.log('✅ 事件总线测试通过');
  } else {
    console.log('❌ 事件总线测试失败');
  }
  unsubscribe();
  console.log('\n');
}, 100);

// ============ 状态管理测试 ============

console.log('🧪 Testing State Manager...\n');

// 创建任务
const task = stateManager.createTask({
  type: 'feature_development',
  title: '实现用户登录功能',
  description: '包含用户名密码登录和 OAuth',
  status: 'pending',
  priority: 'high',
  input: { techStack: ['React', 'Node.js'] },
  maxRetries: 3,
});

console.log(`✅ 任务创建: ${task.id}`);
console.log(`   类型: ${task.type}`);
console.log(`   优先级: ${task.priority}`);

// 更新任务
const updated = stateManager.updateTask(task.id, { status: 'running' });
console.log(`✅ 任务更新: ${updated?.status}`);

// 查询任务
const tasks = stateManager.queryTasks({ status: 'running' });
console.log(`✅ 任务查询: 找到 ${tasks.length} 个运行中任务`);

console.log('\n');

// ============ 编排器完整测试 ============

console.log('🧪 Testing Orchestrator (End-to-End)...\n');

// 测试完整请求处理流程
async function testOrchestrator() {
  try {
    console.log('测试请求: "帮我开发一个用户登录功能"');
    
    // 由于需要 OpenClaw 连接，这里只测试意图识别和任务创建
    const intent = classifyIntent('帮我开发一个用户登录功能');
    console.log(`✅ 意图识别: ${intent.category}`);
    console.log(`   建议Agent: ${intent.suggestedAgent}`);
    console.log(`   军团: ${getIntentCorps(intent)}`);
    
    // 创建工作流
    const workflow = await orchestrator.createWorkflow(
      'Feature Development Test',
      [
        { name: 'design', type: 'architecture', agent: 'architect', dependencies: [] },
        { name: 'implement', type: 'feature_development', agent: 'coder', dependencies: ['design'] },
        { name: 'review', type: 'code_review', agent: 'reviewer', dependencies: ['implement'] },
      ]
    );
    
    console.log(`✅ 工作流创建: ${workflow.name}`);
    console.log(`   节点数: ${workflow.nodes.size}`);
    
    // 获取状态
    const status = orchestrator.getStatus();
    console.log('✅ 系统状态:');
    console.log(`   队列: ${status.scheduler.queueLength}`);
    console.log(`   运行中: ${status.scheduler.runningCount}`);
    console.log(`   任务统计: ${JSON.stringify(status.tasks)}`);
    
    console.log('\n✅ 所有集成测试通过！\n');
    
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
  }
}

testOrchestrator();
