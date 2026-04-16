---
name: audit-log
description: Diseño e implementación de audit log inmutable con valor legal/forense para apps Educabot (Go + TS). Registro append-only de acciones sensibles (quién, qué, cuándo, desde dónde, resultado) con retención multi-año, redacción PII, consulta admin y opcional tamper-evidence. Usar cuando se mencione audit log, auditoría de acciones, trazabilidad, compliance, forensic log, registro de accesos, quién cambió qué, DSAR, LGPD/LOPDGDD menores.
---

# Audit Log — Skill

Registro inmutable de acciones con valor legal y forense. No confundir con `logging-setup` (observabilidad operacional).

## Cuándo usar
- Compliance LATAM (LGPD BR, Ley 25.326 AR, LFPDPPP MX, protección de menores).
- Trazabilidad de acciones sensibles: login, cambio de rol, acceso a datos de alumnos, export DSAR, cambio de calificaciones, borrado de usuario.
- Investigación forense post-incidente (quién tocó qué y cuándo).
- Requerimiento legal/contractual de retención ≥1 año (default Educabot: 5 años).

## Cuándo NO usar
- Logging operacional/debug → `logging-setup` (stdout, structured logs, Loki/Datadog).
- Métricas de negocio → analytics (BigQuery, Mixpanel).
- Event sourcing de dominio → event store dedicado (no es lo mismo que audit).

---

## 1. Diferencia con logging operacional

| Aspecto | Logging (logging-setup) | Audit Log (este skill) |
|---|---|---|
| Propósito | Debug, observabilidad | Legal, forense, compliance |
| Mutabilidad | Rotable, borrable | Append-only, inmutable |
| Retención | 7-30 días | ≥1 año (Educabot: 5 años) |
| Consulta | Dev/SRE (Grafana) | Admin/Legal (endpoint UI) |
| Storage | Loki/ELK | PostgreSQL + archivo frío |
| PII | Evitar | Redactada pero estructurada |

---

## 2. Schema PostgreSQL

```sql
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts           TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id    UUID NOT NULL,
  actor_type   TEXT NOT NULL CHECK (actor_type IN ('user','system','api','service')),
  actor_id     TEXT,
  action       TEXT NOT NULL,            -- login, update_grade, delete_user, export_dsar, role_change, ...
  target_type  TEXT,                     -- user, grade, course, ...
  target_id    TEXT,
  before       JSONB,
  after        JSONB,
  ip           INET,
  user_agent   TEXT,
  request_id   TEXT,                     -- correlación con logs operacionales
  result       TEXT NOT NULL CHECK (result IN ('success','denied','error')),
  metadata     JSONB,
  prev_hash    TEXT,                     -- opcional, tamper-evidence
  hash         TEXT                      -- opcional, sha256(prev_hash||row)
) PARTITION BY RANGE (ts);

CREATE INDEX ON audit_logs (tenant_id, ts DESC);
CREATE INDEX ON audit_logs (tenant_id, actor_id, ts DESC);
CREATE INDEX ON audit_logs (tenant_id, action, ts DESC);
CREATE INDEX ON audit_logs (tenant_id, target_type, target_id, ts DESC);
```

Particionado mensual (performance + archivado selectivo):
```sql
CREATE TABLE audit_logs_2026_04 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
```

---

## 3. Append-only (inmutabilidad)

Revocar UPDATE/DELETE al rol de aplicación; solo INSERT:
```sql
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM app_rw;
GRANT INSERT, SELECT ON audit_logs TO app_rw;
```

Trigger defensivo adicional:
```sql
CREATE FUNCTION audit_no_mutate() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_update BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_no_mutate();
```

---

## 4. Escritura async con transactional outbox

Para no bloquear la transacción principal pero garantizar durabilidad:

1. En la misma tx del negocio, INSERT en tabla `audit_outbox`.
2. Worker lee `audit_outbox` y escribe en `audit_logs` + marca procesado.
3. Si el worker cae, al reiniciar retoma pendientes (at-least-once).

Evita fire-and-forget a cola externa: si la tx commitea y el push falla, se pierde el evento.

---

## 5. Middleware Go (Gin)

```go
func AuditMiddleware(svc audit.Service) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        if action, ok := c.Get("audit_action"); ok {
            svc.Record(c.Request.Context(), audit.Entry{
                TenantID:   tenantFromCtx(c),
                ActorType:  "user",
                ActorID:    userIDFromCtx(c),
                Action:     action.(string),
                TargetType: getString(c, "audit_target_type"),
                TargetID:   getString(c, "audit_target_id"),
                Before:     c.MustGet("audit_before"),
                After:      c.MustGet("audit_after"),
                IP:         c.ClientIP(),
                UserAgent:  c.Request.UserAgent(),
                RequestID:  c.GetString("request_id"),
                Result:     resultFromStatus(c.Writer.Status()),
            })
        }
    }
}
```

Los handlers setean `c.Set("audit_action", "update_grade")` y `before`/`after`.

## 6. Interceptor TS (NestJS)

```ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    const action = Reflect.getMetadata('audit:action', ctx.getHandler());
    if (!action) return next.handle();
    return next.handle().pipe(
      tap((after) => this.audit.record({
        tenantId: req.tenantId,
        actorType: 'user',
        actorId: req.user?.id,
        action,
        targetType: req.auditTargetType,
        targetId: req.auditTargetId,
        before: req.auditBefore,
        after: redact(after),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
        result: 'success',
      })),
      catchError((err) => { /* result: 'error' o 'denied' */ throw err; }),
    );
  }
}
```

Decorator: `@Audit('update_grade')` en el handler.

---

## 7. Redacción PII

Lista negra obligatoria en redactor antes de persistir `before`/`after`/`metadata`:

- Nunca: `password`, `password_hash`, `token`, `refresh_token`, `api_key`, `secret`, `authorization`, `cookie`, `session`, `dni` completo, `cuit` completo, `email` de menor, `phone` de menor, datos biométricos.
- OK: últimos 4 dígitos de DNI, hash SHA256 del email, ID interno.
- Campos sensibles en diffs: reemplazar por `"***REDACTED***"` manteniendo la key para auditabilidad.

---

## 8. Acciones clave Educabot

Mínimo a auditar:
- `auth.login`, `auth.logout`, `auth.login_failed`, `auth.mfa_challenge`
- `user.create`, `user.delete`, `user.role_change`, `user.password_reset`
- `student.data_access` (acceso a datos de menores — crítico)
- `grade.update`, `grade.bulk_update`, `grade.delete`
- `course.enroll`, `course.unenroll`
- `dsar.export`, `dsar.delete_request`
- `tenant.config_change`, `integration.enable`, `integration.disable`
- `admin.impersonate_start`, `admin.impersonate_stop`

---

## 9. Consulta admin

Endpoint `GET /admin/audit` con:
- Filtros: `tenant_id` (obligatorio), `actor_id`, `action`, `target_type`, `target_id`, `from`, `to`, `result`.
- Paginación por cursor sobre `(ts, id)` DESC — no OFFSET (mata performance en tablas grandes).
- Export CSV con rate limit y re-auditable (`dsar.export` se audita a sí mismo).
- RBAC: solo roles `admin`, `security`, `legal`.
- Nunca devolver logs de otros tenants (filtrar por `tenant_id` en WHERE, no confiar en frontend).

---

## 10. Tamper-evidence (hash chain, opcional)

Cada fila incluye `prev_hash` (hash de la fila anterior del mismo tenant) y `hash = sha256(prev_hash || canonical(row))`.

Permite detectar manipulación post-hoc ejecutando un job de verificación. Requiere serialización estricta (campo por campo, orden fijo) y lock por tenant al insertar para garantizar orden.

Trade-off: complejidad + contención en writes. Solo si hay requerimiento legal explícito.

---

## 11. Retención por capas

| Capa | Storage | Ventana | Consulta |
|---|---|---|---|
| Hot | PostgreSQL particionado | 0-3 meses | Online, <100ms |
| Warm | BigQuery o S3 Parquet | 3-12 meses | Online, segundos |
| Cold | S3 Glacier / GCS Archive | 1-5 años | Diferida (horas) |
| Delete | — | >5 años | Purga automática + registro en `audit_logs` (`retention.purge`) |

Job mensual: drop de particiones >3 meses tras export a warm.

---

## 12. Anti-patterns

- No mezclar audit con logs de app (Loki/Datadog). Distintos SLAs, distinta sensibilidad.
- No permitir UPDATE/DELETE sobre `audit_logs` al rol de app.
- No loguear passwords, tokens, PII de menores en claro.
- No omitir `tenant_id` en multi-tenant (filtración cross-tenant = incidente grave).
- No usar `id` autoincremental (filtra volumen de operaciones). UUID v4/v7.
- No hacer audit síncrono sin outbox: si falla el sink, o bloqueás la request o perdés el evento.
- No confiar en IP/UserAgent del cliente sin validar (X-Forwarded-For spoof).
- No exponer endpoint de consulta sin RBAC estricto.
- No dejar retención indefinida (coste + riesgo legal).

---

## Checklist de implementación

- [ ] Tabla `audit_logs` particionada por mes con índices por tenant.
- [ ] REVOKE UPDATE/DELETE + trigger defensivo.
- [ ] Patrón outbox para escritura transaccional.
- [ ] Middleware/interceptor que captura ctx automático (IP, UA, request_id, actor, tenant).
- [ ] Redactor PII con lista negra + tests.
- [ ] Catálogo de acciones (`action` enum documentado).
- [ ] Endpoint admin con RBAC, filtros y cursor pagination.
- [ ] Job de archivado hot→warm→cold.
- [ ] Alerta si tasa de escritura cae a 0 (audit caído = ceguera forense).
- [ ] Verificador de hash chain (si aplica).
- [ ] Runbook: cómo responder a pedido legal/DSAR con audit export.

---

## Output esperado

- Migración SQL con tabla, particiones, índices, REVOKE y trigger.
- Módulo `audit` (Go y/o TS) con: `Entry` struct, `Service.Record`, redactor, middleware/interceptor, worker outbox.
- Handler `GET /admin/audit` con filtros + paginación.
- Tests: append-only enforcement, redacción PII, multi-tenant isolation, outbox replay.
- Doc breve: catálogo de acciones + política de retención.

---

## Delegación

- Observabilidad/debug logs → `logging-setup`.
- RFC técnico del módulo → `doc-rfc`.
- Tickets de implementación → `jira-tickets`.
- Revisión de seguridad del diseño → `audit-dev`.
- Diagrama ER de la tabla → `db-diagram`.
- Documentación del endpoint admin → `api-docs`.
