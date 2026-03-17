# 用户认证模块

完整的用户登录功能实现，包含用户名密码登录和 OAuth 登录（Google/GitHub）。

## 📋 功能特性

- ✅ 用户名/邮箱 + 密码注册和登录
- ✅ JWT 令牌认证（Access Token + Refresh Token）
- ✅ Google OAuth 2.0 登录
- ✅ GitHub OAuth 登录
- ✅ 自动令牌刷新
- ✅ 安全的密码加密（bcrypt）
- ✅ 响应式登录界面
- ✅ 完整的单元测试和集成测试

## 🏗️ 技术栈

**后端:**
- Node.js + Express
- TypeScript
- Passport.js (认证中间件)
- better-sqlite3 (数据库)
- JWT (令牌认证)
- bcryptjs (密码加密)

**前端:**
- React 18
- TypeScript
- React Context API (状态管理)
- CSS3 (响应式设计)

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /Users/bingo/openclaw_all/auth
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 服务器配置
PORT=3001
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development

# Google OAuth (在 Google Cloud Console 获取)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# GitHub OAuth (在 GitHub Settings 获取)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# 数据库
DATABASE_PATH=./auth.db
```

### 3. 启动服务

**后端服务:**
```bash
npm run dev:backend
```

**前端服务 (新终端):**
```bash
npm run dev:frontend
```

### 4. 访问应用

打开浏览器访问：http://localhost:3000

## 📁 项目结构

```
auth/
├── backend/
│   ├── config/
│   │   └── index.ts          # 配置文件
│   ├── models/
│   │   └── User.ts           # 用户模型
│   ├── routes/
│   │   └── auth.ts           # 认证路由
│   ├── middleware/
│   │   └── auth.ts           # 认证中间件
│   ├── utils/
│   │   └── jwt.ts            # JWT 工具
│   └── server.ts             # 服务器入口
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # 认证上下文
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx    # 登录页面
│   │   │   ├── LoginPage.css    # 登录样式
│   │   │   └── AuthCallback.tsx # OAuth 回调
│   │   └── App.tsx              # 主应用
│   └── public/
├── tests/
│   ├── unit/
│   │   └── auth.test.ts        # 单元测试
│   └── integration/
│       └── auth.api.test.ts    # 集成测试
├── package.json
└── README.md
```

## 🔐 API 接口

### 用户注册
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "password123"
}
```

**响应:**
```json
{
  "user": {
    "id": "uuid",
    "username": "john",
    "email": "john@example.com",
    "provider": "local"
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### 用户登录
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### 刷新令牌
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

### 获取当前用户
```http
GET /auth/me
Authorization: Bearer <accessToken>
```

### 登出
```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

### OAuth 登录
```http
GET /auth/google
GET /auth/github
```

## 🧪 运行测试

```bash
# 运行所有测试
npm test

# 只运行单元测试
npm run test:unit

# 只运行集成测试
npm run test:integration

# 生成测试覆盖率报告
npm test -- --coverage
```

## 🔧 OAuth 配置指南

### Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 "Google+ API"
4. 创建 OAuth 2.0 客户端 ID
5. 添加授权重定向 URI: `http://localhost:3001/auth/google/callback`
6. 复制 Client ID 和 Client Secret 到 `.env`

### GitHub OAuth

1. 访问 [GitHub Settings](https://github.com/settings/developers)
2. 创建新的 OAuth App
3. 设置 Authorization callback URL: `http://localhost:3001/auth/github/callback`
4. 复制 Client ID 和 Client Secret 到 `.env`

## 🔒 安全最佳实践

1. **生产环境必须修改 JWT_SECRET**
2. **使用 HTTPS** (生产环境)
3. **设置合适的 CORS 策略**
4. **实施速率限制** (防止暴力破解)
5. **定期轮换密钥**
6. **启用双因素认证** (2FA) - 待实现

## 📝 使用示例

### React 组件中使用认证

```tsx
import { useAuth } from './context/AuthContext';

function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <h1>欢迎，{user?.username}!</h1>
      <button onClick={logout}>登出</button>
    </div>
  );
}
```

### 受保护的路由

```tsx
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return children;
}
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
