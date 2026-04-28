---
name: jira-tickets
description: |
  LEER SIEMPRE ANTES de gestionar Jira. Proyectos: Alizia (ALZ), Tich (TICH), TUNI, Vigía (VIA). Opera via curl + REST API v3 (NO MCP). IDs cacheados de proyectos, estados, transiciones, tipos y usuarios.
argument-hint: "[create|search|update|transition] <args>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Jira Tickets CLI — Educabot

Via **curl + REST API v3** en `aula-educabot.atlassian.net`. Auth: `source ~/.config/jira/credentials` → `JIRA_AUTH="$JIRA_EMAIL:$JIRA_API_TOKEN"`. Links: `https://aula-educabot.atlassian.net/browse/{KEY}`.

## Usuario actual

Juan Mateos Galante — `712020:98d3a4a5-6a5a-4aeb-9562-99b23026769c`

## Usuarios del equipo

| Nombre | account_id | Aliases |
|--------|-----------|---------|
| Juan Mateos Galante | `712020:98d3a4a5-...99b23026769c` | juan, para mí |
| Alejo Bonadeo | `712020:f1ac8489-...87cdbe0ccad4` | alejo |
| Leonardo Cano | `712020:0d30fcc7-...f6684246caa8` | leo, cano |
| Rocío Etchebarne | `712020:2308197a-...a1c6d1709337` | rocio |
| Francisco Conte | `712020:7319b298-...b32a0fec6f6a` | fran |
| Sebastian Luser | `712020:58c089e2-...5007df236751` | seba, sebastian |
| José Attento | `712020:a3a4d5e5-...095114adcd77` | jose |
| Julian Quinteiro | `712020:3fdee20f-...5c256c0a3b39` | julian |
| Joaquin Brito | `712020:6f09bade-...5c256c0a3b39` | joaquin |

## Proyectos

| Proyecto | Key | ID | Aliases |
|----------|-----|----|---------|
| Alizia | ALZ | 10184 | alizia, bloques, scratch |
| Tich | TICH | 10036 | tich, cronos, flashcards |
| TUNI | TUNI | 10052 | tuni, tutoria |
| Vigía | VIA | 10049 | vigia, monitoreo |
| Design | DESIGN | 10051 | diseño, figma |
| Educabot AI | EAI | 10035 | educabot ai |
| Vocación | VOC | 10185 | vocación |

## Issue Types

| Tipo | ID | Subtask? |
|------|----|----------|
| Tarea | 10007 | No |
| Subtarea | 10008 | Sí |
| Historia | 10006 | No |
| Error | 10009 | No |
| Epic | 10000 | No |
| Design | 10079 | No |
| QA | 10112 | No |

## Custom Fields

| Campo | Field ID |
|-------|---------|
| Acceptance criteria | `customfield_10070` (ADF) |
| Design link | `customfield_10071` (URL) |
| Technical details | `customfield_10072` (ADF) |
| Test cases | `customfield_10085` (ADF) |
| QA Assignee | `customfield_10151` (user) |
| Issue quality | `customfield_10074` (radio) |
| Sprint | `customfield_10020` (number) |

## Estados y Transiciones

| Transición | Trans. ID | Status | Status ID | Cat |
|------------|-----------|--------|-----------|-----|
| Por hacer | 11 | Tareas por hacer | 10018 | new |
| En curso | 21 | En curso | 10012 | in-progress |
| Por subir | 41 | Por subir | 10019 | in-progress |
| QA | 51 | Control de calidad | 10020 | in-progress |
| En revisión | 61 | En revisión | 10021 | in-progress |
| EN PROD | 81 | EN PROD | 10105 | in-progress |
| Blocked | 91 | Blocked | 10171 | in-progress |
| Listo | 31 | Finalizada | 10007 | done |
| Canceled | 71 | Cancelado | 10036 | done |

## Épicas activas TUNI

| Key | Descripción |
|-----|-------------|
| TUNI-181 | Canvas LMS integration |
| TUNI-905 | Modelo adaptativo |
| TUNI-1007 | Sesión tutoría adaptativa |
| TUNI-1008 | Generador contenido |
| TUNI-1009 | Mobile |
| TUNI-1010 | Herramientas supervisión |
| TUNI-1011 | Hub identidad estudiante |
| TUNI-1012 | Features sociales |
| TUNI-1016 | Modo repaso |
| TUNI-1017 | Modo desempeño |
| TUNI-1018 | Cosmos (white-labeling) |
| TUNI-1019 | Memoria (persistencia contexto) |
| TUNI-1085 | Nivelación inicial |

Canceladas: TUNI-903, TUNI-906 (reemplazadas por 1007/1008).

## Sprint conocido

| Sprint | ID | Estado |
|--------|----|--------|
| AI Sprint 31 | 2147 | closed |
| AI Sprint 32 | 2213 | active |
| AI Sprint 33 | 2280 | future |

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
