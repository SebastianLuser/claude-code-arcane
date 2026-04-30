---
name: rbac-abac
description: "Autorización Educabot EdTech LatAm: RBAC, ABAC, ReBAC, multi-tenant, ownership checks, RLS Postgres, middleware Go/TS, JWT claims, cache permisos, auditoría."
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
# RBAC / ABAC / ReBAC — Autorización Educabot

**Default:** RBAC con scoping por tenant + ownership checks. Si reglas crecen → ABAC con Casbin. Si sharing granular → evaluar OpenFGA.

## Model Decision

| Modelo | Cuándo | Herramienta |
|--------|--------|-------------|
| **RBAC** | 80% de casos, roles estáticos | Tabla roles/permissions |
| **ABAC** | Reglas con contexto dinámico (fechas, estados, props) | Casbin (Go/TS) |
| **ReBAC** | Sharing granular tipo Google Docs | OpenFGA, SpiceDB |

Roles típicos: `super_admin`, `tenant_admin`, `docente`, `tutor`, `alumno`, `api_client`

## Schema, JWT & Cache

Tables: `roles`, `permissions` (`resource:action`), `role_permissions` (N:M), `user_roles` (scoped a tenant). JWT: sub + tenant_id + roles + perms (optional) + TTL 15min. Cache: Redis `perms:{user_id}:{tenant_id}` TTL 5min.

> → Read references/schema-jwt-cache.md for full schema definitions, JWT structure, cache config, and audit format

## Middleware Pattern

1. **RequirePermission(perm)** — verifica perm en claims/cache
2. **RequireScope** — valida `tenant_id` del path coincide con JWT (cross-tenant denied)
3. **Ownership check** en capa de servicio — middleware valida "puede editar grades", servicio valida "puede editar ESTE grade"

## Row-Level Security (Postgres)

Defensa en profundidad — bug de query sin WHERE no filtra datos cross-tenant:

- `ENABLE ROW LEVEL SECURITY` en tablas con `tenant_id`
- Policy: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`
- Setear GUC en cada transaction: `SET LOCAL app.tenant_id = ?`
- Super admin bypass policy

## Casos Especiales

| Caso | Tratamiento |
|------|-------------|
| Super admin (break-glass) | Logging intenso, alerta Slack, aprobación dual para destructivas |
| Menores (<12-13) | Policy: deny `share_external` si `is_minor`. LatAm compliance |
| API clients (M2M) | Rol `api_client`, scopes mínimos, rotación credenciales |

## Testing

- Matriz rol × acción (allow/deny) para cada recurso
- Cubrir: cross-tenant, sin token, token expirado, rol revocado, ownership negativo

## Anti-patterns

> → Read references/anti-patterns.md for 10 authorization anti-patterns with corrections

## Checklist

> → Read references/checklist.md for 11-item implementation checklist
