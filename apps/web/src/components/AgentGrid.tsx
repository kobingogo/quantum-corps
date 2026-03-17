interface AgentGridProps {
  agents: any[];
}

const departmentIcons: Record<string, string> = {
  research: '🔍',
  content: '✍️',
  dev: '💻',
  data: '📊',
  customer: '💬',
  investment: '📈',
  marketing: '📣',
  operations: '⚙️',
  general: '🤖',
};

const statusColors: Record<string, string> = {
  idle: 'bg-success',
  busy: 'bg-warning',
  error: 'bg-error',
  offline: 'bg-gray-500',
};

export default function AgentGrid({ agents }: AgentGridProps) {
  return (
    <div className="bg-surface rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text">🤖 Agent 军团</h3>
        <button className="text-sm text-primary hover:text-primary/80 transition">
          创建 Agent →
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">暂无 Agent</p>
          <p className="text-sm text-text-muted mt-2">创建你的第一个 Agent 开始吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-background rounded-lg p-4 border border-gray-800 hover:border-primary/50 transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">
                  {departmentIcons[agent.department] || '🤖'}
                </div>
                <div className={`w-3 h-3 rounded-full ${statusColors[agent.status]} animate-pulse`}></div>
              </div>

              <h4 className="text-text font-medium truncate">{agent.name}</h4>
              <p className="text-xs text-text-muted mt-1">{agent.department}</p>

              {agent._count?.tasks > 0 && (
                <div className="mt-3 text-xs text-text-muted">
                  已完成 {agent._count.tasks} 个任务
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
