---
trigger: always_on
---

## A. Architecture Rules

- MUST structure the NestJS backend as discrete, bounded-context modules: `AuthModule`, `DocumentVerificationModule`, `AdminModule`, `NotificationModule`. No logic from one module may bleed into another's service layer.
- MUST NOT create a monolithic service file. Each module owns its own controller, service, repository, and DTOs.
- MUST register all cross-cutting concerns (JWT guard, rate limiter, request logger) as global NestJS middleware or global guards — never re-implement them inside individual modules.
- MUST use NestJS Dependency Injection for all service wiring. No `new ServiceClass()` instantiation inside controllers or other services.
- MUST expose a single `POST /verifications/callback` endpoint as the webhook receiver. This endpoint MUST be owned by `DocumentVerificationModule` and MUST NOT be duplicated in `AdminModule`.
- MUST keep the Mock Verification Service isolated as a separate NestJS module or standalone app. It MUST share zero domain code with the core verification module.
- MUST NOT allow `AdminModule` to import or directly invoke services from `DocumentVerificationModule`. Communication between modules MUST go through NestJS `EventEmitter2` events or shared interfaces.
- MUST apply NestJS `Pipes` with `class-validator` or Zod on every controller method that accepts a request body. No raw `req.body` access without validated DTO.
- MUST use a global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` to strip undeclared properties from every incoming payload.
- MUST configure `ThrottlerModule` globally for rate limiting. The upload presigned-URL endpoint MUST have its own stricter throttle decorator applied.
- SHOULD separate the `users` table role into an enum (`seller` | `admin`) enforced at both the database and DTO validation layers — never as a free-form string.
- MUST NOT implement seller account management, onboarding flows beyond document upload, or product listing logic. These are explicitly out of scope.

---

## B. Data Integrity Rules

- MUST wrap every state transition (`verification_records.status` UPDATE) and its corresponding `audit_events` INSERT inside a single PostgreSQL database transaction. If either operation fails, both MUST roll back.
- MUST increment `verification_records.version` on every UPDATE to that row. The increment MUST occur inside the same transaction as the status change.
- MUST perform all UPDATE queries on `verification_records` with an explicit `WHERE id = $id AND version = $currentVersion` clause. A result of zero rows affected MUST be treated as a concurrent modification conflict.
- MUST NOT allow any code path to update `verification_records.status` without simultaneously writing an `audit_events` row in the same transaction.
- MUST treat the `audit_events` table as append-only. No UPDATE or DELETE operations against `audit_events` are permitted under any circumstance.
- MUST store `audit_events.metadata` as JSONB. Each event type MUST have a documented shape in code comments, but MUST NOT be forced into a fixed relational schema.
- MUST record `actor_id`, `actor_role`, `from_status`, `to_status`, `event_type`, and `created_at` on every `audit_events` row. No nullable omissions for these fields.
- MUST index `verification_records.status` and `verification_records.seller_id` for query performance on the admin queue and seller status endpoints.
- MUST index `audit_events.record_id` to support efficient history lookups.
- MUST NOT use SQLite. PostgreSQL is non-negotiable for concurrent-write correctness and JSONB support.
- MUST configure PostgreSQL with connection pooling (e.g., via `pg` pool or PgBouncer). Worker and API processes MUST share a pool — never open unbounded connections.
- SHOULD use database-level enum enforcement for `verification_records.status` values (`pending`, `processing`, `verified`, `rejected`, `inconclusive`, `approved`, `denied`).
- MUST store `external_job_id` on `verification_records` as the correlation ID between the submitted job and the incoming webhook callback. This field MUST be unique-indexed.

---

## C. State Machine Rules

- MUST enforce the following and only the following valid state transitions:
  - `pending → processing` (BullMQ worker picks up job)
  - `processing → verified` (webhook: result = `verified`)
  - `processing → rejected` (webhook: result = `rejected`)
  - `processing → inconclusive` (webhook: result = `inconclusive`)
  - `processing → pending` (API error, retry count < max)
  - `processing → rejected` (API error, retry count = max)
  - `inconclusive → approved` (admin decision: approve)
  - `inconclusive → denied` (admin decision: deny)
- MUST treat `verified`, `rejected`, `approved`, and `denied` as terminal states. No code path may transition out of a terminal state.
- MUST implement all state transition logic inside a dedicated `StateMachineService` or equivalent guard layer — never inline inside a controller.
- MUST validate the following guard before `pending → processing`: the file referenced by `document_key` MUST exist in object storage. Orphaned records MUST NOT be dispatched to the external service.
- MUST validate the following guards before `processing → verified/rejected/inconclusive`:
  - Webhook HMAC signature is valid.
  - `external_job_id` from the webhook payload matches a known record.
  - The matched record is currently in `processing` state.
- MUST validate the following guards before `inconclusive → approved/denied`:
  - Requesting actor has role `admin`.
  - `locked_by = actor_id` OR `locked_by IS NULL` (expired lock).
  - `version` in the request matches the current `version` on the record.
- MUST NOT accept webhook result values outside `verified`, `rejected`, and `inconclusive`. Any other value MUST trigger a structured error and retry, not a silent state update.
- MUST NOT implement re-submission or appeal flows. `rejected` is a terminal state in the current scope.
- MUST NOT add new states (`escalated`, `pending_resubmission`, etc.) without a corresponding design decision. The defined state machine is exhaustive for this scope.

---

## D. File Handling Rules

- MUST implement document upload as a two-step flow: (1) backend generates and returns a presigned PUT URL; (2) browser uploads directly to object storage; (3) browser calls `POST /documents/confirm` with the storage key.
- MUST NOT route file bytes through the NestJS backend. No `multipart/form-data` file streaming in the backend for the upload path.
- MUST NOT accept base64-encoded file content in any JSON request body.
- MUST embed a `Content-Length-Range` condition in every generated presigned PUT URL, enforcing a maximum of 10 MB at the object storage level.
- MUST restrict accepted MIME types to `application/pdf`, `image/jpeg`, and `image/png`. The presigned URL conditions MUST enforce this at the storage level.
- MUST validate the stored object's `ContentLength` and content type metadata inside `POST /documents/confirm` by reading the object's metadata from storage — never trust the browser-provided Content-Type header.
- MUST issue a storage delete command and return HTTP 400 if `POST /documents/confirm` finds that the stored object violates size or MIME constraints.
- MUST NOT link a `VerificationRecord` to a `document_key` before `POST /documents/confirm` has successfully validated the stored object.
- MUST generate presigned PUT URLs with a short TTL (≤ 15 minutes). The TTL MUST be configurable via environment variable.
- MUST store only the storage key (not a full URL) in `verification_records.document_key`. Signed GET URLs are generated on demand by the backend.
- MUST NOT expose a backend endpoint that proxies or streams file content to the client. Document access MUST be via signed GET URLs only.
- MUST NOT implement document format parsing, OCR, or PDF content inspection. File type validation is limited to MIME type and size.

---

## E. Async & External Service Rules

- MUST use BullMQ for all async job processing. In-process queues, `setTimeout`, or raw `EventEmitter` MUST NOT be used as a substitute for durable job queuing.
- MUST configure Redis with AOF (Append-Only File) persistence. A Redis instance without persistence is rejected for production deployment.
- MUST assign `external_job_id` as the BullMQ job ID or embed it in the job data before dispatching. This ID MUST be stored on the `verification_records` row atomically with the `pending → processing` transition.
- MUST implement all BullMQ verification jobs as idempotent. A job re-enqueued with the same `external_job_id` MUST NOT produce duplicate `VerificationRecord` updates or duplicate `audit_events` rows.
- MUST configure BullMQ retry with exponential backoff for the verification worker: minimum 3 retries with delays of `30s → 2m → 10m → 30m → 1h`. Retry count and delays MUST be environment-configurable.
- MUST move jobs to BullMQ's failed queue after max retries are exhausted. MUST NOT silently discard failed jobs.
- MUST validate the webhook callback payload against a strict Zod schema before processing. A schema validation failure MUST throw a structured error and trigger BullMQ retry — MUST NOT silently move the record to `inconclusive`.
- MUST verify the HMAC signature on every inbound webhook request at `POST /verifications/callback` before any database read or write. Requests failing signature verification MUST return HTTP 401 immediately.
- MUST design the webhook callback handler as idempotent. A duplicate callback for the same `external_job_id` MUST be detected and acknowledged (HTTP 200) without re-applying the state transition.
- MUST catch `ECONNREFUSED` (and equivalent Redis connection errors) on BullMQ enqueue and return HTTP 503 to the caller with a user-facing message indicating temporary unavailability. MUST NOT silently accept the upload and lose the job.
- MUST provide a recovery script that re-enqueues all `verification_records` in `pending` state older than a configurable threshold. This script MUST be idempotent.
- MUST configure Bull Board (or equivalent BullMQ UI) in the deployment for operational visibility of queue depth, job state, and retry counts.
- MUST NOT implement the long-polling pattern (worker holds connection open awaiting provider result). The webhook callback model is the only permitted resolution mechanism.

---

## F. Admin Concurrency Rules

- MUST implement a soft lock on `verification_records` using `locked_by` (UUID FK to `users`) and `locked_at` (timestamp). Setting these fields MUST occur via `POST /admin/verifications/:id/claim`.
- MUST expire soft locks after 10 minutes of inactivity. Lock expiry MUST be checked at read time (`locked_at < NOW() - INTERVAL '10 minutes'`) — not via a DB trigger.
- MUST NOT allow an admin to submit a decision on a record where `locked_by` is set to a different admin's ID and the lock has not expired.
- MUST implement optimistic locking on every admin write operation (claim and decision). The UPDATE clause MUST include `WHERE id = $id AND version = $currentVersion`.
- MUST return HTTP 409 when an optimistic lock check produces zero rows affected. The response body MUST include a structured error indicating concurrent modification.
- MUST NOT return HTTP 500 for a concurrency conflict. HTTP 409 is the correct and only status for this scenario.
- MUST record `reviewed_by` (admin actor ID) on `verification_records` and in the corresponding `audit_event` when a decision is submitted.
- MUST NOT permit two admins to simultaneously hold a non-expired lock on the same record. The claim endpoint MUST enforce this atomically (single UPDATE wit
