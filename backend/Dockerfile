# Backend Dockerfile
FROM docker.m.daocloud.io/python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy project files
COPY pyproject.toml ./
COPY manage.py ./
COPY todo_project ./todo_project
COPY apps ./apps

# Install dependencies
RUN uv pip install --system -r pyproject.toml

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "todo_project.wsgi:application"]
