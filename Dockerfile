# syntax=docker/dockerfile:1

# Home Budget Planner — Django app (demo image).
# SQLite lives inside the container; migrations + seed run on startup.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=2.3.4 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

WORKDIR /app

# Poetry, pinned to match local tooling.
RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}"

# Install dependencies first (cached until the manifests change).
COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-root

# Application code.
COPY . .
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

# Entrypoint applies migrations (which also seed the DB) before the CMD runs.
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
