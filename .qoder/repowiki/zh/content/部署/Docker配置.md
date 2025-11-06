# Docker配置

<cite>
**本文档中引用的文件**   
- [backend/Dockerfile](file://backend/Dockerfile)
- [frontend/Dockerfile](file://frontend/Dockerfile)
- [backend/pyproject.toml](file://backend/pyproject.toml)
- [frontend/package.json](file://frontend/package.json)
- [frontend/nginx.conf](file://frontend/nginx.conf)
- [docker-compose.yml](file://docker-compose.yml)
</cite>

## 目录
1. [后端Dockerfile多阶段构建分析](#后端dockerfile多阶段构建分析)
2. [前端Dockerfile多阶段构建分析](#前端dockerfile多阶段构建分析)
3. [.dockerignore构建上下文优化](#dockerignore构建上下文优化)
4. [Docker最佳实践建议](#docker最佳实践建议)

## 后端Dockerfile多阶段构建分析

后端Dockerfile采用单阶段构建策略，基于`python:3.11-slim`基础镜像，实现了轻量级、安全且高效的生产环境部署方案。该镜像选择Python 3.11版本，确保与项目依赖（如Django 5.0+）的兼容性，同时利用`slim`变体减少镜像体积，仅包含运行Python应用所需的最小系统组件，显著提升了安全性和构建效率。

构建流程首先通过`WORKDIR /app`设置工作目录，随后安装`uv`作为依赖管理工具。`uv`是一个高性能的Python包管理器，相比传统`pip`具有更快的依赖解析和安装速度，特别适合在CI/CD和容器化环境中使用。依赖安装通过`uv pip install --system -r pyproject.toml`命令执行，直接从`pyproject.toml`文件读取生产依赖，确保依赖关系的准确性和可重复性。

静态文件处理是构建的关键步骤，通过`python manage.py collectstatic --noinput || true`命令将所有Django应用的静态文件收集到`STATIC_ROOT`目录。`|| true`确保即使在无静态文件的情况下构建也能成功，增强了构建的健壮性。

最终，容器通过Gunicorn作为WSGI服务器启动应用。启动命令`CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "todo_project.wsgi:application"]`配置了4个工作进程，绑定到`0.0.0.0:8000`，以充分利用多核CPU并实现高并发处理能力。此配置适用于生产环境，提供了良好的性能和稳定性。

**Section sources**
- [backend/Dockerfile](file://backend/Dockerfile#L1-L26)
- [backend/pyproject.toml](file://backend/pyproject.toml#L1-L33)
- [backend/todo_project/settings.py](file://backend/todo_project/settings.py#L109-L111)
- [backend/todo_project/wsgi.py](file://backend/todo_project/wsgi.py#L1-L11)

## 前端Dockerfile多阶段构建分析

前端Dockerfile采用典型的多阶段构建（Multi-stage Build）策略，有效分离了构建环境和运行时环境，极大优化了最终镜像的大小和安全性。

第一阶段（构建阶段）使用`node:20-alpine`作为基础镜像。Alpine Linux以其极小的体积和良好的安全性著称，是构建阶段的理想选择。该阶段首先安装全局`pnpm`包管理器，然后通过`pnpm install`安装项目依赖。`package.json`中的`build`脚本（`"build": "tsc && vite build"`）被调用，执行TypeScript编译和Vite构建，生成生产级的静态资源文件，输出到`dist`目录。

第二阶段（运行时阶段）使用`nginx:alpine`作为基础镜像，这是一个专为Web服务优化的轻量级镜像。构建阶段生成的`dist`目录内容通过`COPY --from=builder /app/dist /usr/share/nginx/html`指令复制到Nginx的默认HTML根目录。同时，自定义的`nginx.conf`配置文件被复制到Nginx的配置目录，实现了对Web服务的精细控制，包括静态资源缓存、Gzip压缩和API请求代理。

Nginx配置中，`location /api`块将所有API请求代理到后端服务`http://backend:8000`，实现了前后端的无缝集成。`location ~* \.(js|css|png|...)$`块为静态资源设置了长达1年的缓存，显著提升了前端应用的加载性能。

**Section sources**
- [frontend/Dockerfile](file://frontend/Dockerfile#L1-L33)
- [frontend/package.json](file://frontend/package.json#L1-L63)
- [frontend/vite.config.ts](file://frontend/vite.config.ts#L1-L23)
- [frontend/nginx.conf](file://frontend/nginx.conf#L1-L32)

## .dockerignore构建上下文优化

尽管项目根目录下未找到`.dockerignore`文件，但根据Docker最佳实践，`.dockerignore`在优化构建上下文方面起着至关重要的作用。一个精心设计的`.dockerignore`文件可以显著提升构建效率和安全性。

其核心作用是定义在执行`docker build`命令时，哪些文件和目录不应被包含在发送到Docker守护进程的构建上下文（build context）中。对于本项目，理想的`.dockerignore`文件应包含以下条目：
- `**/.git`：排除所有Git版本控制文件，避免泄露源码历史和敏感信息。
- `**/*.log`：排除日志文件，这些文件通常很大且与构建无关。
- `**/node_modules`：排除前端的`node_modules`，因为依赖已在Dockerfile中通过`pnpm install`安装。
- `**/__pycache__` 和 `*.pyc`：排除Python编译的字节码文件。
- `.env`：排除本地环境变量文件，防止敏感配置（如数据库密码、API密钥）意外泄露到镜像中。
- `dev-setup.sh`：排除开发脚本，这些脚本仅用于本地开发环境。

通过排除这些不必要的文件，可以大幅减少构建上下文的大小，从而加快`docker build`的传输和构建速度，并确保最终镜像不包含任何敏感或临时文件。

**Section sources**
- [backend/Dockerfile](file://backend/Dockerfile#L9-L13)
- [frontend/Dockerfile](file://frontend/Dockerfile#L7-L16)

## Docker最佳实践建议

1.  **最小化镜像层和体积**：遵循“一个进程一个容器”原则。本项目已通过多阶段构建完美实践此原则，前端构建和运行环境分离，后端使用`slim`镜像，都有效控制了最终镜像的大小。

2.  **安全的基础镜像选择**：优先选择官方镜像（如`python:slim`, `node:alpine`, `nginx:alpine`）。这些镜像由社区维护，更新及时，漏洞修复迅速。避免使用`latest`标签，应指定明确的版本号（如`python:3.11-slim`），以保证构建的可重复性和稳定性。

3.  **高效利用构建缓存**：Docker会缓存每一层的构建结果。为了最大化利用缓存，应将不常变动的指令（如`COPY package.json .`和`RUN pnpm install`）放在Dockerfile的前面，而将经常变动的指令（如`COPY . .`）放在后面。这样，当仅修改源代码时，Docker可以复用前面的缓存层，无需重新安装依赖，从而极大加速构建过程。

4.  **非root用户运行**：为了增强安全性，应在容器内以非root用户身份运行应用。可以在Dockerfile中创建一个专用用户，并使用`USER`指令切换。例如，在后端Dockerfile中添加：
    ```Dockerfile
    RUN adduser --disabled-password --gecos '' appuser
    USER appuser
    ```
    这可以有效降低因应用漏洞导致的权限提升风险。

5.  **环境变量管理**：敏感配置（如`SECRET_KEY`, `DATABASE_URL`）不应硬编码在Dockerfile或代码中。应通过`docker-compose.yml`的`environment`字段或Docker Secrets进行注入，如`docker-compose.yml`中所示。

**Section sources**
- [backend/Dockerfile](file://backend/Dockerfile#L2-L26)
- [frontend/Dockerfile](file://frontend/Dockerfile#L2-L33)
- [docker-compose.yml](file://docker-compose.yml#L1-L61)