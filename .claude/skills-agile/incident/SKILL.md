---
name: incident
description: "Generate structured incident post-mortem (timeline, root cause, impact, action items) and create Jira follow-up ticket."
category: "operations"
argument-hint: "[incident-title or ticket-id]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Incident Post-Mortem Generator

Genera un reporte de post-mortem estructurado y crea tickets de seguimiento.

## Input

El usuario describe el incidente. Argumento opcional: `$ARGUMENTS`

Si no da suficiente info, preguntar:
1. Qué pasó?
2. Cuándo empezó y cuándo se resolvió?
3. Qué sistemas se vieron afectados?
4. Cómo se detectó? (alerta, usuario, casualidad)
5. Cómo se resolvió?
6. Qué proyecto? (para crear tickets en Jira)

## Process

### 1. Recopilar contexto

Si estamos en un repo git:
```bash
# Commits recientes (posible causa)
git log --oneline --since="24 hours ago"

# Deploys recientes
gh run list --limit 5
```

### 2. Generar post-mortem

```markdown
# Post-Mortem: [Título del incidente]
**Fecha:** [fecha del incidente]
**Severidad:** [SEV1-critico / SEV2-alto / SEV3-medio / SEV4-bajo]
**Duración:** [X horas/minutos]
**Autor:** [quien escribe]

## Resumen
[2-3 oraciones: qué pasó, qué impacto tuvo, cómo se resolvió]

## Timeline
| Hora | Evento |
|------|--------|
| HH:MM | Se detecta el problema via [método] |
| HH:MM | Se identifica la causa |
| HH:MM | Se aplica el fix |
| HH:MM | Se confirma resolución |

## Impacto
- **Usuarios afectados:** [N / todos / segmento]
- **Funcionalidad afectada:** [qué dejó de funcionar]
- **Datos perdidos:** [si/no, detalle]
- **SLA/SLO impactado:** [si aplica]

## Root Cause
[Explicación técnica de la causa raíz. Ser específico: archivo, línea, configuración, etc.]

## Resolución
[Qué se hizo para resolver. Incluir commits, PRs, config changes.]

## Factores contribuyentes
- [Factor 1: por qué no se detectó antes]
- [Factor 2: por qué el blast radius fue tan grande]
- [Factor 3: qué faltaba en monitoreo/alertas]

## Lecciones aprendidas
### Qué salió bien
- [Algo que funcionó correctamente en la respuesta]

### Qué salió mal
- [Algo que empeoró la situación o retrasó la resolución]

## Action Items
| # | Acción | Prioridad | Owner | Ticket |
|---|--------|-----------|-------|--------|
| 1 | [Fix permanente] | ALTA | [quien] | [PROJ-XXX] |
| 2 | [Mejorar monitoreo] | MEDIA | [quien] | [PROJ-XXX] |
| 3 | [Agregar test] | MEDIA | [quien] | [PROJ-XXX] |
| 4 | [Documentar runbook] | BAJA | [quien] | [PROJ-XXX] |
```

### 3. Crear tickets en Jira (si el usuario quiere)

Para cada action item, crear un ticket tipo "Tarea" usando la skill de jira-tickets:
- Summary: "[POST-MORTEM] Action item description"
- Priority: según la prioridad del action item
- Labels: ["post-mortem", "incident"]

### 4. Guardar

Guardar en `docs/incidents/[fecha]-[titulo-slug].md`

## Rules
- Sin culpas personales — el post-mortem es sobre el sistema, no las personas
- Ser específico en el root cause (no "error humano" — qué permitió que el error pasara)
- Cada action item debe ser accionable y tener owner
- En español
- Si el incidente está en curso → enfocarse en resolución, post-mortem después
