---
name: rollback-strategy
description: "Rollback strategy: todo deploy reversible en <5min. Code/config/data/infra, canary, auto-rollback, Cloud Run, GKE, mobile."
category: "operations"
argument-hint: "[code|config|data|infra]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Rollback Strategy

> **Todo deploy debe ser reversible en <5 minutos. Si no lo es, es un deploy peligroso.**

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| Planificar rollback **antes** de deployar | Fix forward simple (typo, log) — a veces hotfix más rápido |
| Incidente en producción | Datos corruptos ya escritos — rollback código no arregla datos |
| Diseñar CI/CD pipelines | Post-compatibility window con schema irreversible |
| Validar camino de reversa en breaking changes | Estáticos en CDN — purgar + redeploy puede ser más directo |
| DR drills trimestrales | |

Cada release necesita: comando concreto de rollback escrito antes, responsable que lo ejecuta, criterio claro de cuándo (SLO, error rate), prueba de que funciona.

## Tipos de rollback

| Tipo | Qué | Dificultad |
|------|-----|------------|
| **Code** | Redeploy imagen Docker versión anterior | Simple si versioning correcto |
| **Config** | Revertir feature flag o env var — instantáneo sin redeploy | Preferir siempre |
| **Data** | Revertir migración DB — `DROP COLUMN` no vuelve sin restore | Difícil/imposible. Ver `/data-migrations` |
| **Infra** | `terraform apply` versión anterior del state | Requiere state limpio, revisar drift |

## Estrategia por layer

### Stateless (Cloud Run, GKE)
Rollback = redeploy imagen anterior. GKE: `kubectl rollout undo`. Cloud Run: cambiar tráfico a revision previa con `gcloud run services update-traffic`.

### DB migrations — expand/contract
Nunca drops irreversibles en misma release que código. 4 fases: expand (agregar nuevo backward-compatible) → migrate data + dual-write → cutover (leer de nuevo) → contract (drop viejo una release después). Ver `/data-migrations`.

### Feature flags
Toggle off instantáneo sin redeploy. Regla: toda feature user-facing va detrás de flag con kill switch server-side.

## Versioning de artefactos

- Tag por **git SHA**: `gcr.io/educabot/service:$GIT_SHA`. NUNCA `:latest` en prod
- Retener mínimo **10 imágenes** (lifecycle policy Artifact Registry)
- Mapear SHA ↔ release ↔ ticket Jira (auditoría)

## DB compatibility window

Código N-1 debe funcionar con schema N, y código N con schema N-1, por al menos una release. Nunca mergear breaking schema + código en mismo PR. Separar: PR1=expand, PR2=código, PR3=contract.

## Runbook rollback manual

> → Read references/runbook-commands.md for exact rollback commands (Cloud Run, GKE, feature flags, GitHub Actions, post-rollback, PITR, cache/CDN)

## References

> → Read references/canary-auto-rollback.md for canary progression and auto-rollback triggers
> → Read references/anti-patterns.md for common rollback anti-patterns
> → Read references/pre-deploy-checklist.md for the pre-deploy validation checklist
> → Read references/mobile-rollback.md for React Native rollback mitigations
> → Read references/communication-protocol.md for incident communication protocol

## Post-rollback

1. Crear incident con `/incident`
2. Capturar logs del período malo antes de rotación (ver runbook)
3. Capturar métricas (Grafana/Cloud Monitoring)
4. RCA (5 whys, fishbone)
5. Fix forward: arreglar, testear, redeployar — no quedar en versión vieja indefinidamente

## Delegación

- `/data-migrations` — expand/contract, migraciones reversibles
- `/deploy-check` — checklist pre-deploy completa
- `/incident` — post-mortem + ticket Jira
- `/audit-dev` — auditar pipelines y runbooks
