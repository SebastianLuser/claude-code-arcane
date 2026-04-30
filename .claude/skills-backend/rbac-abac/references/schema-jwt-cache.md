# Schema, JWT & Cache Details - RBAC / ABAC

## Schema DB

- `roles(id, name, tenant_id NULL, description)` — NULL tenant_id = global
- `permissions(id, resource, action)` — naming `resource:action` (e.g. `grade:write`)
- `role_permissions(role_id, permission_id)` — N:M
- `user_roles(user_id, role_id, tenant_id, granted_by, granted_at)` — scoped a tenant

## JWT Claims

```json
{"sub":"user-uuid", "tenant_id":"...", "roles":["docente"], "perms":["grade:read","grade:write"], "exp":...}
```

- `perms` embebido opcional (acelera checks pero crece token). Si >20 permisos -> resolver server-side con cache
- TTL corto (15min) + refresh token. Cambios de rol efectivos en refresh

## Cache de Permisos

- Redis key `perms:{user_id}:{tenant_id}`, TTL 5min
- Invalidar en: cambio de rol, revoke, cambio membership
- Alta concurrencia: cache local TTL 30s + Redis

## Audit

Cada grant/revoke -> evento a audit-log: `{event, actor_id, target_user_id, role, tenant_id, reason, at}`
