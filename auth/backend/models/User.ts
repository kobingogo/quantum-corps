/**
 * 用户模型
 */
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  provider: 'local' | 'google' | 'github';
  providerId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export class UserModel {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        provider TEXT NOT NULL DEFAULT 'local',
        providerId TEXT,
        avatar TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  async createLocalUser(username: string, email: string, password: string): Promise<User> {
    const existingUser = this.getByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();
    const user: User = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      provider: 'local',
      createdAt: now,
      updatedAt: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, email, password, provider, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(user.id, user.username, user.email, user.password, user.provider, user.createdAt, user.updatedAt);
    return user;
  }

  async createOrUpdateOAuthUser(
    provider: 'google' | 'github',
    providerId: string,
    email: string,
    username: string,
    avatar?: string
  ): Promise<User> {
    let user = this.getByProviderId(provider, providerId);

    if (user) {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        UPDATE users 
        SET email = ?, username = ?, avatar = ?, updatedAt = ?
        WHERE id = ?
      `);
      stmt.run(email, username, avatar || null, now, user.id);
      user.email = email;
      user.username = username;
      user.avatar = avatar;
      user.updatedAt = now;
      return user;
    }

    user = this.getByEmail(email);
    if (user) {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        UPDATE users 
        SET provider = ?, providerId = ?, avatar = ?, updatedAt = ?
        WHERE id = ?
      `);
      stmt.run(provider, providerId, avatar || null, now, user.id);
      user.provider = provider;
      user.providerId = providerId;
      user.avatar = avatar;
      user.updatedAt = now;
      return user;
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: uuidv4(),
      username,
      email,
      provider,
      providerId,
      avatar,
      createdAt: now,
      updatedAt: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, email, provider, providerId, avatar, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(newUser.id, newUser.username, newUser.email, newUser.provider, newUser.providerId, newUser.avatar, newUser.createdAt, newUser.updatedAt);
    return newUser;
  }

  getByEmail(email: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | null;
  }

  getByUsername(username: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | null;
  }

  getByProviderId(provider: string, providerId: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE provider = ? AND providerId = ?');
    return stmt.get(provider, providerId) as User | null;
  }

  getById(id: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as User | null;
    if (user) {
      delete user.password;
    }
    return user;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = this.getByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    delete user.password;
    return user;
  }

  saveRefreshToken(userId: string, token: string, expiresAt: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO refresh_tokens (id, userId, token, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(uuidv4(), userId, token, expiresAt, new Date().toISOString());
  }

  validateRefreshToken(token: string): User | null {
    const stmt = this.db.prepare(`
      SELECT u.* FROM refresh_tokens rt
      JOIN users u ON rt.userId = u.id
      WHERE rt.token = ? AND rt.expiresAt > ?
    `);
    const user = stmt.get(token, new Date().toISOString()) as User | null;
    if (user) {
      delete user.password;
    }
    return user;
  }

  deleteRefreshToken(token: string): void {
    const stmt = this.db.prepare('DELETE FROM refresh_tokens WHERE token = ?');
    stmt.run(token);
  }

  cleanupExpiredTokens(): void {
    const stmt = this.db.prepare('DELETE FROM refresh_tokens WHERE expiresAt <= ?');
    stmt.run(new Date().toISOString());
  }

  close(): void {
    this.db.close();
  }
}

export default UserModel;
