---
name: rbac-abac
description: "Autorización Educabot EdTech LatAm: RBAC, ABAC, ReBAC, multi-tenant, ownership checks, RLS Postgres, middleware Go/TS, JWT claims, cache permisos, auditoría."
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

## Schema DB

- `roles(id, name, tenant_id NULL, description)` — NULL tenant_id = global
- `permissions(id, resource, action)` — naming `resource:action` (e.g. `grade:write`)
- `role_permissions(role_id, permission_id)` — N:M
- `user_roles(user_id, role_id, tenant_id, granted_by, granted_at)` — scoped a tenant

## JWT Claims

```json
{"sub":"user-uuid", "tenant_id":"...", "roles":["docente"], "perms":["grade:read","grade:write"], "exp":...}
```

- `perms` embebido opcional (acelera checks pero crece token). Si >20 permisos → resolver server-side con cache
- TTL corto (15min) + refresh token. Cambios de rol efectivos en refresh

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

## Frontend (React)

`usePermissions()` hook: `has(perm)`, `hasAny(...)`, `hasAll(...)`. **Solo UX, nunca seguridad.** Backend valida siempre.

## Cache de Permisos

- Redis key `perms:{user_id}:{tenant_id}`, TTL 5min
- Invalidar en: cambio de rol, revoke, cambio membership
- Alta concurrencia: cache local TTL 30s + Redis

## Audit

Cada grant/revoke → evento a audit-log: `{event, actor_id, target_user_id, role, tenant_id, reason, at}`

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

| # | ❌ No hacer | ✅ Hacer en cambio |
|---|------------|-------------------|
| 1 | Check de permisos solo en frontend | Backend valida siempre; frontend es UX solamente |
| 2 | `role.includes("admin")` match parcial | Comparación exacta: `role === "tenant_admin"` |
| 3 | Super admin sin audit log | Logging intenso + alerta + aprobación dual para ops destructivas |
| 4 | Sin tenant scoping en endpoints | `RequireScope` middleware en cada ruta con recursos de tenant |
| 5 | Permisos hardcodeados en código | Tabla `permissions` en DB, configurable sin deploy |
| 6 | Roles como permisos (`can_edit_grades` como rol) | Naming `resource:action` — roles agrupan permisos, no son permisos |
| 7 | Ownership check en middleware (sin contexto) | Ownership siempre en capa de servicio donde hay contexto de negocio |
| 8 | RLS habilitado sin setear GUC | `SET LOCAL app.tenant_id = ?` en cada transaction |
| 9 | Cache de permisos sin invalidación | Invalidar Redis key en cambio de rol, revoke o cambio de membership |
| 10 | JWT sin `tenant_id` en claims | `tenant_id` obligatorio en claims; validar en middleware |

## Checklist

- [ ] Schema roles/permissions/role_permissions/user_roles con índices
- [ ] Permisos `resource:action`
- [ ] JWT: sub, tenant_id, roles, TTL ≤15min + refresh
- [ ] Middleware RequirePermission + RequireScope en cada endpoint
- [ ] Ownership check en capa de servicio
- [ ] RLS en tablas con tenant_id + GUC seteado
- [ ] Frontend `usePermissions()` solo UX
- [ ] Cache Redis TTL 5min + invalidación en cambio de rol
- [ ] Audit-log en cada grant/revoke
- [ ] Tests matriz rol × acción + cross-tenant
- [ ] Política explícita menores
