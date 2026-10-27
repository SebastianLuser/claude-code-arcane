# Checklist - RBAC / ABAC

- [ ] roles/permissions/role_permissions/user_roles schema with indexes
- [ ] `resource:action` permissions
- [ ] JWT: sub, tenant_id, roles, TTL <=15min + refresh
- [ ] RequirePermission + RequireScope middleware on every endpoint
- [ ] Ownership check in the service layer
- [ ] RLS on tables with tenant_id + GUC set
- [ ] Frontend `usePermissions()` for UX only
- [ ] Redis cache TTL 5min + invalidation on role change
- [ ] Audit log on every grant/revoke
- [ ] Role x action matrix tests + cross-tenant
- [ ] Explicit policy for minors
