# PII Scrubbing, Audit Logs & Access Logs

## PII Scrubbing

Forbidden fields: password, tokens, API keys, DNI/CPF/CUIT, email (hash it if you need correlation), address, phone, user message content, cards. Go: `ReplaceAttr` in the slog handler. Pino: `redact.paths`. Never log a raw `req.body`.

## Access Logs

Fields: method, path, status, latency, user_id, tenant_id, trace_id, ip, user_agent. Exclude /health, /ready, /metrics.

## Audit Logs

Separate from app logs — append-only, long retention. Events: login/logout/signup, password/MFA change, role/permission change, access to minors' PII, tenant CRUD, GDPR exports, admin actions. Schema: `(id, actor_id, actor_type, action, target_type, target_id, tenant_id, ip, user_agent, metadata jsonb, created_at)`. Write-only, no update/delete. Backup off-cluster.

## Retention & Cost

| Type | Retention |
|------|-----------|
| Application | 30d hot, 90d cold |
| Access (LB) | 30d |
| Audit (auth, admin) | 1 year min |
| Security (SIEM) | 1+ year |
| Debug prod | 7-14d |

Reduce cost: sampling, level >= INFO, exclude healthchecks, Loki for high volume, GCS for cold storage.
