# AI 军团 MVP 开发计划

**启动时间：** 2026-03-17  
**目标：** 4 周上线可用的 MVP  
**技术栈：** Node.js (Next.js 14 + NestJS)  
**目标用户：** 个人开发者/创业者  
**开源策略：** 核心开源 + 企业版收费

---

## 📋 Week 1 - 基础架构（3 月 17 日 - 3 月 24 日）

### 目标
搭建完整的前后端框架，实现用户认证和 Agent 基础管理

### 任务清单

#### 1.1 项目初始化
- [ ] 创建 Next.js 14 前端项目（app-router）
- [ ] 创建 NestJS 后端项目
- [ ] 配置 TypeScript 共享类型
- [ ] 设置 Monorepo 结构（pnpm workspace）

#### 1.2 数据库设计
- [ ] 设计 PostgreSQL schema（agents/tasks/logs/metrics）
- [ ] 编写 Prisma schema 或 TypeORM entities
- [ ] 创建数据库迁移脚本
- [ ] 本地测试数据库连接

#### 1.3 用户认证
- [ ] 实现 JWT 认证（access + refresh token）
- [ ] 注册/登录 API
- [ ] 密码加密（bcrypt）
- [ ] 用户中间件

#### 1.4 Agent CRUD
- [ ] 创建 Agent 表
- [ ] 实现 Agent CRUD API
- [ ] Agent 状态管理（idle/busy/error/offline）
- [ ] 单元测试

### 交付物
- ✅ 可运行的前后端项目
- ✅ 用户注册/登录功能
- ✅ Agent 创建/删除/列表 API

---

## 📋 Week 2 - 核心功能（3 月 24 日 - 3 月 31 日）

### 目标
实现任务系统和自然语言解析，打通任务执行流程

### 任务清单

#### 2.1 任务系统 API
- [ ] 创建 Task 表
- [ ] 任务 CRUD API
- [ ] 任务状态机（pending → running → completed/failed）
- [ ] 任务优先级队列

#### 2.2 自然语言解析
- [ ] 意图识别 prompt 设计
- [ ] 集成 OpenAI/Claude 解析用户输入
- [ ] 提取任务参数（时间/动作/目标）
- [ ] 返回确认卡片数据结构

#### 2.3 任务执行引擎
- [ ] BullMQ 队列配置
- [ ] Worker 进程（执行任务）
- [ ] Agent 调用逻辑
- [ ] 任务超时处理

#### 2.4 实时日志
- [ ] WebSocket 网关（NestJS Gateway）
- [ ] 日志推送事件（task:started, task:progress, task:completed）
- [ ] 前端订阅逻辑
- [ ] 断线重连

### 交付物
- ✅ 自然语言创建任务
- ✅ 任务队列执行
- ✅ 实时日志推送

---

## 📋 Week 3 - 前端面板（3 月 31 日 - 4 月 7 日）

### 目标
完成监控面板和交互界面，实现"游戏化"视觉体验

### 任务清单

#### 3.1 布局框架
- [ ] Dashboard 主布局（Sidebar + Header + Content）
- [ ] 响应式设计（桌面/平板/手机）
- [ ] 主题配置（深色模式）
- [ ] 路由配置

#### 3.2 监控面板
- [ ] 全局概览卡片（Agent 总数/任务数/消耗）
- [ ] Agent 列表网格（卡片式）
- [ ] Agent 状态标识（颜色 + 动画）
- [ ] 部门筛选功能

#### 3.3 任务界面
- [ ] 任务创建输入框（自然语言）
- [ ] 任务队列列表
- [ ] 任务详情弹窗
- [ ] 进度条动画

#### 3.4 日志组件
- [ ] 实时日志滚动列表
- [ ] 日志级别颜色（info/warning/error）
- [ ] 自动滚动到底部
- [ ] 日志搜索/过滤

#### 3.5 成本统计
- [ ] Token 消耗图表（Recharts）
- [ ] 按 Agent 分组统计
- [ ] 按时间范围筛选
- [ ] 预算告警设置

### 交付物
- ✅ 完整的监控面板
- ✅ 实时任务日志
- ✅ 成本统计图表

---

## 📋 Week 4 - 测试上线（4 月 7 日 - 4 月 14 日）

### 目标
完成测试优化，部署上线，邀请种子用户

### 任务清单

#### 4.1 集成测试
- [ ] E2E 测试（Playwright）
- [ ] API 测试（Supertest）
- [ ] 性能压测（k6）
- [ ] 修复关键 bug

#### 4.2 性能优化
- [ ] 数据库查询优化（索引）
- [ ] 前端代码分割
- [ ] 图片/资源压缩
- [ ] CDN 配置

#### 4.3 部署配置
- [ ] Docker Compose 配置
- [ ] 前端部署 Vercel
- [ ] 后端部署 Railway/Render
- [ ] 数据库部署 Neon/Supabase

#### 4.4 种子用户
- [ ] 邀请 10-20 个早期用户
- [ ] 创建用户反馈表单
- [ ] 设置 Discord/微信群
- [ ] 收集 NPS 评分

#### 4.5 文档完善
- [ ] README 更新
- [ ] API 文档（Swagger/OpenAPI）
- [ ] 部署指南
- [ ] 用户手册

### 交付物
- ✅ 线上可用版本
- ✅ 种子用户反馈
- ✅ 完整文档

---

## 🛠️ 技术选型确认

### 前端
```json
{
  "framework": "Next.js 14",
  "ui": "Tailwind CSS + shadcn/ui",
  "animation": "Framer Motion",
  "3d": "Three.js + React Three Fiber (Phase 2)",
  "charts": "Recharts",
  "realtime": "WebSocket (Socket.io client)"
}
```

### 后端
```json
{
  "framework": "NestJS",
  "database": "PostgreSQL + Prisma ORM",
  "queue": "BullMQ (Redis)",
  "cache": "Redis",
  "auth": "JWT + bcrypt",
  "realtime": "WebSocket Gateway",
  "models": "OpenAI + Claude (AI SDK)"
}
```

### 部署
```json
{
  "frontend": "Vercel",
  "backend": "Railway",
  "database": "Neon (Serverless Postgres)",
  "redis": "Upstash",
  "monitoring": "Sentry + Logtail"
}
```

---

## 📊 成功指标

| 指标 | 目标值 | 测量方式 |
|------|--------|----------|
| 注册用户 | 50+ | 数据库统计 |
| WAU | 20+ | 登录日志 |
| Agent 创建数 | 100+ | 数据库统计 |
| 任务成功率 | >90% | 任务表统计 |
| 7 日留存 | >40% | Cohort 分析 |
| NPS | >30 | 用户调研 |

---

## ⚠️ 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 开发延期 | 中 | 高 | 严格限制 P0 功能 |
| 性能问题 | 低 | 中 | 早期压测 |
| 用户增长慢 | 中 | 中 | 种子用户计划 |
| API 成本高 | 中 | 低 | 缓存 + 降级 |

---

## 🎯 每日站会模板

```
日期：YYYY-MM-DD
昨日完成：
- [ ] 任务 1
- [ ] 任务 2

今日计划：
- [ ] 任务 1
- [ ] 任务 2

阻塞问题：
- [ ] 问题描述

备注：
- 任何想法/发现
```

---

*最后更新：2026-03-17 | 作者：小 Q 🌀*
