'use client';

import { useState } from 'react';
import { useDashboardStore } from '@/lib/store/dashboard-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface TaskCreateModalProps {
  onClose: () => void;
}

export default function TaskCreateModal({ onClose }: TaskCreateModalProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const [error, setError] = useState('');
  const { fetchTasks } = useDashboardStore();

  const token = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token 
    : null;

  const handleParse = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError('');
    setParsed(null);

    try {
      const res = await fetch(`${API_URL}/intent/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ input }),
      });

      const data = await res.json();

      if (data.success) {
        setParsed(data);
      } else {
        setError(data.error || '解析失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!parsed) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: parsed.data.entities.topic || input,
          description: input,
          agentId: parsed.suggestedAgentId,
          scheduledAt: parsed.data.entities.schedule ? new Date().toISOString() : undefined,
        }),
      });

      if (res.ok) {
        await fetchTasks();
        onClose();
      } else {
        const error = await res.json();
        setError(error.message || '创建失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 w-full max-w-2xl mx-4 border border-gray-800">
        <h2 className="text-xl font-bold text-text mb-4">📋 创建任务</h2>

        <div className="mb-4">
          <label className="block text-text-muted mb-2">
            用自然语言描述任务
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-gray-700 rounded text-text focus:outline-none focus:border-primary min-h-[100px]"
            placeholder="例如："帮我调研 AI 营销工具" 或 "每天早上 9 点，扫描 AI 新闻，生成简报发我飞书""
          />
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={handleParse}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded transition disabled:opacity-50"
          >
            {loading ? '解析中...' : '🔍 解析意图'}
          </button>
        </div>

        {error && (
          <div className="bg-error/10 border border-error text-error px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {parsed && (
          <div className="bg-background rounded-lg p-4 mb-4 border border-gray-800">
            <h3 className="text-sm font-bold text-text mb-3">解析结果</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">意图:</span>
                <span className="text-primary">{parsed.data.intent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">推荐部门:</span>
                <span className="text-success">{parsed.data.agentSuggestion || '未指定'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">置信度:</span>
                <span className="text-text">{(parsed.data.confidence * 100).toFixed(0)}%</span>
              </div>
              {parsed.data.entities.topic && (
                <div className="flex justify-between">
                  <span className="text-text-muted">主题:</span>
                  <span className="text-text">{parsed.data.entities.topic}</span>
                </div>
              )}
              {parsed.data.entities.schedule && (
                <div className="flex justify-between">
                  <span className="text-text-muted">定时:</span>
                  <span className="text-warning">{parsed.data.entities.schedule}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-muted hover:text-text transition"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !parsed}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded transition disabled:opacity-50"
          >
            {loading ? '创建中...' : '✅ 确认创建'}
          </button>
        </div>
      </div>
    </div>
  );
}
