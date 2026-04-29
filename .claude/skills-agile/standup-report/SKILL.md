---
name: standup-report
description: "Auto-generate daily standup report combining ClickUp/Jira activity, Git commits and Slack updates."
category: "agile"
argument-hint: "[date: today|yesterday|YYYY-MM-DD]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Daily Standup Report Generator

## Data Sources

| Source | Data |
|--------|------|
| ClickUp/Jira/Linear | Tasks con status change en últimas 24h |
| Git | Commits por autor (`git log --since="1 day ago" --author`), PRs abiertos/mergeados (`gh pr list`) |
| Slack (opcional) | Mensajes en canales relevantes, bloqueos mencionados |

## Formato Output

### Per-person
Secciones: **Ayer hice** (tickets finalizados, avanzados, code reviews), **Hoy voy a** (sugerido desde tickets In Progress + priorities), **Bloqueos** (esperando reviews, specs, etc.)

### Team standup
Header con stats (tickets completados, commits, PRs). Individual sections. Bloqueos activos. Foco del día. Milestones próximos.

## Comando

`/standup-report [--team X] [--post-to slack]`

Flujo: detectar team/proyecto → pull data en paralelo (git, ClickUp, Jira, GitHub PRs) → agrupar por persona → formatear → opcionalmente postear.

## Integraciones

| Destino | Comando |
|---------|---------|
| Slack | `--post-to slack:#daily-standup` (Block Kit, secciones colapsables) |
| Notion/Coda | `--save-to notion:<page_id>` |
| Google Sheets | `--save-to gsheet:<sheet_id>` (tracking histórico velocity) |

## Configuración

`.claude/config/standup.yml`: team name, members (name, github, jira_email, clickup_id), sources (clickup_space, jira_project, github_repo), post_to (slack channel), schedule (cron).

## Reglas

- Respetar timezones en teams distribuidos
- NO incluir contenido sensible (PII, passwords, secrets)
- Grouping lógico: mergear commits del mismo ticket
- Sugerencias "hoy" basadas en tickets In Progress + priorities
- Max 5 bullets per section, collapsar el resto
