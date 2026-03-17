interface HeaderProps {
  user: any;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="bg-surface border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">指挥中心</h2>
          <p className="text-sm text-text-muted">实时监控你的 AI Agent 军团</p>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-text-muted hover:text-text transition">
            🔔
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-sm">
              <p className="text-text font-medium">{user?.name || '用户'}</p>
              <p className="text-text-muted text-xs">{user?.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="text-text-muted hover:text-error transition text-sm"
            >
              退出
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
