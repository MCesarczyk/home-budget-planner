# Home Budget Planner

A personal finance tracker: accounts, transactions, savings goals, and monthly
budget plans. Django REST API plus a SvelteKit frontend, both containerised.

Single-user by design — the data is one shared dataset, not scoped per user. See
[`TODO.md`](TODO.md) for why.

## Stack

| | |
|---|---|
| **Backend** | Django 6.0, Django REST Framework, drf-spectacular (OpenAPI), SimpleJWT in httpOnly cookies |
| **Database** | PostgreSQL 17 in Docker; SQLite when no `POSTGRES_DB` is set (used by the test suite) |
| **Frontend** | SvelteKit 2 / Svelte 5 runes, Tailwind 4, adapter-node |
| **Tests** | Django test runner; Vitest in real Chromium via Playwright, plus Storybook |
| **Serving** | gunicorn + WhiteNoise (production compose) |

## Quick start

```bash
docker compose up --build
```

| | |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8088/api/v1/ |
| Swagger UI | http://localhost:8088/api/v1/docs/ |
| Django admin | http://localhost:8088/admin/ — `admin` / `admin` |

The entrypoint migrates on every start and, while `DEBUG` is on, loads the demo
dataset. Both steps are idempotent, so restarts are safe. Set
`SEED_DEMO_DATA=False` to come up with an empty schema.

Neither container bind-mounts source, so **code changes need a rebuild**:

```bash
docker compose up -d --build web       # or: frontend
```

## Local development

Backend — Python 3.12+ and Poetry 2.3:

```bash
poetry install
poetry run python manage.py migrate
poetry run python manage.py seed_demo          # optional demo data
poetry run python manage.py runserver 8088
```

Frontend — Node 24 and pnpm 11:

```bash
cd frontend
pnpm install
pnpm dev                                        # http://localhost:5173
```

The Vite dev server proxies `/api` to `API_PROXY_TARGET` (default
`http://localhost:8088`), so the browser sees one origin and the auth cookies just
work.

## Tests and checks

These are exactly what CI gates on:

```bash
# backend
poetry run ruff check .
poetry run python manage.py makemigrations --check --dry-run
poetry run python manage.py test

# frontend
cd frontend
pnpm run lint                                   # prettier + eslint
pnpm run check                                  # svelte-check
pnpm exec vitest --run
```

The backend suite uses SQLite and needs no running database.

## Domain model

Four apps hold the data; [`docs/schema_design.md`](docs/schema_design.md) has the
full design and the reasoning behind it.

- **`wallets`** — `Account` (checking / savings / investment / liability) and
  `Purpose`, a savings earmark an account can point at. Balances are computed from
  transaction legs, never stored. A liability's balance is negative while debt is
  outstanding.
- **`transactions`** — `Category` (carries `income` / `expense`), `Subcategory`, and
  `Transaction`. A transaction's **type is derived from its account legs**, not
  stored: destination only = income, source only = expense, both = transfer.
  `amount` is always a positive magnitude.
- **`budgets`** — `BudgetPlan` (one per month) and `BudgetItem`, a planned amount
  per subcategory. Plan-vs-actual is then a direct join on `Transaction.subcategory`.
- **`reports`** — read-only aggregations: net worth, spending by category, monthly
  cashflow, and progress per savings purpose.

### Off-budget purposes

A purpose flagged `is_off_budget` puts its accounts **outside the budget** — an
emergency fund, a term deposit. The money stays in net worth, but it was already
budgeted for on the month it was set aside, so the expense boundary moves:

| Transaction | Counts as |
|---|---|
| categorised transfer *into* an off-budget account | expense — money set aside |
| anything sourced *from* an off-budget account | nothing — counted on the way in |
| off-budget → off-budget (matured deposit rolled over) | nothing |

The shared predicates live in `transactions/aggregation.py`, so spending, cashflow,
and budget progress cannot drift apart. This is also why a **transfer may carry a
subcategory** — that is how a contribution gets budgeted.

## API

Everything is under `/api/v1/`. Auth is JWT in httpOnly cookies with double-submit
CSRF: unsafe requests need an `X-CSRFToken` header, and every request must send
cookies. [`docs/api.md`](docs/api.md) is the full integration guide — read it before
writing a client.

| | |
|---|---|
| `purposes/` `accounts/` `categories/` `subcategories/` `transactions/` `budget-plans/` | CRUD |
| `budget-plans/{id}/progress/`, `budget-plans/current/progress/` | plan vs actual |
| `reports/net-worth/` `reports/spending/` `reports/cashflow/` `reports/purposes/` | aggregations |
| `auth/csrf/` `auth/login/` `auth/refresh/` `auth/logout/` `auth/me/` | session |
| `health/` `schema/` `docs/` `redoc/` | public, no auth |

## Frontend routes

| | |
|---|---|
| `/` | Settings — accounts, purposes, categories, subcategories |
| `/transactions` | history with filters, plus spending summary |
| `/budget` | monthly plan and realisation progress |
| `/finances` | net worth and savings-purpose progress |
| `/login` | sign in |

## Layout

```
config/            Django settings, root URLs, OpenAPI wiring, health check
authn/             cookie-JWT login, refresh, logout, CSRF bootstrap
wallets/           accounts + purposes
transactions/      categories, subcategories, transactions, shared aggregation
budgets/           monthly plans and realisation progress
reports/           read-only aggregation endpoints
frontend/          SvelteKit app
docs/              api.md (integration guide), schema_design.md (data model)
```

## CI

Two workflows in `.github/workflows/`, each triggered only by changes to its own
side of the repo:

- **`backend-image.yml`** — lint, migration check, and tests; then build and push.
- **`frontend-image.yml`** — lint, type-check, and tests; then build and push.

No image is built unless its tests pass. Images go to GHCR as
`ghcr.io/<owner>/home-budget-planner-backend` and `-frontend`, tagged `latest` on
`main` plus `sha-<short>`. Pull requests build without pushing.

## Production

```bash
cp .env.prod.example .env.prod        # then fill in real values
docker compose -f docker-compose.prod.yml up -d --build
```

`.env.prod.example` documents every setting. At minimum generate a fresh
`SECRET_KEY`, set `ALLOWED_HOSTS` (it must include `web`, since the frontend
proxies to that service) and `CSRF_TRUSTED_ORIGINS`, and point the Postgres
variables at a real database. `DEBUG=False` turns on secure cookies, WhiteNoise
static serving, and skips demo seeding.

## License

GNU GPLv3.
