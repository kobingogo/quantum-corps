'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (data.access_token) {
        login(data.access_token, data.user);
        router.push('/dashboard');
      } else {
        setError(data.message || '注册失败');
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
          <p className="text-text-muted">创建你的账号</p>
        </div>

        <div className="bg-surface rounded-lg p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-text mb-6">注册</h2>

          {error && (
            <div className="bg-error/10 border border-error text-error px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-text-muted mb-2">昵称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-gray-700 rounded text-text focus:outline-none focus:border-primary"
                placeholder="你的名字"
              />
            </div>

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
                placeholder="至少 6 位"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 px-4 rounded transition disabled:opacity-50"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-text-muted hover:text-primary transition"
            >
              已有账号？登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
