---
name: sprint-ceremony
description: "Prepare agendas and outputs for agile ceremonies (daily, planning, review, retro, 1-on-1) with Jira action items."
category: "agile"
argument-hint: "[daily|planning|review|retro|1on1]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# sprint-ceremony — Agile Ceremony Assistant

Agendas, templates and outputs for sprint ceremonies. Integrates with Notion/Coda (docs) and Jira (action items).

## Invocation

`/sprint-ceremony <type> [before|after]` — `before` generates the agenda, `after` records notes + action items.

## Ceremonies

### 1. Daily Standup (15 min, daily)

Template: sprint info + per person (yesterday/today/blockers with ticket IDs) + consolidated blockers (table: blocker/owner/ETA) + follow-ups + sprint health check (in progress/QA/done/scope change).

Rules: it is not a status report to a manager, blockers go to the parking lot, cut it if >15 min. Actions: blockers without an owner → propose an assignee, action items → Jira subtasks.

### 2. Sprint Planning (2h, sprint start)

**Pre-read (24h before):** refined backlog, active PRDs, capacity, retro action items.

**Agenda:** sprint goal (15 min) → review the prioritized backlog (30 min) → estimation/commitment with Fibonacci planning poker (60 min) → dependencies and risks (10 min) → confirmation (5 min).

**Output:** sprint goal + capacity/committed + stories table (ID/story/SP/owner) + risks + external dependencies. Actions: move tickets into the sprint, assign SP, create the sprint goal.

### 3. Sprint Review/Demo (1h, sprint end)

**PPT outline:** cover → sprint goal → executive summary (delivered/in progress/not delivered) → 1 slide per feature (screenshot/video + who uses it + metric) → next steps.

**Doc output:** delivered with demos + in progress (% + reason) + not delivered (reason) + stakeholder feedback → action items + decisions. Actions: PPT outline, feedback → Notion/Coda, actionable items → Jira tickets.

### 4. Retrospective (1h, sprint end, team only)

**Default: Start/Stop/Continue** with votes + kudos + action items (MAX 3, with owner+due+Jira) + follow-up on the previous retro. Alternative formats to rotate: 4Ls, Sailboat, Mad/Sad/Glad.

Rules: max 3 action items, each with owner+due+ticket, always review the previous one, nothing vague ("improve communication" → something specific). Vegas rule. Actions: Jira tickets labeled `retro-action`, private team Notion doc.

### 5. Refinement (1h, once per sprint, mid-sprint)

Per ticket: context + clear AC? + dependencies + SP estimate + ready for dev? Backlog hygiene: tickets >3 months old → archive?, no priority, duplicates. Actions: update SP, label `ready-for-sprint`, archive stale ones.

### 6. 1-on-1 (30-45 min, weekly/biweekly)

**Report template:** session focus + work status + topics + feedback for the manager + professional development + previous action items + notes + new action items.

**Manager template:** topics + rotating guiding questions + positive/constructive feedback + private notes.

Rules: the report sets it up, do not cancel, it is not a status report, private notes are confidential. Actions: private Notion doc, action items → tickets/reminders.

## Educabot integration

| Ceremony | Doc | Action items | PPT |
|-----------|-----|--------------|-----|
| Daily | Notion (team channel) | Jira subtasks | — |
| Planning | Notion | Jira sprint | — |
| Review | Coda (public) | Jira | Slides outline |
| Retro | Notion (team private) | Jira `retro-action` | — |
| Refinement | Jira directly | Jira | — |
| 1-on-1 | Private Notion | Personal Jira | — |

## Anti-patterns

- Daily >15 min → cut side conversations
- Retro without action items, or with 10 → nothing happens afterwards
- Planning without a capacity check → overloaded sprint
- Review without stakeholders → demo into the void
- 1-on-1 cancelled repeatedly → sends the message "you are not a priority"
- Action items without owner+due → they never get closed
