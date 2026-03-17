interface LogPanelProps {
  logs: any[];
}

const levelColors: Record<string, string> = {
  info: 'text-primary',
  warning: 'text-warning',
  error: 'text-error',
};

export default function LogPanel({ logs }: LogPanelProps) {
  return (
    <div className="bg-surface rounded-lg p-6 border border-gray-800 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text">📝 实时日志</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-xs text-text-muted">实时推送</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-text-muted">暂无日志</p>
        </div>
      ) : (
        <div className="bg-background rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
              <span className="text-text-muted text-xs whitespace-nowrap">
                {new Date(log.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={`text-xs font-medium ${levelColors[log.level] || 'text-text'}`}>
                [{log.level.toUpperCase()}]
              </span>
              <span className="text-text flex-1">{log.message}</span>
              {log.agent && (
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {log.agent.name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
