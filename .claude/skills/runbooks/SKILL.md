---
name: runbooks
description: Crear y mantener runbooks operativos ejecutables para on-call. Documentos paso-a-paso con comandos exactos que permiten resolver incidentes sin depender del creador. Usar cuando se mencione runbook, on-call, alerta, incident response, playbook operativo, escalation, postmortem prep.
stack: Go + TypeScript, GCP (Cloud Run, Cloud SQL, Memorystore, Pub/Sub), Alertmanager, Prometheus
locale: es-LatAm
argument-hint: "[create <name> | list | update <name>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Skill: Runbooks Operativos (Educabot)

Runbook = documento **ejecutable paso-a-paso** para un escenario operativo específico. Su objetivo es permitir que **cualquier on-call** (incluso uno que se acaba de sumar) **resuelva sin depender del creador**. No es documentación narrativa, es un manual de vuelo a las 3am.

---

## Cuándo usar

- Hay una alerta de Alertmanager sin `runbook_url`.
- Se repite un incidente y nadie recuerda cómo se resolvió la vez anterior.
- Onboarding de alguien nuevo a la rotación on-call.
- Post-mortem genera action item "documentar este escenario".
- Antes de un game-day / drill de caos.

## Cuándo NO usar

- Guías de desarrollo o contribución → va a `CONTRIBUTING.md`, no es runbook.
- Tutoriales de arquitectura o "cómo funciona X" → ADR / docs técnicos.
- Procedimientos que nunca dispararán una alerta (ej. "cómo generar reporte mensual") → SOP, no runbook.
- Escenarios tan raros que nunca pasaron y son especulativos → perder tiempo.

---

## 1. Estructura obligatoria de un runbook

Todo runbook debe tener estas 10 secciones, en este orden, numeradas. No agregar secciones creativas: la uniformidad es lo que permite escanearlo a las 3am.

```
1. Título + alert name (matchea exactamente con el alert en Alertmanager)
2. Severidad esperada (SEV1 / SEV2 / SEV3)
3. Síntomas (qué ve el usuario, qué dispara la alerta)
4. Impact assessment (qué está roto, a quiénes afecta)
5. Diagnostic steps (comandos exactos para confirmar)
6. Mitigation (acción inmediata para parar el sangrado)
7. Resolution (fix permanente)
8. Rollback plan (si algo empeora)
9. Escalation path (a quién despertar si esto no alcanza)
10. Post-incident (link a template de postmortem)
```

### 1.1 Título + alert name

El H1 del runbook es el alert name **literal**. Así, cuando en Alertmanager ves `HighErrorRate5xx`, buscás `HighErrorRate5xx.md` y es match 1:1.

```markdown
# HighErrorRate5xx — api-alizia

**Alert name**: `HighErrorRate5xx`
**Service**: `alizia-api`
**Region**: `us-central1`
```

### 1.2 Severidad esperada

Definir en tabla. El on-call no debería tener que inferir severidad.

| SEV | Criterio | Respuesta esperada |
|-----|----------|--------------------|
| SEV1 | >50% usuarios afectados O pérdida de datos O horario escolar (8am-18pm LatAm) | Atender inmediato. Convocar a on-call secundario. |
| SEV2 | Degradación parcial, horario no crítico | Atender en <15min. |
| SEV3 | Alerta informativa, sin impacto directo | Atender en horario laboral. |

### 1.3 Síntomas

Qué ve el usuario final y qué dispara la alerta (no confundir).

```markdown
## Síntomas

**Usuario**: No puede hacer login, ve "Error 500" al abrir Alizia.
**Alerta**: `rate(http_requests_total{status=~"5..",service="alizia-api"}[5m]) > 0.05`
**Dashboards relacionados**:
- [Alizia API Overview](https://console.cloud.google.com/monitoring/dashboards/custom/xxx?project=educabot-prod)
- [Cloud Run Metrics — alizia-api](https://console.cloud.google.com/run/detail/us-central1/alizia-api/metrics?project=educabot-prod)
```

### 1.4 Impact assessment

Responder: ¿qué está roto? ¿a cuántos? ¿desde cuándo?

```markdown
## Impact

- Afecta: usuarios que hacen login / crean sesión en Alizia.
- NO afecta: contenido estático, CMS, reportes batch.
- Cuántos: consultar `sum(rate(...))` en el dashboard — si >1000 rpm → SEV1.
- Horario escolar (8am-18pm Bogotá/CDMX/BSAS) eleva severidad +1 nivel.
```

### 1.5 Diagnostic steps

**Comandos exactos, copypasteables**. Nada de "chequeá el estado" sin decir cómo.

```markdown
## Diagnóstico

### 1. Confirmar que la alerta es real (no falso positivo)

```bash
gcloud run services describe alizia-api \
  --region us-central1 \
  --format='value(status.latestReadyRevisionName)'
```

### 2. Ver últimos 100 logs de error

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="alizia-api" AND severity>=ERROR' \
  --limit=100 \
  --format='value(timestamp,textPayload)' \
  --project=educabot-prod
```

### 3. Checar conexiones DB activas

```bash
gcloud sql operations list --instance=alizia-prod-db --limit=5
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### 4. Criterio de decisión

- Si errores son `connection refused` a DB → ir al runbook [database-connection-exhausted.md](./database-connection-exhausted.md).
- Si errores son `context deadline exceeded` de Redis → ir a [redis-down.md](./redis-down.md).
- Si errores son `panic` en código → **ir a sección Mitigation** (rollback).
- Si no hay patrón claro → escalar (sección 9).
```

### 1.6 Mitigation

**Parar el sangrado primero, entender después.**

```markdown
## Mitigación (parar el sangrado)

### Opción A — Rollback al revision anterior

```bash
gcloud run services update-traffic alizia-api \
  --region us-central1 \
  --to-revisions=alizia-api-00042-abc=100
```

Verificar que el tráfico bajó:
```bash
watch -n 5 'gcloud run services describe alizia-api --region us-central1 --format="value(status.traffic)"'
```

### Opción B — Escalar instancias (si es carga, no bug)

```bash
gcloud run services update alizia-api \
  --region us-central1 \
  --min-instances=10 \
  --max-instances=50
```

**Criterio**: si la última deploy fue <2h → Opción A. Si hace días sin deploy y picó tráfico → Opción B.
```

### 1.7 Resolution

Fix permanente (puede ser en horas, no ahora).

```markdown
## Resolución permanente

1. Abrir ticket Jira en ALZ con label `incident-followup`.
2. Reproducir en staging con el payload del log.
3. Fix + test de regresión.
4. Deploy con canary (10% → 50% → 100%).
```

### 1.8 Rollback plan

Qué hacer si el fix empeora.

```markdown
## Rollback

Si después de aplicar Mitigation A la tasa de 5xx **no baja en 5 min**:

```bash
# Volver 2 revisions atrás
gcloud run services update-traffic alizia-api \
  --region us-central1 \
  --to-revisions=alizia-api-00041-xyz=100
```

Si aún persiste → Opción B + escalar a lead (sección 9).
```

### 1.9 Escalation path

A quién despertar, en qué orden, con qué criterio.

```markdown
## Escalación

| Tiempo sin resolver | Escalar a | Cómo contactar |
|---------------------|-----------|----------------|
| 15 min | On-call secundario | PagerDuty / WhatsApp grupo #oncall |
| 30 min | Lead de Alizia (Juan P.) | Teléfono directo en PagerDuty |
| 45 min | CTO | PagerDuty override |
| SEV1 + horario escolar | **Inmediato** al lead + comms al equipo de soporte | Slack #incidentes + llamada |
```

### 1.10 Post-incident

```markdown
## Post-incident

1. Llenar postmortem: [template](../templates/postmortem.md).
2. Action items → Jira con label `postmortem-<fecha>`.
3. **Actualizar este runbook** con lo aprendido. PR obligatorio.
```

---

## 2. Ubicación y discoverability

- **Repo**: `docs/runbooks/<service>/<alert-name>.md` en el repo de ops o del servicio.
- **Link desde la alerta**: cada `alert` en Alertmanager debe tener annotation `runbook_url`.

```yaml
# alertmanager/rules/alizia.yml
- alert: HighErrorRate5xx
  expr: rate(http_requests_total{status=~"5..",service="alizia-api"}[5m]) > 0.05
  for: 2m
  labels:
    severity: sev2
  annotations:
    summary: "Tasa de 5xx alta en alizia-api"
    runbook_url: "https://github.com/educabot/ops/blob/main/runbooks/alizia/high-error-rate-5xx.md"
```

- **NUNCA** tener el runbook solo en Notion/Confluence sin link desde la alerta. A las 3am nadie busca en Confluence.

---

## 3. Runbooks default Educabot (crear estos)

Todos los servicios Educabot deben tener al menos estos runbooks base. Crear con el template de la sección 5.

- `high-error-rate-5xx.md` — tasa de 5xx sobre umbral
- `database-connection-exhausted.md` — pool de conexiones agotado en Cloud SQL
- `redis-down.md` — Memorystore no responde / latencia >500ms
- `cloud-run-deploy-failed.md` — deploy falla, revision no ready
- `stripe-webhook-backlog.md` — webhooks de Stripe acumulados sin procesar
- `disk-space-critical.md` — disco >85% en Cloud SQL / VM
- `certificate-expiring.md` — TLS cert expira en <14 días
- `pubsub-consumer-lag.md` — lag de consumer de Pub/Sub sobre umbral
- `login-failures-spike.md` — pico anómalo de logins fallidos (posible ataque)

---

## 4. Principios de escritura

1. **Comandos exactos, no prosa**. `gcloud run services describe alizia-api --region us-central1` no "chequear el servicio".
2. **Criterios de decisión explícitos**. "Si X>Y → hacé Z; si no → escalar a R". Nunca "si te parece raro".
3. **Escaneable a las 3am**. Headers claros, bloques de código, tablas. No párrafos largos.
4. **Sin tribal knowledge**. ❌ "preguntale a Juan". ✅ "Juan P. — teléfono en PagerDuty, escalación después de 30min".
5. **Screenshots de dashboards clave**. Si el on-call tiene que reconocer "la línea roja que sube", meter imagen.
6. **Español LatAm**. On-call es regional, no asumir inglés nativo.
7. **Horario escolar importa**. Incident 10am Bogotá con clases en curso ≠ incident 3am.
8. **Asumir contexto cero**. "El dashboard principal" no existe. Link directo siempre.

---

## 5. Versionado y ciclo de vida

- **En repo, PRs revisados, ownership claro**. Cada runbook tiene un owner (lead del área del servicio) en el frontmatter.
- **Review cadence**:
  - Tras **cada incident que usó el runbook** → PR obligatorio con lecciones.
  - **Audit trimestral**: buscar runbooks stale (último commit >6 meses, URLs rotas, comandos que ya no corren).
- **Drills / Game days**: ejercicio trimestral simulando escenario. ¿El runbook actual sirve? ¿Cuánto tardó el on-call? Feedback → PR.

```markdown
---
owner: juan.perez@educabot.com
service: alizia-api
last_reviewed: 2026-03-10
last_used_in_incident: 2026-02-22
---
```

---

## 6. Template genérico

Mantener en `docs/runbooks/_template.md` para crear nuevos rápido. Copiar, renombrar, rellenar.

---

## 7. Automatización progresiva

Lo que se ejecuta repetidamente en un runbook es candidato a automatizar:

```
runbook manual
    ↓ (se usa seguido)
script en repo (ops/scripts/restart-alizia.sh)
    ↓ (confiable)
cronjob / alerta auto-ejecutada
    ↓ (muy confiable, bajo riesgo)
auto-remediation (Alertmanager → webhook → acción)
```

Importante: **aunque se automatice, el runbook sigue describiendo el "por qué"**. El on-call necesita entender qué hace el script cuando falla.

---

## 8. Ejemplo completo: `high-error-rate-5xx.md`

```markdown
---
owner: juan.perez@educabot.com
service: alizia-api
last_reviewed: 2026-04-10
last_used_in_incident: 2026-03-28
---

# HighErrorRate5xx — alizia-api

**Alert name**: `HighErrorRate5xx`
**Service**: `alizia-api`
**Region**: `us-central1`

## Severidad

| SEV | Criterio |
|-----|----------|
| SEV1 | >5% error rate en horario escolar (8-18 LatAm) |
| SEV2 | >5% error rate fuera de horario escolar |
| SEV3 | Burst <2min que se auto-recupera |

## Síntomas

- Usuario: error 500 al hacer login o cargar sesión.
- Alerta: `rate(http_requests_total{status=~"5..",service="alizia-api"}[5m]) > 0.05` durante 2min.
- Dashboard: [Alizia API — errors](https://console.cloud.google.com/monitoring/dashboards/custom/alizia-errors?project=educabot-prod)

## Impact

- Afecta: login, creación de sesión, API pública.
- NO afecta: assets estáticos (CDN), reports batch.
- Medir usuarios impactados: dashboard panel "Affected users (5m)".

## Diagnóstico

### 1. Ver revision activa

```bash
gcloud run services describe alizia-api \
  --region us-central1 \
  --format='value(status.latestReadyRevisionName,status.traffic)'
```

### 2. Últimos errores

```bash
gcloud logging read \
  'resource.labels.service_name="alizia-api" AND severity>=ERROR' \
  --limit=50 --project=educabot-prod \
  --format='value(timestamp,jsonPayload.message)'
```

### 3. ¿Hubo deploy reciente?

```bash
gcloud run revisions list --service=alizia-api --region us-central1 --limit=5
```

### Criterio

- Deploy <2h atrás → **Mitigation A (rollback)**.
- Sin deploy reciente + spike de tráfico → **Mitigation B (scale)**.
- Errores de DB → runbook `database-connection-exhausted.md`.
- Errores de Redis → runbook `redis-down.md`.

## Mitigación

### A — Rollback

```bash
# Ver revision previa estable
gcloud run revisions list --service=alizia-api --region us-central1

# Enviar 100% de tráfico
gcloud run services update-traffic alizia-api \
  --region us-central1 \
  --to-revisions=<revision-previa>=100
```

### B — Scale up

```bash
gcloud run services update alizia-api \
  --region us-central1 \
  --min-instances=10 --max-instances=50
```

## Resolución

1. Ticket Jira ALZ con label `incident-followup`.
2. Reproducir en staging.
3. Fix + test regresión.
4. Deploy canary: 10% → 50% → 100%.

## Rollback

Si Mitigation A no baja errores en 5min:
```bash
gcloud run services update-traffic alizia-api \
  --region us-central1 \
  --to-revisions=<revision-2-atras>=100
```

## Escalación

| Minutos | A quién |
|---------|---------|
| 15 | On-call secundario |
| 30 | Lead Alizia (Juan P.) |
| 45 | CTO |
| SEV1 + horario escolar | **Inmediato**: lead + soporte |

## Post-incident

- [Template postmortem](../templates/postmortem.md).
- Action items → Jira label `postmortem-<fecha>`.
- **Actualizar este runbook** con lecciones.
```

---

## 9. Anti-patterns

- ❌ **Runbook sin comandos exactos**: "investigá el problema" no sirve a las 3am.
- ❌ **Tribal knowledge**: "preguntale a Juan" — Juan está de vacaciones.
- ❌ **Sin criterios de escalación**: nadie sabe cuándo despertar al lead.
- ❌ **Stale**: un año sin actualizar, URLs rotas, comandos que ya no corren.
- ❌ **Solo en Notion/Wiki sin link desde la alerta**: nadie lo encuentra.
- ❌ **30 páginas ilegibles**: debe ser escaneable en 1min.
- ❌ **Sin rollback path**: aplicás el fix, empeora, te trabás.
- ❌ **Asumir contexto**: "el dashboard principal" — on-call nuevo no sabe cuál es.
- ❌ **Inglés técnico denso con on-call hispanohablante**: doble carga cognitiva a las 3am.
- ❌ **Severidad ambigua**: "es grave" sin criterios numéricos.
- ❌ **Sin `runbook_url` en la alerta**: existe pero nadie lo linkea.

---

## 10. Checklist antes de mergear un runbook

- [ ] Alert name en H1 matchea exactamente con Alertmanager.
- [ ] Las 10 secciones están presentes y en orden.
- [ ] Todos los comandos son copypasteables (proyecto, región, servicio hardcodeados).
- [ ] Criterios de decisión numéricos (no "si te parece").
- [ ] Escalation path con nombres + canales + tiempos.
- [ ] Links a dashboards GCP funcionan (probarlos).
- [ ] Rollback plan existe y es distinto del fix.
- [ ] Frontmatter con `owner`, `service`, `last_reviewed`.
- [ ] Alertmanager rule tiene `runbook_url` apuntando a este archivo.
- [ ] Screenshots de dashboards clave (si aplica).
- [ ] Español LatAm, sin jerga interna sin explicar.
- [ ] Probado en un drill o por alguien que no lo escribió.

---

## Output esperado ✅

Un archivo `docs/runbooks/<service>/<alert-name>.md` que:

- ✅ Permite que un on-call que nunca tocó el servicio resuelva el incident.
- ✅ Tiene las 10 secciones obligatorias.
- ✅ Contiene comandos exactos, no prosa.
- ✅ Está linkeado desde `runbook_url` en la alerta.
- ✅ Tiene owner claro y fecha de último review.
- ✅ Fue validado en un drill o incident real.

---

## Delegación a otras skills

- **`/incident`** — post-mortem post-incidente (usa el runbook como input de timeline).
- **`/jira-tickets`** — crear tickets de action items del post-mortem.
- **`/deploy-check`** — checklist pre-deploy, complementaria al runbook de `cloud-run-deploy-failed.md`.
- **`/sprint-report`** — tracking de action items post-incident.
- **`/audit-dev`** — auditoría que incluye cobertura de runbooks vs alertas existentes.
