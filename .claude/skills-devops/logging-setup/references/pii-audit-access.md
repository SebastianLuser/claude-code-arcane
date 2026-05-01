# PII Scrubbing, Audit Logs & Access Logs

## PII Scrubbing

Campos prohibidos: password, tokens, API keys, DNI/CPF/CUIT, email (hash si correlacion), direccion, telefono, contenido mensajes usuarios, tarjetas. Go: `ReplaceAttr` en slog handler. Pino: `redact.paths`. Nunca loguear `req.body` crudo.

## Access Logs

Fields: method, path, status, latency, user_id, tenant_id, trace_id, ip, user_agent. Excluir /health, /ready, /metrics.

## Audit Logs

Separados de app logs — append-only, retention larga. Eventos: login/logout/signup, password/MFA change, role/permisos change, acceso PII menores, tenant CRUD, GDPR exports, admin actions. Schema: `(id, actor_id, actor_type, action, target_type, target_id, tenant_id, ip, user_agent, metadata jsonb, created_at)`. Write-only, no update/delete. Backup off-cluster.

## Retention & Cost

| Tipo | Retention |
|------|-----------|
| Application | 30d hot, 90d cold |
| Access (LB) | 30d |
| Audit (auth, admin) | 1 ano min |
| Security (SIEM) | 1+ ano |
| Debug prod | 7-14d |

Reducir costo: sampling, level >= INFO, excluir healthchecks, Loki para alto volumen, GCS para cold storage.
