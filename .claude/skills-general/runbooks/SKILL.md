---
name: runbooks
description: "Crear y mantener runbooks operativos ejecutables para on-call. Paso-a-paso con comandos exactos para resolver incidentes sin depender del creador."
argument-hint: "[create <name> | list | update <name>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Runbooks Operativos (Educabot)

Runbook = documento ejecutable paso-a-paso para on-call. Objetivo: cualquier on-call resuelve sin depender del creador. Manual de vuelo a las 3am, no documentación narrativa.

## 10 Secciones Obligatorias

| # | Sección | Contenido |
|---|---------|-----------|
| 1 | Título + alert name | H1 = alert name literal de Alertmanager |
| 2 | Severidad | SEV1 (>50% afectados), SEV2 (degradación parcial), SEV3 (informativa) |
| 3 | Síntomas | Qué ve el usuario + qué dispara la alerta + links dashboards |
| 4 | Impact assessment | Qué roto, a cuántos, desde cuándo. Horario escolar eleva +1 |
| 5 | Diagnostic steps | **Comandos exactos copypasteables** con criterios de decisión |
| 6 | Mitigation | Parar el sangrado: rollback revision / scale up |
| 7 | Resolution | Fix permanente (puede ser en horas) |
| 8 | Rollback plan | Qué hacer si el fix empeora |
| 9 | Escalation path | Quién, en qué orden, con tiempos (15min/30min/45min) |
| 10 | Post-incident | Link template postmortem, Jira action items, actualizar runbook |

## Ubicación

- `docs/runbooks/<service>/<alert-name>.md` — nombrado 1:1 con alert
- Cada alert en Alertmanager debe tener `runbook_url` annotation
- NUNCA solo en Notion/Confluence sin link desde la alerta

## Runbooks Default Educabot

Todo servicio debe tener al menos:
- `high-error-rate-5xx.md`, `database-connection-exhausted.md`, `redis-down.md`
- `cloud-run-deploy-failed.md`, `stripe-webhook-backlog.md`, `disk-space-critical.md`
- `certificate-expiring.md`, `pubsub-consumer-lag.md`, `login-failures-spike.md`

## Principios de Escritura

- **Comandos exactos**, no prosa ("gcloud run services describe alizia-api" no "chequear servicio")
- **Criterios numéricos** ("Si X>Y → Z", no "si te parece raro")
- **Escaneable a las 3am** — headers, code blocks, tablas, no párrafos
- **Sin tribal knowledge** — no "preguntale a Juan", sí "Juan P. en PagerDuty"
- **Links directos** a dashboards, no "el dashboard principal"
- **Español LatAm** — on-call regional
- **Horario escolar importa** — 10am con clases ≠ 3am

## Frontmatter

```yaml
owner: juan.perez@educabot.com
service: alizia-api
last_reviewed: 2026-04-10
last_used_in_incident: 2026-03-28
```

## Ciclo de Vida

- Review obligatorio tras cada incident que usó el runbook
- Audit trimestral: stale (>6 meses sin commit), URLs rotas, comandos que no corren
- Drills trimestrales: simular escenario, medir si sirve

## Automatización Progresiva

```
runbook manual → script en repo → cronjob → auto-remediation (alerta → webhook → acción)
```

Aunque se automatice, el runbook describe el "por qué" para cuando el script falle.

## Anti-patterns

- Sin comandos exactos, tribal knowledge, sin criterios escalación
- Stale (1 año sin update, URLs rotas), solo en wiki sin link desde alerta
- 30 páginas ilegibles, sin rollback path, asumir contexto
- Severidad ambigua sin criterios numéricos, sin `runbook_url` en alerta

## Checklist

- [ ] Alert name en H1 matchea Alertmanager
- [ ] 10 secciones presentes en orden
- [ ] Comandos copypasteables (proyecto, región, servicio hardcodeados)
- [ ] Criterios de decisión numéricos
- [ ] Escalation path con nombres + canales + tiempos
- [ ] Links a dashboards funcionan
- [ ] Rollback plan distinto del fix
- [ ] Frontmatter: owner, service, last_reviewed
- [ ] Alertmanager tiene `runbook_url`
- [ ] Español LatAm, sin jerga sin explicar
- [ ] Validado en drill o por alguien que no lo escribió
