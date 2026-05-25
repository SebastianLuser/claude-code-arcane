---
name: audit-log
description: "Immutable audit log design: event schema, storage, retention, PII redaction, compliance, query patterns."
category: "operations"
argument-hint: "[design|implement] [service-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# Audit Log — Immutable Action Registry

Append-only record of sensitive actions for legal, forensic, and compliance purposes.
NOT operational logging (use structured logs/observability for that).

## When to Audit

- **Auth:** login, logout, login_failed, MFA challenge
- **Permissions:** role_change, impersonate_start/stop
- **Sensitive CRUD:** user data, grades, enrollments
- **Data exports:** DSAR requests, bulk exports
- **Config/integrations:** tenant settings, enable/disable
- **Deletion:** user delete, record purge

## Event Schema

Core fields: `id` (UUID, never auto-increment), `ts` (TIMESTAMPTZ), `tenant_id`, `actor_type` (user/system/api/service), `actor_id`, `action` (enum), `target_type`, `target_id`, `before`/`after` (JSONB, PII-redacted), `ip`, `user_agent`, `request_id` (log correlation), `result` (success/denied/error), `metadata` (JSONB). Optional tamper-evidence: `prev_hash`, `hash`.

## Storage Decisions

- **Where:** Same PostgreSQL, partitioned by month. Indexes on (tenant_id, ts), (tenant_id, actor_id, ts), (tenant_id, action, ts), (tenant_id, target_type, target_id, ts)
- **Immutability:** REVOKE UPDATE/DELETE from app role + defensive trigger
- **Write pattern:** Transactional outbox — insert in same tx as business op, worker moves to audit table. Avoids fire-and-forget losing events if tx commits but queue push fails

## Retention: Hot (PostgreSQL, 0-3 mo) → Warm (BigQuery/S3 Parquet, 3-12 mo) → Cold (Glacier/Archive, 1-5 yr) → Purge (>5 yr, auto-delete + audit the purge). Monthly job drops partitions after warm export.

## Query Patterns

- `GET /admin/audit` with RBAC (admin, security, legal only)
- Required: tenant_id filter (never trust frontend). Optional: actor_id, action, target, date range, result
- Cursor pagination on `(ts, id)` DESC — never OFFSET
- CSV export rate-limited; export action is itself audited

## PII Redaction

**Never persist:** password, tokens, api_key, secrets, auth headers, cookies, sessions, full national ID, minor's email/phone, biometric data.
**Allowed:** last 4 digits of ID, SHA256 of email, internal IDs.
Replace sensitive fields with `"***REDACTED***"` preserving the key.

## Compliance

- **GDPR/LGPD erasure vs retention:** audit records exempt under legitimate interest, but redact PII — keep action record, remove identifying details
- **Minor data (LATAM):** access to minor data is a critical auditable event
- **Tamper-evidence:** hash chain per tenant only if legal requirement exists (adds write contention)

## Anti-patterns

- Mixing audit with operational logs (different SLAs, sensitivity, retention)
- Allowing UPDATE/DELETE on audit table from app role
- Logging passwords, tokens, or minor PII in cleartext
- Missing tenant_id (cross-tenant leak = critical incident)
- Synchronous audit blocking requests without outbox
- No retention policy (unbounded cost + legal risk)
- Exposing query endpoint without RBAC
- No alert when write rate drops to zero (forensic blindness)

## Checklist

- [ ] Partitioned audit table with tenant-scoped indexes
- [ ] REVOKE UPDATE/DELETE + defensive trigger
- [ ] Transactional outbox pattern
- [ ] Middleware captures context automatically (IP, UA, request_id, actor, tenant)
- [ ] PII redactor with deny-list
- [ ] Action catalog documented
- [ ] Admin endpoint with RBAC, filters, cursor pagination
- [ ] Archival job (hot → warm → cold)
- [ ] Alert on zero write rate
