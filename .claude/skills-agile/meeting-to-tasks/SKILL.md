---
name: meeting-to-tasks
description: "Convertir notas de meeting/transcripción en tasks estructurados con owners y due dates, directo en ClickUp/Jira. Usar cuando el usuario mencione: notas de meeting, minuta, transcripción, action items, to-dos del meeting, convertir notas a tickets."
argument-hint: "[path to notes file, or paste inline]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task, AskUserQuestion
---
# Meeting Notes → Tasks

Transforma notas desordenadas o transcripciones de meetings en action items estructurados, creando tickets directamente en ClickUp o Jira.

## Input Forms Aceptados

### 1. Notas manuales (markdown o plain text)
```
Meeting with product team - 2026-04-12

Discussed Q2 roadmap
- Alice to finalize mobile app specs by Friday
- Bob needs to investigate payment provider options
- Carol will draft the security review before next sprint
- Decision: we're going with Stripe over PayPal
```

### 2. Transcripción (tipo Otter, Fireflies, Zoom)
```
14:03 Alice: "We need to finalize the specs by Friday"
14:05 Bob: "I'll look into payment providers"
14:10 Carol: "I can have the security review done before next sprint"
```

### 3. Email thread / Slack conversation
Pegar contenido, skill extrae action items.

## Flujo

### 1. Parse & Extract

Identifico items con patterns:
- "X to do Y" / "X will Y" / "X needs to Y"
- "[Action] ..."
- "- [ ] ..."
- Menciones con verbos de acción + dates

Para cada action item:
- **Owner**: persona mencionada (match con equipo conocido)
- **Action**: qué hay que hacer (ideal: verbo + objeto)
- **Due date**: si se menciona ("by Friday", "next sprint", "EOW")
- **Context**: 1 oración del meeting que da contexto
- **Priority**: inferir por keywords ("urgent", "blocker", "ASAP")

### 2. Structure

```markdown
# Action Items from [Meeting Name] — 2026-04-12

## Decisions
- Going with Stripe over PayPal

## Action Items

### For Alice
- [ ] Finalize mobile app specs
  - Due: 2026-04-19 (Friday)
  - Context: Q2 roadmap planning
  - Priority: High

### For Bob
- [ ] Investigate payment provider options
  - Due: TBD (no specific date)
  - Context: Need alternative to current provider
  - Priority: Medium

### For Carol
- [ ] Draft security review
  - Due: Before next sprint (2026-04-22)
  - Context: Pre-release security audit
  - Priority: High
```

### 3. Confirm with user

Presento la estructura al user:
- ¿Los owners están correctos? (validar contra miembros del equipo)
- ¿Las fechas parseadas son correctas?
- ¿Agregar o quitar action items?
- ¿En qué tool crear los tickets? (ClickUp / Jira / ambos)

### 4. Create tickets

Por cada action item aprobado:

**ClickUp:**
```
createTask({
  list_id: "...",
  name: "[Action] " + item.action,
  description: "...",
  assignees: [item.owner_id],
  due_date: item.due,
  priority: item.priority,
  tags: ["from-meeting", meeting_date]
})
```

**Jira:**
```
POST /issue
{
  project: {...},
  summary: item.action,
  description: {...},  // ADF con context + decisión relacionada
  assignee: {accountId: item.owner_jira_id},
  duedate: item.due,
  priority: {...},
  labels: ["meeting-action", meeting_date]
}
```

### 5. Close the loop

- Post en Slack/Email el summary con links a los tickets creados
- Opcional: save meeting notes a Notion/Coda con links a tickets
- Update status: "Action items tracked in [tool]"

## Comando

```
/meeting-to-tasks [--file notes.md | --paste | --transcription]
```

### Modos

**File:**
```
/meeting-to-tasks --file notes.md --target clickup --list-id X
```

**Paste:**
```
/meeting-to-tasks --paste
# Claude pide que pegues el contenido
```

**Transcription:**
```
/meeting-to-tasks --transcription fireflies_export.txt
```

## Parsing Heurístico

Patrones comunes:
- `<Name> will/to <verb>` → owner = Name, action = verb + rest
- `<Name> needs to <verb>` → same
- `- [ ] <task>` → action sin owner (preguntar)
- `@<username>` → owner by handle
- `ASAP|urgent|blocker` → priority = Urgent
- `by Friday|EOD|tomorrow|next week` → parse a date relativa

## Team Mapping

Config en `.claude/config/team.yml`:
```yaml
members:
  - name: Alice
    email: alice@educabot.com
    slack: "@alice"
    clickup_id: "..."
    jira_account_id: "..."
  - name: Bob
    ...
```

Si un nombre no matchea, preguntar al user.

## Reglas

- **Nunca crear tickets sin confirmación** — siempre mostrar lista primero
- **Fechas ambiguas** ("soon", "later") → pedir aclaración o dejar sin due date
- **Si falta owner** → preguntar, no asignar arbitrariamente
- **Deduplicar**: si un action item es similar a uno existente abierto, flaggear
- **Privacy**: no incluir información sensible del meeting en descriptions públicas
