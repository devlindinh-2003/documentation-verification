---
description: Review the directory
---

# 🧠 AI Workflow: Code Audit & Type Safety (TypeScript)

This workflow defines how the AI agent must re-scan, validate, and fix code quality issues across the project.

---

# 🎯 GOAL

- Detect and fix TypeScript errors
- Eliminate unsafe patterns
- Improve code quality to production standard
- Ensure consistency across the codebase

---

# 🔁 WORKFLOW STEPS

## STEP 1: Scan the Entire Codebase

- Traverse all files inside:
  - /apps/frontend
  - /apps/backend

- Focus on:
  - TypeScript files (.ts, .tsx)
  - API services
  - Hooks
  - Components

---

## STEP 2: Detect Issues

The agent MUST identify:

### 🔴 TypeScript Issues

- `any` usage without justification
- Type mismatch
- Missing types
- Unsafe type assertions (`as any`)
- Incorrect generics

---

### 🔴 Runtime Risk Issues

- Possible null/undefined access
- Unsafe destructuring
- Missing optional chaining

---

### 🔴 Architecture Issues

- Duplicate logic
- Inconsistent naming
- Incorrect separation of concerns

---

## STEP 3: Fix Type Issues (STRICT RULES)

### 1. Replace `any`

❌ BAD:

```ts
const data: any = response.data;
