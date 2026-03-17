'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AgentGrid from '@/components/AgentGrid';
import TaskQueue from '@/components/TaskQueue';
import LogPanel from '@/components/LogPanel';
import StatsCards from '@/components/StatsCards';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, token, logout } = useAuthStore();
  const { connectSocket, disconnectSocket, fetchAgents, fetchTasks, agents, tasks, logs } = useDashboardStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // 连接 WebSocket
    connectSocket(token!);

    // 加载数据
    const loadData = async () => {
      await Promise.all([fetchAgents(), fetchTasks()]);
      setLoading(false);
    };

    loadData();

    // 清理
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          <Header user={useAuthStore.getState().user} onLogout={() => { logout(); router.push('/login'); }} />
          
          <main className="p-6">
            <StatsCards agents={agents} tasks={tasks} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <AgentGrid agents={agents} />
              <TaskQueue tasks={tasks} />
            </div>
            
            <LogPanel logs={logs} />
          </main>
        </div>
      </div>
    </div>
  );
}
