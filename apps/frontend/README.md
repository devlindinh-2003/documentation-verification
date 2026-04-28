# Frontend | Document Verification System

## 1. Project Overview

The frontend application serves as the user-facing interface for the Document Verification System. It provides a secure gateway for two main user roles:

- **Sellers:** Can upload identity documents, view their verification status in real-time, and receive notifications.
- **Admins:** Can view a queue of pending verifications, review documents, and manually approve or deny them.

This service is responsible for providing a seamless, responsive, and accessible UI, managing client-side state, securely handling JWT authentication, and interfacing with the backend API.

## 2. Tech Stack

- **Framework:** Next.js (v16 App Router)
- **State Management:**
  - Server State: `@tanstack/react-query`
  - Global Client State: `zustand`
- **Styling:** Tailwind CSS v4, Base UI (`@base-ui/react`), Shadcn UI, `clsx`, `tailwind-merge`
- **API Communication:** `axios` (with interceptors for auth and centralized error handling)
- **Forms & Validation:** Standard React forms mapped to Zod-validated APIs
- **Notifications:** `sonner` for toast notifications
- **Icons & Animation:** `lucide-react`, `tw-animate-css`
- **Testing Tools:** Configured for Jest / Playwright (depending on mono-repo setup)

## 3. Project Structure

```text
apps/frontend/
├── src/
│   ├── app/           # Next.js App Router pages (/, /login, /seller, /admin)
│   ├── components/    # Reusable UI components (buttons, layout, providers)
│   ├── hooks/         # Custom React hooks (e.g., useAuth, useDocuments)
│   ├── lib/           # Utility functions, axios configuration, message constants
│   ├── services/      # API communication layers separated by domain
│   └── types/         # TypeScript interfaces and type definitions
├── public/            # Static assets
├── .env.example       # Environment variables template
├── next.config.ts     # Next.js configuration
├── tailwind.config.js # Tailwind configuration (via postcss)
└── package.json       # Project dependencies and scripts
```

## 4. Setup Instructions

### Prerequisites

- Node.js (v20+)
- npm or pnpm or yarn
- Backend service running locally (for API requests)

### Installation

From the `apps/frontend` directory (or monorepo root):

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

Example `.env.local`:

```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:5001
```

### Running Locally (Development Mode)

```bash
npm run dev
```

The application will start on `http://localhost:5001`.

### Build Steps (Production)

```bash
npm run build
npm run start
```

## 5. Frontend Usage

### Pages Overview

- **`/` (Home):** Landing page, redirects based on auth state.
- **`/login`:** Secure authentication page. Generates demo credentials for easy testing.
- **`/seller`:** Seller dashboard. Contains the `UploadDropzone` to submit documents, and tracks real-time verification status (`pending`, `verified`, `rejected`, etc.).
- **`/admin`:** Admin review queue. Displays a list of documents requiring manual review (`inconclusive` state) and allows admins to `approve` or `deny`.

### State Flow

1. **Authentication:** JWT tokens are stored securely and attached to all outgoing API requests via an Axios interceptor.
2. **Data Fetching:** React Query handles fetching, caching, and background-updating server data (e.g., document queues).
3. **Local State:** Zustand manages UI toggles and lightweight global state without prop-drilling.

### How API is Consumed

API calls are centralized in the `src/services` folder. Axios handles request/response normalization, while centralized error handling maps standard HTTP errors into user-friendly `sonner` toast messages.

## 6. Scripts

- `npm run dev`: Starts the Next.js development server on port 5001.
- `npm run build`: Compiles the application for production.
- `npm run start`: Runs the production-compiled application.
- `npm run lint`: Runs ESLint for code formatting and quality checks.

## 7. Deployment Guide

### How to Deploy Frontend

The Next.js frontend is optimized for deployment on Vercel or any standard Node.js hosting environment (Render, AWS Amplify).

1. Connect your repository to Vercel (or similar).
2. Set the Root Directory to `apps/frontend`.
3. Set the Environment Variables (e.g., `NEXT_PUBLIC_API_URL`).
4. Click Deploy.

### Environment Differences

- **Local:** API points to `http://localhost:8000`.
- **Production:** API points to the deployed NestJS backend URL (e.g., `https://api.yourdomain.com`).

## 8. Notes / Best Practices

- **Architecture Decisions:** The App Router is used for modern server-side rendering and layouts. React Query handles async state to prevent race conditions and improve cache invalidation.
- **Scalability Considerations:** Shared components are built with Base UI/Shadcn to ensure visual consistency and allow easy customization as the app grows.
- **Security Notes:** No sensitive business logic resides in the frontend. All state transitions, token validations, and verification logic are strictly enforced by the backend.
