---
name: sprint-report
description: "Reporte unificado de sprint: combina datos de Jira (tickets, estados, asignaciones) con GitHub (PRs mergeados, commits, branches). Usar cuando se mencione: reporte de sprint, avance, cómo vamos, daily, retro, sprint review."
argument-hint: "[sprint-id or current]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Sprint Report Generator

Genera un reporte unificado combinando Jira + GitHub para el sprint actual.

## Input

Argumento opcional: `$ARGUMENTS`
- Nombre de proyecto: "TUNI", "TICH", "ALZ", "VIA"
- Si no se especifica → preguntar

## Process

### 1. Cargar credenciales

```bash
source ~/.config/jira/credentials
JIRA_AUTH="$JIRA_EMAIL:$JIRA_API_TOKEN"
API="$JIRA_BASE_URL/rest/api/3"
```

### 2. Obtener datos de Jira

```bash
# Issues del sprint activo
curl -s -X POST -u "$JIRA_AUTH" -H "Content-Type: application/json" \
  "$API/search/jql" \
  -d '{
    "jql": "project = {KEY} AND sprint in openSprints() ORDER BY status ASC",
    "fields": ["summary","status","assignee","priority","issuetype","labels","parent"],
    "maxResults": 100
  }'
```

Agrupar por estado:
- Tareas por hacer (new)
- En curso (in-progress)
- Por subir / QA / En revisión
- Finalizadas (done)
- Bloqueadas
- Canceladas

### 3. Obtener datos de GitHub

```bash
# PRs mergeados en la última semana (o sprint)
gh pr list --state merged --limit 50 --json number,title,author,mergedAt,additions,deletions

# PRs abiertos
gh pr list --state open --json number,title,author,createdAt,reviewDecision

# Commits en main de la última semana
git log main --since="1 week ago" --pretty=format:"%h|%s|%an|%ad" --date=short
```

### 4. Cruzar datos

- Mapear PRs a tickets de Jira por key en el título (e.g., "TUNI-123: ...")
- Detectar tickets sin PR asociado (posible trabajo pendiente de subir)
- Detectar PRs sin ticket asociado (trabajo no trackeado)

### 5. Generar reporte

```markdown
# Sprint Report — [Proyecto] — [Sprint Name] — [Fecha]

## Resumen
| Métrica | Valor |
|---------|-------|
| Total tickets | X |
| Completados | Y (Z%) |
| En progreso | N |
| Bloqueados | M |
| PRs mergeados | P |
| Líneas +/- | +A / -B |

## Velocidad
[Barra de progreso visual: ████████░░ 80%]

## Por estado

### Finalizados
| Ticket | Título | Assignee | PR |
|--------|--------|----------|-----|

### En progreso
| Ticket | Título | Assignee | Status | PR |
|--------|--------|----------|--------|-----|

### Bloqueados
| Ticket | Título | Assignee | Motivo |
|--------|--------|----------|--------|

### Sin empezar
| Ticket | Título | Assignee | Prioridad |
|--------|--------|----------|-----------|

## PRs abiertos (pendientes de review)
| PR | Título | Autor | Días abierto |
|----|--------|-------|-------------|

## Alertas
- Tickets sin PR asociado
- PRs sin ticket asociado
- Tickets en "En curso" hace más de 3 días sin actividad
- Tickets sin asignar

## Por persona
| Dev | Completados | En progreso | PRs |
|-----|-------------|-------------|-----|
```

## Rules
- Usar los IDs de proyecto y sprint de la skill de jira-tickets
- Si no hay repo Git en el directorio actual → solo mostrar datos de Jira
- En español
- No cachear datos — siempre consultar en vivo
