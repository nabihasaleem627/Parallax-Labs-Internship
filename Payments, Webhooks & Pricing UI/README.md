# SaaS Booking Platform

## Week 3: Payments, Webhooks & Pricing UI

BookFlow is a multi-tenant B2B booking platform for teams that manage customer appointments. Week 3 extends the booking, calendar, customer, team, authentication, tenant, dashboard, and REST API foundations with production-oriented Stripe subscriptions and webhook-driven billing.

> **Core billing rule:** the browser redirect never activates a subscription. Stripe webhooks are the source of truth. The UI reads subscription state from BookFlow's database through the authenticated API.

## Project Overview

The repository is a TypeScript npm workspace:

```text
bookflow/
├── client/                  React + Vite + Tailwind application
│   └── src/
│       ├── components/      Layout and reusable UI components
│       ├── lib/             API, auth, formatting, toasts, hooks
│       ├── pages/           Booking, pricing, billing, checkout pages
│       └── types/           Shared client-side domain types
├── server/                  Express REST API
│   ├── prisma/              PostgreSQL schema and seed
│   └── src/
│       ├── config/          Validated environment, Prisma, Stripe
│       ├── middleware/      JWT and tenant authorization
│       ├── routes/          REST endpoints and raw-body webhook route
│       ├── services/        Stripe and subscription business logic
│       └── utils/           Errors and validation helpers
├── .env.example
└── package.json
```

## Week 3 Objectives

- Add monthly/yearly pricing without exposing Stripe Price IDs to the browser.
- Create Stripe Checkout sessions on the authenticated server.
- Model one billing subscription per tenant.
- Use verified, idempotent webhooks to update subscription and payment state.
- Provide plan changes, cancellation, resume, Stripe customer portal, and invoice history.
- Surface billing state on responsive Pricing, Billing, Checkout, and Dashboard pages.
- Preserve the existing tenant-scoped booking, calendar, customers, team, and authentication experience.

## Features

### Existing booking platform

- JWT sign-in and workspace registration API
- Tenant membership checks on every protected API request
- Dashboard metrics, booking overview, upcoming bookings, and plan usage
- Weekly calendar
- Searchable/filterable booking management with create flow
- Customer directory and team management
- Responsive settings page

### Week 3 billing

- Starter, Professional, and Business pricing cards
- Monthly/yearly toggle with annual savings
- Current-plan and button loading states
- Stripe Checkout with server-side plan-to-price mapping
- Checkout success/cancel experiences
- Subscription overview and status messaging
- Upgrade/downgrade, scheduled cancellation, resume, and customer portal
- Billing history with hosted invoice and PDF links
- Desktop table and mobile invoice cards
- Stripe signature verification and raw request body handling
- Durable webhook event idempotency records
- Webhook retry support for previously failed events
- Loading skeletons, empty states, safe API errors, dialogs, and toast feedback

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, React Router, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Zod
- **Database:** PostgreSQL, Prisma ORM
- **Authentication:** JWT, bcrypt
- **Payments:** Stripe Checkout, Subscriptions, Billing Portal, Invoices, Webhooks
- **API:** Tenant-scoped REST JSON endpoints

## Architecture

```text
Browser (React)
      │ JWT + plan key (never a Stripe Price ID)
      ▼
Express REST API ────────► Stripe API
      │                       │
      │ Prisma                │ signed events
      ▼                       ▼
 PostgreSQL ◄──────── /api/webhooks/stripe
      │
      └── subscription + invoice + webhook event records
```

The billing layer is separated into routes and `server/src/services/billing.ts`. Routes authenticate, authorize, and validate. The service owns Stripe calls and persistence mapping. The browser only receives public billing data and redirect URLs.

## Pricing Plans

| Plan | Monthly | Yearly | Limits/highlights |
|---|---:|---:|---|
| Starter | $9 | $90 | 1 member, 100 bookings/month, basic calendar, email notifications |
| Professional | $29 | $290 | 5 members, 1,000 bookings/month, advanced calendar, analytics, priority support |
| Business | $79 | $790 | Unlimited members/bookings, advanced analytics, custom settings, priority support |

Monthly and yearly prices are different Stripe Price objects. Their IDs exist only in backend environment configuration.

## Stripe Integration

`server/src/config/stripe.ts` maps the validated plan key and billing interval to a Stripe Price ID. Client requests contain only:

```json
{ "plan": "PROFESSIONAL", "interval": "month" }
```

The server resolves the current tenant from the JWT, checks membership in PostgreSQL, creates/reuses a tenant-owned Stripe Customer, and adds `tenantId`, `userId`, plan, and interval metadata. Stripe secret keys and webhook secrets are never bundled into Vite.

## Checkout Flow

1. User selects a plan on `/pricing`.
2. React posts a plan key and interval to `POST /api/billing/checkout`.
3. Express validates the request with Zod and maps it to an environment-configured Price ID.
4. The server creates a Stripe Checkout Session for the authenticated tenant.
5. Browser redirects to the Stripe-hosted Checkout URL.
6. Stripe redirects the browser to `/checkout/success` or `/checkout/cancel`.
7. The success page says activation is being confirmed; it does not mutate billing state.
8. Stripe sends signed webhook events to the server.
9. Webhook processing updates PostgreSQL.
10. The frontend refetches `/api/billing/subscription` and reflects the database state.

## Webhook Architecture

`POST /api/webhooks/stripe` is mounted **before** `express.json()` and uses `express.raw({ type: 'application/json' })`. The endpoint:

1. Requires `Stripe-Signature`.
2. Calls `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`.
3. Inserts the unique Stripe event ID as `RECEIVED`.
4. Returns success immediately for an already processed/received duplicate.
5. Retries a previously `FAILED` event when Stripe delivers it again.
6. Applies a tenant-scoped upsert for subscription/invoice data.
7. Marks the event `PROCESSED` with a timestamp, or `FAILED` without exposing the internal error to the caller.

## Supported Stripe Events

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Unrecognized, correctly signed events are safely recorded and acknowledged.

## Duplicate Webhook Handling

`WebhookEvent.stripeEventId` has a unique constraint. A duplicate insert triggers Prisma error `P2002`; processed events return HTTP 200 with `duplicate: true`. Failed events can be reset to `RECEIVED` and processed again. This prevents duplicate subscription/invoice writes while allowing Stripe's retry mechanism to recover transient failures.

## Subscription Management

- **Change plan:** updates the existing Stripe subscription item with prorations; local state waits for `customer.subscription.updated`.
- **Cancel:** sets `cancel_at_period_end`; access remains until the webhook-confirmed period end.
- **Resume:** clears `cancel_at_period_end` before the subscription ends.
- **Manage billing:** opens a short-lived Stripe Billing Portal session.
- **Statuses:** `trialing`, `active`, `past_due`, `canceled`, `incomplete`, `incomplete_expired`, and `unpaid` are retained from Stripe and displayed safely in the UI.

## Billing History

Invoice webhooks persist amount, currency, normalized status, plan, invoice number/date, Stripe-hosted invoice URL, and PDF URL. `GET /api/billing/invoices` reads only invoices matching the authorized tenant and returns newest first.

## Database Schema

Important billing tables in `server/prisma/schema.prisma`:

- `Tenant`: workspace details and unique Stripe Customer ID
- `Subscription`: one record per tenant; Stripe customer/subscription/price IDs, plan, status, interval, period dates, cancellation flag, and payment status
- `Invoice`: unique Stripe Invoice ID, tenant ownership, totals, status, plan, and hosted document URLs
- `WebhookEvent`: unique event ID, type, processing status, timestamp, optional tenant, and private processing error

Existing `User`, `Membership`, `Customer`, and `Booking` models preserve multi-tenant product functionality. All tenant-owned records have tenant indexes and cascade/restrict behavior where appropriate.

## API Endpoints

All `/api/billing/*`, `/api/bookings`, and `/api/customers` endpoints require `Authorization: Bearer <JWT>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create user, tenant, owner membership, and free subscription |
| POST | `/api/auth/login` | Validate credentials and issue a tenant-scoped JWT |
| GET/POST | `/api/bookings` | List/create tenant bookings |
| PATCH | `/api/bookings/:id/status` | Change a tenant booking status |
| GET/POST | `/api/customers` | List/create tenant customers |
| POST | `/api/billing/checkout` | Create Stripe Checkout Session |
| GET | `/api/billing/subscription` | Return latest database subscription and usage |
| GET | `/api/billing/invoices` | Return tenant invoice history |
| POST | `/api/billing/change-plan` | Submit Stripe subscription plan change |
| POST | `/api/billing/cancel` | Schedule cancellation |
| POST | `/api/billing/resume` | Resume scheduled subscription |
| POST | `/api/billing/portal` | Create Stripe Billing Portal session |
| POST | `/api/webhooks/stripe` | Receive and verify Stripe events |
| GET | `/api/health` | API health check |

Successful API responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }` with suitable HTTP status codes.

## Environment Variables

Copy `.env.example` to `server/.env`. Do not commit `.env` files.

| Variable | Use |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | At least 32 random characters |
| `STRIPE_SECRET_KEY` | Server-only Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from Stripe CLI/dashboard |
| `STRIPE_STARTER_PRICE_ID` | Starter monthly Stripe Price |
| `STRIPE_STARTER_YEARLY_PRICE_ID` | Starter annual Stripe Price |
| `STRIPE_PROFESSIONAL_PRICE_ID` | Professional monthly Stripe Price |
| `STRIPE_PROFESSIONAL_YEARLY_PRICE_ID` | Professional annual Stripe Price |
| `STRIPE_BUSINESS_PRICE_ID` | Business monthly Stripe Price |
| `STRIPE_BUSINESS_YEARLY_PRICE_ID` | Business annual Stripe Price |
| `FRONTEND_URL` | Allowed browser origin and Stripe return origin |
| `BACKEND_URL` | Public API origin |
| `VITE_API_URL` | Browser-visible API base URL only |
| `VITE_DEMO_MODE` | `true` only for the self-contained UI preview |

## Stripe Setup

1. Create a Stripe account and enable test mode.
2. Create three products: Starter, Professional, and Business.
3. Create monthly and yearly recurring Prices for each product.
4. Put all six `price_...` IDs in `server/.env`.
5. Copy your test `sk_test_...` key to `STRIPE_SECRET_KEY`.
6. Enable the Stripe Customer Portal and allow subscription/payment method management.
7. Register the supported webhook events in Stripe, or use Stripe CLI locally.
8. Put the endpoint's `whsec_...` value in `STRIPE_WEBHOOK_SECRET`.

## Local Development

Prerequisites: Node.js 20+, npm 10+, PostgreSQL 15+, Stripe CLI.

```bash
# from the repository root
npm install
cp .env.example server/.env
cp client/.env.example client/.env

# edit server/.env with PostgreSQL and Stripe test values
# edit client/.env and keep VITE_DEMO_MODE=false for the full stack
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Seed login: `alex@northstar.co` / `demo123`

The committed `client/.env` enables a no-secret UI preview. Replace it from `client/.env.example` to exercise the real API.

## Running the Backend

```bash
npm run dev:server
# production build
npm run build -w server
npm run start -w server
```

The API fails fast if required secrets, URLs, Price IDs, or the database connection string are malformed/missing.

## Running the Frontend

```bash
npm run dev:client
# production build and preview
npm run build -w client
npm run preview -w client
```

## Database Migration

```bash
# create/apply a development migration
npm run db:migrate -- --name week3_billing

# regenerate Prisma Client after schema changes
npm run db:generate

# deployment environment
npx prisma migrate deploy --schema server/prisma/schema.prisma
```

## Stripe Webhook Testing

Start the backend, authenticate Stripe CLI, then forward signed events:

```bash
stripe login
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

Copy the printed `whsec_...` into `server/.env`, restart the backend, then use real Checkout or trigger fixtures:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

For subscription fixtures to map to a tenant, use Checkout from BookFlow so metadata and the tenant-owned Customer are present. Stripe Dashboard's Events page can resend the same event to verify duplicate handling.

## Security Considerations

- Secret and webhook keys exist only in server environment variables.
- The browser submits allow-listed plan keys, never trusted Price IDs.
- Zod validates all billing inputs.
- Every protected request verifies a signed JWT and then confirms current tenant membership in PostgreSQL.
- All reads/writes are scoped by the authenticated `tenantId`.
- Stripe webhook signatures are checked against the untouched raw body.
- Unique event IDs and subscription constraints prevent duplicate processing/records.
- Browser success redirects do not activate subscriptions.
- Public API errors do not include Stripe responses, stack traces, database details, or secrets.
- Passwords are hashed with bcrypt; production must use HTTPS and a strong JWT secret.

## Error Handling

The frontend includes loading, disabled, empty, retry, success, warning, and failure states. The backend distinguishes validation (422), authentication (401), authorization (403), missing resources (404), state conflicts (409), Stripe/upstream issues (502 where applicable), webhook signatures (400), and private internal failures (500). Stripe or database details are logged server-side only.

## Responsive Design

- **Desktop:** persistent navigation, three-column pricing, wide dashboard, invoice table.
- **Tablet:** compact grids and flexible dashboard cards.
- **Mobile:** slide-out navigation, stacked pricing, touch-friendly controls, responsive invoice cards, and horizontally scrollable calendar only where the time grid requires it.
- Accessible labels, visible keyboard focus, semantic tables/dialogs, readable contrast, and reduced visual motion are included.

## Screenshots

Recommended capture routes after starting the frontend:

1. `/` — dashboard with compact subscription card
2. `/pricing` — three plan cards and billing period toggle
3. `/billing` — subscription management and billing history
4. `/checkout/success?plan=professional` — webhook confirmation state
5. `/calendar` and `/bookings` — preserved Week 2 product views

## Week 3 Deliverables

- [x] Responsive pricing page with monthly/yearly plans
- [x] Secure Stripe Checkout Session endpoint
- [x] Checkout success and cancellation routes
- [x] Subscription management UI and APIs
- [x] Billing history table/mobile cards
- [x] Raw-body, signature-verified Stripe webhook
- [x] Idempotent webhook persistence and duplicate protection
- [x] Webhook-driven subscription and invoice updates
- [x] PostgreSQL/Prisma billing schema
- [x] Tenant authorization and Zod validation
- [x] Dashboard plan integration and complete navigation
- [x] Loading, error, empty, toast, dialog, and mobile states
- [x] Environment templates, seed data, setup, security, and testing documentation
