---
description: Use optional chaining for falsy values
---

# 🧠 AI Workflows: Null Safety & Object Handling

This document defines strict rules for handling objects, API responses, and state to prevent runtime errors such as:

- Cannot read property 'x' of undefined
- Cannot destructure property of undefined
- null reference errors

These rules MUST be followed in all frontend and backend implementations.

---

# 🎯 CORE PRINCIPLE

> NEVER TRUST DATA

All external data (API, user input, database) must be treated as:

- nullable
- incomplete
- inconsistent

---

# 📦 OBJECT ACCESS RULES

## 1. ALWAYS USE OPTIONAL CHAINING

❌ BAD:

```ts
user.profile.name;
```
