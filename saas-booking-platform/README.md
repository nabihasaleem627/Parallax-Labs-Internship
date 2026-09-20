# Bookflow — Multi-Tenant B2B SaaS Booking Platform

A production-quality **Week 1 foundation** for a multi-tenant booking SaaS. Multiple
organizations ("tenants") register their own workspaces and independently manage their
users and bookings — with data isolation enforced **in the database**, not just in the UI.

Built as the first week of a 6-week full-stack internship project, structured so that
later weeks (Stripe billing, Redis caching, real-time collaboration, etc.) can be added
without rework.

---

## Features (Week 1)

- **Organization onboarding** — create a tenant + its first admin (org admin) in one flow
- **Authentication** — login (with "remember me"), registration (join an existing org by
  subdomain), forgot password, single-use password reset
- **Multi-tenant isolation via PostgreSQL Row-Level Security** — tenant A can never read,
  write, or delete tenant B's data (enforced by the database itself)
- **Role-based access control** — Org Admin / Staff / Member with distinct permissions
- **Dashboard** — summary cards, upcoming bookings, role-aware navigation
- **Bookings** — list, create, confirm, cancel, delete (permission-gated)
- **Calendar** — month grid with organization bookings (foundation view)
- **Users** — tenant member directory with roles
- **Settings** — organization & profile information
- **Zod validation** — every input validated on the client *and* re-validated server-side
- **Docker Compose** — one-command local PostgreSQL
- **Migrations + seed** — reproducible schema and realistic multi-tenant demo data

## Tech Stack

| Area            | Choice                                          | Why |
| --------------- | ----------------------------------------------- | --- |
| Framework       | **Next.js 15 (App Router) + TypeScript**        | Server components, route handlers, edge middleware, Vercel-native |
| Database        | **PostgreSQL 16+**                              | Row-Level Security, strong data types, UUIDs |
| ORM             | **Prisma 6**                                    | Type-safe queries, migrations, seed |
| Styling         | **Tailwind CSS 4**                              | Cohesive design system, responsive-first |
| Validation      | **Zod 3**                                       | One schema source for client + server + env validation |
| Auth            | **jose (JWT, HS256) + bcryptjs**                | Zero long-running services; safe on serverless (Vercel) |
| Local database  | **Docker Compose**                              | Reproducible local Postgres with a persistent volume |
| Quality         | **ESLint 9 (flat config), TypeScript strict**   | Catch issues before runtime |

Intentionally *no* auth framework with a session store, no Redis, no message broker —
Week 1 must stay beginner-friendly and Vercel-deployable. The architecture leaves clean
integration points for all of them.

---

## Architecture

```text
                    ┌──────────────────────────────────────────────┐
                    │                 Browser                      │
                    └───────────────┬──────────────────────────────┘
                                    │ HTTPS
┌───────────────────────────────────▼────────────────────────────────┐
│                     Next.js application                            │
│                                                                    │
│  Middleware (edge)        Server Components / API Route Handlers   │
│  · verifies session JWT   · server-side Zod validation             │
│    (jose, HS256)          · role checks (lib/authz)                │
│  · guards /dashboard/**   · withTenantScope() wraps every          │
│                           tenant data query in one transaction     │
└───────────────┬────────────────────────────────────────────────────┘
                │ Prisma (TLS connection)
                │   runtime role:  tenant_app   (non-owner → RLS enforced)
                │   owner role:    postgres     (migrations/seed only)
┌───────────────▼────────────────────────────────────────────────────┐
│                     PostgreSQL                                     │
│  RLS policies on User / Booking / PasswordResetToken               │
│  USING (tenantId = current_setting('app.current_tenant_id'))       │
└────────────────────────────────────────────────────────────────────┘
```

- **Local development:** VS Code → Next.js → Docker Compose → PostgreSQL
- **Production:** GitHub → Vercel → Next.js → external PostgreSQL (Neon / RDS / Supabase …)

The same codebase runs in both environments; only environment variables differ.

---

## Multi-Tenant Strategy

Isolation is enforced at **three layers**:

### 1. Database: Row-Level Security (the real boundary)

The application connects with a **non-owner role** (`tenant_app`). Table owners bypass
RLS by default, so a non-owner role *guarantees* the policies are always in effect:

```sql
CREATE POLICY tenant_isolation ON "User"
    USING ("User"."tenantId"::text = current_setting('app.current_tenant_id', true)
           OR current_setting('app.bypass_tenant_isolation', true) = 'on')
    WITH CHECK ( -- same condition for INSERT/UPDATE -- );
```

- Every tenant-scoped query runs inside `withTenantScope(tenantId, fn)`
  (`src/lib/db/tenant.ts`), which opens **one transaction** and sets the GUC
  `app.current_tenant_id` for that transaction only (`set_config(..., true)`).
- No GUC set → **zero rows visible** (default deny).
- The same policy covers `USING` (SELECT/UPDATE/DELETE visibility) and
  `WITH CHECK` (INSERT/UPDATE targets), so tenant A cannot read, modify, or delete
  tenant B's rows — verified by direct SQL tests (see below).
- `Tenant` rows are readable (auth needs tenant lookup) and insertable (onboarding),
  but `UPDATE`/`DELETE` privileges are **revoked** from the app role.

### 2. Server: session-bound scoping

- Sessions are short-lived signed JWTs (1 h, or 7 d with "remember me") carrying
  `sub`, `tenantId`, and `role`.
- Every API route and server component re-reads the user from the database **inside the
  tenant scope** — so a deleted account or a role change takes effect immediately.
- `tenantId` is **never** taken from client input; it comes from the verified session.
- Cross-tenant resource access (e.g. a raw booking UUID from another tenant) returns
  **404**, not 403 — other tenants' resources don't leak their existence.

### 3. Edge: route guard

`src/middleware.ts` verifies the JWT signature/expiry on `/dashboard/**` and redirects
unauthenticated visitors to `/login`. API routes and server components still re-check
independently (defense in depth).

**Auth-only bypass.** Login and "forgot password" must find a user *before* the tenant
is known. Those lookups run inside `withAuthScope()`, which sets
`app.bypass_tenant_isolation = 'on'` for a single transaction. It is set in exactly two
places, never from client input, and the policies keep the rest of the app strictly
tenant-scoped.

**Verified isolation (direct SQL, run as `tenant_app`):**

| Test | Result |
| --- | --- |
| No tenant GUC set → `SELECT COUNT(*)` on User/Booking | `0` / `0` (default deny) |
| Scoped to Acme → Acme rows visible, Nova rows | `3 users / 6 bookings`, `0 Nova` |
| Scoped to Acme → `UPDATE` Nova users | `UPDATE 0` |
| Scoped to Acme → `INSERT` user into Nova tenant | **RLS violation** |
| Scoped to Acme → `DELETE` Nova bookings | `DELETE 0` |
| `UPDATE "Tenant"` / `DELETE "Tenant"` | **permission denied** |
| API: Nova admin PATCHes Acme's booking by raw UUID | `404 Booking not found` |

### Roles

| Capability                        | Org Admin | Staff | Member |
| --------------------------------- | :-------: | :---: | :----: |
| View tenant dashboard/bookings    |     ✅    |  ✅   |   ✅   |
| Create booking (self)             |     ✅    |  ✅   |   ✅   |
| Confirm / cancel any booking      |     ✅    |  ✅   |   —    |
| Cancel own booking                |     ✅    |  ✅   |   ✅   |
| Delete bookings                   |     ✅    |  ✅   |   —    |
| View users                        |     ✅    |  ✅   |   ✅   |
| Manage users / settings           |     ✅    |  —    |   —    |

Implemented in `src/lib/authz/permissions.ts` — a deliberately small, single place that
later weeks can extend (e.g. per-tenant permission overrides). Roles are stored as a
Postgres enum on `User` (`UserRole`); a full RBAC table can be introduced later without
changing the application boundary.

---

## Database Schema

Entities: `Tenant`, `User` (with `UserRole`), `Booking` (with `BookingStatus`),
`PasswordResetToken`. UUID primary keys, FKs with `ON DELETE CASCADE`, unique
constraints, indexes on tenant-scoped queries, and `createdAt`/`updatedAt` timestamps.

```mermaid
erDiagram
    TENANT {
        uuid id PK
        string name
        string subdomain UK
        string plan "reserved for Stripe tiers"
        datetime createdAt
        datetime updatedAt
    }
    USER {
        uuid id PK
        uuid tenantId FK "RLS boundary"
        string email UK
        string name
        string passwordHash "bcrypt, never plaintext"
        userRole role
        datetime createdAt
        datetime updatedAt
    }
    BOOKING {
        uuid id PK
        uuid tenantId FK "RLS boundary"
        uuid userId FK
        string title
        string notes
        datetime startsAt
        datetime endsAt
        bookingStatus status
        datetime createdAt
        datetime updatedAt
    }
    PASSWORD_RESET_TOKEN {
        uuid id PK
        uuid userId FK
        string tokenHash UK "SHA-256, single use"
        datetime expiresAt
        datetime createdAt
    }
    USER_ROLE {
        ORG_ADMIN
        STAFF
        USER
    }
    BOOKING_STATUS {
        PENDING
        CONFIRMED
        CANCELLED
    }

    TENANT ||--o{ USER : "has members"
    TENANT ||--o{ BOOKING : "owns bookings"
    USER ||--o{ BOOKING : "creates"
    USER ||--o{ PASSWORD_RESET_TOKEN : "has"
    USER }o--|| USER_ROLE : "role (enum)"
    BOOKING }o--|| BOOKING_STATUS : "status (enum)"
```

**Ownership boundaries:** dashed RLS boundary on every `tenantId` column — the only
column the policies compare against.

---

## Environment Setup

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable                | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`          | **Runtime** connection string. Must use the non-owner `tenant_app` role so RLS is enforced. |
| `DIRECT_URL`            | **Owner** connection string, used by the Prisma CLI for migrations/seed only. On Vercel set it to the same value as `DATABASE_URL`. |
| `AUTH_SECRET`           | JWT signing secret, ≥ 32 chars. Generate: `openssl rand -base64 32`          |
| `NEXT_PUBLIC_APP_URL`   | Absolute base URL (local: `http://localhost:3000`, Vercel: your deployment URL) |

Environment variables are validated with **Zod** on first use (`src/lib/env.ts`); the
app fails fast with a clear, itemized message when something is missing or malformed.
No secrets are hard-coded anywhere.

---

## Installation

Requirements: **Node.js 20+**, **Docker** (for local PostgreSQL).

```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Configure environment
cp .env.example .env
#    → set AUTH_SECRET (openssl rand -base64 32); the rest match docker-compose defaults

# 3. Start PostgreSQL (Docker)
docker compose up -d

# 4. Create the schema
npm run db:migrate        # prisma migrate dev (applies migrations + creates shadow db)

# 5. Seed demo data (2 organizations, 6 users, 12 bookings)
npm run db:seed

# 6. Run
npm run dev               # http://localhost:3000
```

Other useful commands:

```bash
npm run build             # production build
npm run start             # serve the production build
npm run lint              # ESLint
npm run db:deploy         # prisma migrate deploy (production-style, no shadow db)
npm run db:studio         # Prisma Studio
docker compose down       # stop Postgres (data persists in the volume)
docker compose down -v    # stop Postgres AND destroy the data volume
```

---

## Docker Setup

`docker-compose.yml` runs `postgres:16-alpine` with:

- a named volume `db_data` (persistent storage across restarts),
- a healthcheck,
- an init script (`docker/init/01-create-app-role.sql`) that creates the non-owner
  `tenant_app` role on first boot.

> **Note:** the init script only runs when the volume is created. If you changed role
> credentials, run `docker compose down -v` to reinitialize.

---

## Database Setup

- **Migrations** live in `prisma/migrations/`. The initial migration contains the schema
  *and* the RLS policies + role grants, so a fresh database is secure the moment it is
  migrated.
- `npm run db:migrate` (dev) uses `DIRECT_URL` for the shadow database and applies
  migrations idempotently; `npm run db:deploy` applies them in order (used in
  production pipelines).
- `npm run db:seed` is idempotent (clears then recreates demo data).

### Test Accounts (local seed data — development only)

| Organization      | Role        | Email            | Password      |
| ----------------- | ----------- | ---------------- | ------------- |
| Acme Consulting   | Org Admin   | `admin@acme.test`   | `Password123!` |
| Acme Consulting   | Staff       | `staff@acme.test`   | `Password123!` |
| Acme Consulting   | Member      | `user@acme.test`    | `Password123!` |
| Nova Health       | Org Admin   | `admin@nova.test`   | `Password123!` |
| Nova Health       | Staff       | `staff@nova.test`   | `Password123!` |
| Nova Health       | Member      | `user@nova.test`    | `Password123!` |

Sign in with one Acme account, note its bookings; sign out; sign in with a Nova
account — the datasets are completely different. These are seeded local-demo
credentials; never ship real credentials in a repository.

---

## Project Structure

```text
saas-booking-platform/
├── docker-compose.yml            # local PostgreSQL (dev only)
├── docker/init/                  # creates the non-owner tenant_app role
├── prisma/
│   ├── schema.prisma             # data model (Tenants/Users/Bookings/…)
│   ├── migrations/               # schema + RLS policies + grants
│   └── seed.ts                   # 2 orgs, 6 users, 12 bookings
└── src/
    ├── middleware.ts             # edge JWT guard for /dashboard/**
    ├── app/
    │   ├── page.tsx              # landing page
    │   ├── (auth)/               # login, register, forgot-password, reset-password
    │   ├── onboarding/           # organization onboarding
    │   ├── terms/                # terms of service
    │   ├── dashboard/            # layout (sidebar/topbar) + 5 pages
    │   └── api/
    │       ├── auth/             # login, logout, register, forgot/reset password
    │       ├── onboarding/       # create organization + admin
    │       └── bookings/         # list/create, [id] patch/delete
    ├── components/
    │   ├── ui/                   # design system: buttons, inputs, cards, badges, alerts…
    │   ├── auth/                 # client forms (client-side Zod validation)
    │   └── dashboard/            # sidebar, topbar, tables, calendar, booking forms
    ├── lib/
    │   ├── env.ts                # Zod-validated environment (fail fast)
    │   ├── db/prisma.ts          # lazy Prisma singleton
    │   ├── db/tenant.ts          # withTenantScope / withAuthScope (RLS GUCs)
    │   ├── auth/jwt.ts           # edge-safe JWT create/verify (jose)
    │   ├── auth/session.ts       # cookie session + current-user resolution
    │   ├── auth/password.ts      # bcrypt hash/verify
    │   ├── authz/permissions.ts  # role checks (single source of truth)
    │   ├── validation/schemas.ts # all Zod schemas
    │   ├── api.ts                # error response helpers
    │   └── format.ts             # date formatting, cn()
    └── types/                    # (reserved for shared domain types)
```

Tailwind CSS 4 is configured via `postcss.config.mjs` + `@theme` in
`src/app/globals.css` (no `tailwind.config.js` required — that is expected, not
missing).

---

## Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Week 1: multi-tenant booking platform foundation"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

`.gitignore` already excludes `.env*`, `node_modules/`, `.next/`, `dist/`, `build/`,
`coverage/` — **no secrets leave the machine**.

### 2. Import into Vercel

Vercel → *Add New Project* → import the repository. Framework preset: **Next.js**
(auto-detected). Build command `npm run build`, output `.next` — defaults are correct.

### 3. Configure a production PostgreSQL

Vercel has no filesystem or local services — the database must be external. Any
managed Postgres works (Neon, RDS, Supabase, Aiven, Railway…).

1. Create a project/database (e.g. Neon → new project → note the connection string).
2. Create **two** roles if your provider allows it (mirrors local dev):
   - an owner role (used to run migrations from your machine or CI), and
   - a **non-owner** app role used by `DATABASE_URL` at runtime.
   If you only have one role (and it owns the tables), apply `FORCE ROW LEVEL
   SECURITY` so RLS applies to the owner as well:

   ```sql
   ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
   ALTER TABLE "Booking" FORCE ROW LEVEL SECURITY;
   ALTER TABLE "PasswordResetToken" FORCE ROW LEVEL SECURITY;
   ```
   Grant the app role `SELECT, INSERT, UPDATE, DELETE` on the tables and revoke
   `UPDATE, DELETE` on `"Tenant"` (exactly as the migration does).
3. Copy the connection strings into Vercel **Environment Variables**
   (Project → Settings → Environment Variables) for **Production, Preview, Development**:
   - `DATABASE_URL` (runtime, app role)
   - `DIRECT_URL` (same value is fine — used only by the Prisma CLI)
   - `AUTH_SECRET` (a *different* secret from local; `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL or custom domain)

### 4. Run migrations against production

Vercel functions cannot run `prisma migrate` at request time, so run it from your
machine (or a CI step) after each schema change:

```bash
npx prisma migrate deploy        # reads DATABASE_URL/DIRECT_URL from .env or env
```

Add it to Vercel as a **Build Command** (`npx prisma migrate deploy && next build`)
only if you commit a real `DATABASE_URL` there — otherwise keep it in CI.

Seeding in production is **not required**; create real organizations through
`/onboarding`. (If you ever need it, `npx prisma db seed` from a machine with access
to the owner role.)

### 5. Deploy & verify

1. Push → Vercel builds and deploys.
2. Open your deployment → sign in with an existing account (or onboard a new org).
3. Verify auth: dashboard loads, sign out works, invalid sessions redirect to `/login`.
4. Verify tenant isolation: two organizations see disjoint datasets (spot-check the
   API: `GET /api/bookings` with each organization's session).
5. Verify DB connectivity: Vercel → Deployments → check the logs for no Prisma
   connection errors.

### Common deployment problems

| Symptom | Cause → Fix |
| --- | --- |
| `P1001: Can't reach database server` | Vercel cannot reach a *private* database → use a publicly reachable Postgres (or private networking add-on) |
| `P1000: Authentication failed` | Wrong role/password in `DATABASE_URL` → check Vercel env vars; ensure URL is `postgresql://user:pass@host:5432/db?schema=public` |
| `Environment variable not found: DATABASE_URL` | Missing var for that environment (Production vs Preview are separate lists in Vercel) |
| `Failed to resolve AUTH_SECRET` errors at runtime | `AUTH_SECRET` shorter than 32 chars or missing → regenerate |
| RLS "not working" in production | The runtime role owns the tables → run the `FORCE ROW LEVEL SECURITY` statements or use a non-owner role |
| Migrations fail with `shadow database` errors | Only affects `migrate dev`; use `prisma migrate deploy` for production |
| Cookie/session not set in production | Cookies are `secure` in production — the site must be served over HTTPS (Vercel always is) |

---

## Security Practices

- Passwords: **bcrypt (12 rounds)**, stored only as hashes; never logged or returned
- Sessions: signed JWT (HS256) in **httpOnly, SameSite=Lax** cookies; 1 h default,
  7 d with "remember me"; `secure` flag in production
- Password reset tokens: **random 256-bit**, stored **SHA-256-hashed**, single-use,
  1-hour expiry
- No account enumeration: identical responses for unknown email (login & forgot password)
- Server-side re-validation of everything the client sends (Zod)
- Tenant scoping bound to the verified session — never to client input
- RBAC checked on every mutation; least privilege at the database role level too
- Env validated at startup; `.env` git-ignored; only `.env.example` committed
- No secrets in the client bundle (only `NEXT_PUBLIC_*` URLs are public by design)
- Reset emails: in Week 1 the reset link is returned directly **only in development**;
  in production an email provider would send it — the integration point is marked in
  `src/app/api/auth/forgot-password/route.ts`

---

## Week 1 Progress

**Completed**

- [x] Multi-tenant schema (Tenant/User/Booking/PasswordResetToken) + migrations
- [x] PostgreSQL Row-Level Security isolation (verified with adversarial SQL tests)
- [x] Two-database-role security model (app role vs owner role)
- [x] Auth: onboarding, login (+ remember me), registration, forgot/reset password
- [x] RBAC (Org Admin / Staff / Member) enforced in the API
- [x] Dashboard: summary cards, bookings (CRUD), calendar, users, settings
- [x] Responsive SaaS design system (Tailwind 4) — desktop/laptop/tablet/mobile
- [x] Zod validation (forms, APIs, environment)
- [x] Docker Compose Postgres + persistent volume + init script
- [x] Seed data for 2 organizations demonstrating isolation
- [x] ESLint clean, `tsc` strict clean, production build passes
- [x] `.env.example`, `.gitignore`, deployment-ready structure
- [x] End-to-end API tests: auth, RBAC, IDOR (cross-tenant UUID → 404), onboarding,
  reset flow, validation errors

**Deliberately deferred (prepared for, not implemented)**

| Week 2+ feature | Prepared by |
| --- | --- |
| Stripe subscriptions / webhooks / pricing page | `Tenant.plan` column, isolated route-handler boundaries, no local persistence assumptions |
| Billing history | Clean API route structure; tenant-scoped queries ready |
| Redis caching + invalidation | Data access funnels through `withTenantScope` — a cache layer can wrap it without touching callers |
| Real-time collaboration (Yjs/CRDT) + presence | Booking model is conflict-ready (`startsAt/endsAt/status`); no global mutable state in requests |
| Booking conflict prevention | `(tenantId, startsAt)` index in place; constraint/overlap logic is a pure function on top |
| Invitations (replace subdomain-join registration) | Registration flow isolated in one route handler |
| Idempotency keys | Route handlers are small and stateless — a key check is a two-line middleware addition |
| Zero-downtime migrations | Prisma migrations are already forward-compatible SQL; add `prisma migrate diff` checks to CI |

**Known Week 1 simplifications**

- Registration joins an org by subdomain (no invite codes yet)
- `email` is globally unique (one account per person, standard B2B model)
- Calendar is a foundation view (current month, no drag-and-drop)
- No email delivery (dev shortcut surfaces the reset link in development)

---

## Verification Checklist

- [x] Application runs (`npm run dev`, `npm run build` both pass)
- [x] PostgreSQL runs through Docker (compose file provided; verified against Postgres 16/17)
- [x] Database migrations work (`prisma migrate deploy`)
- [x] Seed data works (`prisma db seed`, idempotent)
- [x] Multiple tenants exist (Acme Consulting, Nova Health — plus onboarding creates more)
- [x] Tenant isolation enforced (RLS SQL tests + API IDOR test, results above)
- [x] Authentication UI responsive (auth pages, onboarding, dashboard)
- [x] Organization onboarding works (tested: 201, 409 duplicate, 400 validation)
- [x] Login UI works (200 + cookie, 401 wrong password, 400 validation)
- [x] Registration UI works (joins existing org, auto sign-in)
- [x] Password reset UI exists and works (single-use tokens verified)
- [x] Zod validation implemented (client + server + env)
- [x] `.env.example` exists
- [x] Mermaid ERD exists (above)
- [x] README comprehensive (this file)
- [x] No secrets committed (`.env` git-ignored; seed uses labeled local demo credentials)
- [x] Responsive on mobile and desktop (sidebar collapses to drawer; tables to cards)
- [x] Code clean and maintainable (ESLint clean, strict TS, modular structure)
