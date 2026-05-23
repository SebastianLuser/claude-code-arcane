---
name: jira-tickets
description: |
  LEER SIEMPRE ANTES de gestionar Jira. Proyectos: Alizia (ALZ), Tich (TICH), TUNI, Vigía (VIA). Opera via curl + REST API v3 (NO MCP). IDs cacheados de proyectos, estados, transiciones, tipos y usuarios.
category: "integrations"
argument-hint: "[create|search|update|transition] <args>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Jira Tickets CLI — Educabot

Via **curl + REST API v3** en `aula-educabot.atlassian.net`. Auth: `source ~/.config/jira/credentials` → `JIRA_AUTH="$JIRA_EMAIL:$JIRA_API_TOKEN"`. Links: `https://aula-educabot.atlassian.net/browse/{KEY}`.

## Usuario actual

Juan Mateos Galante — `712020:98d3a4a5-6a5a-4aeb-9562-99b23026769c`

> → Read references/team-data.md for users (account_ids), projects (IDs), issue types, and custom fields

> → Read references/states-epics-sprints.md for transition IDs, TUNI epics, and sprint IDs

## API Operations

| Operación | Método | Endpoint | Notas |
|-----------|--------|----------|-------|
| Crear | POST | `/issue` | fields en JSON |
| Buscar (JQL) | POST | `/search/jql` | **NO** `/search` (eliminado) |
| Obtener | GET | `/issue/{KEY}?fields=...` | |
| Editar | PUT | `/issue/{KEY}` | 204=éxito |
| Transicionar | POST | `/issue/{KEY}/transitions` | `{"transition":{"id":"21"}}` |
| Comentar | POST | `/issue/{KEY}/comment` | ADF body |
| Sprints | GET | `$AGILE_API/board/33/sprint?state=active,future` | |
| Mover a sprint | POST | `$AGILE_API/sprint/{ID}/issue` | `{"issues":["KEY"]}` |
| Bulk create | POST | `/issue/bulk` | Array issueUpdates |

**Descripción API v3:** DEBE ser ADF (`{"type":"doc","version":1,"content":[...]}`). Nodos: paragraph, bulletList, heading (attrs.level), codeBlock, text con marks (strong, link).

## Workflows

1. **Crear:** detectar proyecto → resolver assignee → campos ADF → POST → reportar link
2. **Buscar:** JQL → POST `/search/jql` → parsear → tabla Key/Summary/Status/Assignee
3. **Reporte:** JQL sprint abierto → agrupar status → % avance
4. **Actualizar:** transicionar/PUT/comment → confirmar
5. **Bulk:** parsear lista → confirmar → `/issue/bulk` o loop → reportar
6. **Contexto:** GET completo → presentar summary/description/status/comments

## Troubleshooting

- **Verificar:** `curl -s -u "$JIRA_AUTH" "$API/myself" | jq '.displayName'`
- **401:** Token expirado → regenerar id.atlassian.com
- **400 ADF:** Verificar structure doc/version/content
- **Errores:** `| jq '.errors, .errorMessages'`
