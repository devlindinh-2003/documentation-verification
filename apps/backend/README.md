# Backend | Document Verification System

## 1. Project Overview

The backend application is the core orchestration layer for the Document Verification System. It securely handles identity verification requests, manages async document processing workflows, and maintains strict database integrity.

Its responsibilities include:

- Managing user authentication and role-based access control (Sellers vs Admins).
- Generating secure, time-limited presigned URLs for direct-to-cloud document uploads.
- Orchestrating the asynchronous verification pipeline via distributed message queues.
- Exposing secure Webhook endpoints for third-party verification providers.
- Managing strict state machine transitions for document records.

## 2. Tech Stack

- **Runtime:** Node.js
- **Framework:** NestJS (v11)
- **Database:** PostgreSQL (`pg`)
- **ORM:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Authentication:** Passport, JWT (`@nestjs/jwt`), Argon2 (Password hashing)
- **Message Queue:** BullMQ (backed by Redis)
- **External Services:** Supabase Storage (Object Storage)
- **Validation:** Zod (`nestjs-zod`)
- **Security/Monitoring:** `@nestjs/throttler` (Rate limiting), internal request logging.

## 3. Project Structure

```text
apps/backend/
├── src/
│   ├── common/           # Global guards, filters, decorators, and interceptors
│   ├── config/           # Environment configuration and validation
│   ├── database/         # Drizzle schema, migrations, and seed scripts
│   ├── modules/
│   │   ├── admin/        # Admin endpoints, document claiming, and decisions
│   │   ├── auth/         # Login, token generation, and demo account creation
│   │   ├── mock-verification/ # Simulated external vendor processing
│   │   ├── notification/ # In-app user notifications
│   │   ├── storage/      # Supabase interaction (presigned URLs)
│   │   └── verification/ # Seller document submission and Webhook callbacks
│   ├── app.module.ts     # Root module
│   └── main.ts           # Application entry point
├── drizzle/              # Generated SQL migrations
├── test/                 # E2E test suites
├── .env.example          # Environment variables template
├── drizzle.config.ts     # Drizzle studio/CLI configuration
└── package.json          # Dependencies and scripts
```

## 4. Setup Instructions

### Prerequisites

- Node.js (v20+)
- PostgreSQL database
- Redis instance

### Installation

From the `apps/backend` directory (or monorepo root):

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` (or just `.env` depending on your setup) and update the values:

```bash
cp .env.example .env.local
```

Ensure you have valid PostgreSQL, Redis, and Supabase credentials.

### Running Locally

1. Run migrations and seed the database:
   ```bash
   npm run db:push
   # or
   npm run db:migrate
   npm run db:seed
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

### Build Steps

```bash
npm run build
```

## 5. API Overview

### Main Domains & Endpoints

- **Auth:**
  - `POST /auth/login` - Returns JWT.
  - `POST /auth/demo` - Generates a demo account.
- **Verification (Seller):**
  - `POST /verifications/upload-url` - Requests a presigned PUT URL.
  - `POST /verifications/confirm` - Confirms upload and queues the job.
  - `GET /verifications/status` - Gets the status of the seller's current document.
  - `POST /verifications/callback` - **Webhook Receiver** for external provider results.
- **Admin:**
  - `GET /admin/verifications` - Lists inconclusive records for review.
  - `POST /admin/verifications/:id/claim` - Soft-locks a record to prevent concurrent edits.
  - `POST /admin/verifications/:id/decision` - Submits a manual `approved` or `denied` result.
- **Notifications:**
  - `GET /notifications` - Retrieves unread alerts for the user.

### Request/Response Format & Validation

All incoming requests are validated against Zod schemas using `nestjs-zod`.
Unexpected fields are stripped. Validation errors return `400 Bad Request` with structured error details.

### Authentication Flow

Endpoints are protected by `@UseGuards(JwtAuthGuard)`. Admin routes additionally require a `RolesGuard`. The JWT is passed as a Bearer token in the `Authorization` header.

## 6. Scripts

- `npm run dev`: Starts the NestJS dev server with hot-reloading.
- `npm run build`: Compiles the TS code into the `dist` directory.
- `npm run start:prod`: Runs the production build (`node dist/src/main`).
- `npm run db:generate`: Generates Drizzle SQL migrations based on schema changes.
- `npm run db:migrate`: Executes pending database migrations.
- `npm run db:push`: Pushes schema directly to DB (dev only).
- `npm run db:seed`: Populates the database with default users and test data.
- `npm run lint`: Runs ESLint over the codebase.
- `npm run format`: Runs Prettier.

## 7. Deployment Guide

### How to Deploy Backend

The NestJS app compiles to standard Node.js and can be deployed via Docker, Render, Heroku, or AWS ECS.

1. Configure environment variables in the production environment.
2. Ensure the production PostgreSQL and Redis databases are accessible.
3. Run the build step during deployment (`npm run build`).
4. Execute migrations before the app starts (`npm run db:migrate`).
5. Start the server using `npm run start:prod`.

### Environment Differences

- **Local:** Connects to local Postgres/Redis via `.env.local`. Uses `npm run dev`.
- **Production:** Connects to managed services (e.g., Supabase DB, Upstash Redis). Safety guards in `main.ts` will throw warnings if production DBs are accidentally used in `NODE_ENV=development`.

## 8. Notes / Best Practices

- **Architecture Decisions:** Code is cleanly separated by domain in bounded modules. Services do not cross-import directly; communication happens via shared interfaces or events.
- **Data Integrity:** PostgreSQL transactions and Optimistic Locking (`version` column) ensure that concurrent admin updates or race conditions do not corrupt the verification state machine.
- **Security:** Files are never streamed through the Node app. Direct-to-storage presigned URLs are used. Incoming webhooks are strictly verified using HMAC signatures.
