interface TaskQueueProps {
  tasks: any[];
}

const statusColors: Record<string, string> = {
  pending: 'text-warning',
  running: 'text-primary',
  completed: 'text-success',
  failed: 'text-error',
  cancelled: 'text-text-muted',
};

export default function TaskQueue({ tasks }: TaskQueueProps) {
  return (
    <div className="bg-surface rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text">📋 任务队列</h3>
        <button className="text-sm text-primary hover:text-primary/80 transition">
          创建任务 →
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">暂无任务</p>
          <p className="text-sm text-text-muted mt-2">创建你的第一个任务吧！</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {tasks.slice(0, 10).map((task) => (
            <div
              key={task.id}
              className="bg-background rounded-lg p-4 border border-gray-800 hover:border-primary/50 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-text font-medium">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-medium ${statusColors[task.status]}`}>
                  {task.status === 'pending' && '⏳ 待处理'}
                  {task.status === 'running' && '🚀 进行中'}
                  {task.status === 'completed' && '✅ 已完成'}
                  {task.status === 'failed' && '❌ 失败'}
                  {task.status === 'cancelled' && '⏹ 已取消'}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                <span>创建于 {new Date(task.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                {task.agent && (
                  <span>• 执行者：{task.agent.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
