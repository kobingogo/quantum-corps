/**
 * AI 军团重启脚本
 */
const { exec } = require('child_process');

console.log('🚀 正在重启 AI 军团服务...\n');

// 1. 启动健康监控和优先级调度
const startupScript = `
const { healthMonitor } = require('./orchestrator/monitor/health-monitor');
const { priorityScheduler } = require('./orchestrator/scheduler/priority-scheduler');
const { orchestrator } = require('./index');

async function start() {
  console.log('✅ 初始化编排器...');
  await orchestrator.initialize();
  
  console.log('✅ 启动健康监控（30 秒检查一次）...');
  healthMonitor.startMonitoring(30000);
  
  console.log('✅ 启动优先级调度（5 秒调度一次）...');
  priorityScheduler.startScheduling(5000);
  
  console.log('\\n🎉 AI 军团服务已启动！\\n');
  
  // 定期打印状态
  setInterval(() => {
    const health = healthMonitor.getHealth();
    const queue = priorityScheduler.getQueueStatus();
    console.log('\\n📊 系统状态:', {
      status: health.status,
      active: health.activeTasks,
      queued: health.queuedTasks,
      failed: health.failedTasks,
      agents: queue.activeAgents,
    });
  }, 60000);
}

start().catch(console.error);
`;

require('fs').writeFileSync('/tmp/start-corps.js', startupScript);

exec('cd /Users/bingo/openclaw_all && node /tmp/start-corps.js &', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ 启动失败：${error.message}`);
    return;
  }
  console.log('✅ AI 军团服务已在后台启动');
  console.log('📝 日志将输出到控制台');
});

setTimeout(() => {
  console.log('\\n✅ 重启完成！');
}, 3000);
