'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: '指挥中心', href: '/dashboard', icon: '🎯' },
  { name: 'Agent 管理', href: '/dashboard/agents', icon: '🤖' },
  { name: '任务列表', href: '/dashboard/tasks', icon: '📋' },
  { name: '成本统计', href: '/dashboard/analytics', icon: '📊' },
  { name: '设置', href: '/dashboard/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-gray-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">🤖 AI 军团</h1>
        <p className="text-xs text-text-muted mt-1">v0.1.0 MVP</p>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm transition ${
                isActive
                  ? 'bg-primary/10 text-primary border-r-2 border-primary'
                  : 'text-text-muted hover:text-text hover:bg-white/5'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="bg-gradient-to-r from-primary/20 to-transparent rounded-lg p-4">
          <p className="text-xs text-text-muted">🌀 小 Q 提供支持</p>
          <p className="text-xs text-text-muted mt-1">有问题随时找我</p>
        </div>
      </div>
    </aside>
  );
}
