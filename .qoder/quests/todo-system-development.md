# 待办系统 (Todo App) - 系统设计文档

## 一、项目概述

### 1.1 项目定位
构建一个功能完善的任务管理系统，提供与滴答清单（TickTick）相似的用户体验，支持任务的层级管理、多维度组织（项目/分组/标签）、时间规划和活动追踪等核心功能。

### 1.2 技术架构选型

**后端技术栈**
- Django 5.x - Web 框架
- Django REST Framework - API 开发
- djangorestframework-simplejwt - JWT 认证
- drf-spectacular - API 文档生成
- django-filter - 查询过滤
- django-cors-headers - 跨域支持
- django-environ - 环境变量管理
- PostgreSQL / SQLite - 数据库
- uv - Python 项目依赖管理

**前端技术栈**
- React 19 + TypeScript - UI 框架
- Vite - 构建工具
- TailwindCSS - 样式框架
- shadcn/ui - UI 组件库
- React Query - 数据缓存与状态同步
- Zustand - 全局状态管理
- React Router v6 - 路由管理
- React Beautiful DnD - 拖拽排序
- dayjs - 日期处理
- pnpm - 包管理器

**部署技术栈**
- Docker + Docker Compose - 容器化
- Gunicorn - WSGI 服务器
- Nginx - 反向代理与静态文件服务

### 1.3 系统架构

```mermaid
graph TB
    subgraph 客户端层
        A[Web 浏览器]
        B[移动浏览器]
    end
    
    subgraph 前端服务
        C[React SPA<br/>Vite + TailwindCSS]
        D[Nginx 静态服务]
    end
    
    subgraph 后端服务
        E[Django REST API]
        F[JWT 认证中间件]
        G[Django ORM]
    end
    
    subgraph 数据层
        H[(PostgreSQL)]
        I[Redis 缓存<br/>未来扩展]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    E -.-> I
