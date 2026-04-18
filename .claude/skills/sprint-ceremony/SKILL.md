---
name: sprint-ceremony
description: "Prepara agendas y outputs de ceremonias agile: daily, sprint planning, sprint review, retro, 1-on-1. Genera templates Notion/Coda + crea action items en Jira. Usar para: daily, review, retro, planning, one-on-one, ceremonia, reunión de sprint."
argument-hint: "[daily|planning|review|retro|1on1]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# sprint-ceremony — Agile Ceremony Assistant

Prepara **agendas, templates y outputs** de las ceremonias de sprint en Educabot. Integra con Notion/Coda (docs) y Jira (action items).

## Cuándo usar

- Armar agenda antes de una ceremonia
- Documentar outputs después de una ceremonia
- Convertir action items en tickets de Jira automáticamente
- Generar PPT resumen para stakeholders

## Ceremonias soportadas

1. **Daily standup** (15 min)
2. **Sprint planning** (2h)
3. **Sprint review / demo** (1h)
4. **Retrospective** (1h)
5. **Refinement / backlog grooming** (1h)
6. **1-on-1** (30-45 min)

## Workflow general

```
User: /sprint-ceremony <tipo> [before|after]
  ↓
Skill pregunta contexto específico
  ↓
Genera doc en Markdown (template)
  ↓
Publica en Notion/Coda
  ↓
Si hay action items → crea tickets Jira
  ↓
Resumen con links
```

---

## 1. Daily Standup

**Duración**: 15 min estricto
**Cadencia**: diaria

### Template (formato Educabot)

```markdown
# Daily — <Equipo> — <YYYY-MM-DD>

**Sprint**: <N>
**Día del sprint**: <X de Y>
**Asistentes**: <lista>
**Ausentes**: <lista + motivo>

## 🟢 Por persona

### <Persona>
- **Ayer**: <qué cerró + ticket IDs>
- **Hoy**: <qué va a atacar + ticket IDs>
- **Bloqueos**: <nada / descripción + owner de la destraba>

### <Persona 2>
...

## 🚧 Bloqueos consolidados

| Bloqueo | Owner de destraba | ETA |
|---------|-------------------|-----|
| <X> | <quién> | <cuándo> |

## 📌 Follow-ups (post daily)

- [ ] <acción> — @<owner>
- [ ] <acción> — @<owner>

## 📊 Sprint health check

- Stories in progress: X
- Stories en QA: Y
- Stories done: Z
- Scope change hoy: ninguno / <descripción>
```

### Reglas
- **No es status report a manager** — es sync del equipo
- **Bloqueos van a parking lot**, se resuelven después del daily
- **3 preguntas clásicas**: ayer / hoy / bloqueos
- Si se extiende > 15 min → cortar y movelo a sync aparte

### Acciones automáticas
- Bloqueos sin owner → skill propone asignar
- Action items → crear tickets en Jira como subtasks

---

## 2. Sprint Planning

**Duración**: 2h (sprint de 2 semanas)
**Cadencia**: inicio del sprint

### Agenda (pre-planning)

```markdown
# Sprint Planning — <Equipo> — Sprint <N>

**Fecha**: <YYYY-MM-DD>
**Duración**: 2h
**Facilitador**: <SM / PM>
**Asistentes**: <equipo completo>

## Pre-read (enviado 24h antes)
- [ ] Backlog refinado: <link Jira>
- [ ] PRDs activos: <links>
- [ ] Capacity del equipo: <X story points>
- [ ] Retro anterior — action items: <link>

## Agenda

### 1. Sprint goal (15 min)
Declarar 1-2 oraciones que describan el objetivo del sprint.

### 2. Review de backlog priorizado (30 min)
Top N items. Product owner presenta contexto.

### 3. Estimación / commitment (60 min)
Equipo estima en planning poker (fibonacci: 1, 2, 3, 5, 8, 13).
Meter items hasta llenar capacity.

### 4. Identificar dependencias y riesgos (10 min)

### 5. Confirmación y cierre (5 min)
```

### Output (post-planning)

```markdown
# Sprint <N> — Commitment

**Sprint goal**: <1-2 oraciones>
**Capacity**: <X SP>
**Comprometido**: <Y SP>
**Fechas**: <inicio> → <fin>

## Stories comprometidas
| ID | Story | SP | Owner |
|----|-------|----|----|
| ALZ-101 | ... | 5 | @juan |
| ALZ-102 | ... | 3 | @ana |

## Riesgos identificados
- <riesgo + mitigación>

## Dependencias externas
- <equipo X entrega Y antes de <fecha>>
```

### Acciones automáticas
- Mover tickets al sprint activo en Jira
- Asignar story points a cada ticket
- Crear sprint goal en Jira sprint description

---

## 3. Sprint Review / Demo

**Duración**: 1h
**Cadencia**: fin del sprint
**Audiencia**: equipo + stakeholders (comercial, CS, founders)

### Template PPT (outline)

```
Slide 1 — Portada
  Sprint <N> Review — <Equipo> — <Fecha>

Slide 2 — Sprint goal
  Qué nos propusimos

Slide 3 — Resumen ejecutivo
  ✅ Entregado: X stories / Y SP
  🚧 En progreso: Z stories
  ❌ No entregado: W stories (+ razón)

Slide 4-N — Demos (1 slide por feature)
  - Screenshot / video / link a staging
  - Quién lo usa y cómo
  - Métrica que va a mover

Slide final — Próximos pasos
  - Siguiente sprint: <preview>
  - Preguntas
```

### Template Markdown (doc post-review)

```markdown
# Sprint <N> Review — <Fecha>

**Sprint goal**: <X>
**Asistentes**: <lista>
**Grabación**: <link>

## Entregado
- **[ALZ-101] Feature X** — demo <link video> — [screenshot]
- **[ALZ-102] Feature Y** — ...

## En progreso (se mueve a sprint <N+1>)
- **[ALZ-103]** — <% completado + razón>

## No entregado (se re-prioriza)
- **[ALZ-104]** — <razón>

## Feedback de stakeholders
- <quote + quién> → action item
- <quote>

## Decisiones tomadas
- Priorizar X sobre Y en próximo sprint
```

### Acciones automáticas
- Generar PPT outline listo para pegar en Slides/PowerPoint
- Crear feedback items en Notion/Coda
- Convertir feedback accionable en tickets Jira

---

## 4. Retrospective

**Duración**: 1h
**Cadencia**: fin del sprint, después de review
**Asistentes**: solo el equipo (safe space)

### Formato por defecto: Start / Stop / Continue

```markdown
# Retro Sprint <N> — <Fecha>

**Facilitador**: <SM>
**Asistentes**: <equipo>
**Norma**: Vegas rule — lo que se dice acá, queda acá (excepto action items)

## 🟢 Start (empezar a hacer)
- <item> — votos: X
- <item> — votos: Y

## 🔴 Stop (dejar de hacer)
- <item> — votos: X

## 🟡 Continue (seguir haciendo)
- <item> — votos: X

## ⭐ Kudos
- @persona por <razón>
- @persona por <razón>

## 🎯 Action items (MAX 3)
| Acción | Owner | Due | Jira |
|--------|-------|-----|------|
| <acción concreta, medible> | @persona | próximo sprint | ALZ-XXX |

## Follow-up de retro anterior
| Action item anterior | Status |
|----------------------|--------|
| <X> | ✅ Done / 🚧 In progress / ❌ Not done |
```

### Formatos alternativos (rotar para mantener engagement)
- **4Ls**: Liked / Learned / Lacked / Longed for
- **Sailboat**: Wind (propulsa) / Anchors (frena) / Rocks (riesgos) / Island (meta)
- **Mad/Sad/Glad**
- **Start/Stop/Continue** (default)

### Reglas
- **Max 3 action items** — más es irreal
- **Cada action item tiene owner + due + ticket Jira**
- **Siempre revisar action items del retro anterior** — si no, pierde sentido
- **Sin action items vagos** tipo "mejorar la comunicación" → convertir en algo específico

### Acciones automáticas
- Crear action items como tickets Jira con label `retro-action`
- Publicar retro en Notion/Coda con permisos solo para el equipo

---

## 5. Refinement / Backlog Grooming

**Duración**: 1h
**Cadencia**: 1x por sprint (mitad del sprint)

### Template

```markdown
# Refinement — <Equipo> — <Fecha>

**Asistentes**: PM, eng lead, tech lead, 1-2 devs
**Tickets a refinar**: <lista IDs>

## Por cada ticket

### ALZ-XXX — <Title>
- **Context**: ¿por qué hace falta?
- **AC claros**: sí / falta <qué>
- **Dependencias**: ninguna / <lista>
- **Estimación**: <SP>
- **Ready for dev?**: ✅ / ❌ (qué falta)

## Backlog hygiene
- Tickets viejos (> 3 meses sin tocar): <lista> → ¿archivar?
- Tickets sin prioridad: <lista>
- Duplicados detectados: <lista>
```

### Acciones automáticas
- Actualizar story points en tickets
- Agregar label `ready-for-sprint` a los que pasaron refinement
- Archivar tickets stale si user aprueba

---

## 6. 1-on-1

**Duración**: 30-45 min
**Cadencia**: semanal o quincenal
**Participantes**: manager + report

### Template (lado del report — se arma de antemano)

```markdown
# 1-on-1 con <Manager> — <YYYY-MM-DD>

## 🎯 Foco de esta sesión
<1-2 temas principales>

## 📊 Status de mi trabajo
- **En progreso**: <lista>
- **Blockers**: <nada / descripción>
- **Wins de la semana**: <lista>

## 🤔 Temas para discutir
- <tema 1>
- <tema 2>

## 📣 Feedback para mi manager
- <qué me gustaría que pase / cambie>

## 🌱 Desarrollo profesional
- Objetivos del trimestre: <status>
- Skills en las que quiero crecer: <lista>
- Recursos que necesito: <cursos / tiempo / coaching>

## Action items de 1-on-1 anterior
- [ ] <item> — ✅/❌

## 📝 Notas de la sesión
(se llenan en la reunión)

## ✅ Action items nuevos
- [ ] <item> — @report o @manager
```

### Template (lado del manager)

```markdown
# 1-on-1 con <Report> — <YYYY-MM-DD>

## Temas a tocar
- <preguntas abiertas>
- Feedback positivo (algo concreto de esta semana)
- Feedback constructivo (si aplica)
- Carrera y desarrollo (1x al mes mínimo)

## Preguntas guía (rotar)
- ¿Qué te tiene más motivado esta semana?
- ¿Qué te frustra?
- ¿Cómo estás respecto a workload?
- ¿Hay algo que debería saber y no sé?
- ¿Cómo puedo ayudarte más?
- ¿Qué feedback tenés para mí?

## Notas privadas
(no compartir sin consentimiento)
```

### Reglas
- **Lo arma el report** con la agenda de antemano
- **No cancelar** — reprogramar pero no saltear
- **No es status report** del trabajo — eso está en daily/Jira
- **Notas privadas** del manager se mantienen confidenciales
- **Action items compartidos** se tracquean

### Acciones automáticas
- Crear doc en Notion privado (solo manager + report)
- Action items → tickets personales o recordatorios
- Recordatorio de next 1-on-1 en calendar

---

## Invocación

```
/sprint-ceremony daily before     → genera agenda
/sprint-ceremony daily after      → registra notas + action items
/sprint-ceremony planning         → prepara/output planning
/sprint-ceremony review           → genera template PPT + doc
/sprint-ceremony retro            → facilita retro + captura action items
/sprint-ceremony refinement       → template de refinement
/sprint-ceremony 1on1 before      → agenda (depende del rol)
/sprint-ceremony 1on1 after       → notas + action items
```

## Integración con herramientas Educabot

| Ceremonia | Doc | Action items | PPT |
|-----------|-----|--------------|-----|
| Daily | Notion (canal equipo) | Jira (subtasks) | — |
| Planning | Notion | Jira sprint | — |
| Review | Coda (public) | Jira | Slides outline |
| Retro | Notion (privado equipo) | Jira `retro-action` | — |
| Refinement | Jira directo | Jira | — |
| 1-on-1 | Notion privado | Jira personal / recordatorio | — |

## Anti-patterns a evitar

- **Daily que dura 45 min** → cortar, mover side conversations
- **Retro sin action items** o con 10 items → no pasa nada después
- **Planning sin capacity check** → sprint sobrecargado
- **Review sin stakeholders** → demo al vacío
- **1-on-1 cancelado repetidamente** → mensaje de "no sos prioridad"
- **Action items sin owner + due** → no se cierran nunca

## Delegación

**Coordinar con:** `scrum-master`, `project-manager`, `delivery-manager`, `product-manager`
**Reporta a:** `program-director`

**Skills relacionadas:**
- `/notion`, `/coda` — publicar docs
- `/jira-tickets` — action items y sprints
- `/sprint-report` — reporte unificado al cierre
- `/meeting-to-tasks` — convertir transcripciones en tickets
- `/standup-report` — resumen diario consolidado
