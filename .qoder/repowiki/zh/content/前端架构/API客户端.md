# API客户端

<cite>
**本文档引用文件**  
- [api.ts](file://frontend/src/services/api.ts)
- [auth.ts](file://frontend/src/services/auth.ts)
- [task.ts](file://frontend/src/services/task.ts)
- [project.ts](file://frontend/src/services/project.ts)
- [tag.ts](file://frontend/src/services/tag.ts)
- [vite.config.ts](file://frontend/vite.config.ts)
- [index.ts](file://frontend/src/types/index.ts)
</cite>

## 目录
1. [简介](#简介)
2. [API基础配置](#api基础配置)
3. [认证服务实现](#认证服务实现)
4. [资源服务模块分析](#资源服务模块分析)
5. [请求示例](#请求示例)
6. [错误处理与重试机制](#错误处理与重试机制)
7. [开发环境跨域解决方案](#开发环境跨域解决方案)
8. [总结](#总结)

## 简介
本项目前端通过Axios封装了一套完整的HTTP服务客户端，实现了统一的请求管理、身份认证、错误处理和缓存机制。API客户端与React Query深度集成，支持查询键生成、数据缓存和自动重试功能，为任务、项目、标签等核心资源提供了标准化的CRUD操作接口。

## API基础配置

API客户端基于Axios创建，封装了基础URL、请求头配置以及请求/响应拦截器，确保所有请求的一致性和安全性。

```mermaid
flowchart TD
A[请求发起] --> B{请求拦截器}
B --> C[添加JWT令牌]
C --> D[发送请求]
D --> E{响应拦截器}
E --> F{状态码401?}
F --> |是| G[尝试刷新令牌]
G --> H[更新令牌并重试]
H --> I[返回结果]
F --> |否| I
I --> J[返回响应或抛出错误]
```

**Diagram sources**
- [api.ts](file://frontend/src/services/api.ts#L5-L58)

**Section sources**
- [api.ts](file://frontend/src/services/api.ts#L1-L58)

## 认证服务实现

认证服务模块封装了用户注册、登录和令牌刷新逻辑，并与本地存储中的认证状态保持同步。

```mermaid
sequenceDiagram
participant 前端 as 前端应用
participant AuthService as authService
participant ApiClient as apiClient
participant 后端 as 后端API
前端->>AuthService : login(credentials)
AuthService->>ApiClient : POST /token/
ApiClient->>后端 : 发送登录请求
后端-->>ApiClient : 返回access和refresh令牌
ApiClient-->>AuthService : 返回令牌数据
AuthService-->>前端 : 返回TokenResponse
前端->>localStorage : 存储access_token和refresh_token
```

**Diagram sources**
- [auth.ts](file://frontend/src/services/auth.ts#L4-L24)
- [api.ts](file://frontend/src/services/api.ts#L35-L49)

**Section sources**
- [auth.ts](file://frontend/src/services/auth.ts#L1-L25)
- [types/index.ts](file://frontend/src/types/index.ts#L109-L124)

## 资源服务模块分析

各资源服务模块（任务、项目、标签）均采用一致的设计模式，封装了对应资源的CRUD操作，并适配分页响应格式。

### 任务服务分析

任务服务提供了全面的任务管理功能，包括常规操作和批量处理。

```mermaid
classDiagram
class taskService {
+getTasks(params) Task[]
+getTask(id) Task
+createTask(data) Task
+updateTask(id, data) Task
+deleteTask(id) void
+completeTask(id) Task
+toggleStar(id) Task
+getTodayTasks() Task[]
+getStatistics() any
+getSystemList(type) SystemListResponse
+batchUpdate(data) BatchUpdateResponse
+restoreTask(id) Task
+permanentDelete(id) void
}
taskService --> apiClient : 使用
```

**Diagram sources**
- [task.ts](file://frontend/src/services/task.ts#L12-L78)
- [types/index.ts](file://frontend/src/types/index.ts#L23-L47)

**Section sources**
- [task.ts](file://frontend/src/services/task.ts#L1-L79)
- [types/index.ts](file://frontend/src/types/index.ts#L187-L202)

### 项目服务分析

项目服务支持项目的基本操作及收藏、置顶等状态切换功能。

```mermaid
classDiagram
class projectService {
+getProjects(params) Project[]
+getProject(id) Project
+createProject(data) Project
+updateProject(id, data) Project
+deleteProject(id) void
+toggleFavorite(id) Project
+togglePin(id) Project
}
projectService --> apiClient : 使用
```

**Diagram sources**
- [project.ts](file://frontend/src/services/project.ts#L12-L47)
- [types/index.ts](file://frontend/src/types/index.ts#L69-L87)

**Section sources**
- [project.ts](file://frontend/src/services/project.ts#L1-L48)
- [types/index.ts](file://frontend/src/types/index.ts#L69-L87)

### 标签服务分析

标签服务提供标签的增删改查功能，兼容分页与非分页响应格式。

```mermaid
classDiagram
class tagService {
+getTags() Tag[]
+getTag(id) Tag
+createTag(data) Tag
+updateTag(id, data) Tag
+deleteTag(id) void
}
tagService --> apiClient : 使用
```

**Diagram sources**
- [tag.ts](file://frontend/src/services/tag.ts#L12-L40)
- [types/index.ts](file://frontend/src/types/index.ts#L100-L107)

**Section sources**
- [tag.ts](file://frontend/src/services/tag.ts#L1-L41)
- [types/index.ts](file://frontend/src/types/index.ts#L100-L107)

## 请求示例

以下为各HTTP方法的实际调用方式与参数传递示例：

### GET请求
```typescript
// 获取所有任务（带过滤参数）
const tasks = await taskService.getTasks({ 
  status: 'todo', 
  project: 1 
});

// 获取特定任务
const task = await taskService.getTask(123);
```

### POST请求
```typescript
// 创建新任务
const newTask = await taskService.createTask({
  title: '新任务',
  project: 1,
  priority: 'high'
});

// 完成任务
const completedTask = await taskService.completeTask(123);
```

### PUT/PATCH请求
```typescript
// 更新任务信息
const updatedTask = await taskService.updateTask(123, {
  title: '更新后的标题',
  description: '新的描述'
});
```

### DELETE请求
```typescript
// 删除任务
await taskService.deleteTask(123);
```

**Section sources**
- [task.ts](file://frontend/src/services/task.ts#L13-L36)
- [project.ts](file://frontend/src/services/project.ts#L13-L35)
- [tag.ts](file://frontend/src/services/tag.ts#L13-L38)

## 错误处理与重试机制

系统实现了多层次的错误处理与恢复机制，保障用户体验的连续性。

### 令牌自动刷新机制
当API返回401未授权状态时，客户端会自动尝试使用refresh token获取新的access token，并重新发送原始请求。

### 网络离线重试策略
结合React Query的配置，系统设置了合理的重试次数（retry: 1），在网络短暂中断时自动重试请求。

```mermaid
flowchart TD
A[请求失败] --> B{网络错误?}
B --> |是| C[等待默认延迟]
C --> D[自动重试请求]
D --> E{成功?}
E --> |否| F[显示错误提示]
E --> |是| G[返回结果]
B --> |否| F
```

**Diagram sources**
- [api.ts](file://frontend/src/services/api.ts#L26-L55)
- [main.tsx](file://frontend/src/main.tsx#L10-L15)

**Section sources**
- [api.ts](file://frontend/src/services/api.ts#L26-L55)
- [main.tsx](file://frontend/src/main.tsx#L10-L15)

## 开发环境跨域解决方案

通过Vite的代理配置，开发环境下的跨域问题得到有效解决。

```mermaid
flowchart LR
A[前端应用] --> B[Vite开发服务器]
B --> C{请求路径匹配/api}
C --> |是| D[代理到后端API]
D --> E[http://localhost:8000]
C --> |否| F[直接处理]
```

**Diagram sources**
- [vite.config.ts](file://frontend/vite.config.ts#L13-L20)

**Section sources**
- [vite.config.ts](file://frontend/vite.config.ts#L1-L23)
- [api.ts](file://frontend/src/services/api.ts#L3)

## 总结
本API客户端设计充分考虑了安全性、可用性和可维护性。通过Axios拦截器实现统一的认证管理，利用React Query提供强大的缓存和状态管理能力，各服务模块遵循一致的封装规范。开发环境通过Vite代理解决跨域问题，生产环境可通过环境变量灵活配置API地址。整个架构既保证了代码的整洁性，又提供了良好的扩展性和用户体验。