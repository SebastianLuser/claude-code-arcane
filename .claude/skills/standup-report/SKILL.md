---
name: standup-report
description: "Generar reporte de daily standup automático combinando datos de ClickUp/Jira + Git + Slack. Usar cuando el usuario mencione: standup, daily, reporte diario, qué hice ayer, avance del día, what did I do."
---

# Daily Standup Report Generator

Genera un reporte de standup completo pulling data de múltiples fuentes.

## Data Sources

Por cada persona del equipo:

### 1. Tickets completados/avanzados
- ClickUp: tasks con status change en últimas 24h
- Jira: issues con transition en últimas 24h
- Linear: issues con status change

### 2. Commits y PRs
```bash
# Commits del día por autor
git log --since="1 day ago" --author="$USER" --pretty=format:"%h %s"

# PRs abiertos/mergeados hoy
gh pr list --author "$USER" --state all --search "created:>$(date -d '1 day ago' +%Y-%m-%d)"
```

### 3. Slack activity (opcional)
Buscar mensajes del user en canales relevantes — contexto de bloqueos mencionados.

## Formato Output

### Per-person standup
```markdown
## 👤 Alice

**Ayer hice:**
- ✅ Finalizó TUNI-123 "Add OAuth support" (PR #456 merged)
- 🔄 Avanzó en TUNI-124 "Refactor auth middleware" (ahora In Review)
- 💬 2 code reviews

**Hoy voy a:**
- [Sugerido basándose en tickets In Progress]
- Finalizar TUNI-124 después de review feedback
- Empezar TUNI-125 "Add rate limiting"

**Bloqueos:**
- Esperando review de Bob en PR #456
```

### Team standup
```markdown
# Daily Standup — 2026-04-12

## 📊 Ayer
- 4 tickets completados
- 12 commits
- 3 PRs abiertos, 2 mergeados

## 👥 Individual

[Per-person sections]

## 🚨 Bloqueos activos
- Alice ← esperando review de Bob
- Carol ← esperando specs de PM

## 🎯 Foco del día
- Finalizar features de sprint (3 en review)
- Empezar X

## 📅 Milestones próximos
- Release v2.1: viernes 2026-04-14
```

## Comando

```
/standup-report [--team X] [--post-to slack]
```

Flujo:
1. Detectar team/proyecto activo
2. Pull data en paralelo:
   - Git log
   - ClickUp tasks
   - Jira issues
   - GitHub PRs
3. Agrupar por persona
4. Formatear
5. Opcionalmente postear a Slack/Discord

## Integraciones

### Post a Slack
```
/standup-report --post-to slack:#daily-standup
```

Usa Block Kit con secciones colapsables per-person.

### Guardar en Notion/Coda
```
/standup-report --save-to notion:<page_id>
```

### Export a Sheet
```
/standup-report --save-to gsheet:<sheet_id>
```

Tracking histórico para velocity.

## Configuración

`.claude/config/standup.yml`:
```yaml
team: "Backend Educabot"
members:
  - name: Alice
    github: alice-gh
    jira_email: alice@educabot.com
    clickup_id: "..."
  - name: Bob
    github: bob-gh
    jira_email: bob@educabot.com

sources:
  clickup_space: 90138713959
  jira_project: TUNI
  github_repo: educabot/alizia-be

post_to:
  slack: "#daily-standup"

schedule: "0 9 * * 1-5"  # 9am weekdays
```

## Reglas

- **Respetar timezones** — si team distribuido, mostrar timezone del ayer relativo
- **NO incluir contenido sensible** (PII, passwords, secrets) aunque esté en commits
- **Grouping lógico**: mergear múltiples commits del mismo ticket
- **Sugerencias de "hoy"**: basado en tickets In Progress + priorities
- **Brevity**: max 5 bullets per section, collapsar el resto
