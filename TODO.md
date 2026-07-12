# Backend TODO / Backlog

Deferred backend work, captured after the API + auth + Postgres foundation was in
place. Ordered roughly by priority. Reporting/aggregation endpoints are **not**
here — they're being built now, not deferred.

## Decided

- **Single-user app.** Data is intentionally *not* scoped per-user: there is no
  `owner` FK on `Transaction` / `Account` / `Purpose` / `Category` /
  `Subcategory`, and querysets are not filtered by user. Every authenticated
  session sees the one shared dataset. This is a deliberate choice — do **not**
  add per-user isolation unless the app's scope changes to multi-user (which would
  be a schema migration + queryset filtering + create-time owner assignment across
  every endpoint).

---

## 1. CORS — needed if the frontend is served cross-origin  · Priority: High (conditional)

The cookie-based auth (`access_token` / `refresh_token` httpOnly cookies +
`X-CSRFToken`) only works cross-origin with explicit CORS + CSRF trust config.

- **If same-origin** (frontend proxied behind the same host as the API, e.g. the
  Vite dev server proxies `/api`): nothing to do.
- **If cross-origin** (frontend on its own origin, e.g. `http://localhost:5173`):
  - Add `django-cors-headers`.
  - `CORS_ALLOWED_ORIGINS = [<frontend origin>]` and `CORS_ALLOW_CREDENTIALS = True`.
  - `CSRF_TRUSTED_ORIGINS = [<frontend origin>]`.
  - Frontend must use `fetch(..., { credentials: "include" })` (already documented
    in `docs/api.md` §6).

Decide the dev topology before starting the frontend — it dictates this.

## 2. Automated test suite  · Priority: High

There is currently **no** automated coverage (`transactions/tests.py`,
`wallets/tests.py`, and there is no `authn/tests.py` are all empty). Everything so
far was verified with throwaway scripts. Lock the contracts the frontend will
depend on before it starts depending on them. Suggested coverage:

- **Auth:** CSRF bootstrap → login → authed request → refresh → logout; wrong
  password → 401; missing `X-CSRFToken` → 403; malformed/expired refresh → 401.
- **Transactions:** all validation rules (kind mismatch, transfer-with-subcategory,
  self-transfer, non-positive amount, missing leg) → 400; nested read shape on
  list/retrieve; id-based write returning nested response.
- **Endpoints:** account `DELETE` → 405 (soft-delete); protected-delete → 409;
  pagination shape.
- Use DRF's `APITestCase` with an isolated test DB (no need to touch the seed DB).

## 3. Password-change endpoint  · Priority: Low

Registration is **not applicable** (single-user; the `admin` user is seeded by the
container entrypoint). A `POST /api/v1/auth/password/` to change the password without
going through the Django admin / shell would be a nice-to-have. Skip entirely if
the admin UI is acceptable for this.

## 4. Production hardening  · Priority: Medium — **mostly done**

Implemented: `DEBUG`/`SECRET_KEY`/`ALLOWED_HOSTS`/`CSRF_TRUSTED_ORIGINS` are
env-driven; secure auth/CSRF/session cookies + `SECURE_PROXY_SSL_HEADER` when
`DEBUG=False`; WhiteNoise + `collectstatic`; gunicorn; `docker-compose.prod.yml`
with an external DB and secrets from `.env.prod` (`.env.prod.example` template).

Remaining (operator/env side, not code):
- Put real values in `.env.prod` (generate a strong `SECRET_KEY`, set the domain).
- Optionally enable `SECURE_SSL_REDIRECT` / `SECURE_HSTS_SECONDS` via env once
  HTTPS is stable (both are opt-in — `check --deploy` warns until then).
- DB backups + a rollback plan for the external Postgres (not app code).

## 5. Login throttling  · Priority: Medium — **done**

`/api/v1/auth/login/` is rate-limited to `5/min` per IP (`ScopedRateThrottle`,
scope `login`); exceeding it returns 429 with `Retry-After`. `NUM_PROXIES` (env)
makes it key off the real client IP behind the reverse proxy.

Possible later refinement: per-username throttling (in addition to per-IP) to blunt
distributed/low-and-slow attacks against a single account, and a shared cache
(Redis) so the limit is exact across multiple gunicorn workers rather than
per-worker.

## 6. Seed-data cleanup: legacy "Savings & Investments" expense category  · Priority: Low

The seed data still models moving money into savings as **expense** transactions
under the `Savings & Investments` category (subcategories `Emergency Fund`,
`Index Fund`, `Retirement Account`). Per `docs/schema_design.md` (v2), this is
superseded: in the accounts model, moving money to savings is a **transfer** (net
worth unchanged) and the goal lives on the account's `purpose`. The old category
was left in place with cleanup deferred.

Consequence today: the spending report (`/api/v1/reports/spending/`) counts these as
expenses, so "savings" shows up as spending and overstates true outflow.

Cleanup (data migration): reclassify those rows as transfers into the relevant
savings account (clear `subcategory`, set `source_account`/`destination_account`),
then retire the now-empty `Savings & Investments` category/subcategories. Verify
the report totals afterward (spending drops by the reclassified amount; net worth
is unchanged since transfers net to zero).
