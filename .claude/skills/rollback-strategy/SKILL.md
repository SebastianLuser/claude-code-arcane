---
name: rollback-strategy
description: "Estrategia de rollback para deploys en Educabot. Principio rector — todo deploy debe ser reversible en menos de 5 minutos. Cubre code/config/data/infra rollback, versioning de artefactos, compatibility windows, canary, auto-rollback, runbooks para Cloud Run y GKE, feature flags, CDN/cache, mobile (RN) y comunicación de incidentes. Usar cuando se mencione: rollback, revertir deploy, deshacer release, volver atrás, kill switch, incident response, hotfix, redeploy versión anterior, undo deployment."
argument-hint: "[code|config|data|infra]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Rollback Strategy

## Cuándo usar

- Planificar una release y definir el plan de rollback **antes** de deployar
- Durante un incidente en producción: ejecutar rollback rápido y seguro
- Al diseñar CI/CD pipelines nuevos (GitHub Actions, Cloud Deploy)
- Revisar que un cambio breaking (schema, API) tenga camino de reversa
- DR drills trimestrales: probar que el rollback realmente funciona
- Onboarding de devs: que sepan los comandos a las 3am sin improvisar

## Cuándo NO usar

- Para fix forward simple (un typo, un log): a veces hotfix es más rápido que rollback. Evaluar
- Si el bug es de datos ya escritos (corruption): rollback de código no arregla los datos, necesitás restore + reconciliación
- Si ya pasó la compatibility window y el schema migró irreversiblemente: rollback de código puede romper más
- Features puramente estáticas en CDN: a veces purgar + redeploy previo es más directo que un "rollback" formal

## Principio rector

> **Todo deploy debe ser reversible en < 5 minutos. Si no lo es, es un deploy peligroso.**

Un deploy sin plan de rollback es una apuesta. En Educabot (EdTech LatAm, picos de tráfico en horario escolar) no podemos darnos el lujo de "ver qué pasa". Cada release debe tener:

1. Un comando concreto de rollback escrito **antes** de deployar
2. Un responsable que sepa ejecutarlo
3. Un criterio claro de cuándo apretar el botón (SLO, error rate, alertas)
4. Pruebas de que el rollback realmente funciona (drills periódicos)

## 1. Tipos de rollback

### 1.1 Code rollback
Redeploy del artefacto (imagen Docker) de la versión anterior. Es el caso más simple **si** tenés versioning correcto.

### 1.2 Config rollback
Revertir feature flag o env var. **Instantáneo**, sin redeploy. Preferí esto cuando sea posible.

### 1.3 Data rollback
Revertir migración DB. Mucho más difícil, a veces imposible (un `DROP COLUMN` no vuelve sin restore). Ver sección 3 y skill `/data-migrations`.

### 1.4 Infra rollback
`terraform apply` con la versión anterior del state/módulo. Requiere state bien manejado y revisar drift.

## 2. Estrategia por layer

### 2.1 Stateless (Cloud Run, GKE Deployments)

Rollback = redeploy de la imagen anterior. Trivial si taggeás por git SHA.

```bash
# GKE
kubectl rollout undo deployment/alizia-api -n production
kubectl rollout status deployment/alizia-api -n production

# Cloud Run (cambiar tráfico a revision previa)
gcloud run services update-traffic alizia-api \
  --to-revisions=alizia-api-00042-abc=100 \
  --region=us-central1
```

### 2.2 DB migrations — expand/contract

Nunca hagas drops irreversibles en la misma release que el deploy de código. Patrón multi-step:

1. **Expand:** agregar columnas/tablas nuevas (backward compatible)
2. **Migrate data + deploy código** que escribe en nuevo schema y lee de ambos
3. **Cutover:** código lee solo del nuevo schema
4. **Contract:** una release después, drop de columnas/tablas viejas

Garantiza que el rollback de código en cualquier paso sigue siendo compatible con el schema actual. Ver `/data-migrations`.

### 2.3 Feature flags

Toggle off instantáneo sin redeploy. Ideal como **kill switch** para nuevas features.

```bash
# Unleash emergency toggle
curl -X POST "$UNLEASH_URL/admin/features/new_checkout/toggle-off" \
  -H "Authorization: $UNLEASH_ADMIN_TOKEN"
```

Regla: toda feature nueva user-facing va detrás de un flag con kill switch server-side.

## 3. Versioning de artefactos

- Tag por **git SHA**: `gcr.io/educabot/alizia-api:$GIT_SHA`
- **NUNCA** `:latest` en producción: no sabés qué tenés corriendo
- Retener mínimo las últimas **10 imágenes** (política de lifecycle en Artifact Registry)
- Mapear SHA ↔ release ↔ ticket Jira (para auditoría)

```yaml
# GitHub Actions snippet
- name: Build & push
  run: |
    docker build -t $REGISTRY/alizia-api:${{ github.sha }} .
    docker push $REGISTRY/alizia-api:${{ github.sha }}
```

## 4. Database compatibility window

**Regla:** el código N-1 debe funcionar con schema N, y el código N con schema N-1, por al menos una release.

- Nunca mergear en el **mismo PR** un breaking schema change y el código que lo requiere
- Separar siempre: PR1 = schema expand, PR2 = código, PR3 = schema contract
- Code review debe exigir esta separación explícitamente

## 5. Blue/green + canary

Reducir blast radius de cada deploy:

- **Canary progression:** 5% → 25% → 50% → 100% con pausas y checks
- **Auto-rollback** si error rate supera baseline + 3σ o burn rate de SLO > umbral
- Herramientas: **Argo Rollouts**, **Flagger** (GKE), **Cloud Deploy** (Cloud Run)

```yaml
# Argo Rollouts example
strategy:
  canary:
    steps:
      - setWeight: 5
      - pause: { duration: 5m }
      - setWeight: 25
      - pause: { duration: 10m }
      - setWeight: 100
    analysis:
      templates:
        - templateName: error-rate-check
```

## 6. Auto-rollback triggers

Definir métricas y umbrales **antes** del deploy:

- SLO burn rate > 2x en ventana de 10min → rollback automático
- Error rate 5xx > baseline + 3σ sostenido 3min
- p95 latency > umbral contractual (ej: 500ms para Alizia API)
- Health check failures > 20% de réplicas

## 7. Runbook rollback manual (Educabot)

```bash
# ───── Cloud Run ─────
gcloud run revisions list --service=alizia-api --region=us-central1
gcloud run services update-traffic alizia-api \
  --to-revisions=alizia-api-00042-abc=100 \
  --region=us-central1

# ───── GKE ─────
kubectl rollout history deployment/alizia-api -n production
kubectl rollout undo deployment/alizia-api -n production
kubectl rollout status deployment/alizia-api -n production --timeout=5m

# ───── Feature flag emergency kill ─────
curl -X POST "$UNLEASH_URL/admin/features/new_checkout/toggle-off" \
  -H "Authorization: $UNLEASH_ADMIN_TOKEN"

# ───── Verificación post-rollback ─────
curl -sf https://api.educabot.com/health
kubectl logs -n production -l app=alizia-api --since=5m | grep -i error
```

## 8. GitHub Actions workflow de rollback

`.github/workflows/rollback.yml` con input `revision_sha`, re-deploya **sin build** (solo redeploy de imagen ya existente). Permisos restringidos y approval gate.

```yaml
name: rollback
on:
  workflow_dispatch:
    inputs:
      revision_sha:
        description: 'Git SHA de la versión a la que volver'
        required: true
      service:
        description: 'Servicio (alizia-api, tich-api, etc.)'
        required: true
jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production  # requiere approval
    steps:
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
      - name: Redeploy previous image
        run: |
          gcloud run deploy ${{ inputs.service }} \
            --image=$REGISTRY/${{ inputs.service }}:${{ inputs.revision_sha }} \
            --region=us-central1
      - name: Notify Slack
        run: |
          curl -X POST $SLACK_WEBHOOK \
            -d "{\"text\": \"Rollback ejecutado: ${{ inputs.service }} → ${{ inputs.revision_sha }}\"}"
```

## 9. Post-rollback

1. Crear incident con `/incident` (post-mortem estructurado, Jira)
2. Capturar **logs del período malo** antes de que roten (Cloud Logging export)
3. Capturar métricas (screenshots de Grafana/Cloud Monitoring)
4. Root cause analysis (5 whys, fishbone)
5. **Fix forward:** arreglar en branch, testear, redeployar. No dejar el sistema indefinidamente en versión vieja

## 10. Rollback de DB data (corruption)

- **Restore desde PITR** (Point-in-Time Recovery) de Cloud SQL
- Probar restore **periódicamente** en staging (DR drill trimestral obligatorio)
- Documentar tiempo estimado de restore (suele ser 30min-2h según tamaño)
- Tener runbook de reconciliación: qué hacer con eventos/writes que ocurrieron entre el punto de restore y "ahora"

```bash
# Cloud SQL PITR
gcloud sql backups restore $BACKUP_ID \
  --restore-instance=alizia-db-restored \
  --backup-instance=alizia-db
```

## 11. Cache y CDN

- **Invalidar caches** relevantes tras rollback (Redis, Memorystore): la versión vieja puede haber cacheado respuestas del formato nuevo o viceversa
- **Purgar CDN** (Cloud CDN, Cloudflare) si el rollback frontend afecta HTML/JS cacheado
- Versionar assets por hash (`app.a1b2c3.js`) para evitar cache colisiones entre versiones

```bash
# Cloud CDN cache invalidation
gcloud compute url-maps invalidate-cdn-cache $URL_MAP \
  --path="/static/*" --async
```

## 12. Mobile (React Native)

No hay rollback instantáneo por App Store review. Mitigaciones:

- **Feature flags server-driven** (Unleash, Firebase Remote Config): apagar features rotas sin release
- **OTA updates** (Expo Updates / CodePush) para el bundle JS (no código nativo)
- **Versión mínima forzada** (force update): el cliente se bloquea si backend declara incompatibilidad
- Mantener compatibilidad de API con N-2 versiones de la app en stores

## 13. Comunicación durante rollback

- **Status page** update (Atlassian Statuspage, Instatus) — automatizar si posible
- Slack `#incidents` con formato: qué, cuándo empezó, impacto, ETA rollback, responsable
- Email a stakeholders si es user-facing (product, CS, cuentas grandes)
- Durante horario escolar LatAm: escalada inmediata (picos de carga y visibilidad)

## Anti-patterns

- ❌ Tag `:latest` en prod — no sabés qué tenías corriendo, rollback imposible
- ❌ Schema breaking + código breaking en misma release — rollback imposible sin downtime
- ❌ Nunca probar el rollback — el día que lo necesitás descubrís que no funciona
- ❌ DB restore sin drill previo — descubrir que el backup estaba corrupto en producción
- ❌ Rollback sin incident post-mortem — repetís el bug en la próxima release
- ❌ Depender de "deshacer el merge en git" sin plan real de redeploy
- ❌ Feature flag sin kill switch server-side (flag solo en build time = inservible en incidente)
- ❌ Rollback manual sin runbook — nadie sabe los comandos a las 3am
- ❌ Rollback sin invalidar cache/CDN — bugs fantasma por datos stale
- ❌ No retener imágenes viejas — 10 mínimo, preferible 30
- ❌ Workflows de rollback sin approval gate — cualquiera revierte producción
- ❌ Ignorar mobile (RN) en la estrategia — depender de App Store review para fixes

## Checklist pre-deploy

- [ ] Artefacto taggeado por `$GIT_SHA` (no `:latest`)
- [ ] Últimas 10+ imágenes retenidas en Artifact Registry
- [ ] Schema changes siguen expand/contract (separados del deploy de código)
- [ ] Compatibility window N-1 validada
- [ ] Comando de rollback escrito en el ticket/PR
- [ ] Feature flag con kill switch si es feature user-facing
- [ ] Canary configurado (5% → 25% → 100%) para cambios riesgosos
- [ ] Auto-rollback triggers definidos (SLO burn rate, error rate)
- [ ] Workflow `rollback.yml` disponible y probado
- [ ] Runbook actualizado con comandos específicos del servicio
- [ ] DR drill de restore DB ejecutado en el último trimestre
- [ ] Responsable de guardia identificado
- [ ] Plan de comunicación (status page, Slack, email) listo

## Output ✅

Un plan de rollback para un deploy debe entregar:

- ✅ Comando exacto de rollback (copy-paste ready)
- ✅ SHA / revision objetivo documentado
- ✅ Criterios de decisión (cuándo apretar el botón)
- ✅ Responsable on-call identificado
- ✅ Plan de comunicación (canales, plantillas)
- ✅ Verificación post-rollback (smoke tests, métricas)
- ✅ Ticket `/incident` pre-creado (solo falta rellenar si se ejecuta)
- ✅ Cache/CDN invalidation plan
- ✅ DB compatibility confirmada para la versión objetivo

## Delegación

- `/data-migrations` — patrón expand/contract, migraciones reversibles
- `/deploy-check` — checklist pre-deploy completa
- `/incident` — post-mortem estructurado + ticket Jira automático
- `/audit-dev` — auditar que pipelines y runbooks existen y están al día
- `/env-sync` — verificar que env vars de la versión objetivo siguen válidas
- `/deps-audit` — confirmar que no hay deps vulnerables en la versión a la que se vuelve
- `/changelog` — identificar qué cambió entre versión actual y objetivo
- `/api-docs` — verificar compatibilidad de API entre versiones
