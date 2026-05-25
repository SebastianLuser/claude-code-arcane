---
name: weekly-digest
description: "Generate a weekly stakeholder digest combining ClickUp/Jira, Git/GitHub, deploys and Slack activity."
category: "agile"
argument-hint: "[week: current|last|YYYY-WW]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Weekly Digest Generator

Reporte ejecutivo semanal combinando actividad de múltiples herramientas.

## Secciones

1. **Executive summary** — 3-5 oraciones alto nivel
2. **Shipped this week** — features/fixes en prod (merged PRs "production", completed tickets "shipped", release tags)
3. **In progress** — tickets In Progress, PRs abiertos, progreso vs sprint goal
4. **Blockers & risks** — tickets bloqueados >3d, PRs sin review >2d, deploys fallidos, incidents
5. **Metrics** — velocity (pts), PRs merged, bugs closed/opened, DAU/key product metrics (week-over-week comparison)
6. **Upcoming** — próximos 7d: milestones, releases, events
7. **Team updates** — nuevos miembros, ausencias, shout-outs

## Data Sources (en paralelo)

- **ClickUp:** searchTasks updated last 7 days
- **Jira:** JQL `updated >= -7d`
- **Git/GitHub:** `git log --since="1 week ago"`, `gh pr list --state merged`, `gh pr list --state open`, `gh issue list`, `gh release list`
- **Deploys:** GitHub Actions runs last week (success/failed/duration)
- **Analytics (opcional):** DAU/WAU, signups, conversions

## Distribution

| Canal | Método |
|-------|--------|
| Slack | `--post-to slack:#channel` (Block Kit, secciones colapsables) |
| Email | `--post-to email:addr` (HTML con tabla métricas) |
| Notion/Coda | `--post-to notion:<db_id>` (page nueva en db reportes) |
| Sheet | `--save-to gsheet:<id>` (append row métricas, tracking longitudinal) |

## Config

`.claude/config/weekly-digest.yml`: default_day, default_hour, projects (name, jira_project/clickup_space, github_repo, slack channel), metrics_source (posthog/mixpanel/ga4), recipients.

## Reglas

- Ejecutivo = terse, max 1 página printed
- Color coding (🟢🟡🔴) para scannability
- Links everywhere — no texto largo
- Comparisons week-over-week para contexto
- Tone factual, no marketing
- Timezone consistente
