#!/bin/bash

# AI 军团 MVP 快速启动脚本
# 使用：./start-dev.sh

set -e

echo "🚀 AI 军团 MVP 开发环境启动"
echo "════════════════════════════"

# 检查必要工具
echo "📋 检查环境..."
command -v node >/dev/null 2>&1 || { echo "❌ 需要安装 Node.js"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ 需要安装 pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 && echo "✅ Docker 已安装（可选）"

# 检查 .env 文件
if [ ! -f "apps/api/.env" ]; then
    echo "⚠️  未找到 apps/api/.env 文件"
    echo "📝 正在从 .env.example 复制..."
    cp apps/api/.env.example apps/api/.env
    echo "✅ 已创建，请编辑 apps/api/.env 填入你的配置"
    echo ""
    echo "必要配置："
    echo "  - DATABASE_URL"
    echo "  - REDIS_URL"
    echo "  - JWT_SECRET"
    echo "  - OPENAI_API_KEY"
    echo "  - ANTHROPIC_API_KEY"
    echo ""
    read -p "按回车继续..."
fi

# 安装依赖
echo ""
echo "📦 安装依赖..."
pnpm install

# 初始化数据库
echo ""
echo "🗄️  初始化数据库..."
cd apps/api
if [ ! -f ".env" ]; then
    echo "❌ 请先配置 apps/api/.env"
    exit 1
fi

echo "运行 Prisma 迁移..."
pnpm prisma migrate dev --name init

# 返回根目录
cd ../..

# 启动服务
echo ""
echo "🚀 启动开发服务..."
echo ""
echo "服务将在以下地址可用："
echo "  🌐 前端：http://localhost:3000"
echo "  📡 API:  http://localhost:4000"
echo "  📚 Swagger: http://localhost:4000/api/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "════════════════════════════"
echo ""

# 启动前后端
pnpm dev
