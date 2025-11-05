# Todo App 项目概述

## 项目信息

- **项目名称**: Todo App - 任务管理系统
- **版本**: 0.1.0
- **创建时间**: 2025-11-05

## 技术栈总结

### 后端技术
- **框架**: Django 5.x + Django REST Framework
- **认证**: JWT (djangorestframework-simplejwt)
- **文档**: drf-spectacular (OpenAPI/Swagger)
- **数据库**: PostgreSQL (生产环境) / SQLite (开发环境)
- **包管理**: uv
- **服务器**: Gunicorn (生产环境)

### 前端技术
- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS
- **状态管理**: Zustand (全局状态) + React Query (服务端状态)
- **路由**: React Router v6
- **包管理**: pnpm

### 部署技术
- **容器化**: Docker + Docker Compose
- **Web服务器**: Nginx
- **数据库**: PostgreSQL

## 核心功能模块

### 1. 用户管理 (users)
- 用户注册/登录
- JWT 认证
- 用户信息管理

### 2. 任务管理 (tasks)
- 任务 CRUD 操作
- 任务状态管理 (待办/进行中/已完成)
- 优先级设置 (无/低/中/高)
- 截止时间
- 标星收藏
- 子任务支持
- 拖拽排序

### 3. 项目管理 (projects)
- 项目 CRUD 操作
- 项目颜色标识
- 项目收藏
- 任务分组

### 4. 标签管理 (tags)
- 标签 CRUD 操作
- 任务标签关联
- 按标签筛选

## 数据库模型

### User (用户)
- id, username, email, password
- avatar, bio
- created_at, updated_at

### Task (任务)
- id, title, description
- user_id (外键)
- project_id (外键, 可选)
- parent_id (外键, 可选) - 支持子任务
- priority (优先级)
- status (状态)
- due_date (截止时间)
- completed_at (完成时间)
- order (排序)
- is_starred (是否标星)
- created_at, updated_at

### Project (项目)
- id, name, description
- color (颜色标识)
- user_id (外键)
- is_favorite (是否收藏)
- order (排序)
- created_at, updated_at

### Tag (标签)
- id, name, color
- user_id (外键)
- created_at, updated_at

### TaskTag (任务-标签关联)
- id
- task_id (外键)
- tag_id (外键)
- created_at

## API 端点

### 认证
- `POST /api/token/` - 登录获取 Token
- `POST /api/token/refresh/` - 刷新 Token
- `POST /api/users/register/` - 注册
- `GET /api/users/me/` - 获取当前用户

### 任务
- `GET /api/tasks/` - 获取任务列表
- `POST /api/tasks/` - 创建任务
- `GET /api/tasks/{id}/` - 获取任务详情
- `PATCH /api/tasks/{id}/` - 更新任务
- `DELETE /api/tasks/{id}/` - 删除任务
- `POST /api/tasks/{id}/complete/` - 完成任务
- `POST /api/tasks/{id}/toggle_star/` - 切换标星
- `GET /api/tasks/today/` - 今日任务

### 项目
- `GET /api/projects/` - 获取项目列表
- `POST /api/projects/` - 创建项目
- `GET /api/projects/{id}/` - 获取项目详情
- `PATCH /api/projects/{id}/` - 更新项目
- `DELETE /api/projects/{id}/` - 删除项目
- `POST /api/projects/{id}/toggle_favorite/` - 切换收藏

### 标签
- `GET /api/tags/` - 获取标签列表
- `POST /api/tags/` - 创建标签
- `GET /api/tags/{id}/` - 获取标签详情
- `PATCH /api/tags/{id}/` - 更新标签
- `DELETE /api/tags/{id}/` - 删除标签

## 前端路由

- `/login` - 登录页
- `/register` - 注册页
- `/dashboard` - 仪表盘
- `/tasks` - 任务列表
- `/projects` - 项目列表

## 开发工作流

### 本地开发
1. 启动数据库: `make dev-up` 或 `./dev-setup.sh`
2. 后端开发: `make backend-dev`
3. 前端开发: `make frontend-dev`

### 生产部署
1. 构建和部署: `make prod-up`
2. 查看日志: `docker-compose logs -f`
3. 停止服务: `make prod-down`

## 环境变量

### 后端 (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://user:pass@host:5432/db
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 前端 (.env)
```
VITE_API_URL=http://localhost:8000/api
```

## 文件结构

```
backend/
├── apps/
│   ├── users/       - 用户模块
│   ├── tasks/       - 任务模块
│   ├── projects/    - 项目模块
│   └── tags/        - 标签模块
├── todo_project/
│   ├── settings.py  - Django 配置
│   ├── urls.py      - URL 路由
│   ├── wsgi.py      - WSGI 入口
│   └── asgi.py      - ASGI 入口
├── manage.py        - Django 管理脚本
└── pyproject.toml   - 依赖配置

frontend/
├── src/
│   ├── components/  - React 组件
│   ├── pages/       - 页面组件
│   ├── services/    - API 服务
│   ├── store/       - 状态管理
│   ├── types/       - TS 类型
│   ├── utils/       - 工具函数
│   ├── App.tsx      - 根组件
│   └── main.tsx     - 入口文件
└── package.json     - 依赖配置
```

## 下一步计划

1. 完善前端 UI 组件（shadcn/ui 集成）
2. 实现拖拽排序功能
3. 添加任务筛选和搜索
4. 实现今日任务视图
5. 添加任务统计图表
6. 实现移动端响应式布局
7. 添加单元测试
8. 性能优化
9. 部署到生产环境

## 注意事项

1. 开发环境使用 SQLite，生产环境使用 PostgreSQL
2. JWT Token 默认有效期: Access Token 1天, Refresh Token 7天
3. API 文档访问地址: http://localhost:8000/api/docs/
4. 确保 CORS 配置正确
5. 生产环境需要更改 SECRET_KEY
