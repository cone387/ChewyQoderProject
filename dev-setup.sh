#!/bin/bash

# Todo App 快速启动脚本

echo "=== Todo App 开发环境启动脚本 ==="
echo ""

# 检查是否在项目根目录
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 启动数据库
echo "1. 启动数据库..."
docker-compose -f docker-compose.dev.yml up -d
echo "✓ 数据库已启动"
echo ""

# 等待数据库启动
echo "2. 等待数据库准备就绪..."
sleep 5
echo "✓ 数据库已就绪"
echo ""

# 后端设置
echo "3. 配置后端..."
cd backend

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
    echo "✓ .env 文件已创建"
fi

# 检查是否需要安装依赖（简化检查）
echo "提示: 请确保已安装后端依赖 (uv pip install -r pyproject.toml)"
echo "提示: 如需运行迁移，请执行: python manage.py migrate"
echo ""

cd ..

# 前端设置
echo "4. 配置前端..."
cd frontend

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
    echo "✓ .env 文件已创建"
fi

echo "提示: 请确保已安装前端依赖 (pnpm install)"
echo ""

cd ..

echo "==================================="
echo "环境配置完成！"
echo ""
echo "接下来的步骤："
echo "1. 安装后端依赖:"
echo "   cd backend && uv pip install -r pyproject.toml"
echo ""
echo "2. 运行数据库迁移:"
echo "   cd backend && python manage.py migrate"
echo ""
echo "3. 创建超级用户 (可选):"
echo "   cd backend && python manage.py createsuperuser"
echo ""
echo "4. 启动后端服务器:"
echo "   cd backend && python manage.py runserver"
echo ""
echo "5. 安装前端依赖 (在新终端):"
echo "   cd frontend && pnpm install"
echo ""
echo "6. 启动前端服务器:"
echo "   cd frontend && pnpm dev"
echo ""
echo "访问地址:"
echo "- 前端: http://localhost:5173"
echo "- 后端 API: http://localhost:8000"
echo "- API 文档: http://localhost:8000/api/docs/"
echo "==================================="
