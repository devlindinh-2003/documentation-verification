# 🛡️ VeriFlow — Document Verification System

A production-grade document verification platform for marketplace sellers. Built as a monorepo with a **NestJS** backend and **Next.js** frontend.

> Sellers upload identity documents → The system verifies them automatically → Admins review edge cases manually.

### 🌐 Live Demo

👉 **[https://documentation-verification-frontend.vercel.app](https://documentation-verification-frontend.vercel.app)**

---

## 📖 Table of Contents

- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Screen Captures](#-screen-captures)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Test Credentials & Demo Flow](#-test-credentials--demo-flow)
- [Test Files](#-test-files)
- [API Overview](#-api-overview)
- [State Machine](#-state-machine)
- [Environment Variables](#-environment-variables)
- [What I'd Build Next](#-what-id-build-next)

---

## 🧱 Tech Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| **Frontend**   | Next.js 16 (App Router), React 19, TypeScript |
| **Backend**    | NestJS 11, TypeScript                         |
| **Database**   | PostgreSQL 15 (Supabase)                      |
| **ORM**        | Drizzle ORM                                   |
| **Queue**      | BullMQ + Redis 7                              |
| **Storage**    | Supabase Storage (S3-compatible)              |
| **Auth**       | JWT + Argon2 password hashing                 |
| **Styling**    | Tailwind CSS 4, shadcn/ui components          |
| **State Mgmt** | Zustand, TanStack React Query                 |

---

## 🏗 Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Next.js   │  REST   │   NestJS     │  Queue  │   BullMQ     │
│  Frontend   │ ──────► │   Backend    │ ──────► │   Worker     │
└─────────────┘         └──────┬───────┘         └──────┬───────┘
                               │                        │
                        ┌──────▼───────┐         ┌──────▼───────┐
                        │  PostgreSQL  │         │ Mock Verify  │
                        │  (Supabase)  │         │   Service    │
                        └──────────────┘         └──────────────┘
                        ┌──────────────┐
                        │  Supabase    │
                        │  Storage     │
                        └──────────────┘
```

**Key flows:**

1. Seller uploads a document → presigned URL → direct to Supabase Storage
2. Backend confirms upload → creates a verification record → enqueues a BullMQ job
3. Worker calls the mock verification service → receives a result → updates record via webhook
4. If result is `inconclusive`, an Admin must manually approve or deny
5. Notifications are created for every final status change

---

## 📸 Screen Captures

### Authentication Flow

![Login Page](Documents/Images/login_page.png)
_The login interface with the one-click demo account creation feature._

### Seller Dashboard & Upload Flow

![Seller Dashboard](Documents/Images/seller_page.png)
_The seller dashboard where users can upload documents and track their verification status._

![System Verified Status](Documents/Images/system_verify_page.png)
_Real-time status update showing a successfully verified document._

![System Rejected Status](Documents/Images/system_rejected_page.png)
_Real-time status update showing a rejected document._

![File Inconclusive Status](Documents/Images/file_inconclusive_page.png)
_Real-time status update showing a document flagged as inconclusive, requiring admin review._

### Admin Review Queue

![Admin Dashboard](Documents/Images/admin_page.png)
_The admin dashboard displaying the queue of verification records waiting for review._

![Admin File Detail](Documents/Images/admin_file_detail_page.png)
_The admin interface for reviewing a specific document and submitting an approve/deny decision._

---

## 📁 Project Structure

```
document-verification/
├── apps/
│   ├── backend/              # NestJS API server
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # Login, register, demo accounts
│   │   │   │   ├── verification/     # Upload, confirm, state machine
│   │   │   │   ├── admin/            # Admin review queue & decisions
│   │   │   │   ├── notification/     # In-app notification system
│   │   │   │   ├── mock-verification/# Simulated external verifier
│   │   │   │   └── storage/          # Supabase Storage integration
│   │   │   └── database/             # Drizzle schema, migrations, seed
│   │   └── drizzle/                  # SQL migration files
│   └── frontend/             # Next.js App Router
│       └── src/
│           ├── app/
│           │   ├── login/            # Authentication page
│           │   ├── seller/           # Seller dashboard & upload
│           │   └── admin/            # Admin review queue & detail
│           ├── components/           # Reusable UI components
│           ├── hooks/                # Custom React hooks
│           ├── services/             # API service layer
│           └── lib/                  # Utilities, config, error handling
├── Documents/
│   ├── Mock-File/            # Test PDFs for deterministic results
│   └── Postman/              # API collection & environment
└── docker-compose.yml        # Local PostgreSQL + Redis
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Docker** & Docker Compose (for local PostgreSQL + Redis)
- **npm** ≥ 9

### 1. Clone & Install

```bash
git clone <repository-url>
cd Document-Verification
npm install
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts:

- **PostgreSQL** on port `5433`
- **Redis** on port `6379`

### 3. Configure Environment

Create `apps/backend/.env.local`:

```env
DATABASE_URL=postgresql://postgres:user@localhost:5433/document_verification_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-local-secret-key
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_SERVICE_KEY=<your-supabase-service-role-key>
SUPABASE_BUCKET=documents
PRESIGNED_URL_TTL=900
NODE_ENV=development
```

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Run Migrations & Seed

```bash
cd apps/backend
npm run db:migrate
npm run db:seed
```

### 5. Start Development

From the root directory:

```bash
npm run dev
```

This starts both apps concurrently:

- **Backend** → `http://localhost:8000`
- **Frontend** → `http://localhost:5001`

---

## 🔑 Test Credentials & Demo Flow

Follow this step-by-step guide to test the full system in under 5 minutes.

### 👤 Admin Account (Pre-seeded)

The admin account is created automatically when you run `npm run db:seed`:

```
Email:    admin@example.com
Password: password123
```

### 👤 Seller Account (Generated)

Seller accounts are **not pre-defined**. You create one through the UI.

---

### 🎬 Step 1 — Create a Seller Account

1. Open the app at **http://localhost:5001/login**
2. Click the **"Create Demo Account"** button at the bottom of the login page
3. The system generates a unique seller account instantly:
   - **Email**: auto-generated (e.g., `demo_1745847632_abc123@example.com`)
   - **Password**: `password123`
4. Copy the credentials displayed on screen

---

### 🎬 Step 2 — Log In as Seller

1. Enter the generated email and password into the login form
2. Click **"Enter Dashboard"**
3. You will be redirected to the **Seller Dashboard**

---

### 🎬 Step 3 — Upload a Document

1. On the Seller Dashboard, you will see the **Upload Document** section
2. Drag and drop one of the [test files](#-test-files) or click to browse
3. Click **"Confirm & Submit Document"**
4. The system will:
   - Upload the file to secure storage
   - Create a verification record in `pending` status
   - Enqueue a background job for verification
5. Within a few seconds, the status will update automatically on the dashboard

---

### 🎬 Step 4 — Understand Document Statuses

The mock verification service determines the result **based on the filename**:

| File You Upload    | Resulting Status    | What Happens Next                            |
| ------------------ | ------------------- | -------------------------------------------- |
| `verified.pdf`     | ✅ **Verified**     | Done. Identity confirmed.                    |
| `rejected.pdf`     | ❌ **Rejected**     | Done. Document was invalid.                  |
| `inconclusive.pdf` | ⚠️ **Inconclusive** | Requires Admin review (see below).           |
| Any other file     | 🎲 **Random**       | 50% verified, 30% inconclusive, 20% rejected |

> The seller dashboard auto-refreshes every 5 seconds while a document is being processed. You will see the status change in real time.

---

### 🎬 Step 5 — Admin Reviews an Inconclusive Document

1. **Log out** from the Seller account (or open a new incognito window)
2. Go to **http://localhost:5001/login**
3. Log in with the **Admin credentials**:
   ```
   Email:    admin@example.com
   Password: password123
   ```
4. You will be redirected to the **Admin Dashboard**
5. Find the document with status **"Inconclusive"** in the review queue
6. Click on the document to open the detail view
7. **Claim** the record (locks it so other admins can't review it simultaneously)
8. **Review** the uploaded document
9. Click **"Approve"** or **"Deny"** and provide a reason
10. The seller will see the updated status on their dashboard

---

### 🔄 Full Flow Summary

```
Seller creates account
       │
       ▼
Seller logs in → uploads document
       │
       ▼
System processes (1-3 seconds)
       │
       ├── verified.pdf   → ✅ Verified (terminal)
       ├── rejected.pdf   → ❌ Rejected (terminal)
       └── inconclusive.pdf → ⚠️ Inconclusive
                                    │
                                    ▼
                            Admin logs in
                                    │
                                    ▼
                         Admin claims & reviews
                                    │
                              ┌─────┴─────┐
                              ▼           ▼
                         ✅ Approved   ❌ Denied
```

---

## 📎 Test Files

Three test PDFs are included in the [`Documents/Files upload/`](Documents/Files%20upload/) directory:

| File                                                               | Purpose                                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| [`verified.pdf`](Documents/Files%20upload/verified.pdf)            | Triggers an automatic **Verified** result                   |
| [`rejected.pdf`](Documents/Files%20upload/rejected.pdf)            | Triggers an automatic **Rejected** result                   |
| [`inconclusive.pdf`](Documents/Files%20upload/%20inconclusive.pdf) | Triggers an **Inconclusive** result (requires Admin review) |

> **How it works:** The mock verification service checks the uploaded filename. If it ends with `verified.pdf`, `rejected.pdf`, or `inconclusive.pdf`, the result is deterministic. Any other filename produces a random result.

---

## 🔌 API Overview

### Auth (Public)

| Method | Endpoint            | Description              |
| ------ | ------------------- | ------------------------ |
| POST   | `/auth/register`    | Register a new seller    |
| POST   | `/auth/login`       | Log in and receive a JWT |
| POST   | `/auth/demo/create` | Generate a demo account  |

### Verification (Seller)

| Method | Endpoint                 | Description                         |
| ------ | ------------------------ | ----------------------------------- |
| GET    | `/verifications/my`      | List seller's own verifications     |
| POST   | `/verifications/presign` | Get a presigned upload URL          |
| POST   | `/verifications/confirm` | Confirm upload and start processing |

### Admin (Admin only)

| Method | Endpoint                            | Description                      |
| ------ | ----------------------------------- | -------------------------------- |
| GET    | `/admin/verifications`              | List all verification records    |
| GET    | `/admin/verifications/:id`          | Get a single record              |
| GET    | `/admin/verifications/:id/history`  | Get audit trail for a record     |
| GET    | `/admin/verifications/:id/document` | Get a signed URL to view the doc |
| POST   | `/admin/verifications/:id/claim`    | Claim a record for review        |
| POST   | `/admin/verifications/:id/decision` | Submit approve/deny decision     |

### Notifications (Authenticated)

| Method | Endpoint                       | Description                    |
| ------ | ------------------------------ | ------------------------------ |
| GET    | `/notifications`               | List notifications             |
| GET    | `/notifications/unread-count`  | Get unread notification count  |
| PATCH  | `/notifications/:id/read`      | Mark a notification as read    |
| POST   | `/notifications/mark-all-read` | Mark all notifications as read |

---

## 🔄 State Machine

The verification lifecycle follows a strict state machine:

```
                  ┌─────────┐
                  │ pending │
                  └────┬────┘
                       │
                       ▼
                 ┌───────────┐
          ┌──────┤ processing ├──────┐
          │      └─────┬─────┘      │
          │            │            │
          ▼            ▼            ▼
    ┌──────────┐ ┌───────────┐ ┌────────────┐
    │ verified │ │inconclusive│ │  rejected  │
    └──────────┘ └─────┬─────┘ └────────────┘
                       │
                 ┌─────┴─────┐
                 ▼           ▼
           ┌──────────┐ ┌────────┐
           │ approved │ │ denied │
           └──────────┘ └────────┘
```

**Terminal states** (no further transitions): `verified`, `rejected`, `approved`, `denied`

---

## ⚙️ Environment Variables

### Backend (`apps/backend/.env.local`)

| Variable               | Description                     | Required |
| ---------------------- | ------------------------------- | -------- |
| `DATABASE_URL`         | PostgreSQL connection string    | ✅       |
| `REDIS_HOST`           | Redis host                      | ✅       |
| `REDIS_PORT`           | Redis port                      | ✅       |
| `JWT_SECRET`           | Secret key for JWT signing      | ✅       |
| `SUPABASE_URL`         | Supabase project URL            | ✅       |
| `SUPABASE_SERVICE_KEY` | Supabase service role key       | ✅       |
| `SUPABASE_BUCKET`      | Storage bucket name             | ✅       |
| `PRESIGNED_URL_TTL`    | Upload URL expiration (seconds) | Optional |
| `NODE_ENV`             | `development` or `production`   | Optional |

### Frontend (`apps/frontend/.env.local`)

| Variable              | Description          | Required |
| --------------------- | -------------------- | -------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | ✅       |

---

## 🔮 What I'd Build Next

If I had 2 more hours, these are the two features I would prioritize:

### 1. Real-Time Notifications with Socket.IO

**What:** Replace the current 10-second polling mechanism with WebSocket-based push notifications using Socket.IO.

**Why it matters:**

- **Instant feedback.** Right now, a seller uploads a document and waits up to 10 seconds before the UI reflects the new status. With Socket.IO, the backend would push the update the moment the BullMQ worker finalizes the verification — cutting perceived latency from seconds to milliseconds.
- **Lower server load.** Polling means every authenticated client hits `GET /notifications/unread-count` every 10 seconds, regardless of whether anything changed. At scale, that's thousands of unnecessary database reads per minute. WebSockets flip the model: the server only sends data when there is data to send.
- **Better admin coordination.** When two admins are reviewing the queue simultaneously, Socket.IO enables real-time lock visibility — Admin B would instantly see that Admin A just claimed a record, without waiting for the next poll cycle. This directly reduces the chance of conflicting reviews.

### 2. Transactional Email Notifications

**What:** Send email alerts (via SendGrid, Resend, or AWS SES) when a seller's document reaches a terminal state (`verified`, `rejected`, `approved`, `denied`).

**Why it matters:**

- **Offline reach.** In-app notifications only work if the user has the tab open. Sellers who submit a document and close the browser have no way to know their status changed. Email closes that gap — it meets the user where they already are.
- **Trust and professionalism.** A verification system that silently changes status without proactively notifying the user feels incomplete. A well-crafted email ("Your identity has been verified — you can now list products") builds confidence in the platform.
- **Minimal implementation cost.** The infrastructure is already in place: the `NotificationWorker` processes BullMQ jobs and creates in-app notifications. Adding an email step is a single `await sendEmail()` call inside the same worker, using the same job data. No new queues, no new services — just one more side-effect in an existing pipeline.
