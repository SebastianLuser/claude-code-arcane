---
name: rbac-abac
description: "Diseño e implementación de autorización en Educabot EdTech LatAm. Cubre RBAC (roles), ABAC (atributos/políticas), ReBAC (relaciones), multi-tenant scoping, ownership checks, Row-Level Security en Postgres, middleware Go (Gin) y TS (NestJS/Express), JWT claims, cache de permisos y auditoría. Usar cuando se mencione: autorización, permisos, roles, RBAC, ABAC, ReBAC, Casbin, OpenFGA, multi-tenant, RLS, guards, policies, can/cannot, access control."
argument-hint: "[rbac|abac|rebac|design]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# RBAC / ABAC / ReBAC — Autorización Educabot

## Cuándo usar esta skill

- Diseñar modelo de permisos para una app nueva (Alizia, Tich, TUNI, Vigía, etc.)
- Agregar un rol o permiso nuevo a un sistema existente
- Debuggear "¿por qué este usuario puede/no puede hacer X?"
- Revisar seguridad de endpoints (escalada de privilegios, cross-tenant leak)
- Migrar de RBAC simple a ABAC/ReBAC cuando el dominio lo exige
- Implementar RLS en Postgres como defensa en profundidad
- Definir claims de JWT y estrategia de cache de permisos

## Cuándo NO usar

- Autenticación (login, OAuth, password reset) → usar `auth-setup`
- Encriptación de datos en reposo / PII → otra skill
- Rate limiting / anti-abuso → otra skill
- Logging de acciones ya autorizadas → `audit-log`

---

## 1. Elegir el modelo correcto

### 1.1 RBAC — Role-Based Access Control
**Usuarios → Roles → Permisos.** Simple, suficiente para ~80% de casos Educabot.

- Roles típicos: `super_admin`, `tenant_admin`, `docente`, `tutor`, `alumno`, `api_client`
- Ventaja: fácil de entender, auditar y cachear
- Limite: no modela "este docente solo puede editar SUS cursos"

### 1.2 ABAC — Attribute-Based Access Control
Políticas sobre atributos de **sujeto + recurso + acción + contexto**.

Ejemplo de política:
> "docente puede editar calificación SI `curso.tenant_id == docente.tenant_id` AND `curso.id IN docente.cursos_asignados` AND `now() < fecha_cierre_trimestre`"

- Más potente, más complejo
- Implementación: **Casbin** (Go/TS) para políticas declarativas
- Usar cuando reglas dependen de contexto dinámico (fechas, estados, propiedades del recurso)

### 1.3 ReBAC — Relationship-Based Access Control
Modelo **Google Zanzibar**. Graph de relaciones: "user A es owner de doc X", "doc X está en folder Y compartido con grupo Z".

- Herramientas: **OpenFGA**, **SpiceDB**
- Overkill para Educabot default. Considerar solo si el producto pivota a colaboración tipo Google Docs / Notion

### 1.4 Default Educabot
**RBAC con scoping por tenant + ownership checks** (RBAC enriquecido). Si el dominio crece en complejidad de reglas → migrar a **ABAC con Casbin**. Si aparecen relaciones granulares de sharing → evaluar **OpenFGA**.

---

## 2. Schema de base de datos

```sql
-- Roles (globales o por tenant)
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  tenant_id   UUID NULL REFERENCES tenants(id), -- NULL = rol global (super_admin)
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, tenant_id)
);

-- Permisos como resource:action
CREATE TABLE permissions (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,   -- grade, student, course, ...
  action   TEXT NOT NULL,   -- read, write, delete, export
  UNIQUE (resource, action)
);

-- N:M roles ↔ permissions
CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Asignación usuario → rol, scopeada a tenant
-- Un mismo user puede tener roles distintos en tenants distintos
CREATE TABLE user_roles (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id   UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id, tenant_id)
);

CREATE INDEX idx_user_roles_user_tenant ON user_roles(user_id, tenant_id);
```

### 2.1 Permission naming convention
Formato: `resource:action` → `grade:read`, `grade:write`, `student:delete`, `report:export`.

**Evitar** roles como permisos (ver anti-patterns).

---

## 3. JWT claims

```json
{
  "sub": "user-uuid",
  "tenant_id": "tenant-uuid",
  "roles": ["docente"],
  "perms": ["grade:read", "grade:write", "student:read"],
  "exp": 1234567890,
  "iat": 1234567000
}
```

- `perms` embebido es **opcional**: acelera checks pero crece el token. Si >20 permisos, dejar fuera y resolver server-side con cache.
- TTL corto (15 min) + refresh token. Cambios de rol NO son efectivos hasta refresh (ver anti-patterns).

---

## 4. Middleware Go (Gin)

```go
// internal/middleware/authz.go
package middleware

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

type Claims struct {
	UserID   string   `json:"sub"`
	TenantID string   `json:"tenant_id"`
	Roles    []string `json:"roles"`
	Perms    []string `json:"perms"`
}

func RequirePermission(perm string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := c.MustGet("claims").(*Claims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "no claims"})
			return
		}
		for _, p := range claims.Perms {
			if p == perm {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden", "missing": perm})
	}
}

// RequireScope valida que el tenant del path/body coincida con el del JWT.
func RequireScope() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := c.MustGet("claims").(*Claims)
		pathTenant := c.Param("tenantID")
		if pathTenant != "" && pathTenant != claims.TenantID {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "cross-tenant denied"})
			return
		}
		c.Set("tenant_id", claims.TenantID)
		c.Next()
	}
}

// Uso en routes:
// r.PUT("/tenants/:tenantID/grades/:id",
//     middleware.RequireScope(),
//     middleware.RequirePermission("grade:write"),
//     handlers.UpdateGrade)
```

### 4.1 Ownership check en la capa de servicio

El middleware valida **"puede editar grades"**. El servicio valida **"puede editar ESTE grade"**.

```go
// internal/service/grade_service.go
func (s *GradeService) Update(ctx context.Context, userID, gradeID string, patch GradePatch) error {
	g, err := s.repo.FindByID(ctx, gradeID)
	if err != nil {
		return err
	}
	user := auth.UserFromCtx(ctx)

	// tenant_admin salta el ownership check
	isAdmin := slices.Contains(user.Roles, "tenant_admin")
	isOwner := g.DocenteID == userID

	if !isAdmin && !isOwner {
		return ErrForbidden
	}
	if g.TenantID != user.TenantID {
		return ErrForbidden // defense in depth
	}
	return s.repo.Update(ctx, gradeID, patch)
}
```

---

## 5. Middleware TypeScript (NestJS)

```ts
// src/authz/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...perms: string[]) => SetMetadata(PERMISSIONS_KEY, perms);
```

```ts
// src/authz/permissions.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // { sub, tenant_id, roles, perms }
    if (!user) throw new ForbiddenException('no auth');

    const pathTenant = req.params.tenantID;
    if (pathTenant && pathTenant !== user.tenant_id) {
      throw new ForbiddenException('cross-tenant denied');
    }

    const ok = required.every((p) => user.perms.includes(p));
    if (!ok) throw new ForbiddenException(`missing: ${required.join(',')}`);
    return true;
  }
}
```

```ts
// Uso en controller
@Controller('tenants/:tenantID/grades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GradesController {
  @Put(':id')
  @Permissions('grade:write')
  async update(@Param('id') id: string, @Body() dto: UpdateGradeDto, @Req() req) {
    return this.service.update(req.user.sub, id, dto);
  }
}
```

---

## 6. Row-Level Security (Postgres) — defensa en profundidad

Aún con middleware correcto, un bug de query (`WHERE` olvidado) puede filtrar datos cross-tenant. RLS lo bloquea a nivel DB.

```sql
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY grades_tenant_isolation ON grades
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY grades_super_admin_bypass ON grades
  USING (current_setting('app.role', true) = 'super_admin');
```

En Go, setear el GUC al checkout del pool:

```go
func (r *Repo) WithTenant(ctx context.Context, tenantID string, fn func(tx *gorm.DB) error) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("SET LOCAL app.tenant_id = ?", tenantID).Error; err != nil {
			return err
		}
		return fn(tx)
	})
}
```

---

## 7. Frontend (React) — UX, nunca seguridad

**Regla:** el backend valida siempre. El frontend oculta/muestra por UX.

```tsx
// hooks/usePermissions.ts
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();
  const has = (perm: string) => user?.perms.includes(perm) ?? false;
  const hasAny = (...perms: string[]) => perms.some(has);
  const hasAll = (...perms: string[]) => perms.every(has);
  return { has, hasAny, hasAll };
}

// Uso
function GradeRow({ grade }) {
  const { has } = usePermissions();
  return (
    <tr>
      <td>{grade.score}</td>
      <td>{has('grade:write') && <EditButton id={grade.id} />}</td>
    </tr>
  );
}
```

---

## 8. Cache de permisos

- **Redis**, key `perms:{user_id}:{tenant_id}`, TTL 5 min
- Invalidar en: cambio de rol, revoke, cambio de membership
- En alta concurrencia, cache local (in-process) con TTL 30s + Redis

```go
func (s *AuthzService) GetPerms(ctx context.Context, userID, tenantID string) ([]string, error) {
	key := fmt.Sprintf("perms:%s:%s", userID, tenantID)
	if cached, err := s.redis.Get(ctx, key).Result(); err == nil {
		return strings.Split(cached, ","), nil
	}
	perms, err := s.repo.LoadPerms(ctx, userID, tenantID)
	if err != nil { return nil, err }
	s.redis.Set(ctx, key, strings.Join(perms, ","), 5*time.Minute)
	return perms, nil
}
```

---

## 9. Audit

Cada cambio de rol / asignación / revoke → evento a `audit-log` skill:

```json
{
  "event": "role.granted",
  "actor_id": "admin-uuid",
  "target_user_id": "user-uuid",
  "role": "docente",
  "tenant_id": "tenant-uuid",
  "reason": "contratación nuevo docente",
  "at": "2026-04-15T10:30:00Z"
}
```

---

## 10. Casos especiales

### 10.1 Super admin (break-glass)
- Acceso global `super_admin` → logging intenso, alerta a Slack en cada uso
- Considerar **aprobación dual** (4-eyes) para acciones destructivas
- NUNCA usar super_admin para operaciones de rutina

### 10.2 Menores de edad
- Regulación LatAm: no pueden consentir compartir datos con terceros
- Policy explícita: `action == "share_external" AND subject.age < 18 → DENY`
- Marcar en schema `users.is_minor BOOLEAN` y evaluar en policy engine

### 10.3 API clients (machine-to-machine)
- Rol `api_client` con permisos mínimos por integración
- Scopes por cliente (similar a OAuth scopes)
- Rotación de credenciales obligatoria

---

## 11. Testing — matriz rol × acción

```go
func TestGradeAuthzMatrix(t *testing.T) {
	cases := []struct {
		role   string
		action string
		want   bool
	}{
		{"super_admin",  "grade:write",  true},
		{"tenant_admin", "grade:write",  true},
		{"docente",      "grade:write",  true},  // si es owner
		{"docente",      "grade:delete", false},
		{"tutor",        "grade:read",   true},  // solo hijo
		{"tutor",        "grade:write",  false},
		{"alumno",       "grade:read",   true},  // solo propias
		{"alumno",       "grade:write",  false},
	}
	for _, c := range cases {
		t.Run(c.role+"_"+c.action, func(t *testing.T) {
			got := authz.Check(c.role, c.action)
			assert.Equal(t, c.want, got)
		})
	}
}
```

Cubrir también: cross-tenant, sin token, token expirado, rol revocado, ownership negativo.

---

## Anti-patterns

- ❌ **Roles embebidos en JWT sin refresh corto** → usuario degradado conserva acceso hasta expiry
- ❌ **Check solo en frontend** → `curl` salta toda la seguridad
- ❌ **Permisos por string-matching frágil** (`if role.includes("admin")`) → `super_admin`, `tenant_admin` matchean ambos
- ❌ **Rol "super" con bypass sin audit** → abuso invisible
- ❌ **Sin tenant scoping** → cross-tenant data leak, violación LGPD/LatAm
- ❌ **Permisos hardcoded en código** en vez de tabla → cada cambio requiere deploy
- ❌ **Roles como permisos** (`can_edit_grades` como rol en vez de permission `grade:write`)
- ❌ **Ownership checkeado solo en middleware** → middleware valida "puede editar grades" pero no "este grade"
- ❌ **RLS sin setear `app.tenant_id`** → policy bloquea todo o nada
- ❌ **Cache de permisos sin invalidación** en cambio de rol → window de acceso indebido
- ❌ **JWT sin `tenant_id`** → imposible scopear multi-tenant correctamente

---

## Checklist de implementación

- [ ] Schema `roles / permissions / role_permissions / user_roles` creado con índices
- [ ] Permisos nombrados `resource:action` (no roles como permisos)
- [ ] JWT incluye `sub`, `tenant_id`, `roles`, (opcional `perms`), TTL ≤ 15min
- [ ] Refresh token implementado
- [ ] Middleware `RequirePermission` + `RequireScope` en cada endpoint protegido
- [ ] Ownership check en capa de servicio para recursos propios
- [ ] RLS habilitado en tablas con `tenant_id` + GUC seteado en checkout
- [ ] `usePermissions()` hook en frontend (solo UX)
- [ ] Cache Redis de permisos con TTL 5min e invalidación en cambio de rol
- [ ] Audit-log en cada grant/revoke
- [ ] Super admin con logging intenso y alerta
- [ ] Tests de matriz rol × acción (allow/deny) + cross-tenant
- [ ] Política explícita para menores (no sharing externo)
- [ ] Documentado en `/doc-rfc` si es un cambio de diseño

---

## Output ✅

Al terminar, entregar:

- ✅ Migrations SQL del schema de autz
- ✅ Seed de roles y permisos default Educabot
- ✅ Middleware Go y/o TS listo para usar
- ✅ Policies RLS para tablas con `tenant_id`
- ✅ Hook frontend `usePermissions`
- ✅ Test suite con matriz rol × acción
- ✅ Tabla markdown de roles × permisos como referencia
- ✅ Nota de decisión: RBAC / RBAC+scope / ABAC con Casbin / ReBAC con OpenFGA

---

## Delegación a otras skills

- **`/auth-setup`** → login, OAuth, password reset, MFA (pre-requisito de esta skill)
- **`/audit-log`** → eventos de grant/revoke, acceso super_admin
- **`/api-design`** → diseño de endpoints scopeados por tenant
- **`/doc-rfc`** → documentar decisión de modelo (RBAC vs ABAC vs ReBAC)
- **`/check`** → escaneo de endpoints sin middleware de autz
- **`/audit-dev`** → auditoría integral de seguridad del proyecto
- **`/scaffold-go`** / **`/scaffold-unity`** → incluir boilerplate de autz en proyectos nuevos
