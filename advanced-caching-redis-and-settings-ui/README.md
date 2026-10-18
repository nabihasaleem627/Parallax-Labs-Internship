# ProjectHive

A multi-tenant collaboration platform built with Next.js (App Router), PostgreSQL + Drizzle ORM, and Redis.
This submission implements the **Week 5 — Advanced Caching (Redis) & Tenant Settings Dashboard** deliverables for the
Parallax Labs Internship on top of a complete, working multi-tenant application (auth, workspaces, projects) that
provides the context Redis caching and tenant settings operate within.

---

## 1. Project Overview

ProjectHive lets a team create an isolated **workspace (tenant)**, invite is modeled through memberships, track
**projects**, and configure **tenant-wide settings** (general, appearance, notifications). Every user, project,
setting, and cache entry is strictly scoped to the authenticated tenant — a tenant can never read or write another
tenant's data.

### Week 5 objectives

- Add a Redis caching layer in front of tenant settings reads.
- Give tenants a real settings management UI with validated server-side updates.
- Invalidate/refresh the cache on every successful settings update so reads are never stale.
- Make Redis an optimization, not a dependency: the app must keep working (reads **and** writes) if Redis is down.
- Expose real cache/database health to the UI — never fabricate a "connected" or "saved" state.
- Cover the caching and fallback behavior with automated tests.

---

## 2. Features Implemented

**Core platform (Week 4 context, included so Week 5 features have real data to operate on)**
- Email/password authentication with hashed passwords (bcrypt) and server-side sessions (httpOnly cookie).
- Workspace creation on signup; every user belongs to exactly one tenant with a role (`owner`, `admin`, `member`).
- Project tracking (create, list, delete) scoped to the current tenant.
- Workspace activity log (settings updates, project creation, workspace creation).
- Responsive application shell: collapsible sidebar, top bar with breadcrumbs/page title, user menu, theme toggle.
- Light/dark theme (persisted in `localStorage`, applied before paint to avoid flashing).

**Week 5 — Redis caching & tenant settings**
- Tenant Settings page (General, Appearance, Notifications) with:
  - Unsaved-changes detection, disabled/duplicate-submit protection, saving spinner, reset-to-last-saved.
  - Server-confirmed success/error banners (the UI never says "Saved" before the API call actually succeeds).
  - Inline field-level validation errors returned from the server (Zod).
  - Role-based access: `member` accounts get a read-only view.
- Redis-backed cache-aside layer for tenant settings (`src/lib/cache.ts`, `src/lib/tenant-settings.ts`):
  - Tenant-scoped cache key: `projecthive:tenant:{tenantId}:settings`.
  - 5 minute TTL.
  - Cache invalidation + repopulation immediately after a successful database write.
- Dedicated Redis/DB health endpoint (`/api/system/cache-health`) and a **System Status** page that polls it — cache
  health is never inferred from the settings API.
- Compact cache-status badge in the top bar and a summary on the Overview page, with distinct `available` /
  `database fallback` / `checking` / `unknown` states.
- Defensive, bounded Redis client configuration (`src/lib/redis.ts`): short connect/command timeouts, a capped retry
  strategy, no offline command queueing, and `safeRedisOp()` so **no Redis failure can ever throw into a request**.
- Automated tests covering cache hit/miss/expiration, invalidation, tenant isolation, and graceful degradation.

---

## 3. Technology Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Server Components) |
| Language | TypeScript (strict) |
| Database | PostgreSQL via `drizzle-orm` / `pg` |
| Cache | Redis via `ioredis` |
| Validation | `zod` |
| Auth | Custom session auth, `bcryptjs` password hashing |
| Styling | Tailwind CSS v4 (CSS-first config, class-based dark mode) |
| Testing | Vitest |

---

## 4. Architecture & Caching Workflow

```
Browser ──fetch──▶ /api/tenant/settings (GET)
                        │
                        ▼
                 getCurrentAuth()  ── resolves tenant/user from the session cookie (never trusts client input)
                        │
                        ▼
                 getTenantSettings(tenantId)
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
  Redis GET projecthive:tenant:   (on miss / Redis down)
  {tenantId}:settings                 │
          │ hit                       ▼
          │                   PostgreSQL SELECT (source of truth)
          │                           │
          │                           ▼
          │                   Redis SET ... EX 300  (best-effort; failures swallowed)
          ▼                           │
   return { source: "cache" }  return { source: "database" }
```

**Write path**

1. `PUT /api/tenant/settings` validates the payload with Zod and checks the caller's role (`owner`/`admin` only).
2. The database row is updated first — **this is the source of truth** and the operation is only reported as
   successful once this write commits.
3. The tenant's cache key is invalidated (`DEL`) and immediately repopulated with the fresh value.
4. If the invalidation/repopulation step fails or Redis is unreachable, the API still returns a success response for
   the save (`cacheInvalidated: false`) — **a cache failure is never reported as a save failure.**

### Tenant-scoped cache keys & TTL

- Key pattern: `projecthive:tenant:<tenantId>:settings`
- TTL: `300` seconds (5 minutes), defined as `SETTINGS_TTL_SECONDS` in `src/lib/cache.ts`.
- Keys are only ever derived from the tenant id resolved server-side from the session — never from client input.

### Cache invalidation strategy

Write-through invalidation: every successful settings update immediately issues `DEL` followed by a fresh `SET` with
the new value and a renewed TTL. This guarantees the next read is either a cache hit with up-to-date data or a clean
cache miss that reloads from PostgreSQL — stale reads after a write are not possible.

### Graceful degradation

- `src/lib/redis.ts` wraps the `ioredis` client with `lazyConnect`, a 2s connect timeout, a 1.5s command timeout, a
  retry strategy capped at 5 attempts, and `enableOfflineQueue: false` so commands fail fast instead of queueing
  indefinitely.
- `safeRedisOp()` is the single choke point every cache call goes through: it catches **all** errors (connection,
  timeout, command) and resolves to `null` instead of throwing.
- `checkRedisHealth()` performs a real `PING` (not a response-shape guess) and caches the result for 2 seconds to
  avoid hammering a down instance while still being responsive to recovery.
- When Redis recovers, the very next request transparently resumes cache reads/writes — there is no manual "reset"
  step required.

---

## 5. Redis Configuration & Docker Setup

Redis runs as a standalone service via Docker Compose (`docker-compose.yml` at the project root):

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: projecthive-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - projecthive_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
```

- Persistence: AOF (`appendonly yes`) backed by a named volume (`projecthive_redis_data`) so cached data survives
  container restarts.
- Health check: `redis-cli ping`, polled every 5s.

### Starting Redis (Windows PowerShell)

```powershell
# From the project root
docker compose up -d redis

# Check status / health
docker compose ps

# Tail logs
docker compose logs -f redis

# Stop Redis (keeps the volume/data)
docker compose stop redis

# Stop and remove the container (keeps the named volume)
docker compose down

# Also wipe cached data
docker compose down -v
```

### Starting Redis (macOS/Linux shells)

```bash
docker compose up -d redis
docker compose logs -f redis
docker compose down
```

> This sandbox environment does not have Docker available, so Redis is unreachable here by design — which is exactly
> the scenario the graceful-degradation code path is built and tested for. In any environment with Docker, starting
> the `redis` service above is all that's required for `REDIS_URL` to resolve and caching to activate automatically.

---

## 6. Prerequisites

- Node.js 20+
- A reachable PostgreSQL instance
- Docker (optional, for Redis — the app runs correctly without it)

---

## 7. Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```env
# PostgreSQL connection string used by Drizzle ORM (src/db/index.ts)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db

# Redis connection string used for tenant settings caching (src/lib/redis.ts).
# ProjectHive degrades gracefully to PostgreSQL if this is unreachable.
REDIS_URL=redis://127.0.0.1:6379
```

No secrets are hardcoded anywhere in the frontend or backend; both values are read exclusively from
`process.env` on the server.

---

## 8. Installation & Startup

```bash
npm install
# Start Redis (optional but recommended)
docker compose up -d redis
# Apply the database schema
npx drizzle-kit push
# Run the dev server
npm run dev
```

Build & run for production:

```bash
npm run build
npm run start
```

---

## 9. Database Setup & Migrations

The schema is defined in `src/db/schema.ts` (Drizzle ORM, `pg-core`). Tables: `tenants`, `users`, `memberships`,
`sessions`, `projects`, `tenant_settings`, `activity_log`.

Apply the schema directly (no migration files are used in this project):

```bash
npx drizzle-kit push
```

---

## 10. API Endpoints

All protected endpoints resolve the tenant/user from the `ph_session` httpOnly cookie — **no endpoint accepts a
tenant id from the client.**

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create a user + a brand-new tenant workspace, start a session |
| `POST` | `/api/auth/login` | Authenticate and start a session |
| `POST` | `/api/auth/logout` | Destroy the current session |
| `GET` | `/api/health` | Database health check (existing) |
| `GET` | `/api/system/cache-health` | Live Redis + database health (status, latency, last checked) |
| `GET` | `/api/tenant/settings` | Fetch the current tenant's settings (`source: "cache" \| "database"`) |
| `PUT` | `/api/tenant/settings` | Validate + persist settings, then invalidate/refresh the cache |
| `GET` | `/api/projects` | List the current tenant's projects |
| `POST` | `/api/projects` | Create a project in the current tenant |
| `DELETE` | `/api/projects?id=<id>` | Delete a project (ownership re-checked against the tenant) |

### Example: fetching tenant settings

```bash
curl -b cookies.txt http://localhost:3000/api/tenant/settings
```

```json
{
  "ok": true,
  "settings": {
    "tenantId": 5,
    "workspaceName": "Acme Inc.",
    "workspaceDescription": "",
    "timezone": "UTC",
    "locale": "en-US",
    "theme": "system",
    "density": "comfortable",
    "notifyEmailUpdates": true,
    "notifyProjectActivity": true,
    "notifyWeeklyDigest": false,
    "updatedAt": "2026-01-01T12:00:00.000Z",
    "updatedBy": 5
  },
  "source": "database"
}
```

### Example: updating tenant settings

```bash
curl -b cookies.txt -X PUT http://localhost:3000/api/tenant/settings \
  -H 'Content-Type: application/json' \
  -d '{
    "workspaceName": "Acme Inc.",
    "workspaceDescription": "Product & growth team",
    "timezone": "America/New_York",
    "locale": "en-US",
    "theme": "dark",
    "density": "compact",
    "notifyEmailUpdates": true,
    "notifyProjectActivity": true,
    "notifyWeeklyDigest": false
  }'
```

```json
{ "ok": true, "settings": { "...": "updated row" }, "cacheInvalidated": true }
```

### Example: checking cache health

```bash
curl -b cookies.txt http://localhost:3000/api/system/cache-health
```

```json
{
  "ok": true,
  "redis": { "status": "unavailable", "latencyMs": null, "checkedAt": "2026-01-01T12:00:00.000Z", "degraded": true },
  "database": { "status": "available", "latencyMs": 1 }
}
```

---

## 11. Settings Dashboard Usage

1. Sign up at `/signup` (creates your workspace) or sign in at `/login`.
2. Open **Tenant Settings** in the sidebar.
3. Edit any field — the **Save changes** button only activates once a field actually differs from the last saved
   value.
4. Click **Save changes**: the button shows a spinner and disables itself (duplicate submits are ignored) until the
   server responds.
5. On success you'll see a confirmation banner stating whether the cache was refreshed or whether Redis was
   unavailable (in which case the database save still succeeded). On failure you'll see field-level messages plus an
   error banner — nothing is marked "Saved" without a confirmed server response.
6. Use **Reset** at any time to discard local edits and restore the last values loaded from the server.
7. `member` role accounts see the same page in a read-only state.

---

## 12. Testing

Run the automated test suite (Vitest):

```bash
npm run test
```

What's covered (`tests/`):

- **`validation.test.ts`** — Zod schemas for signup, login, tenant settings, and project creation (valid/invalid
  inputs, including rejected locales, time zones, and short passwords).
- **`slug.test.ts`** — workspace slug generation.
- **`redis-fallback.test.ts`** — `safeRedisOp`/`checkRedisHealth`/cache helpers never throw, resolve to well-formed
  results, and never leak connection strings or passwords in error output. These run against the real `REDIS_URL` of
  the environment, so in a sandbox with no Redis reachable they are a genuine end-to-end test of the fallback path.
- **`tenant-settings.test.ts`** — integration tests against the real PostgreSQL database (with the Redis cache layer
  mocked for determinism) covering: cache miss → populate, cache hit, TTL-style expiration, tenant isolation (two
  real tenants, asserting no cross-tenant leakage in reads/writes/cache keys), successful update invalidates +
  repopulates the cache, and a thrown cache error never prevents a successful database update from being reported as
  successful.

```
Test Files  4 passed (4)
     Tests  27 passed (27)
```

Other checks used during development and required for this submission:

```bash
npx next typegen
npm exec tsc -- --noEmit
npm run build
npm run lint
```

---

## 13. Simulating a Redis Outage

The project is built so this is simple to verify in either direction:

**Redis down (default in most sandboxes without Docker, or stop it manually):**

```bash
docker compose stop redis
```

- `/api/system/cache-health` and the System Status page report `redis.status: "unavailable"`.
- The top bar badge switches to **Database fallback**.
- `/api/tenant/settings` (GET) returns `source: "database"`.
- `PUT /api/tenant/settings` still succeeds; the response includes `cacheInvalidated: false`, and the settings form
  shows a banner explaining the cache refresh was skipped while the save itself succeeded.

**Redis back up:**

```bash
docker compose start redis
```

- Within one polling interval (≤ 8s on the System Status page, ≤ 15s in the top bar), the badge returns to
  **Cache available**.
- The next settings read re-populates the cache; subsequent reads report `source: "cache"`.

---

## 14. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `DATABASE_URL is required` on startup | `.env` missing/misnamed | Copy `.env.example` to `.env` and set `DATABASE_URL` |
| Settings page always shows "Database fallback" | Redis container not running or wrong `REDIS_URL` | `docker compose up -d redis`; confirm the port in `REDIS_URL` matches the mapped port |
| `docker compose up` fails with a port conflict | Something else is bound to `6379` | Stop the other process, or change the host port mapping (`"6380:6379"`) and update `REDIS_URL` accordingly |
| Settings save returns 403 | Logged-in user has the `member` role | Sign in as the workspace owner/admin, or promote the member in the database |
| `npx drizzle-kit push` can't connect | PostgreSQL not running or wrong credentials | Verify PostgreSQL is running and `DATABASE_URL` is correct |
| Cache badge stuck on "Checking…" | Network request to `/api/system/cache-health` is blocked/slow | Check browser dev tools network tab and server logs for errors |

---

## 15. Known Limitations

- Each user belongs to exactly one tenant (created at signup); there is no invite-another-user-to-my-tenant flow or
  tenant-switcher UI in this iteration.
- The sidebar's quick theme toggle is a per-browser preference (`localStorage`) independent from the tenant-level
  "Interface theme" default stored in Tenant Settings; they are intentionally separate concerns (personal override vs
  workspace default) but are not yet reconciled into a single source of truth.
- Redis is deployed as a single standalone instance (no cluster/sentinel); production deployments needing HA should
  front it with a managed Redis service.
- Cache health polling is client-driven (interval-based); it is not push-based (no WebSocket/SSE).
- No automated UI (browser) tests are included — testing focuses on schema validation, caching behavior, and tenant
  isolation at the API/service layer per the Week 5 scope.
