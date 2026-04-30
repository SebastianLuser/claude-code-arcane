# Anti-patterns - RBAC / ABAC

| # | No hacer | Hacer en cambio |
|---|----------|-----------------|
| 1 | Check de permisos solo en frontend | Backend valida siempre; frontend es UX solamente |
| 2 | `role.includes("admin")` match parcial | Comparacion exacta: `role === "tenant_admin"` |
| 3 | Super admin sin audit log | Logging intenso + alerta + aprobacion dual para ops destructivas |
| 4 | Sin tenant scoping en endpoints | `RequireScope` middleware en cada ruta con recursos de tenant |
| 5 | Permisos hardcodeados en codigo | Tabla `permissions` en DB, configurable sin deploy |
| 6 | Roles como permisos (`can_edit_grades` como rol) | Naming `resource:action` — roles agrupan permisos, no son permisos |
| 7 | Ownership check en middleware (sin contexto) | Ownership siempre en capa de servicio donde hay contexto de negocio |
| 8 | RLS habilitado sin setear GUC | `SET LOCAL app.tenant_id = ?` en cada transaction |
| 9 | Cache de permisos sin invalidacion | Invalidar Redis key en cambio de rol, revoke o cambio de membership |
| 10 | JWT sin `tenant_id` en claims | `tenant_id` obligatorio en claims; validar en middleware |
