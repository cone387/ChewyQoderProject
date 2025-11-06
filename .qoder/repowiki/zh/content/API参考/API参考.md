# API参考

<cite>
**本文档中引用的文件**  
- [backend/apps/users/urls.py](file://backend/apps/users/urls.py)
- [backend/apps/users/views.py](file://backend/apps/users/views.py)
- [backend/apps/users/serializers.py](file://backend/apps/users/serializers.py)
- [backend/apps/tasks/urls.py](file://backend/apps/tasks/urls.py)
- [backend/apps/tasks/views.py](file://backend/apps/tasks/views.py)
- [backend/apps/tasks/serializers.py](file://backend/apps/tasks/serializers.py)
- [backend/apps/projects/urls.py](file://backend/apps/projects/urls.py)
- [backend/apps/projects/views.py](file://backend/apps/projects/views.py)
- [backend/apps/projects/serializers.py](file://backend/apps/projects/serializers.py)
- [backend/apps/tags/urls.py](file://backend/apps/tags/urls.py)
- [backend/apps/tags/views.py](file://backend/apps/tags/views.py)
- [backend/apps/tags/serializers.py](file://backend/apps/tags/serializers.py)
- [backend/todo_project/urls.py](file://backend/todo_project/urls.py)
- [README.md](file://README.md)
- [PROJECT_OVERVIEW.md](file://PROJECT_OVERVIEW.md)
</cite>

## 目录
1. [简介](#简介)
2. [认证API](#认证api)
3. [用户API](#用户api)
4. [任务API](#任务api)
5. [项目API](#项目api)
6. [标签API](#标签api)
7. [JWT认证流程](#jwt认证流程)
8. [错误响应码](#错误响应码)
9. [API版本控制与速率限制](#api版本控制与速率限制)

## 简介
本API参考文档详细描述了任务管理系统的所有公开RESTful API端点。系统基于Django REST Framework构建，采用JWT进行身份验证，并通过drf-spectacular自动生成OpenAPI文档。所有API均以`/api/`为前缀，可通过`http://localhost:8000/api/docs/`访问交互式Swagger UI文档。

**Section sources**
- [README.md](file://README.md#L206-L240)
- [PROJECT_OVERVIEW.md](file://PROJECT_OVERVIEW.md#L98-L130)

## 认证API
认证API提供用户登录、注册和令牌管理功能。

### 获取访问令牌
- **HTTP方法**: `POST`
- **URL模式**: `/api/token/`
- **请求头**: `Content-Type: application/json`
- **请求体schema**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应体schema**:
  ```json
  {
    "refresh": "string",
    "access": "string"
  }
  ```

### 刷新令牌
- **HTTP方法**: `POST`
- **URL模式**: `/api/token/refresh/`
- **请求头**: `Content-Type: application/json`
- **请求体schema**:
  ```json
  {
    "refresh": "string"
  }
  ```
- **响应体schema**:
  ```json
  {
    "access": "string"
  }
  ```

**Section sources**
- [backend/apps/users/urls.py](file://backend/apps/users/urls.py#L1-L10)
- [README.md](file://README.md#L210-L213)

## 用户API
用户API管理用户账户信息。

### 用户注册
- **HTTP方法**: `POST`
- **URL模式**: `/api/users/register/`
- **请求头**: `Content-Type: application/json`
- **请求体schema**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **响应体schema**:
  ```json
  {
    "id": "integer",
    "username": "string",
    "email": "string"
  }
  ```

### 获取当前用户信息
- **HTTP方法**: `GET`
- **URL模式**: `/api/users/me/`
- **请求头**: `Authorization: Bearer <access_token>`
- **响应体schema**:
  ```json
  {
    "id": "integer",
    "username": "string",
    "email": "string",
    "avatar": "string",
    "bio": "string"
  }
  ```

**Section sources**
- [backend/apps/users/views.py](file://backend/apps/users/views.py#L15-L50)
- [backend/apps/users/serializers.py](file://backend/apps/users/serializers.py#L10-L30)

## 任务API
任务API提供完整的任务管理功能。

### 获取任务列表
- **HTTP方法**: `GET`
- **URL模式**: `/api/tasks/`
- **请求头**: `Authorization: Bearer <access_token>`
- **查询参数**:
  - `project_id`: 按项目过滤
  - `status`: 按状态过滤（pending, in_progress, completed）
  - `priority`: 按优先级过滤（low, medium, high）
  - `is_starred`: 是否标星
- **响应体schema**:
  ```json
  [
    {
      "id": "integer",
      "title": "string",
      "description": "string",
      "status": "string",
      "priority": "string",
      "due_date": "datetime",
      "is_starred": "boolean",
      "project": "integer",
      "order": "integer"
    }
  ]
  ```

### 创建任务
- **HTTP方法**: `POST`
- **URL模式**: `/api/tasks/`
- **请求头**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **请求体schema**:
  ```json
  {
    "title": "string",
    "description": "string",
    "status": "string",
    "priority": "string",
    "due_date": "datetime",
    "project": "integer",
    "order": "integer"
  }
  ```
- **响应体schema**: 同获取任务列表中的单个任务对象

### 获取任务详情
- **HTTP方法**: `GET`
- **URL模式**: `/api/tasks/{id}/`
- **请求头**: `Authorization: Bearer <access_token>`
- **响应体schema**: 同创建任务的响应体

### 更新任务
- **HTTP方法**: `PATCH`
- **URL模式**: `/api/tasks/{id}/`
- **请求头**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **请求体schema**: 与创建任务相同，仅需提供要更新的字段
- **响应体schema**: 完整的任务对象

### 删除任务
- **HTTP方法**: `DELETE`
- **URL模式**: `/api/tasks/{id}/`
- **请求头**: `Authorization: Bearer <access_token>`

### 完成任务
- **HTTP方法**: `POST`
- **URL模式**: `/api/tasks/{id}/complete/`
- **请求头**: `Authorization: Bearer <access_token>`
- **响应体schema**:
  ```json
  {
    "success": "boolean",
    "message": "string"
  }
  ```

### 切换标星状态
- **HTTP方法**: `POST`
- **URL模式**: `/api/tasks/{id}/toggle_star/`
- **请求头**: `Authorization: Bearer <access_token>`
- **响应体schema**: 同完成任务

### 获取今日任务
- **HTTP方法**: `GET`
- **URL模式**: `/api/tasks/today/`
- **请求头**: `Authorization: Bearer <access_token>`
- **响应体schema**: 同任务列表

**Section sources**
- [backend/apps/tasks/urls.py](file://backend/apps/tasks/urls.py#L1-L15)
- [backend/apps/tasks/views.py](file://backend/apps/tasks/views.py#L20-L100)
- [backend/apps/tasks/serializers.py](file://backend/apps/tasks/serializers.py#L15-L40)

## 项目API
项目API管理任务的分组项目。

### 获取项目列表
- **HTTP方法**: `GET`
- **URL模式**: `/api/projects/`
- **请求头**: `Authorization: Bearer <access_token>`
- **响应体schema**:
  ```json
  [
    {
      "id": "integer",
      "name": "string",
      "description": "string",
      "color": "string",
      "is_favorite": "boolean",
      "order": "integer"
    }
  ]
  ```

### 创建项目
- **HTTP方法**: `POST`
- **URL模式**: `/api/projects/`
- **请求头**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **请求体schema**:
  ```json
  {
    "name": "string",
    "description": "string",
    "color": "string",
    "is_favorite": "boolean"
  }
  ```
- **响应体schema**: 完整的项目对象

### 获取项目详情
- **HTTP方法**: `GET`
- **URL模式**: `/api/projects/{id}/`
- **请求头**: `Authorization: Bearer <access_token>`
- **响应体schema**: 同创建项目的响应体

### 更新项目
- **HTTP方法**: `PATCH`
- **URL模式**: `/api/projects/{id}/`
- **请求头**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **请求体schema**: 与创建项目相同，仅需提供要更新的字段
- **响应体schema**: 完整的项目对象

### 删除项目
- **HTTP方法**: `DELETE`
- **URL模式**: `/api/projects/{id}/`
- **请求头**: `Authorization: Bearer <access_token>`

### 切换收藏状态
- **HTTP方法**: `POST`
- **URL模式**: `/api/projects/{id}/toggle_favorite/`
- **请求头**: `Authorization: Bearer <access_token>`
- **响应体schema**:
  ```json
  {
    "is_favorite": "boolean"
  }
  ```

**Section sources**
- [backend/apps/projects/urls.py](file://backend/apps/projects/urls.py#L1-L12)
- [backend/apps/projects/views.py](file://backend/apps/projects/views.py#L18-L60)
- [backend/apps/projects/serializers.py](file://backend/apps/projects/serializers.py#L10-L25)

## 标签API
标签API管理任务的标签系统。

### 获取标签列表
- **HTTP方法**: `GET`
- **URL模式**: `/api/tags/`
- **请求头**: `Authorization: Bearer <access_token>`
- **响应体schema**:
  ```json
  [
    {
      "id": "integer",
      "name": "string",
      "color": "string"
    }
  ]
  ```

### 创建标签
- **HTTP方法**: `POST`
- **URL模式**: `/api/tags/`
- **请求头**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **请求体schema**:
  ```json
  {
    "name": "string",
    "color": "string"
  }
  ```
- **响应体schema**: 完整的标签对象

### 获取标签详情
- **HTTP方法**: `GET`
- **URL模式**: `/api/tags/{id}/`
- **请求头**: `Authorization: Bearer <access_token>`
- **响应体schema**: 同创建标签的响应体

### 更新标签
- **HTTP方法**: `PATCH`
- **URL模式**: `/api/tags/{id}/`
- **请求头**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **请求体schema**: 与创建标签相同，仅需提供要更新的字段
- **响应体schema**: 完整的标签对象

### 删除标签
- **HTTP方法**: `DELETE`
- **URL模式**: `/api/tags/{id}/`
- **请求头**: `Authorization: Bearer <access_token>`

**Section sources**
- [backend/apps/tags/urls.py](file://backend/apps/tags/urls.py#L1-L10)
- [backend/apps/tags/views.py](file://backend/apps/tags/views.py#L15-L50)
- [backend/apps/tags/serializers.py](file://backend/apps/tags/serializers.py#L8-L20)

## JWT认证流程
系统采用JWT（JSON Web Token）进行无状态认证，使用`djangorestframework-simplejwt`库实现。

### Token获取
用户通过`/api/token/`端点使用用户名和密码登录，服务器验证凭据后返回一对JWT：
- **Access Token**: 用于API请求认证，有效期24小时
- **Refresh Token**: 用于获取新的Access Token，有效期7天

### Token刷新
当Access Token过期时，客户端使用Refresh Token调用`/api/token/refresh/`端点获取新的Access Token，无需重新登录。

### Token失效处理
- Access Token过期后，API返回401状态码
- 客户端应自动使用Refresh Token获取新Token
- 若Refresh Token也过期，则要求用户重新登录
- 服务端不维护Token黑名单，依赖Token自然过期

**Section sources**
- [README.md](file://README.md#L10-L11)
- [PROJECT_OVERVIEW.md](file://PROJECT_OVERVIEW.md#L13-L14)
- [IMPLEMENTATION_SUMMARY.md](file://IMPLEMENTATION_SUMMARY.md#L57-L58)

## 错误响应码
API使用标准HTTP状态码表示请求结果。

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 删除操作成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 认证失败或Token无效 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 405 | Method Not Allowed | HTTP方法不支持 |
| 500 | Internal Server Error | 服务器内部错误 |

**Section sources**
- [README.md](file://README.md#L298-L308)
- [PROJECT_OVERVIEW.md](file://PROJECT_OVERVIEW.md#L211-L215)

## API版本控制与速率限制
### API版本控制
当前系统未实现API版本控制，所有端点位于`/api/`根路径下。未来可通过以下方式实现版本控制：
- URL路径版本控制：`/api/v1/tasks/`
- 请求头版本控制：`Accept: application/vnd.todoapp.v1+json`

### 速率限制
当前系统未配置速率限制。建议在生产环境中实现以下限制：
- 匿名用户：每分钟60次请求
- 认证用户：每分钟300次请求
- 登录尝试：每小时10次失败尝试后锁定

**Section sources**
- [README.md](file://README.md#L117-L119)
- [PROJECT_OVERVIEW.md](file://PROJECT_OVERVIEW.md#L213-L214)