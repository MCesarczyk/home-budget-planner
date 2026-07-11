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
container entrypoint). A `POST /api/auth/password/` to change the password without
going through the Django admin / shell would be a nice-to-have. Skip entirely if
the admin UI is acceptable for this.

## 4. Production hardening  · Priority: Medium (before any real deployment)

All fine for the demo/dev build, but not for anything real. Make env-driven:

- `DEBUG` (default `False` in prod), `SECRET_KEY` (from env, not the hardcoded
  dev key), `ALLOWED_HOSTS`.
- Auth-cookie `Secure` flag already auto-enables when `DEBUG=False` — which means
  prod requires **HTTPS**.
- `DEBUG=False` turns off Django's dev static-file serving that the Swagger sidecar
  relies on — add **WhiteNoise** (or serve `/static/` via the reverse proxy) and
  run `collectstatic`.

## 5. Login throttling  · Priority: Medium

No brute-force protection on `/api/auth/login/` today. Add DRF throttling
(`ScopedRateLimit` / `AnonRateThrottle`) scoped to the auth endpoints so repeated
failed logins are rate-limited.

## 6. Seed-data cleanup: legacy "Savings & Investments" expense category  · Priority: Low

The seed data still models moving money into savings as **expense** transactions
under the `Savings & Investments` category (subcategories `Emergency Fund`,
`Index Fund`, `Retirement Account`). Per `docs/schema_design.md` (v2), this is
superseded: in the accounts model, moving money to savings is a **transfer** (net
worth unchanged) and the goal lives on the account's `purpose`. The old category
was left in place with cleanup deferred.

Consequence today: the spending report (`/api/reports/spending/`) counts these as
expenses, so "savings" shows up as spending and overstates true outflow.

Cleanup (data migration): reclassify those rows as transfers into the relevant
savings account (clear `subcategory`, set `source_account`/`destination_account`),
then retire the now-empty `Savings & Investments` category/subcategories. Verify
the report totals afterward (spending drops by the reclassified amount; net worth
is unchanged since transfers net to zero).
