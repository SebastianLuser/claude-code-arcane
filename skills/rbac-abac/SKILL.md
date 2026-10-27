---
name: rbac-abac
description: "Authorization for Educabot EdTech LatAm: RBAC, ABAC, ReBAC, multi-tenant, ownership checks, Postgres RLS, Go/TS middleware, JWT claims, permission cache, auditing."
category: "security"
argument-hint: "[rbac|abac|rebac|design]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
metadata:
  category: security
  sources:
    - NIST SP 800-162 (Guide to Attribute Based Access Control)
    - OWASP Authorization Cheat Sheet
    - OpenFGA documentation (openfga.dev)
    - Casbin documentation (casbin.org)
---
# RBAC / ABAC / ReBAC — Educabot Authorization

**Default:** RBAC with per-tenant scoping + ownership checks. If the rules grow → ABAC with Casbin. If granular sharing is needed → evaluate OpenFGA.

## Model Decision

| Model | When | Tool |
|--------|--------|-------------|
| **RBAC** | 80% of cases, static roles | roles/permissions table |
| **ABAC** | Rules with dynamic context (dates, states, props) | Casbin (Go/TS) |
| **ReBAC** | Granular Google Docs-style sharing | OpenFGA, SpiceDB |

Typical roles: `super_admin`, `tenant_admin`, `teacher`, `tutor`, `student`, `api_client`

## Schema, JWT & Cache

Tables: `roles`, `permissions` (`resource:action`), `role_permissions` (N:M), `user_roles` (scoped to a tenant). JWT: sub + tenant_id + roles + perms (optional) + TTL 15min. Cache: Redis `perms:{user_id}:{tenant_id}` TTL 5min.

> → Read references/schema-jwt-cache.md for full schema definitions, JWT structure, cache config, and audit format

## Middleware Pattern

1. **RequirePermission(perm)** — checks the perm in claims/cache
2. **RequireScope** — validates that the path's `tenant_id` matches the JWT (cross-tenant denied)
3. **Ownership check** in the service layer — middleware validates "can edit grades", the service validates "can edit THIS grade"

## Row-Level Security (Postgres)

Defense in depth — a query bug without WHERE does not leak cross-tenant data:

- `ENABLE ROW LEVEL SECURITY` on tables with `tenant_id`
- Policy: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`
- Set the GUC in every transaction: `SET LOCAL app.tenant_id = ?`
- Super admin bypass policy

## Special Cases

| Case | Handling |
|------|-------------|
| Super admin (break-glass) | Heavy logging, Slack alert, dual approval for destructive operations |
| Minors (<12-13) | Policy: deny `share_external` if `is_minor`. LatAm compliance |
| API clients (M2M) | `api_client` role, minimal scopes, credential rotation |

## Testing

- Role × action matrix (allow/deny) for every resource
- Cover: cross-tenant, no token, expired token, revoked role, negative ownership

## Anti-patterns

> → Read references/anti-patterns.md for 10 authorization anti-patterns with corrections

## Checklist

> → Read references/checklist.md for 11-item implementation checklist
