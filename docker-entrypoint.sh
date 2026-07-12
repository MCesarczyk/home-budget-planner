#!/bin/sh
set -e

# On a fresh Postgres volume the schema is empty. `migrate` creates the schema and
# applies the seed data migrations (e.g. transactions.0002_seed_data), so the demo
# DB comes up already populated. On an existing DB it is a no-op. The web service
# waits for Postgres to be healthy (compose depends_on) before this runs.
echo "==> Applying migrations (schema + seed)..."
python manage.py migrate --noinput

# In production (DEBUG off) runserver's dev static serving is gone, so gather the
# admin + Swagger assets for WhiteNoise to serve. Skipped in dev.
DEBUG_LC=$(printf '%s' "${DEBUG:-True}" | tr '[:upper:]' '[:lower:]')
if [ "$DEBUG_LC" != "true" ]; then
    echo "==> Collecting static files..."
    python manage.py collectstatic --noinput
fi

# Create a demo superuser when credentials are provided (opt-in via env vars).
# createsuperuser --noinput errors if the user already exists, so this is guarded
# to stay idempotent across container restarts.
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "==> Ensuring demo superuser '$DJANGO_SUPERUSER_USERNAME' exists..."
    python manage.py createsuperuser --noinput 2>/dev/null \
        && echo "    created." \
        || echo "    already exists — skipping."
fi

exec "$@"
