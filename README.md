# Todo App - 任务管理系统

一个功能完善的任务管理系统，提供与滴答清单（TickTick）相似的用户体验，支持任务的层级管理、多维度组织（项目/分组/标签）、时间规划等核心功能。

## 技术栈

### 后端
- Django 5.x - Web 框架
- Django REST Framework - API 开发
- djangorestframework-simplejwt - JWT 认证
- drf-spectacular - API 文档生成
- django-filter - 查询过滤
- django-cors-headers - 跨域支持
- django-environ - 环境变量管理
- PostgreSQL / SQLite - 数据库
- uv - Python 项目依赖管理

### 前端
- React 19 + TypeScript - UI 框架
- Vite - 构建工具
- TailwindCSS - 样式框架
- React Query - 数据缓存与状态同步
- Zustand - 全局状态管理
- React Router v6 - 路由管理
- React Beautiful DnD - 拖拽排序
- dayjs - 日期处理
- pnpm - 包管理器

### 部署
- Docker + Docker Compose - 容器化
- Gunicorn - WSGI 服务器
- Nginx - 反向代理与静态文件服务

## 项目结构

```
ChewyQoderProject/
├── backend/                 # Django 后端
│   ├── apps/               # 应用模块
│   │   ├── users/         # 用户管理
│   │   ├── tasks/         # 任务管理
│   │   ├── projects/      # 项目管理
│   │   └── tags/          # 标签管理
│   ├── todo_project/      # Django 项目配置
│   ├── manage.py          # Django 管理脚本
│   ├── pyproject.toml     # Python 依赖配置
│   ├── .env.example       # 环境变量示例
│   └── Dockerfile         # 后端 Docker 配置
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── store/         # 状态管理
│   │   ├── types/         # TypeScript 类型定义
│   │   └── utils/         # 工具函数
│   ├── public/            # 静态资源
│   ├── package.json       # 前端依赖配置
│   ├── vite.config.ts     # Vite 配置
│   ├── tailwind.config.js # TailwindCSS 配置
│   ├── nginx.conf         # Nginx 配置
│   └── Dockerfile         # 前端 Docker 配置
├── docker-compose.yml      # 生产环境 Docker Compose
├── docker-compose.dev.yml  # 开发环境 Docker Compose
└── README.md              # 项目说明文档
```

## 快速开始

### 前置要求

开发环境需要安装：
- Python 3.11+
- Node.js 20+
- pnpm
- uv (Python 包管理器)
- PostgreSQL (可选，使用 Docker)

生产环境需要安装：
- Docker
- Docker Compose

### 开发环境设置

#### 1. 启动数据库（使用 Docker）

```bash
docker-compose -f docker-compose.dev.yml up -d
```

#### 2. 后端设置

```bash
cd backend

# 复制环境变量文件
cp .env.example .env

# 安装 uv（如果未安装）
pip install uv

# 安装依赖
uv pip install -r pyproject.toml

# 运行数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver
```

后端服务将运行在 `http://localhost:8000`

API 文档访问：
- Swagger UI: `http://localhost:8000/api/docs/`
- API Schema: `http://localhost:8000/api/schema/`

#### 3. 前端设置

```bash
cd frontend

# 安装 pnpm（如果未安装）
npm install -g pnpm

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

前端服务将运行在 `http://localhost:5173`

### 生产环境部署

使用 Docker Compose 一键部署：

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问应用：
- 前端: `http://localhost`
- 后端 API: `http://localhost:8000`

## 核心功能

### 用户管理
- 用户注册和登录
- JWT 认证
- 用户信息管理

### 任务管理
- 创建、编辑、删除任务
- 任务状态管理（待办、进行中、已完成）
- 优先级设置
- 截止时间
- 标星收藏
- 子任务支持
- 任务排序

### 项目管理
- 创建和管理项目
- 项目颜色标识
- 项目收藏
- 任务分组到项目

### 标签管理
- 创建和管理标签
- 为任务添加标签
- 按标签筛选任务

## 环境变量配置

### 后端环境变量 (.env)

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://todo_user:todo_password@localhost:5432/todo_db
# 或使用 SQLite（开发环境）
# DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 前端环境变量

在 `frontend/.env` 中配置：

```env
VITE_API_URL=http://localhost:8000/api
```

## API 接口

主要 API 端点：

### 认证
- `POST /api/token/` - 获取访问令牌
- `POST /api/token/refresh/` - 刷新令牌
- `POST /api/users/register/` - 用户注册
- `GET /api/users/me/` - 获取当前用户信息

### 任务
- `GET /api/tasks/` - 获取任务列表
- `POST /api/tasks/` - 创建任务
- `GET /api/tasks/{id}/` - 获取任务详情
- `PATCH /api/tasks/{id}/` - 更新任务
- `DELETE /api/tasks/{id}/` - 删除任务
- `POST /api/tasks/{id}/complete/` - 完成任务
- `POST /api/tasks/{id}/toggle_star/` - 切换标星状态
- `GET /api/tasks/today/` - 获取今日任务

### 项目
- `GET /api/projects/` - 获取项目列表
- `POST /api/projects/` - 创建项目
- `GET /api/projects/{id}/` - 获取项目详情
- `PATCH /api/projects/{id}/` - 更新项目
- `DELETE /api/projects/{id}/` - 删除项目
- `POST /api/projects/{id}/toggle_favorite/` - 切换收藏状态

### 标签
- `GET /api/tags/` - 获取标签列表
- `POST /api/tags/` - 创建标签
- `GET /api/tags/{id}/` - 获取标签详情
- `PATCH /api/tags/{id}/` - 更新标签
- `DELETE /api/tags/{id}/` - 删除标签

## 开发指南

### 代码规范

#### Python (后端)
- 遵循 PEP 8 规范
- 使用 Black 格式化代码
- 使用 isort 排序导入
- 使用 Flake8 检查代码质量

```bash
# 格式化代码
black .

# 排序导入
isort .

# 检查代码
flake8
```

#### TypeScript (前端)
- 使用 ESLint 检查代码
- 使用 Prettier 格式化代码（可选）

```bash
# 检查代码
pnpm lint
```

### 数据库迁移

```bash
# 创建迁移文件
python manage.py makemigrations

# 执行迁移
python manage.py migrate

# 查看迁移状态
python manage.py showmigrations
```

### 测试

```bash
# 后端测试
cd backend
pytest

# 前端测试（需要配置）
cd frontend
pnpm test
```

## 常见问题

### 1. 数据库连接失败

确保 PostgreSQL 服务正在运行，并且环境变量中的数据库配置正确。

### 2. 前端无法连接后端 API

检查 CORS 设置，确保后端 `CORS_ALLOWED_ORIGINS` 包含前端地址。

### 3. Docker 构建失败

确保 Docker 和 Docker Compose 版本是最新的，并检查 Dockerfile 中的配置。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请通过 Issue 联系。
