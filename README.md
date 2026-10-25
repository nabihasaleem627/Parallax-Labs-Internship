# Parallax Labs Full-Stack Developer Internship

**Program:** Full-Stack Developer Internship  
**Track:** Track B  
**Duration:** 6 Weeks  
**Project:** Multi-Tenant B2B SaaS Booking Platform

## Overview

This repository contains my work throughout the six-week Parallax Labs Full-Stack Developer Internship. It brings together weekly projects, implementation exercises, and development deliverables focused on building scalable web applications and understanding production-oriented software engineering practices.

The internship focuses on full-stack development, multi-tenant application architecture, booking APIs, calendar interfaces, payment integration, real-time collaboration, Redis caching, database migrations, Docker, and production optimization.

Each weekly folder contains the corresponding project work and documentation.

## Internship Objectives

- Build maintainable full-stack web applications.
- Understand multi-tenant SaaS architecture and tenant isolation.
- Develop APIs and responsive user interfaces.
- Implement booking workflows and calendar functionality.
- Explore payment processing and webhook handling.
- Work with real-time collaboration and presence.
- Implement Redis caching and database fallback strategies.
- Practice database migration and data integrity testing.
- Containerize applications using Docker Compose.
- Improve application reliability, accessibility, and performance.
- Document projects with clear setup and testing instructions.
- Use Git and GitHub to manage and submit development work.

## Technology Stack

The technologies used across the internship projects include:

| Technology | Purpose |
|---|---|
| React | Component-based user interfaces |
| Next.js | Full-stack web application framework |
| TypeScript | Type-safe application development |
| Tailwind CSS | Responsive interface styling |
| PostgreSQL | Relational database |
| Drizzle ORM / database tooling | Database access and migrations, where configured |
| Redis | Caching and performance optimization |
| Docker | Application containerization |
| Docker Compose | Multi-service orchestration |
| Stripe | Payment processing and subscriptions |
| Yjs | Real-time collaborative data synchronization |
| REST APIs | Communication between application components |
| Git and GitHub | Version control and project submission |
| Vercel | Deployment platform, where configured |

*The exact stack varies by weekly project. Refer to each project's README and configuration files for its verified dependencies.*

## Weekly Project Roadmap

### Week 1: SaaS Booking Platform Foundation

**Focus:** Application architecture and multi-tenant foundations.

The internship's core project is a multi-tenant B2B SaaS booking platform designed to support multiple businesses using a shared application while keeping their data separated.

Key development areas:

- Application structure and architecture.
- Multi-tenant data modeling.
- Database schema design.
- Tenant-aware data access.
- Separation of business data.
- Project configuration and documentation.

**Objective:** Establish a maintainable foundation for the booking platform.

### Week 2: Booking APIs and Calendar UI

**Project folder:** `booking-apis-and-calendar-ui/`

**Focus:** Booking workflows and calendar interfaces.

Key development areas:

- Booking API implementation.
- Calendar-based booking interfaces.
- Booking creation and management.
- Input validation and error handling.
- Availability and scheduling logic.
- Prevention of conflicting bookings.
- Integration between the frontend and backend.

**Objective:** Build a reliable booking experience with clear API behavior and calendar-based interaction.

### Week 3: Payments, Webhooks and Pricing UI

**Focus:** Payment integration and subscription-oriented functionality.

Key development areas:

- Pricing interface and subscription presentation.
- Payment provider integration.
- Payment and subscription workflows.
- Webhook handling.
- Payment event validation.
- Idempotent processing of repeated events.
- Clear payment status and error feedback.

**Objective:** Develop the payment-related components required for a SaaS application.

### Week 4: Real-Time Collaboration and Presence

**Project:** ProjectHive  
**Project folder:** `real-time collaboration & presence/projecthive/`

**Focus:** Collaborative application functionality.

Key development areas:

- Real-time collaboration architecture.
- Shared application state.
- User presence and collaboration indicators.
- Client-server communication.
- Synchronization of collaborative changes.
- Handling connection and synchronization issues.

Yjs is relevant to the project's real-time collaboration architecture where configured.

**Objective:** Explore how collaborative web applications coordinate shared state and user activity.

### Week 5: Advanced Caching (Redis) and Settings UI

**Project folder:** `advanced-caching-redis-and-settings-ui/`

**Focus:** Performance, caching, and settings management.

Key development areas:

- Redis integration.
- Tenant-specific settings caching.
- Cache hits and misses.
- Cache invalidation after updates.
- Database fallback when Redis is unavailable.
- Tenant isolation in cache keys.
- Settings interface and API integration.
- Error handling and application reliability.

**Objective:** Improve application responsiveness while maintaining data consistency and tenant isolation.

### Week 6: Migrations, Docker and Polish

**Project folder:** `migrations, docker & polish/`

**Focus:** Deployment readiness, migration safety, and final application quality.

Key development areas:

- Database migration strategy.
- Testing against a 100,000-row seeded dataset.
- Data integrity and migration compatibility.
- Responsive UI improvements.
- Custom 404 and 500 error handling.
- Loading, empty, and error states.
- Docker Compose configuration for the application services.
- Database and Redis health checks.
- Application liveness and readiness endpoints.
- Frontend production build optimization.
- Comprehensive README documentation.

**Objective:** Prepare the application for reliable operation through improved infrastructure, testing, documentation, and user experience.

## Repository Structure

```text
Parallax-Labs-Internship/
│
├── README.md
│
├── saas-booking-platform/
│   └── Core booking platform work
│
├── booking-apis-and-calendar-ui/
│   └── Booking APIs and calendar interface
│
├── payments, webhooks & pricing ui/
│   └── Payment and pricing functionality
│
├── real-time collaboration & presence/
│   └── projecthive/
│       ├── client/
│       ├── server/
│       └── README.md
│
├── advanced-caching-redis-and-settings-ui/
│   └── Redis caching and settings functionality
│
└── migrations, docker & polish/
    ├── src/
    ├── drizzle/
    ├── scripts/
    ├── docker-compose.yml
    ├── Dockerfile
    ├── .env.example
    └── README.md
```

*This is a logical overview of the internship projects. Actual directory names and contents may differ. Preserve the existing repository structure and use the names present in GitHub.*

## Core Project: Multi-Tenant B2B SaaS Booking Platform

The central project explores a booking platform that can serve multiple businesses through a shared software application.

### Main architectural considerations

**Tenant isolation:** Each business should access only its authorized data.

**Booking integrity:** Scheduling operations should prevent conflicting reservations and validate availability.

**Reliable payments:** Payment events should be validated and processed safely.

**Performance:** Redis caching can reduce repeated database queries for frequently accessed settings.

**Data consistency:** Database updates and cache invalidation should work together to avoid stale settings.

**Real-time collaboration:** Collaborative components can synchronize shared information and communicate user presence.

**Operational reliability:** Health checks, containerization, and migration planning help prepare the application for deployment.

## Development and Setup

Each weekly project may have different prerequisites and commands. Follow the README inside the relevant project folder before running it.

### General prerequisites

- Git
- Node.js and npm for Node.js-based projects
- Docker Desktop for containerized projects
- Access to the required database and services
- Environment variables configured for the selected project

### Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Parallax-Labs-Internship
```

Replace the placeholder with the actual clone URL of your repository.

### Open a weekly project

For example:

```powershell
cd "booking-apis-and-calendar-ui"
```

Or:

```powershell
cd "advanced-caching-redis-and-settings-ui"
```

### Install dependencies

For a Node.js project using npm:

```bash
npm install
```

### Configure environment variables

If the project provides an `.env.example` file, create a local `.env` file based on it and configure the required database, Redis, payment, and application settings.

Never commit real credentials or secret keys.

### Run a project

Use the scripts defined in that project's `package.json`. For example, when the relevant scripts exist:

```bash
npm run dev
```

For a project with Docker Compose configured:

```bash
docker compose up --build
```

Consult the project-specific README for exact commands, ports, and environment requirements.

## Testing and Quality Assurance

Testing should reflect the requirements of each individual project.

Areas to verify include:

- API input validation and error handling.
- Tenant authorization and data separation.
- Booking availability and duplicate-booking prevention.
- Payment and webhook processing.
- Real-time synchronization behavior.
- Redis caching and invalidation.
- Database fallback when Redis is unavailable.
- Migration correctness and data integrity.
- Health and readiness endpoints.
- Responsive layouts and accessible interactions.
- Docker service connectivity.
- Successful production builds.

Only report tests as passing when they have actually been executed and verified.

## Security and Reliability

Security and reliability considerations across the projects include:

- Environment-based secret management.
- Server-side input validation.
- Tenant-aware authorization.
- Safe database access.
- Protection against duplicate operations where appropriate.
- Secure payment webhook verification.
- Appropriate cache-key scoping.
- Graceful handling of unavailable dependencies.
- Safe migration and recovery planning.
- Avoidance of sensitive information in logs and health responses.

## Documentation

Each project should include a README describing its purpose, features, technology stack, installation steps, environment variables, execution commands, and testing instructions.

The Week 6 project additionally documents migration strategy, the seeded dataset, Docker services, health checks, production optimization, and deployment considerations.

## Internship Deliverables

The repository organizes work across six areas:

1. SaaS application architecture and multi-tenant foundations.
2. Booking APIs and calendar interface.
3. Payments, webhooks, and pricing interface.
4. Real-time collaboration and presence.
5. Redis caching and settings management.
6. Database migrations, Docker, health checks, and final UI polish.

The precise completion status of individual requirements should be confirmed against the code and test results in each folder.

## Final Summary

The Parallax Labs Full-Stack Developer Internship provides practical experience with the technologies and engineering practices used to develop modern SaaS applications.

Across the six-week program, this repository brings together work on application architecture, booking workflows, payment processing, collaborative functionality, caching, database reliability, containerization, and production readiness.

The goal is to maintain a well-organized collection of projects that demonstrates implementation decisions, development progress, technical problem-solving, and documented results.

---

**Repository:** Parallax-Labs-Internship  
**Program:** Parallax Labs Full-Stack Developer Internship  
**Track:** B  
**Duration:** Six Weeks
