/**
 * OpenClaw 连接测试 - 验证集成配置
 */

import { openclawIntegration, AGENT_CONFIG, PROMPT_TEMPLATES } from '../orchestrator/router/openclaw-integration';
import { classifyIntent } from '../orchestrator/intent/classifier';

console.log('\n🔗 OpenClaw 连接配置测试\n');
console.log('='.repeat(60));

// 测试任务
const testTask = {
  id: 'test_task_001',
  title: '实现用户登录功能',
  description: '包含用户名密码登录和 OAuth 登录',
  input: { techStack: ['React', 'Node.js'] },
};

async function testConnection() {
  // 1. 意图识别
  console.log('\n📋 Step 1: 意图识别');
  console.log('-'.repeat(40));
  const intent = classifyIntent(testTask.title);
  console.log(`   输入: "${testTask.title}"`);
  console.log(`   分类: ${intent.category}`);
  console.log(`   建议 Agent: ${intent.suggestedAgent}`);

  // 2. 获取 Agent 配置
  console.log('\n📋 Step 2: Agent 配置');
  console.log('-'.repeat(40));
  const agentType = intent.suggestedAgent as any;
  const config = openclawIntegration.getAgentConfig(agentType);
  
  if (config) {
    console.log(`   Agent: ${agentType}`);
    console.log(`   Runtime: ${config.runtime}`);
    console.log(`   Agent ID: ${config.agentId || 'N/A'}`);
    console.log(`   Timeout: ${config.timeout / 1000}s`);
    console.log(`   Skills: ${config.skills.join(', ')}`);
  } else {
    console.log(`   ⚠️ 未找到 Agent 配置: ${agentType}`);
  }

  // 3. 生成 spawn 参数
  console.log('\n📋 Step 3: 生成 spawn 参数');
  console.log('-'.repeat(40));
  
  const { sessionId, spawnParams } = await openclawIntegration.spawnAgent(agentType, testTask);
  
  console.log(`   Session ID: ${sessionId}`);
  console.log(`   Runtime: ${spawnParams.runtime}`);
  console.log(`   Mode: ${spawnParams.mode}`);
  console.log(`   Timeout: ${spawnParams.timeoutSeconds}s`);
  console.log(`   Task (前100字): ${spawnParams.task.substring(0, 100)}...`);

  // 4. 显示完整调用命令
  console.log('\n📋 Step 4: OpenClaw 调用示例');
  console.log('-'.repeat(40));
  console.log('   在 OpenClaw 环境中调用 sessions_spawn:');
  console.log('');
  console.log('   await sessions_spawn({');
  console.log(`     runtime: "${spawnParams.runtime}",`);
  if (spawnParams.agentId) {
    console.log(`     agentId: "${spawnParams.agentId}",`);
  }
  console.log(`     task: \`\${prompt}\`,`);
  console.log(`     mode: "${spawnParams.mode}",`);
  console.log(`     timeoutSeconds: ${spawnParams.timeoutSeconds}`);
  console.log('   });');

  // 5. 测试其他 Agent
  console.log('\n📋 Step 5: 其他 Agent 配置');
  console.log('-'.repeat(40));
  
  const allAgents = openclawIntegration.getAllAgentTypes();
  console.log(`   总共 ${allAgents.length} 个 Agent:`);
  
  const byRuntime = { acp: [] as string[], subagent: [] as string[] };
  for (const agent of allAgents) {
    const cfg = openclawIntegration.getAgentConfig(agent);
    if (cfg) {
      byRuntime[cfg.runtime].push(agent);
    }
  }
  
  console.log(`   ACP (claude-code): ${byRuntime.acp.join(', ')}`);
  console.log(`   Subagent: ${byRuntime.subagent.join(', ')}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ OpenClaw 连接配置测试完成\n');
  
  console.log('📝 使用说明:');
  console.log('   1. 在 NEXUS 主会话中，可以直接调用 sessions_spawn');
  console.log('   2. 在 Dashboard 中，需要通过 API 触发');
  console.log('   3. 开发军团使用 ACP runtime (claude-code)');
  console.log('   4. 创业/投资军团使用 subagent runtime\n');
}

testConnection().catch(console.error);
