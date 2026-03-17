# AI 军团管理平台 - MVP

> 🤖 游戏化管理你的 AI Agent 团队

**版本：** 0.1.0 MVP  
**启动时间：** 2026-03-17  
**目标用户：** 个人开发者/创业者  
**开源策略：** 核心开源 + 企业版收费

---

## 🚀 快速开始

### 前置条件

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14
- Redis >= 6

### 1. 安装依赖

```bash
cd /Users/bingo/openclaw_all
pnpm install
```

### 2. 配置环境变量

**API 服务 (.env):**
```bash
cp apps/api/.env.example apps/api/.env
# 编辑 apps/api/.env 填入你的配置
```

**必要配置：**
- `DATABASE_URL` - PostgreSQL 连接字符串
- `REDIS_URL` - Redis 连接字符串
- `JWT_SECRET` - JWT 密钥（生产环境务必修改）
- `OPENAI_API_KEY` - OpenAI API 密钥
- `ANTHROPIC_API_KEY` - Anthropic API 密钥

### 3. 初始化数据库

```bash
cd apps/api
pnpm prisma migrate dev --name init
```

### 4. 启动服务

**开发模式（同时启动前后端）:**
```bash
# 根目录
pnpm dev
```

**单独启动:**
```bash
# API 服务 (端口 4000)
cd apps/api
pnpm dev

# Web 前端 (端口 3000)
cd apps/web
pnpm dev
```

### 5. 访问应用

- **前端:** http://localhost:3000
- **API 文档:** http://localhost:4000/api/docs
- **WebSocket:** ws://localhost:4000/events

---

## 📁 项目结构

```
openclaw_all/
├── apps/
│   ├── web/              # Next.js 前端
│   │   ├── src/
│   │   │   ├── app/      # 页面路由
│   │   │   ├── components/  # React 组件
│   │   │   └── lib/      # 工具库
│   │   └── package.json
│   │
│   └── api/              # NestJS 后端
│       ├── src/
│       │   ├── auth/     # 认证模块
│       │   ├── agents/   # Agent 管理
│       │   ├── tasks/    # 任务系统
│       │   ├── events/   # WebSocket 事件
│       │   └── prisma/   # 数据库
│       └── package.json
│
├── packages/
│   └── shared/           # 共享代码
│
├── docs/                 # 文档
│   ├── MVP-PRD-v1.0.md
│   └── 3D-Agent-Design-v1.0.md
│
├── agents/               # 现有 Agent 定义（保留）
├── orchestrator/         # 现有编排逻辑（保留）
└── shared/               # 现有共享模块（保留）
```

---

## 🎯 MVP 功能范围

### ✅ Week 1 - 基础架构（进行中）

- [x] 项目初始化（Monorepo）
- [x] 数据库设计（Prisma + PostgreSQL）
- [x] 用户认证（JWT）
- [x] Agent CRUD API
- [ ] WebSocket 实时通信
- [ ] 前端监控面板

### 📋 Week 2 - 核心功能

- [ ] 自然语言任务创建
- [ ] 任务队列（BullMQ）
- [ ] 任务执行引擎
- [ ] 实时日志推送

### 📋 Week 3 - 前端完善

- [ ] 任务创建界面
- [ ] Agent 详情页面
- [ ] 成本统计图表
- [ ] 响应式优化

### 📋 Week 4 - 测试上线

- [ ] E2E 测试
- [ ] 性能优化
- [ ] 部署配置（Docker）
- [ ] 种子用户邀请

---

## 🔧 技术栈

### 前端
- **框架:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + 自定义组件
- **状态管理:** Zustand
- **实时通信:** Socket.io Client
- **图表:** Recharts
- **动画:** Framer Motion

### 后端
- **框架:** NestJS
- **数据库:** PostgreSQL + Prisma
- **队列:** BullMQ (Redis)
- **认证:** JWT + Passport
- **实时:** WebSocket Gateway
- **AI:** AI SDK (OpenAI + Anthropic)

### 部署
- **前端:** Vercel
- **后端:** Railway / Render
- **数据库:** Neon (Serverless Postgres)
- **Redis:** Upstash

---

## 📊 API 接口

### 认证
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录

### Agent 管理
- `GET /agents` - 获取 Agent 列表
- `POST /agents` - 创建 Agent
- `GET /agents/:id` - 获取 Agent 详情
- `PUT /agents/:id` - 更新 Agent
- `DELETE /agents/:id` - 删除 Agent

### 任务管理
- `GET /tasks` - 获取任务列表
- `POST /tasks` - 创建任务
- `GET /tasks/:id` - 获取任务详情
- `POST /tasks/:id/cancel` - 取消任务

### WebSocket 事件
- `task:created` - 任务创建
- `task:running` - 任务开始
- `task:completed` - 任务完成
- `task:log` - 日志推送

---

## 🧪 开发指南

### 添加新 Agent 部门

1. 更新数据库枚举（`apps/api/prisma/schema.prisma`）
2. 更新 DTO 枚举（`apps/api/src/agents/dto/create-agent.dto.ts`）
3. 更新前端图标映射（`apps/web/src/components/AgentGrid.tsx`）

### 添加新任务类型

1. 创建任务处理器（`apps/api/src/tasks/processors/`）
2. 注册到 BullMQ 队列
3. 添加前端创建表单

---

## ⚠️ 注意事项

1. **不要硬编码敏感信息** - 使用环境变量
2. **定期审查日志** - `logs/` 目录
3. **生产环境修改 JWT_SECRET** - 默认值不安全
4. **数据库备份** - 定期备份 PostgreSQL

---

## 📝 更新日志

### v0.1.0 (2026-03-17) - MVP 启动
- ✅ 项目初始化
- ✅ 数据库设计
- ✅ 用户认证
- ✅ Agent CRUD
- 🚧 前端开发中

---

## 🤝 贡献指南

本项目采用核心开源 + 企业版收费模式：

- **核心功能:** MIT 许可证，完全开源
- **企业功能:** 闭源，需商业授权

**企业版功能包括:**
- 私有部署
- 定制 Agent
- SLA 保障
- 专属支持

---

## 📞 联系方式

- **项目地址:** `/Users/bingo/openclaw_all`
- **文档:** `/docs/` 目录
- **小 Q:** 随时在 Feishu 找我 🌀

---

*由小 Q 🌀 协助开发 | 最后更新：2026-03-17*
