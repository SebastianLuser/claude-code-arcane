---
name: runbooks
description: "Crear y mantener runbooks operativos ejecutables para on-call. Paso-a-paso con comandos exactos para resolver incidentes sin depender del creador."
category: "operations"
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

> → Read templates/runbook.md for the fill-in-the-blank runbook skeleton

## Ubicación

- `docs/runbooks/<service>/<alert-name>.md` — nombrado 1:1 con alert
- Cada alert en Alertmanager debe tener `runbook_url` annotation
- NUNCA solo en Notion/Confluence sin link desde la alerta

## Runbooks Default Educabot

Todo servicio debe tener al menos:
- `high-error-rate-5xx.md`, `database-connection-exhausted.md`, `redis-down.md`
- `cloud-run-deploy-failed.md`, `stripe-webhook-backlog.md`, `disk-space-critical.md`
- `certificate-expiring.md`, `pubsub-consumer-lag.md`, `login-failures-spike.md`

## Frontmatter

```yaml
owner: juan.perez@educabot.com
service: alizia-api
last_reviewed: 2026-04-10
last_used_in_incident: 2026-03-28
```

## References

> → Read references/writing-principles.md for runbook writing principles
> → Read references/anti-patterns.md for common anti-patterns to avoid
> → Read references/lifecycle.md for review cycle and automation progression
> → Read references/checklist.md for the validation checklist
