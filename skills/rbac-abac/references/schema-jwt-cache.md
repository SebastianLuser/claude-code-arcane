# Schema, JWT & Cache Details - RBAC / ABAC

## Schema DB

- `roles(id, name, tenant_id NULL, description)` — NULL tenant_id = global
- `permissions(id, resource, action)` — naming `resource:action` (e.g. `grade:write`)
- `role_permissions(role_id, permission_id)` — N:M
- `user_roles(user_id, role_id, tenant_id, granted_by, granted_at)` — scoped to a tenant

## JWT Claims

```json
{"sub":"user-uuid", "tenant_id":"...", "roles":["teacher"], "perms":["grade:read","grade:write"], "exp":...}
```

- `perms` optionally embedded (speeds up checks but grows the token). If >20 permissions -> resolve server-side with a cache
- Short TTL (15min) + refresh token. Role changes take effect on refresh

## Permission Cache

- Redis key `perms:{user_id}:{tenant_id}`, TTL 5min
- Invalidate on: role change, revoke, membership change
- High concurrency: local cache with 30s TTL + Redis

## Audit

Every grant/revoke -> event to the audit log: `{event, actor_id, target_user_id, role, tenant_id, reason, at}`
