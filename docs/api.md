# HBP REST API — Frontend Integration Guide

Contracts for building a browser frontend against the Home Budget Planner API.
Everything here is the actual behaviour of the current implementation.

- **Base URL** (local dev / Docker): `http://localhost:8088`
- **API root**: all endpoints are under `/api/v1/`
- **Content type**: `application/json` for request and response bodies
- **Interactive reference**: Swagger UI at `/api/v1/docs/`, ReDoc at `/api/v1/redoc/`,
  raw OpenAPI schema at `/api/v1/schema/` (all public, no auth required)
- **Health check**: `GET /api/v1/health/` — public, no auth. Returns `200 {"status": "ok"}`
  when the process is up and the database is reachable; `503` otherwise. Ideal for
  uptime monitors / the quickest "is it up?" check.

---

## 1. Authentication model (read this first)

Auth is **JWT stored in httpOnly cookies** with **double-submit CSRF protection**.
There is no `Authorization` header and no token in the response body — the browser
holds everything in cookies and sends them automatically.

Three cookies are involved:

| Cookie | Set by | httpOnly | Read by JS? | Purpose |
|---|---|---|---|---|
| `access_token` | login / refresh | ✅ yes | ❌ no | Authenticates every request (15 min lifetime) |
| `refresh_token` | login / refresh | ✅ yes | ❌ no | Mints a new access token (7 day lifetime) |
| `csrftoken` | `GET /api/v1/auth/csrf/` | ❌ no | ✅ yes | Echoed back in the `X-CSRFToken` header |

### The two rules

1. **Every unsafe request** (`POST`, `PUT`, `PATCH`, `DELETE`) must include a
   header `X-CSRFToken: <value of csrftoken cookie>`. Safe requests (`GET`,
   `HEAD`, `OPTIONS`) do not.
2. **Every request must send cookies.** With `fetch`, that means
   `credentials: 'include'` (required if the frontend is served from a different
   origin than the API; harmless if same-origin).

### Login sequence

```
GET  /api/v1/auth/csrf/          → sets csrftoken cookie (do this once on app load)
POST /api/v1/auth/login/         → {username, password} + X-CSRFToken header
                                → sets access_token + refresh_token cookies
... authenticated requests ...
POST /api/v1/auth/refresh/       → when a request 401s, refresh then retry
POST /api/v1/auth/logout/        → clears cookies + revokes refresh token
```

### Token expiry & refresh

The access token lives **15 minutes**. When any data endpoint returns **401**,
call `POST /api/v1/auth/refresh/` (it uses the `refresh_token` cookie) and retry the
original request once. If refresh also returns 401, the session is dead — send the
user back to login. Refresh tokens rotate on every use, so the old one is revoked
immediately (a stolen refresh token has a short life).

---

## 2. Auth endpoints

### `GET /api/v1/auth/csrf/`
Public. Sets the `csrftoken` cookie. Call once before the first login.

- **200** `{"detail": "CSRF cookie set."}`

### `POST /api/v1/auth/login/`
Public. Requires the `X-CSRFToken` header.

- **Request** `{"username": "string", "password": "string"}`
- **200** `{"detail": "Login successful."}` — sets `access_token` + `refresh_token`
- **400** `{"password": ["This field is required."]}` — missing field(s)
- **401** `{"detail": "Invalid credentials."}` — wrong username/password
- **403** `{"detail": "CSRF Failed: ..."}` — missing/invalid `X-CSRFToken`
- **429** `{"detail": "Request was throttled. Expected available in N seconds."}` — too many login attempts from your IP (rate-limited; every attempt counts). Retry after the `Retry-After` header.

### `POST /api/v1/auth/refresh/`
Public. Requires the `X-CSRFToken` header. Uses the `refresh_token` cookie (no body).

- **200** `{"detail": "Token refreshed."}` — sets new `access_token` (and rotated `refresh_token`)
- **401** `{"detail": "No refresh token cookie."}` — no cookie present
- **401** `{"detail": "Invalid or expired refresh token."}` — expired/revoked/malformed token
- **403** `{"detail": "CSRF Failed: ..."}` — missing/invalid `X-CSRFToken`

### `POST /api/v1/auth/logout/`
**Authenticated.** Requires the `X-CSRFToken` header. Revokes the refresh token
(blacklist) and clears both auth cookies.

- **200** `{"detail": "Logout successful."}`

### `GET /api/v1/auth/me/`
**Authenticated.** Returns the current user.

- **200** `{"id": 1, "username": "admin", "email": "admin@example.com", "is_staff": true}`
- **401** if not logged in

---

## 3. Conventions for all data endpoints

**Every** `/api/v1/` resource below requires authentication. Unauthenticated
requests get **401** `{"detail": "Authentication credentials were not provided."}`.

### Pagination
List endpoints are paginated, **50 items per page**. Use `?page=N`.

```json
{
  "count": 179,
  "next": "http://localhost:8088/api/v1/transactions/?page=2",
  "previous": null,
  "results": [ /* array of objects */ ]
}
```

### Money & dates
- **All monetary values are serialized as strings** (e.g. `"294.00"`) to avoid
  float rounding — this covers `amount`, `balance`, `opening_balance`,
  `target_amount`, and every money field in the report responses (`net_worth`,
  `total_assets`, `total_liabilities`, `current_amount`, category/subcategory
  totals, etc.). Send them as strings or numbers; you'll always get strings back.
  (The report `progress` field is the one exception — a JSON number, not a string.)
- Dates are `"YYYY-MM-DD"`.

### Standard error shapes

| Status | When | Body |
|---|---|---|
| 400 | Validation failure | `{"field": ["message"]}` or `{"non_field_errors": ["message"]}` |
| 401 | Not authenticated / access token expired | `{"detail": "..."}` |
| 403 | CSRF header missing/invalid | `{"detail": "CSRF Failed: ..."}` |
| 404 | Unknown id | `{"detail": "No <Model> matches the given query."}` |
| 405 | Method not supported (e.g. DELETE on accounts) | `{"detail": "Method \"DELETE\" not allowed."}` |
| 409 | Deleting a record still referenced by others | `{"detail": "Cannot delete: N related object(s) still reference this record."}` |

---

## 4. Resources

FK fields are integer ids. `id` and any field marked *read-only* are ignored on
write. Standard REST routes per resource:
`GET /` (list), `POST /` (create), `GET /{id}/` (retrieve),
`PUT|PATCH /{id}/` (update), `DELETE /{id}/` (delete) — except where noted.

### 4.1 Purposes — `/api/v1/purposes/`
A savings goal an account can be earmarked toward. **Full CRUD.**

| Field | Type | Notes |
|---|---|---|
| `id` | int | read-only |
| `name` | string(100) | **required**, unique |
| `description` | string(255) | optional, defaults to `""` |
| `target_amount` | decimal string | nullable |

- `DELETE` returns **409** if any account still references the purpose.

```json
{ "id": 1, "name": "Emergency Fund", "description": "3-6 months of expenses", "target_amount": "20000.00" }
```

### 4.2 Accounts — `/api/v1/accounts/`
A container of money — an **asset** (checking/savings/investment) or a
**liability** (a debt). **No `DELETE`** — accounts are soft-archived by setting
`is_active: false` via `PATCH` (a `DELETE` returns **405**).

| Field | Type | Notes |
|---|---|---|
| `id` | int | read-only |
| `name` | string(100) | **required**, unique |
| `type` | enum | **required**: `checking` \| `savings` \| `investment` \| `liability` |
| `opening_balance` | decimal string | defaults to `"0"`; **negative** for a liability with debt outstanding |
| `purpose` | int (FK) | nullable |
| `is_active` | bool | defaults to `true` |
| `balance` | decimal string | **read-only** — opening_balance + incoming − outgoing (negative while a debt is unpaid) |
| `is_liability` | bool | **read-only** — `true` when `type == "liability"` |

```json
{ "id": 5, "name": "Brokerage Account", "type": "investment", "opening_balance": "12000.00", "purpose": 3, "is_active": true, "balance": "12600.00", "is_liability": false }
```

To archive: `PATCH /api/v1/accounts/5/` with `{"is_active": false}`.

**Debts / liabilities.** Model a debt as a `liability` account whose
`opening_balance` is the negative amount owed (e.g. a mortgage at `"-300000.00"`);
its `balance` climbs toward `0` as it is paid down. Paying **principal** is a
**transfer** from a cash account into the liability (net-worth neutral — see
`/api/v1/reports/net-worth/`). **Interest** is a separate **expense** (net-worth
negative). A single real-world payment therefore splits into two transactions
(principal transfer + interest expense).

### 4.3 Categories — `/api/v1/categories/`
Classifies income/expense flows. **Full CRUD.**

| Field | Type | Notes |
|---|---|---|
| `id` | int | read-only |
| `name` | string(100) | **required**, unique |
| `kind` | enum | **required**: `income` \| `expense` |

- `DELETE` returns **409** if subcategories reference it.

### 4.4 Subcategories — `/api/v1/subcategories/`
**Full CRUD.**

| Field | Type | Notes |
|---|---|---|
| `id` | int | read-only |
| `category` | int (FK) | **required** |
| `name` | string(100) | **required**, unique within its category |

- `DELETE` returns **409** if transactions reference it.

### 4.5 Transactions — `/api/v1/transactions/`
A money movement. Its **`type` is derived** from which account legs are set —
you never send `type`; you set the legs. **Full CRUD** (including `DELETE`).

> **Reads and writes have different shapes for the related fields.** On write
> (POST/PUT/PATCH) you send `source_account`, `destination_account`, and
> `subcategory` as **ids**. On read (and in the response to a write) those fields
> come back **expanded** as nested objects, so you can render a transaction
> without any extra lookups. All expansion is done via a single joined query — it
> costs no extra round-trips or database queries.

**Fields — write (request body)**

| Field | Type | Notes |
|---|---|---|
| `tx_date` | date | **required**, `YYYY-MM-DD` |
| `amount` | decimal string | **required**, must be `> 0` (positive magnitude) |
| `source_account` | int (FK) | nullable — the account money leaves |
| `destination_account` | int (FK) | nullable — the account money lands in |
| `subcategory` | int (FK) | nullable — see rules below |

**Fields — read (response body)**

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `type` | enum | derived: `income` \| `expense` \| `transfer` |
| `tx_date` | date | |
| `amount` | decimal string | |
| `source_account` | object \| null | `{ "id", "name" }` (account `balance` is **not** included here) |
| `destination_account` | object \| null | `{ "id", "name" }` |
| `subcategory` | object \| null | `{ "id", "name", "category": { "id", "name", "kind" } }` |

**How the three types are expressed** (direction is encoded by the legs, never by
the sign of `amount`):

| Intent | `source_account` | `destination_account` | `subcategory` |
|---|---|---|---|
| **income** | `null` | set | **required**, must belong to an `income` category |
| **expense** | set | `null` | **required**, must belong to an `expense` category |
| **transfer** | set | set (different) | **must be `null`** |

**Validation** (all return **400** with `non_field_errors`, except amount):
- At least one of `source_account` / `destination_account` must be set.
- `source_account` and `destination_account` must differ (no self-transfer).
- `amount` must be positive → `{"amount": ["amount must be positive."]}`.
- Transfer (both legs set) must **not** have a `subcategory`.
- Income/expense (one leg) **must** have a `subcategory`, and its category `kind`
  must match the shape (income→income category, expense→expense category).

**Query filters** (combine freely, all optional):

| Param | Example | Meaning |
|---|---|---|
| `type` | `?type=transfer` | `income` \| `expense` \| `transfer` |
| `account` | `?account=1` | id appears on either leg |
| `source_account` | `?source_account=1` | id on the source leg |
| `destination_account` | `?destination_account=2` | id on the destination leg |
| `subcategory` | `?subcategory=4` | subcategory id |
| `category` | `?category=3` | category id (matched via subcategory) |
| `date_from` | `?date_from=2024-01-01` | inclusive lower bound on `tx_date` |
| `date_to` | `?date_to=2024-12-31` | inclusive upper bound on `tx_date` |
| `page` | `?page=2` | pagination |

Results are ordered newest first (`tx_date` desc).

**Examples**

Request bodies use **ids** (all three transaction shapes):

```jsonc
// POST /api/v1/transactions/  — an expense
{ "tx_date": "2024-03-01", "amount": "42.00", "source_account": 1, "subcategory": 20 }

// POST /api/v1/transactions/  — income
{ "tx_date": "2024-03-05", "amount": "3358.67", "destination_account": 1, "subcategory": 1 }

// POST /api/v1/transactions/  — a transfer (no subcategory)
{ "tx_date": "2024-03-10", "amount": "200.00", "source_account": 1, "destination_account": 2 }
```

The response (to the expense above, and to every GET) returns the **expanded**
shape with derived `type`:

```json
{
  "id": 42,
  "type": "expense",
  "tx_date": "2024-03-01",
  "amount": "42.00",
  "source_account": { "id": 1, "name": "Main Checking" },
  "destination_account": null,
  "subcategory": {
    "id": 20,
    "name": "Public Transit Pass",
    "category": { "id": 6, "name": "Transportation", "kind": "expense" }
  }
}
```

### 4.6 Reports — `/api/v1/reports/`
Read-only aggregations for dashboards. All are `GET`, require auth, and (being
safe methods) need no `X-CSRFToken`. Money values are decimal strings. **Transfers
are excluded** from spending and cashflow (they're internal moves that net to
zero); spending is expense-only.

**`GET /api/v1/reports/net-worth/`** — balances grouped into assets and liabilities,
with subtotals. Liability balances are negative, so
`net_worth = total_assets + total_liabilities` (assets abbreviated to one row here):
```json
{
  "assets": [ { "id": 1, "name": "Main Checking", "type": "checking", "balance": "2003.17" } ],
  "total_assets": "59403.17",
  "liabilities": [
    { "id": 7, "name": "Home Mortgage", "type": "liability", "balance": "-247600.00" },
    { "id": 8, "name": "Credit Card", "type": "liability", "balance": "-1000.00" }
  ],
  "total_liabilities": "-248600.00",
  "net_worth": "-189196.83"
}
```

**`GET /api/v1/reports/spending/?date_from=&date_to=`** — expenses grouped by
category, with a subcategory breakdown, over an optional inclusive date range.
```json
{
  "date_from": null, "date_to": null,
  "total": "16825.25",
  "categories": [
    { "id": 3, "name": "Housing", "kind": "expense", "total": "5985.13",
      "subcategories": [ { "id": 6, "name": "Rent", "total": "5400.00" } ] }
  ]
}
```

**`GET /api/v1/reports/cashflow/?date_from=&date_to=`** — monthly income / expense /
net over an optional inclusive date range, plus grand totals.
```json
{
  "date_from": null, "date_to": null,
  "months": [ { "month": "2023-12", "income": "3751.70", "expense": "3778.50", "net": "-26.80" } ],
  "totals": { "income": "20928.42", "expense": "16825.25", "net": "4103.17" }
}
```

**`GET /api/v1/reports/purposes/`** — per purpose, earmarked total (Σ balances of its
accounts) vs `target_amount`. `progress` is the `current/target` ratio, or `null`
when the purpose has no target.
```json
{
  "purposes": [
    { "id": 1, "name": "Emergency Fund", "target_amount": "20000.00",
      "current_amount": "8200.00", "progress": 0.41,
      "accounts": [ { "id": 2, "name": "Everyday Savings", "balance": "8200.00" } ] }
  ]
}
```

---

## 5. Reference frontend client

A minimal, framework-agnostic wrapper that handles CSRF and automatic refresh.

```js
const BASE = "http://localhost:8088";

// Read a non-httpOnly cookie (csrftoken is readable by design).
function getCookie(name) {
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? m[2] : null;
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  // CSRF header required on unsafe methods.
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers["X-CSRFToken"] = getCookie("csrftoken");
  }
  const opts = {
    method,
    headers,
    credentials: "include",              // <-- always send cookies
    body: body ? JSON.stringify(body) : undefined,
  };

  let res = await fetch(BASE + path, opts);

  // Access token expired → refresh once, then retry.
  if (res.status === 401 && path !== "/api/v1/auth/refresh/") {
    const refreshed = await fetch(BASE + "/api/v1/auth/refresh/", {
      method: "POST",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      credentials: "include",
    });
    if (refreshed.ok) res = await fetch(BASE + path, opts);
  }
  return res;
}

// --- usage ---
export const api = {
  async bootstrap() { await fetch(BASE + "/api/v1/auth/csrf/", { credentials: "include" }); },
  login(username, password) { return request("POST", "/api/v1/auth/login/", { username, password }); },
  logout() { return request("POST", "/api/v1/auth/logout/"); },
  me() { return request("GET", "/api/v1/auth/me/"); },

  listTransactions(query = "") { return request("GET", "/api/v1/transactions/" + query); },
  createTransaction(data) { return request("POST", "/api/v1/transactions/", data); },
  updateTransaction(id, data) { return request("PATCH", `/api/v1/transactions/${id}/`, data); },
  deleteTransaction(id) { return request("DELETE", `/api/v1/transactions/${id}/`); },

  listAccounts() { return request("GET", "/api/v1/accounts/"); },
  archiveAccount(id) { return request("PATCH", `/api/v1/accounts/${id}/`, { is_active: false }); },
};

// app startup:
//   await api.bootstrap();
//   await api.login("admin", "admin");
//   const txs = await (await api.listTransactions("?type=expense&date_from=2024-01-01")).json();
```

### App-load checklist for the frontend
1. `GET /api/v1/auth/csrf/` to obtain the `csrftoken` cookie.
2. Try `GET /api/v1/auth/me/` — 200 means an existing session is still valid; 401
   means show the login screen.
3. On login, `POST /api/v1/auth/login/` with the `X-CSRFToken` header.
4. Wrap all calls so a 401 triggers one refresh-and-retry (see above).
5. Send `X-CSRFToken` on every `POST/PUT/PATCH/DELETE`.

---

## 6. CORS note (cross-origin frontends)

If the frontend is served from a different origin (e.g. a Vite dev server on
`http://localhost:5173`), the API needs CORS configured with credentials support
and `CSRF_TRUSTED_ORIGINS` set — this is **not yet configured** on the backend.
Until then, serve the frontend same-origin (or behind the same reverse proxy) so
cookies flow. Flag this to the backend when a separate frontend origin is
introduced.
```
