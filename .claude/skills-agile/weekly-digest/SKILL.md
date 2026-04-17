---
name: weekly-digest
description: "Generar digest semanal combinando ClickUp/Jira + Git/GitHub + deploys + Slack. Reporte unificado para stakeholders. Usar cuando el usuario mencione: digest semanal, weekly report, resumen de la semana, stakeholder update, semana pasada."
argument-hint: "[week: current|last|YYYY-WW]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Weekly Digest Generator

Genera un reporte ejecutivo semanal combinando actividad de múltiples herramientas.

## Contenido del Digest

### 1. Executive summary
3-5 oraciones de alto nivel. Lo más importante de la semana.

### 2. Shipped this week
Features/fixes que llegaron a producción:
- Pulled from merged PRs con tag "production"
- Pulled from completed tickets con label "shipped"
- Linked a release tags

### 3. In progress
Trabajo activo:
- Tickets In Progress (ClickUp/Jira)
- PRs abiertos
- Progreso vs. sprint goal

### 4. Blockers & risks
- Tickets bloqueados >3 días
- PRs sin review >2 días
- Deploys fallidos
- Incidents activos

### 5. Metrics
- Velocity (puntos completados)
- PRs merged
- Bugs closed vs. opened
- Active users / key product metrics

### 6. Upcoming
Próximos 7 días:
- Milestones próximos
- Releases planeados
- Events importantes

### 7. Team updates
- Nuevos miembros
- Ausencias (si relevante)
- Shout-outs

## Data Sources (en paralelo)

### ClickUp
```
mcp__clickup__searchTasks(filters={
  space_id: ...,
  updated_date: "last 7 days"
})
```

### Jira
```
JQL: project = X AND updated >= -7d
```

### Git / GitHub
```bash
# Commits last week
git log --since="1 week ago" --all --pretty=format:"%h|%s|%an|%ad"

# PRs merged
gh pr list --state merged --search "merged:>=$(date -d '7 days ago' +%Y-%m-%d)"

# PRs open
gh pr list --state open

# Issues opened/closed
gh issue list --state all --search "updated:>=$(date -d '7 days ago' +%Y-%m-%d)"

# Releases
gh release list --limit 5
```

### Deploys
- GitHub Actions runs last week
- Successful / failed / duration
- Deployed versions

### Analytics (opcional)
- DAU/WAU cambios
- Signups / conversions
- Top events

## Output Format

```markdown
# Weekly Digest — Week of 2026-04-07 to 2026-04-13

## 📢 Executive Summary
Shipped v2.1.0 with OAuth support and performance improvements. Mobile app beta started with 3 customers. Main risk: Stripe integration behind schedule by 2 days.

## 🚀 Shipped this Week
- **v2.1.0** deployed Monday ([changelog](link))
  - OAuth support for Google, GitHub, Microsoft
  - Dashboard load time reduced 40%
  - Fixed timezone bug affecting EU users
- **Mobile app beta** launched with 3 pilot customers

## 🔄 In Progress
### Alizia BE (ALZ)
- Progress: 13/21 pts (62%) — on track
- Active tickets: 5
- [Alice] ALZ-123 OAuth refresh token rotation — 60%
- [Bob] ALZ-124 Payment provider integration — 30%

### Project T
- Progress: 8/15 pts (53%) — behind
- [Carol] PT-45 Combat rebalance — in review

## ⚠️ Blockers & Risks
- 🔴 **ALZ-124 Stripe integration** — Blocked 4 days waiting on API keys from finance
- 🟡 **PT-45 PR #234** — No review in 3 days
- 🟡 Dashboard deploy failed yesterday (retried successfully)

## 📊 Metrics
| Metric | This week | Last week | Δ |
|--------|-----------|-----------|---|
| Velocity (pts) | 21 | 18 | +17% |
| PRs merged | 12 | 8 | +50% |
| Bugs closed | 8 | 5 | +60% |
| New bugs | 3 | 6 | -50% |
| DAU | 1,234 | 1,180 | +4.6% |

## 📅 Upcoming (Next 7 Days)
- **Mon**: Security audit kickoff
- **Wed**: Mobile app beta checkpoint
- **Fri**: Sprint review + planning
- **Target**: v2.2.0 release by 2026-04-25

## 👥 Team
- 🎉 Welcome @dave (joined backend team)
- 🌴 @alice OOO Thursday-Friday
- 🙌 Shout-out to @bob for refactoring auth middleware

---
_Generated from Jira/ClickUp, GitHub, GA4. [Dashboard](link)._
```

## Comando

```
/weekly-digest [--project X] [--post-to slack|email|notion]
```

## Distribution

### Slack
```
/weekly-digest --post-to slack:#weekly-updates
```
Usa Block Kit — secciones colapsables para scanning rápido.

### Email a stakeholders
```
/weekly-digest --post-to email:stakeholders@company.com
```
HTML formatted, con tabla de métricas.

### Notion/Coda
```
/weekly-digest --post-to notion:<db_id>
```
Crea page nueva en database de reportes, con history tracking.

### Sheet tracker
```
/weekly-digest --save-to gsheet:<sheet_id>
```
Append row con métricas clave — permite tracking longitudinal.

## Config

`.claude/config/weekly-digest.yml`:
```yaml
default_day: Friday
default_hour: "16:00"

projects:
  - name: "Alizia BE"
    jira_project: ALZ
    github_repo: educabot/alizia-be
    channel_slack: "#alzbe-weekly"
  - name: "Project T"
    clickup_space: 90138713959
    github_repo: educabot/project-t
    channel_slack: "#pt-weekly"

metrics_source: posthog  # or mixpanel, ga4

recipients:
  slack: ["#weekly-updates"]
  email: ["stakeholders@educabot.com"]
```

## Reglas

- **Ejecutivo = terse.** Max 1 página printed.
- **Color coding** (🟢🟡🔴) para scannability
- **Links everywhere** — no texto largo, linkear a detalle
- **Comparisons week-over-week** para contexto
- **Tone**: factual, no marketing — stakeholders pueden detectar spin
- **Timezone consistente** — declarar al top si relevante
