interface StatsCardsProps {
  agents: any[];
  tasks: any[];
}

export default function StatsCards({ agents, tasks }: StatsCardsProps) {
  const stats = {
    totalAgents: agents.length,
    busyAgents: agents.filter((a) => a.status === 'busy').length,
    pendingTasks: tasks.filter((t) => t.status === 'pending').length,
    runningTasks: tasks.filter((t) => t.status === 'running').length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-surface rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm">Agent 总数</p>
            <p className="text-3xl font-bold text-primary mt-1">{stats.totalAgents}</p>
          </div>
          <div className="text-4xl">🤖</div>
        </div>
      </div>

      <div className="bg-surface rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm">工作中</p>
            <p className="text-3xl font-bold text-warning mt-1">{stats.busyAgents}</p>
          </div>
          <div className="text-4xl">🟡</div>
        </div>
      </div>

      <div className="bg-surface rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm">待处理任务</p>
            <p className="text-3xl font-bold text-text mt-1">{stats.pendingTasks}</p>
          </div>
          <div className="text-4xl">⏳</div>
        </div>
      </div>

      <div className="bg-surface rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm">进行中任务</p>
            <p className="text-3xl font-bold text-success mt-1">{stats.runningTasks}</p>
          </div>
          <div className="text-4xl">🚀</div>
        </div>
      </div>
    </div>
  );
}
