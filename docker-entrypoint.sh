#!/bin/sh
set -e

DEBUG_LC=$(printf '%s' "${DEBUG:-True}" | tr '[:upper:]' '[:lower:]')
# Whether to load the demo/sample dataset. Defaults to DEBUG, so dev is seeded and
# prod (DEBUG off) comes up with an empty schema-only DB. Override with SEED_DEMO_DATA.
SEED_LC=$(printf '%s' "${SEED_DEMO_DATA:-$DEBUG_LC}" | tr '[:upper:]' '[:lower:]')

# On a fresh Postgres volume the schema is empty. `migrate` creates the schema
# (schema only — the sample data no longer lives in migrations). On an existing DB
# it is a no-op. The web service waits for Postgres to be healthy (compose
# depends_on) before this runs.
echo "==> Applying migrations (schema only)..."
python manage.py migrate --noinput

# Load the sample dataset in dev. The command is idempotent (skips when data is
# already present), so it is safe across container restarts. Prod skips this and
# stays empty until real data is created via the API.
if [ "$SEED_LC" = "true" ]; then
    echo "==> Seeding demo data..."
    python manage.py seed_demo
fi

# In production (DEBUG off) runserver's dev static serving is gone, so gather the
# admin + Swagger assets for WhiteNoise to serve. Skipped in dev.
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
