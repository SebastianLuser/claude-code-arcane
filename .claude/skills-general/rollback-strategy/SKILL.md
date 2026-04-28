---
name: rollback-strategy
description: "Estrategia de rollback para deploys en Educabot. Principio rector — todo deploy debe ser reversible en menos de 5 minutos. Cubre code/config/data/infra rollback, versioning de artefactos, compatibility windows, canary, auto-rollback, runbooks para Cloud Run y GKE, feature flags, CDN/cache, mobile (RN) y comunicación de incidentes. Usar cuando se mencione: rollback, revertir deploy, deshacer release, volver atrás, kill switch, incident response, hotfix, redeploy versión anterior, undo deployment."
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

## Canary + auto-rollback

- Canary: 5% → 25% → 50% → 100% con pausas y checks
- Auto-rollback si: SLO burn rate >2x en 10min, error rate 5xx >baseline+3σ 3min, p95 latency >umbral, health check failures >20% réplicas
- Herramientas: Argo Rollouts, Flagger (GKE), Cloud Deploy (Cloud Run)

## Runbook rollback manual

- **Cloud Run:** listar revisions → update-traffic a revision previa
- **GKE:** rollout history → rollout undo → rollout status
- **Feature flag:** POST toggle-off a Unleash/LaunchDarkly
- **Verificación:** health check + logs últimos 5min buscando errores

## GitHub Actions rollback

Workflow `rollback.yml` con input `revision_sha` + `service`. Redeploya imagen existente sin build. Environment production con approval gate. Notify Slack post-rollback.

## Post-rollback

1. Crear incident con `/incident`
2. Capturar logs del período malo antes de rotación
3. Capturar métricas (Grafana/Cloud Monitoring)
4. RCA (5 whys, fishbone)
5. Fix forward: arreglar, testear, redeployar — no quedar en versión vieja indefinidamente

## DB data (corruption)

PITR (Point-in-Time Recovery) de Cloud SQL. Probar restore periódicamente en staging (DR drill trimestral). Documentar tiempo estimado (~30min-2h). Runbook reconciliación para writes entre punto restore y ahora.

## Cache y CDN

Invalidar caches (Redis/Memorystore) tras rollback. Purgar CDN (Cloud CDN, Cloudflare) si frontend afectado. Versionar assets por hash (`app.a1b2c3.js`).

## Mobile (React Native)

No hay rollback instantáneo por App Store review. Mitigaciones: feature flags server-driven, OTA updates (Expo Updates/CodePush) para JS bundle, versión mínima forzada (force update), compatibilidad API con N-2 versiones.

## Comunicación

Status page update (Statuspage/Instatus). Slack #incidents (qué, cuándo, impacto, ETA, responsable). Email stakeholders si user-facing. Horario escolar LatAm: escalada inmediata.

## Anti-patterns

- `:latest` en prod — rollback imposible
- Schema breaking + código breaking en misma release
- Nunca probar rollback — descubrís que no funciona cuando lo necesitás
- DB restore sin drill previo
- Rollback sin post-mortem
- "Deshacer merge en git" sin plan real de redeploy
- Flag sin kill switch server-side
- Sin runbook — nadie sabe comandos a las 3am
- Sin invalidar cache/CDN
- No retener imágenes viejas (10 mínimo)
- Rollback workflow sin approval gate
- Ignorar mobile en la estrategia

## Checklist pre-deploy

- [ ] Artefacto taggeado por `$GIT_SHA`
- [ ] 10+ imágenes retenidas en Artifact Registry
- [ ] Schema expand/contract separados de código
- [ ] Compatibility window N-1 validada
- [ ] Comando rollback escrito en ticket/PR
- [ ] Feature flag con kill switch si user-facing
- [ ] Canary configurado para cambios riesgosos
- [ ] Auto-rollback triggers definidos
- [ ] Workflow rollback.yml disponible y probado
- [ ] Runbook actualizado con comandos del servicio
- [ ] DR drill DB restore ejecutado último trimestre
- [ ] Responsable on-call identificado
- [ ] Plan comunicación listo

## Delegación

- `/data-migrations` — expand/contract, migraciones reversibles
- `/deploy-check` — checklist pre-deploy completa
- `/incident` — post-mortem + ticket Jira
- `/audit-dev` — auditar pipelines y runbooks
