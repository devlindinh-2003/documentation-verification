---
description: Creating the env example (Backend, Frontend, Mobile)
---

You are a senior software engineer performing environment configuration extraction.

## Scope

- Analyze the provided project (backend, frontend, or mobile)
- Scan ALL files for environment variable usage

## Detection Rules

You MUST detect environment variables from:

- process.env.\*
- import.meta.env.\*
- config services (e.g. @nestjs/config)
- dotenv usage
- hardcoded fallback patterns (e.g. process.env.X || 'default')
- SDK configs (JWT, Redis, DB, S3/MinIO, API keys)

## Tasks

1. Extract ALL environment variables used in the codebase
2. Normalize names (UPPERCASE_WITH_UNDERSCORES)
3. Group variables by domain:
   - App
   - Database
   - Auth
   - Queue (Redis / BullMQ)
   - Storage (S3 / MinIO)
   - External Services
   - Frontend/Public
4. Infer safe default placeholders (DO NOT use real secrets)

## Output Requirements

Generate a `.env.example` file with:

- Clear grouping via comments
- No real secrets
- Safe placeholders only
- Include ALL required variables (no missing ones)

## Format

Example:

# ========================

# App

# ========================

NODE_ENV=development
PORT=3000

# ========================

# Database

# ========================

DATABASE_URL=postgresql://user:password@localhost:5432/db_name

# ========================

# Auth

# ========================

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h

## Constraints

- MUST NOT miss any env variable used in code
- MUST NOT include unused variables
- MUST NOT leak sensitive real values
- MUST infer variables even if indirectly used via config services

## Bonus (IMPORTANT)

Also output a short section:

### Missing Env Safety Check

- List variables that:
  - are used but not validated
  - have unsafe fallbacks (e.g. || 'secret')
- Suggest which ones MUST be validated at startup

## Output Structure

1. `.env.example` file
2. "Missing Env Safety Check" section
