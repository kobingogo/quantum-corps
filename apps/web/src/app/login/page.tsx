'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { useDashboardStore } from '@/lib/store/dashboard-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { connectSocket } = useDashboardStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.access_token) {
        login(data.access_token, data.user);
        connectSocket(data.access_token);
        router.push('/dashboard');
      } else {
        setError(data.message || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请检查 API 服务');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">🤖 AI 军团</h1>
          <p className="text-text-muted">游戏化管理你的 AI Agent 团队</p>
        </div>

        <div className="bg-surface rounded-lg p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-text mb-6">登录</h2>

          {error && (
            <div className="bg-error/10 border border-error text-error px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-text-muted mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-gray-700 rounded text-text focus:outline-none focus:border-primary"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-text-muted mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-gray-700 rounded text-text focus:outline-none focus:border-primary"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 px-4 rounded transition disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/register')}
              className="text-text-muted hover:text-primary transition"
            >
              还没有账号？注册
            </button>
          </div>
        </div>

        <p className="text-center text-text-muted text-sm mt-8">
          🌀 由小 Q 提供支持
        </p>
      </div>
    </div>
  );
}
