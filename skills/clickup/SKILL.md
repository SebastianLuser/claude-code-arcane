---
name: clickup
description: "ClickUp integration: create/update/search tasks, docs, time entries and spaces via MCP tools."
category: "integrations"
argument-hint: "[task|doc|time] <action> <args>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# ClickUp Manager

Skill que usa el MCP nativo de ClickUp para gestión completa de tasks, docs y tiempo.

## Tools MCP Disponibles

- `mcp__clickup__searchSpaces` — listar spaces accesibles
- `mcp__clickup__searchTasks` — buscar con filtros
- `mcp__clickup__getTaskById` — detalle completo
- `mcp__clickup__createTask` — crear
- `mcp__clickup__updateTask` — actualizar (status, fields, assignees)
- `mcp__clickup__addComment` — comentar
- `mcp__clickup__createDocumentOrPage` — crear doc
- `mcp__clickup__readDocument` — leer doc
- `mcp__clickup__updateDocumentPage` — actualizar doc
- `mcp__clickup__createTimeEntry`, `getTimeEntries` — time tracking
- `mcp__clickup__getListInfo`, `updateListInfo` — gestionar listas

## Spaces Conocidos (Educabot)

| Space | ID |
|-------|-----|
| Project_T | 90138713959 |
| VR Game | 901313710103 |
| Scholar Duel | 901313710122 |

## Comandos

### Crear task
```
/clickup create [space] "título de la task"
```
Preguntá:
- Lista destino (si hay múltiples en el space)
- Tipo (feature/bug/task)
- Assignee
- Priority
- Due date
- Descripción (markdown soportado)

### Buscar tasks
```
/clickup search [query]
```
Filtros posibles:
- por space, list, assignee, status, priority
- por texto en title/description
- por date range (created/updated/due)

Devolver tabla:
| ID | Title | Status | Assignee | Due |

### Actualizar task
```
/clickup update <task_id>
```
Cambios comunes:
- Status (Open, In Progress, Review, Done, Archived)
- Assignee (uno o múltiples)
- Priority (Urgent/High/Normal/Low)
- Due date
- Custom fields

### Comentar
```
/clickup comment <task_id> "texto"
```

### Docs
```
/clickup doc create [space] "título"
/clickup doc read <doc_id>
/clickup doc update <doc_id>
```

### Time tracking
```
/clickup time start <task_id>
/clickup time stop <task_id>
/clickup time report [period]
```

## Flujos Típicos

### Daily triage
1. Listar tasks asignadas a mí en estado "Open" o "In Progress"
2. Agrupá por priority
3. Sugerí reordenamiento si hay misalignment

### Crear feature con contexto completo
1. User describe feature
2. Detectá space target (por keywords o preguntá)
3. Buscá tasks similares para evitar duplicados
4. Generá descripción estructurada:
   ```markdown
   ## Contexto
   [por qué se necesita]

   ## Descripción
   [qué hace]

   ## Acceptance criteria
   - [ ] Criterio 1
   - [ ] Criterio 2

   ## Referencias
   - [links a docs, designs, tickets relacionados]
   ```
5. Pedí confirmación antes de crear
6. Crear task, devolver URL

### Bulk update
Para actualizar múltiples tasks:
1. Listá las targeteadas (con filtros)
2. Mostrá preview del cambio
3. Pedí confirmación
4. Ejecutá uno por uno con rate limiting

## Reglas

- **SIEMPRE** confirmar antes de crear/actualizar/eliminar
- **NO** crear duplicados — buscar primero
- **NO** cambiar assignees sin saber quién está en el space
- **Rate limit**: max 10 operaciones consecutivas, después pausar
- Descripción siempre en markdown estructurado
- En español
