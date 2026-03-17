/**
 * 认证配置
 */
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // OAuth 配置
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback',
    },
  },

  // 服务器配置
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // 数据库配置
  database: {
    path: process.env.DATABASE_PATH || './auth.db',
  },
};

export default config;
