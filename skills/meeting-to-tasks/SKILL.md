---
name: meeting-to-tasks
description: "Convert meeting notes or transcripts into structured tasks with owners and due dates in ClickUp/Jira."
category: "agile"
argument-hint: "[path to notes file, or paste inline]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task, AskUserQuestion
---
# Meeting Notes → Tasks

Transforma notas/transcripciones en action items estructurados, creando tickets en ClickUp o Jira.

## Input aceptado

Notas manuales (markdown/plain text), transcripciones (Otter/Fireflies/Zoom), email/Slack threads.

## Flujo

### 1. Parse & Extract

Patterns: "X to/will/needs to Y", "[Action]", "- [ ]", verbos de acción + dates. Por cada item: **owner** (match con equipo), **action** (verbo+objeto), **due date** (parsear "by Friday", "next sprint", "EOW"), **context** (1 oración), **priority** (urgent/blocker/ASAP keywords).

### 2. Structure

Separar en: **Decisions** (hechos registrados) + **Action Items** agrupados por owner (checkbox, due date, context, priority).

### 3. Confirm

Presentar lista al user: owners correctos? Fechas OK? Agregar/quitar? ¿Tool target? (ClickUp / Jira / ambos).

### 4. Create tickets

**ClickUp:** `createTask` con list_id, name, description, assignees, due_date, priority, tags `[from-meeting, date]`.

**Jira:** POST `/issue` con project, summary, description (ADF), assignee, duedate, priority, labels `[meeting-action, date]`.

### 5. Close the loop

Post en Slack/Email summary con links a tickets. Opcional: save a Notion/Coda. Update status.

## Comando

`/meeting-to-tasks [--file notes.md | --paste | --transcription file.txt] [--target clickup|jira] [--list-id X]`

## Parsing heurístico

- `<Name> will/to/needs to <verb>` → owner + action
- `- [ ] <task>` → action sin owner (preguntar)
- `@<username>` → owner by handle
- `ASAP|urgent|blocker` → priority Urgent
- `by Friday|EOD|tomorrow|next week` → parse fecha relativa

## Team mapping

Config en `.claude/config/team.yml`: members con name, email, slack, clickup_id, jira_account_id. Si nombre no matchea → preguntar.

## Reglas

- Nunca crear tickets sin confirmación — siempre mostrar lista primero
- Fechas ambiguas ("soon", "later") → pedir aclaración o sin due date
- Sin owner → preguntar, no asignar arbitrariamente
- Deduplicar: si similar a ticket existente abierto → flaggear
- Privacy: no incluir info sensible del meeting en descriptions públicas
