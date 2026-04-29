# Checklist - RBAC / ABAC

- [ ] Schema roles/permissions/role_permissions/user_roles con indices
- [ ] Permisos `resource:action`
- [ ] JWT: sub, tenant_id, roles, TTL <=15min + refresh
- [ ] Middleware RequirePermission + RequireScope en cada endpoint
- [ ] Ownership check en capa de servicio
- [ ] RLS en tablas con tenant_id + GUC seteado
- [ ] Frontend `usePermissions()` solo UX
- [ ] Cache Redis TTL 5min + invalidacion en cambio de rol
- [ ] Audit-log en cada grant/revoke
- [ ] Tests matriz rol x accion + cross-tenant
- [ ] Politica explicita menores
