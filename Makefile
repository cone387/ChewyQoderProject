# Makefile for Todo App

.PHONY: help dev-up dev-down prod-up prod-down backend-shell frontend-shell migrate test clean

help:
	@echo "Todo App - 开发命令"
	@echo ""
	@echo "开发环境:"
	@echo "  make dev-up        - 启动开发数据库"
	@echo "  make dev-down      - 停止开发数据库"
	@echo "  make backend-dev   - 启动后端开发服务器"
	@echo "  make frontend-dev  - 启动前端开发服务器"
	@echo ""
	@echo "生产环境:"
	@echo "  make prod-up       - 启动生产环境（Docker Compose）"
	@echo "  make prod-down     - 停止生产环境"
	@echo ""
	@echo "数据库:"
	@echo "  make migrate       - 运行数据库迁移"
	@echo "  make makemigrations - 创建数据库迁移文件"
	@echo "  make superuser     - 创建超级用户"
	@echo ""
	@echo "其他:"
	@echo "  make backend-shell - 进入后端容器 shell"
	@echo "  make frontend-shell - 进入前端容器 shell"
	@echo "  make clean         - 清理临时文件"

dev-up:
	docker-compose -f docker-compose.dev.yml up -d

dev-down:
	docker-compose -f docker-compose.dev.yml down

backend-dev:
	cd backend && python manage.py runserver

frontend-dev:
	cd frontend && pnpm dev

prod-up:
	docker-compose up -d --build

prod-down:
	docker-compose down

backend-shell:
	docker exec -it todo-backend /bin/bash

frontend-shell:
	docker exec -it todo-frontend /bin/sh

migrate:
	cd backend && python manage.py migrate

makemigrations:
	cd backend && python manage.py makemigrations

superuser:
	cd backend && python manage.py createsuperuser

test:
	cd backend && pytest

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	cd frontend && rm -rf node_modules dist
