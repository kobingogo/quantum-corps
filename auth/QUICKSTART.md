# 快速开始指南

## 1. 复制环境变量文件

```bash
cd auth
cp .env.example .env
```

## 2. 配置 OAuth (可选但推荐)

### Google OAuth
1. 访问 https://console.cloud.google.com/
2. 创建新项目
3. 创建 OAuth 2.0 凭据
4. 将 Client ID 和 Secret 填入 `.env`

### GitHub OAuth
1. 访问 https://github.com/settings/developers
2. 创建 New OAuth App
3. 将 Client ID 和 Secret 填入 `.env`

## 3. 安装依赖

```bash
npm install
```

## 4. 启动开发服务器

### 方式一：同时启动前后端（推荐）

```bash
# 在项目根目录
npm run dev:backend  # 终端 1
npm run dev:frontend # 终端 2
```

### 方式二：仅后端（用于测试 API）

```bash
npm run dev:backend
```

然后用 Postman 或 curl 测试 API。

## 5. 测试登录

访问 http://localhost:3000

- 使用邮箱密码注册/登录
- 或点击 Google/GitHub 按钮进行 OAuth 登录

## 6. 运行测试

```bash
# 所有测试
npm test

# 单元测试
npm run test:unit

# 集成测试
npm run test:integration
```

## 常见问题

### 端口被占用
修改 `.env` 中的 `PORT` 值

### CORS 错误
确保 `.env` 中的 `CORS_ORIGIN` 与前端地址匹配

### OAuth 回调失败
检查 `.env` 中的回调 URL 是否与 OAuth 应用配置一致
