/**
 * 意图分类器 v2.0 测试
 */

import { classifyIntent, getIntentCorps, getIntentPriority } from '../orchestrator/intent/classifier';

console.log('\n🧪 意图分类器 v2.0 测试\n');
console.log('='.repeat(60));

const testCases = [
  // ============ 开发军团 ============
  { input: '帮我开发一个用户登录功能', expected: 'code_development' },
  { input: '实现一个 REST API', expected: 'code_development' },
  { input: '审查这个 PR 的代码质量', expected: 'code_review' },
  { input: 'code review 这个分支', expected: 'code_review' },
  { input: '修复这个 bug', expected: 'bug_fix' },
  { input: 'debug 一下这个问题', expected: 'bug_fix' },
  { input: '为这个项目写文档', expected: 'documentation' },
  { input: '生成 README', expected: 'documentation' },
  { input: '重构一下这个模块', expected: 'refactoring' },
  { input: '优化这段代码的性能', expected: 'refactoring' },
  { input: '写单元测试', expected: 'testing' },
  { input: '增加测试覆盖率', expected: 'testing' },
  
  // ============ 创业军团 ============
  { input: '最近有什么副业机会', expected: 'opportunity_scan' },
  { input: '有什么赚钱的机会', expected: 'opportunity_scan' },
  { input: '我想做个产品', expected: 'product_idea' },
  { input: '有个 MVP 想法想实现', expected: 'product_idea' },
  
  // ============ 投资军团 ============
  { input: '分析 AAPL 这只股票', expected: 'stock_analysis' },
  { input: '分析 TSLA 和 NVDA 的投资价值', expected: 'stock_analysis' },
  { input: '市场趋势分析', expected: 'market_analysis' },
  { input: '分析一下 AI 行业的发展', expected: 'market_analysis' },
  { input: '分析比特币走势', expected: 'crypto_analysis' },
  { input: 'ETH 最近怎么样', expected: 'crypto_analysis' },
  
  // ============ 通用 ============
  { input: '什么是 TypeScript', expected: 'general_question' },
  { input: 'hello', expected: 'chitchat' },
  
  // ============ 边界情况 ============
  { input: '设计一个电商系统的架构', expected: 'code_development' },
  { input: '帮我写代码实现用户注册', expected: 'code_development' },
  { input: '检查安全问题', expected: 'code_review' },
];

let passed = 0;
let failed = 0;

for (const test of testCases) {
  const result = classifyIntent(test.input);
  const isPass = result.category === test.expected;
  const status = isPass ? '✅' : '❌';
  
  if (isPass) passed++;
  else failed++;
  
  console.log(`${status} "${test.input}"`);
  console.log(`   分类: ${result.category} | 置信度: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`   Agent: ${result.suggestedAgent} | 工作流: ${result.suggestedWorkflow}`);
  console.log(`   军团: ${getIntentCorps(result)} | 优先级: ${getIntentPriority(result.category)}`);
  console.log(`   推理: ${result.reasoning}`);
  
  if (Object.keys(result.entities).length > 0) {
    console.log(`   实体: ${JSON.stringify(result.entities)}`);
  }
  
  if (!isPass) {
    console.log(`   ⚠️  预期: ${test.expected}`);
  }
  console.log();
}

console.log('='.repeat(60));
console.log(`\n📊 测试结果: ${passed}/${testCases.length} 通过`);
console.log(`   通过率: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log(`\n⚠️  ${failed} 个测试失败`);
} else {
  console.log('\n✅ 全部通过！');
}
