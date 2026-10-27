# Anti-patterns - RBAC / ABAC

| # | Don't | Do instead |
|---|----------|-----------------|
| 1 | Permission checks only in the frontend | The backend always validates; the frontend is UX only |
| 2 | `role.includes("admin")` partial match | Exact comparison: `role === "tenant_admin"` |
| 3 | Super admin without an audit log | Heavy logging + alert + dual approval for destructive ops |
| 4 | No tenant scoping on endpoints | `RequireScope` middleware on every route with tenant resources |
| 5 | Permissions hardcoded in code | `permissions` table in the DB, configurable without a deploy |
| 6 | Roles as permissions (`can_edit_grades` as a role) | `resource:action` naming — roles group permissions, they are not permissions |
| 7 | Ownership check in middleware (no context) | Ownership always in the service layer, where there is business context |
| 8 | RLS enabled without setting the GUC | `SET LOCAL app.tenant_id = ?` in every transaction |
| 9 | Permission cache without invalidation | Invalidate the Redis key on role change, revoke or membership change |
| 10 | JWT without `tenant_id` in the claims | `tenant_id` mandatory in the claims; validate it in middleware |
