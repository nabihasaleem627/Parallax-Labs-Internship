# SaaS Booking Platform

A modern, production-grade, multi-tenant B2B SaaS booking management platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL**, and **Prisma ORM**.

Engineered specifically for service businesses—including medical and wellness clinics, design and strategy consultants, personal fitness studios, salons, agencies, and small service providers—to manage appointments, prevent double-bookings, maintain client histories, and automate scheduling workflows.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Booking API](#booking-api)
7. [API Endpoints](#api-endpoints)
8. [Validation](#validation)
9. [Idempotency](#idempotency)
10. [Double-Booking Prevention](#double-booking-prevention)
11. [Error Handling](#error-handling)
12. [Authentication & Tenant Awareness](#authentication--tenant-awareness)
13. [Multi-Tenant Architecture](#multi-tenant-architecture)
14. [Environment Variables](#environment-variables)
15. [Installation](#installation)
16. [Database Setup](#database-setup)
17. [Development](#development)
18. [Production Build](#production-build)
19. [Vercel Deployment](#vercel-deployment)
20. [Postman API Collection](#postman-api-collection)
21. [Responsive Design](#responsive-design)
22. [Security Considerations](#security-considerations)
23. [Known Limitations](#known-limitations)
24. [Future Improvements](#future-improvements)

---

## Overview

The Modern Multi-Tenant SaaS Booking Platform provides a unified, reliable workspace for service businesses to schedule appointments, eliminate slot conflicts, and maintain clean customer relationships. Unlike basic scheduling toys, this system implements database-backed idempotency, strict tenant isolation, and atomic conflict detection, ensuring reliability under high-concurrency commercial use.

---

## Features

- **Full-Featured Booking Management**: Schedule, modify, reschedule, and delete appointments with real-time UI state sync.
- **Responsive Multi-View Calendar**: Switch smoothly between Month, Week, Day, and Agenda views with mobile-optimized touch drawers.
- **Atomic Double-Booking Prevention**: Mathematical interval intersection checks `(SlotStart < ExistingEnd) AND (SlotEnd > ExistingStart)` to block slot conflicts across active appointments.
- **Database-Backed Idempotency**: `Idempotency-Key` headers guarantee that duplicate network retries or rapid double-clicks return the original response without duplicate database inserts.
- **Live Database Metrics**: Real-time overview cards displaying Total Bookings, Today's Bookings, Upcoming Bookings, and Cancelled Slots.
- **Multi-Tenant Isolation**: Switch between pre-configured organizations (*Acme Wellness Clinic*, *Lumina Creative Studio*, *Apex Performance Lab*) or custom tenant workspaces with database-level isolation.
- **Customer Directory & History**: Automated customer indexing linking contact information, appointment logs, and intake notes.
- **Client & Server Zod Validation**: Strict validation guarding input lengths, email structures, 24-hour time sequencing, and status enumerations.
- **Interactive Landing Page**: High-converting commercial landing page with live interactive conflict sandbox and sector showcases.
- **Postman API Suite**: Standardized Postman v2.1.0 collection documenting all RESTful endpoints and payload structures.

---

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **UI & Styling**: React 18, Tailwind CSS, Lucide Icons, clsx, tailwind-merge
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Schema Validation**: Zod 3
- **Date Utilities**: Date-fns
- **Execution & Deployment**: Node.js 20+, Vercel Serverless

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Next.js App Router                   │
│                                                        │
│  Public Landing    Dashboard Overview   Calendar View  │
│  (/)               (/dashboard)         (/calendar)    │
└───────────┬──────────────────┬─────────────────┬───────┘
            │                  │                 │
            ▼                  ▼                 ▼
┌────────────────────────────────────────────────────────┐
│                Standardized REST API Routes            │
│  /api/bookings  /api/bookings/[id]  /api/stats  /api/… │
└───────────┬────────────────────────────────────────────┘
            │
            ├─► Tenant Resolution Context (Headers, Cookies, Query)
            ├─► Server-Side Zod Schema Validation
            ├─► Idempotency Store (prisma.idempotencyKey)
            ├─► Double-Booking Conflict Engine (findBookingConflict)
            │
            ▼
┌────────────────────────────────────────────────────────┐
│                Prisma ORM & PostgreSQL                 │
│  Tenant ◄──► Customer ◄──► Booking ◄──► IdempotencyKey │
└────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── bookings/
│   │   │   ├── route.ts           # GET (list/filter) & POST (create + idempotency)
│   │   │   └── [id]/
│   │   │       └── route.ts       # GET (one), PATCH (update), DELETE (destroy)
│   │   ├── customers/
│   │   │   └── route.ts           # Customer directory API
│   │   ├── stats/
│   │   │   └── route.ts           # Calculated database metrics API
│   │   ├── tenants/
│   │   │   └── route.ts           # Available tenant organizations API
│   │   └── health/
│   │       └── route.ts           # Health check and DB ping probe
│   ├── dashboard/
│   │   ├── layout.tsx             # Dashboard shell with sidebar & header
│   │   ├── page.tsx               # Main Dashboard (Metrics + Calendar + Actions)
│   │   ├── bookings/page.tsx      # Filterable bookings table & CSV export
│   │   ├── calendar/page.tsx      # Full-screen interactive calendar
│   │   ├── customers/page.tsx     # Client directory & appointment history
│   │   └── settings/page.tsx      # Workspace & operating hours settings
│   ├── globals.css                # Tailwind base styles and scrollbar overrides
│   ├── layout.tsx                 # Root layout with ToastProvider
│   └── page.tsx                   # Commercial Landing Page
├── components/
│   ├── dashboard/                 # Metrics, Calendar, List, Details, Form
│   ├── landing/                   # Hero, Features, Demo Sandbox, Pricing, CTA
│   ├── layout/                    # Navbar, AppHeader, AppSidebar, Footer
│   └── ui/                        # Toast, Modal, Badge, Button, Skeleton, States
├── lib/
│   ├── api-response.ts            # Standardized API response wrappers
│   ├── auth.ts                    # Multi-tenant context resolver
│   ├── booking-conflict.ts        # Atomic double-booking detection engine
│   ├── idempotency.ts             # Database-backed idempotency service
│   ├── prisma.ts                  # Global Prisma client singleton
│   ├── utils.ts                   # Date, time, currency, and classname helpers
│   └── validations/
│       └── booking.ts             # Zod schemas for create, update, and query
├── prisma/
│   ├── schema.prisma              # Database schema definitions
│   └── seed.ts                    # Multi-tenant demo dataset seeder
├── postman/
│   └── booking-api.json           # Postman Collection v2.1.0
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Booking API

All API requests and responses communicate via JSON and adhere to a unified response protocol.

### Response Conventions

#### Standard Success (200 / 201)
```json
{
  "success": true,
  "data": {
    "id": "cm1q2w3e4r5t6y7u8",
    "customerName": "Eleanor Vance",
    "customerEmail": "eleanor.vance@example.com",
    "serviceName": "Initial Health Consultation",
    "bookingDate": "2026-10-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "10:00",
    "status": "CONFIRMED",
    "price": 150
  },
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

#### Standard Error (400, 401, 404, 409, 500)
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "This time slot is already booked.",
    "details": []
  }
}
```

---

## API Endpoints

| Method | Endpoint | Description | Key Headers |
|---|---|---|---|
| `GET` | `/api/health` | System health and database verification | None |
| `GET` | `/api/bookings` | List and filter bookings (date, status, search, page) | `x-tenant-slug` |
| `POST` | `/api/bookings` | Create booking with conflict check & idempotency | `Idempotency-Key`, `x-tenant-slug` |
| `GET` | `/api/bookings/:id` | Fetch single booking by ID | `x-tenant-slug` |
| `PATCH` | `/api/bookings/:id` | Update timing, customer, notes, or status | `x-tenant-slug` |
| `DELETE` | `/api/bookings/:id` | Delete booking within tenant | `x-tenant-slug` |
| `GET` | `/api/stats` | Aggregated dashboard metrics | `x-tenant-slug` |
| `GET` | `/api/customers` | Directory of customers and booking counts | `x-tenant-slug` |
| `POST` | `/api/customers` | Manually register a customer profile | `x-tenant-slug` |
| `GET` | `/api/tenants` | List available tenant workspaces | None |

---

## Validation

All incoming payloads are strictly validated on both the client (for immediate form feedback) and server (for database security) using **Zod**.

### Rules Enforced:
- **Customer Name**: 2–100 characters.
- **Customer Email**: RFC 5322 compliant email format.
- **Booking Date**: ISO date or `YYYY-MM-DD` date string.
- **Times**: 24-hour `HH:MM` format (`00:00` to `23:59`).
- **Logical Ordering**: End time must be strictly greater than start time (`startTime < endTime`).
- **Status Values**: Must match enum `['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']`.

---

## Idempotency

Booking creation supports **database-backed idempotency** via the `Idempotency-Key` HTTP header.

### How It Works:
1. Client generates a UUID v4 idempotency key before submitting `POST /api/bookings`.
2. The server checks the `IdempotencyKey` table for matching `(tenantId, key)`.
3. If a cached record exists and is within its 24-hour expiration window:
   - The server immediately returns the stored HTTP status and response payload with header `Idempotent-Replayed: true`.
   - **Zero duplicate rows are created in PostgreSQL.**
4. If it is a new key, the mutation is processed, and the result is committed to the database and cached.

This protects against browser refreshes, double-clicks, and network retries on flaky connections.

---

## Double-Booking Prevention

To eliminate overlapping appointments, the platform evaluates interval intersections before inserting or updating records:

$$\text{Conflict} \iff (\text{RequestedStart} < \text{ExistingEnd}) \land (\text{RequestedEnd} > \text{ExistingStart})$$

### Behavior:
- **Overlapping Slot (e.g. 09:30–10:30 vs 09:00–10:00)**: Rejected with HTTP `409 Conflict` and code `BOOKING_CONFLICT`.
- **Contiguous Slot (e.g. 10:00–11:00 vs 09:00–10:00)**: Permitted.
- **Cancelled Appointments**: Excluded from conflict checks, freeing the slot for new clients.
- **Self-Updates (PATCH)**: Excludes the current booking ID to allow updating notes or status without triggering self-conflict.

---

## Error Handling

Standard error codes returned across the API:
- `VALIDATION_ERROR` (400): Malformed JSON, missing fields, or invalid time sequence.
- `UNAUTHORIZED` (401): Missing or unresolvable tenant workspace.
- `FORBIDDEN` (403): Unauthorized operation within tenant boundaries.
- `NOT_FOUND` (404): Booking or customer ID not found in the active tenant.
- `BOOKING_CONFLICT` (409): Target time slot already occupied by an active appointment.
- `DUPLICATE_REQUEST` (422): Unprocessable concurrent duplicate.
- `INTERNAL_ERROR` (500): Safe fallback error without leaking stack traces.

---

## Authentication & Tenant Awareness

Every database query is strictly scoped by `tenantId`.

Tenant context is resolved transparently in order of priority:
1. `x-tenant-id` or `x-tenant-slug` HTTP request header
2. `tenantId` or `tenantSlug` query parameter
3. `saas_tenant_slug` cookie set by the in-app Tenant Switcher
4. Primary seeded tenant (`acme-wellness`) fallback for seamless live demos

---

## Multi-Tenant Architecture

The seed script initializes three distinct business workspaces:
1. **Acme Wellness Clinic** (`acme-wellness`): Healthcare consultations, therapy assessments, nutritional sessions.
2. **Lumina Design & Strategy** (`lumina-creative`): Brand discovery sprints, UX reviews, advisory sessions.
3. **Apex Performance Lab** (`apex-fitness`): 1-on-1 athletic conditioning, VO2 max testing.

Switching organizations instantaneously switches data contexts, demonstrating complete isolation.

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/saas_booking?schema=public` |
| `NEXTAUTH_SECRET` | Secret key for signing sessions | `min-32-character-random-secret` |
| `NEXTAUTH_URL` | Base application URL | `http://localhost:3000` |

---

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Push database schema to PostgreSQL
npx prisma db push

# 3. Seed multi-tenant demo data
npm run seed
```

---

## Database Setup

To reset or sync the PostgreSQL schema:

```bash
# Push schema updates
npx prisma db push

# Run the seeding script
npx prisma db seed
```

---

## Development

Start the local development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the landing page and dashboard.

---

## Production Build

Verify the production build locally:

```bash
npm run build
npm run start
```

---

## Vercel Deployment

1. Push your repository to GitHub / GitLab.
2. Import the repository into [Vercel](https://vercel.com).
3. Set the environment variable `DATABASE_URL` to your PostgreSQL database (e.g. Neon, Supabase, Railway, Vercel Postgres).
4. Deploy. Vercel automatically runs `npm run build` and optimizes App Router routes.

---

## Postman API Collection

The complete Postman collection is located at:
```
/postman/booking-api.json
```
Import this file into Postman or Insomnia to test all endpoints with pre-configured headers, query parameters, idempotency examples, and response schemas.

---

## Responsive Design

Tested and optimized across:
- **Mobile (< 640px)**: Collapsible sidebar, touch-friendly day drawer, adaptive agenda view, zero horizontal scrolling.
- **Tablet (640px – 1024px)**: Responsive navigation, compact calendar grid.
- **Desktop (> 1024px)**: Fixed workspace sidebar, comprehensive 7-column calendar, quick actions header.

---

## Security Considerations

- **Tenant Scoping**: All mutations and queries enforce `where: { tenantId }`.
- **SQL Injection Prevention**: Prisma ORM executes parameterized queries.
- **Input Sanitization**: Zod trims and validates string bounds before reaching database layers.
- **Safe Errors**: Database internals and stack traces are suppressed from client responses.

---

## Known Limitations

- Real-time websockets (e.g. Supabase Realtime / Socket.io) are replaced by high-performance event listeners and optimistic UI updates for maximum serverless compatibility.
- Multi-currency conversion is based on organization-level default currency without dynamic exchange rate fetching.

---

## Future Improvements

- Automated SMS / WhatsApp reminder integration via Twilio.
- Webhook subscriptions for third-party calendar sync (Google Calendar & Outlook).
- Stripe Checkout integration for upfront appointment deposit collection.
- Custom booking form field builder per service category.
