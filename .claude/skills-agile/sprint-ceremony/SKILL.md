---
name: sprint-ceremony
description: "Prepara agendas y outputs de ceremonias agile: daily, sprint planning, sprint review, retro, 1-on-1. Genera templates Notion/Coda + crea action items en Jira. Usar para: daily, review, retro, planning, one-on-one, ceremonia, reunión de sprint."
argument-hint: "[daily|planning|review|retro|1on1]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# sprint-ceremony — Agile Ceremony Assistant

Agendas, templates y outputs de ceremonias de sprint. Integra con Notion/Coda (docs) y Jira (action items).

## Invocación

`/sprint-ceremony <tipo> [before|after]` — `before` genera agenda, `after` registra notas + action items.

## Ceremonias

### 1. Daily Standup (15 min, diaria)

Template: sprint info + por persona (ayer/hoy/bloqueos con ticket IDs) + bloqueos consolidados (tabla: bloqueo/owner/ETA) + follow-ups + sprint health check (in progress/QA/done/scope change).

Reglas: no es status report a manager, bloqueos a parking lot, cortar si >15 min. Acciones: bloqueos sin owner → proponer asignar, action items → subtasks Jira.

### 2. Sprint Planning (2h, inicio sprint)

**Pre-read (24h antes):** backlog refinado, PRDs activos, capacity, retro action items.

**Agenda:** sprint goal (15 min) → review backlog priorizado (30 min) → estimación/commitment planning poker fibonacci (60 min) → dependencias y riesgos (10 min) → confirmación (5 min).

**Output:** sprint goal + capacity/comprometido + stories table (ID/story/SP/owner) + riesgos + dependencias externas. Acciones: mover tickets al sprint, asignar SP, crear sprint goal.

### 3. Sprint Review/Demo (1h, fin sprint)

**PPT outline:** portada → sprint goal → resumen ejecutivo (entregado/en progreso/no entregado) → 1 slide por feature (screenshot/video + quién lo usa + métrica) → próximos pasos.

**Doc output:** entregado con demos + en progreso (% + razón) + no entregado (razón) + feedback stakeholders → action items + decisiones. Acciones: PPT outline, feedback → Notion/Coda, accionable → tickets Jira.

### 4. Retrospective (1h, fin sprint, solo equipo)

**Default: Start/Stop/Continue** con votos + kudos + action items (MAX 3, con owner+due+Jira) + follow-up retro anterior. Formatos alternativos para rotar: 4Ls, Sailboat, Mad/Sad/Glad.

Reglas: max 3 action items, cada uno con owner+due+ticket, siempre revisar anterior, nada vago ("mejorar comunicación" → algo específico). Vegas rule. Acciones: tickets Jira label `retro-action`, doc Notion privado equipo.

### 5. Refinement (1h, 1x por sprint mitad)

Por ticket: context + AC claros? + dependencias + estimación SP + ready for dev? Backlog hygiene: tickets >3 meses → archivar?, sin prioridad, duplicados. Acciones: actualizar SP, label `ready-for-sprint`, archivar stale.

### 6. 1-on-1 (30-45 min, semanal/quincenal)

**Report template:** foco sesión + status trabajo + temas + feedback para manager + desarrollo profesional + action items anterior + notas + nuevos action items.

**Manager template:** temas + preguntas guía rotativas + feedback positivo/constructivo + notas privadas.

Reglas: lo arma el report, no cancelar, no es status report, notas privadas confidenciales. Acciones: doc Notion privado, action items → tickets/recordatorios.

## Integración Educabot

| Ceremonia | Doc | Action items | PPT |
|-----------|-----|--------------|-----|
| Daily | Notion (canal equipo) | Jira subtasks | — |
| Planning | Notion | Jira sprint | — |
| Review | Coda (public) | Jira | Slides outline |
| Retro | Notion (privado equipo) | Jira `retro-action` | — |
| Refinement | Jira directo | Jira | — |
| 1-on-1 | Notion privado | Jira personal | — |

## Anti-patterns

- Daily >15 min → cortar side conversations
- Retro sin action items o con 10 → no pasa nada después
- Planning sin capacity check → sprint sobrecargado
- Review sin stakeholders → demo al vacío
- 1-on-1 cancelado repetidamente → mensaje "no sos prioridad"
- Action items sin owner+due → no se cierran
