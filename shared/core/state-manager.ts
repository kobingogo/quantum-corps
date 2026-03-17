/**
 * 状态管理器 v2.0 - SQLite 数据库版本
 * 
 * 解决问题:
 * 1. 使用 SQLite 替代 JSON 文件
 * 2. 支持事务
 * 3. 更好的查询性能
 */

import fs from 'fs/promises';
import path from 'path';
import Database from 'better-sqlite3';

const STATE_DIR = process.env.STATE_DIR || '/Users/bingo/openclaw_all/logs';
const DB_PATH = path.join(STATE_DIR, 'corps.db');

export type TaskStatus = 'pending' | 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type AgentStatus = 'idle' | 'busy' | 'error' | 'offline';

export interface Task {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  input: any;
  output?: any;
  error?: string;
  agent?: string;
  workflow?: string;
  dependencies?: string[];
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

export interface AgentState {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  currentTask?: string;
  lastActivity?: number;
  capabilities: string[];
  metadata?: Record<string, any>;
}

class StateManager {
  private db: Database.Database | null = null;
  private initialized = false;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    await fs.mkdir(STATE_DIR, { recursive: true });
    
    this.db = new Database(DB_PATH);
    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT NOT NULL DEFAULT 'medium',
        input TEXT,
        output TEXT,
        error TEXT,
        agent TEXT,
        workflow TEXT,
        dependencies TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        startedAt INTEGER,
        completedAt INTEGER,
        retryCount INTEGER DEFAULT 0,
        maxRetries INTEGER DEFAULT 3,
        metadata TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
      CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent);
      CREATE INDEX IF NOT EXISTS idx_tasks_createdAt ON tasks(createdAt);
      
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'idle',
        currentTask TEXT,
        lastActivity INTEGER,
        capabilities TEXT,
        metadata TEXT
      );
      
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        nodes TEXT,
        currentNode TEXT,
        startedAt INTEGER,
        completedAt INTEGER
      );
    `);

    this.initialized = true;
  }

  /**
   * 确保数据库已初始化（自动初始化）
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      // 同步初始化（用于测试环境）
      try {
        require('fs').mkdirSync(STATE_DIR, { recursive: true });
        this.db = new Database(DB_PATH);
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            priority TEXT NOT NULL DEFAULT 'medium',
            input TEXT,
            output TEXT,
            error TEXT,
            agent TEXT,
            workflow TEXT,
            dependencies TEXT,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            startedAt INTEGER,
            completedAt INTEGER,
            retryCount INTEGER DEFAULT 0,
            maxRetries INTEGER DEFAULT 3,
            metadata TEXT
          );
          
          CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
          CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
          CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent);
          CREATE INDEX IF NOT EXISTS idx_tasks_createdAt ON tasks(createdAt);
        `);
        this.initialized = true;
      } catch (e) {
        // 忽略错误，让调用方处理
      }
    }
  }

  /**
   * 创建任务
   */
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'retryCount'>): Task {
    this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const newTask: Task = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      maxRetries: task.maxRetries ?? 3,
    };

    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, type, title, description, status, priority, input, agent, workflow, createdAt, updatedAt, retryCount, maxRetries)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      task.type,
      task.title,
      task.description || null,
      task.status,
      task.priority,
      JSON.stringify(task.input),
      task.agent || null,
      task.workflow || null,
      now,
      now,
      0,
      newTask.maxRetries
    );

    return newTask;
  }

  /**
   * 更新任务
   */
  updateTask(id: string, updates: Partial<Task>): Task | null {
    this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    const task = this.getTask(id);
    if (!task) return null;

    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: Date.now(),
    };

    const stmt = this.db.prepare(`
      UPDATE tasks SET
        status = ?, output = ?, error = ?, agent = ?, startedAt = ?, completedAt = ?, updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedTask.status,
      updatedTask.output ? JSON.stringify(updatedTask.output) : null,
      updatedTask.error || null,
      updatedTask.agent || null,
      updatedTask.startedAt || null,
      updatedTask.completedAt || null,
      updatedTask.updatedAt,
      id
    );

    return updatedTask;
  }

  /**
   * 获取任务
   */
  getTask(id: string): Task | null {
    this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return this.rowToTask(row);
  }

  /**
   * 查询任务
   */
  queryTasks(filter?: {
    status?: TaskStatus | TaskStatus[];
    type?: string;
    agent?: string;
    limit?: number;
  }): Task[] {
    this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (filter?.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      sql += ` AND status IN (${statuses.map(() => '?').join(',')})`;
      params.push(...statuses);
    }
    if (filter?.type) {
      sql += ' AND type = ?';
      params.push(filter.type);
    }
    if (filter?.agent) {
      sql += ' AND agent = ?';
      params.push(filter.agent);
    }

    sql += ' ORDER BY createdAt DESC';

    if (filter?.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    
    return rows.map(row => this.rowToTask(row));
  }

  /**
   * 获取统计
   */
  getStats(): {
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<string, number>;
  } {
    this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    const total = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any;
    
    const byStatusRows = this.db.prepare('SELECT status, COUNT(*) as count FROM tasks GROUP BY status').all() as any[];
    const byStatus: Record<string, number> = {};
    for (const row of byStatusRows) {
      byStatus[row.status] = row.count;
    }

    const byPriorityRows = this.db.prepare('SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority').all() as any[];
    const byPriority: Record<string, number> = {};
    for (const row of byPriorityRows) {
      byPriority[row.priority] = row.count;
    }

    return {
      total: total.count,
      byStatus: byStatus as Record<TaskStatus, number>,
      byPriority,
    };
  }

  /**
   * 清理旧任务
   */
  cleanupOldTasks(daysToKeep: number = 30): number {
    this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    const stmt = this.db.prepare('DELETE FROM tasks WHERE createdAt < ? AND status IN (?, ?)');
    const result = stmt.run(cutoff, 'completed', 'failed');
    
    return result.changes;
  }

  /**
   * 行转任务对象
   */
  private rowToTask(row: any): Task {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description || undefined,
      status: row.status,
      priority: row.priority,
      input: row.input ? JSON.parse(row.input) : {},
      output: row.output ? JSON.parse(row.output) : undefined,
      error: row.error || undefined,
      agent: row.agent || undefined,
      workflow: row.workflow || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      startedAt: row.startedAt || undefined,
      completedAt: row.completedAt || undefined,
      retryCount: row.retryCount,
      maxRetries: row.maxRetries,
    };
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

export const stateManager = new StateManager();
