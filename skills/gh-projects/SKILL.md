---
name: gh-projects
description: "Manage GitHub Projects v2 via gh CLI + GraphQL: boards, items, fields, views, automations."
category: "integrations"
argument-hint: "[list|create|add|update] [project/item]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# GitHub Projects Manager

Interactúa con GitHub Projects v2 (el nuevo sistema de project management de GitHub, no los classic).

## Setup

Requiere `gh CLI` autenticado:
```bash
gh auth status
gh auth refresh -s project  # scope para projects
```

## Comandos gh CLI

### Listar projects
```bash
gh project list --owner <user-or-org>
gh project list --owner myorg --format json
```

### Ver project
```bash
gh project view <number> --owner <owner>
gh project item-list <number> --owner <owner>
```

### Agregar item (issue o PR existente)
```bash
gh project item-add <number> --owner <owner> --url https://github.com/org/repo/issues/123
```

### Crear draft item (sin issue)
```bash
gh project item-create <number> --owner <owner> --title "Draft idea"
```

### Editar fields
```bash
gh project item-edit --id <item_id> --project-id <project_id> \
  --field-id <field_id> --single-select-option-id <option_id>
```

## GraphQL para Operaciones Complejas

Para operaciones que `gh project` CLI no soporta (filtros complejos, bulk updates, iteraciones, draft items), usar GraphQL via `gh api graphql`.

> Queries completas con variables (GetProject, GetProjectItems, UpdateStatus, AddItem, CreateDraft, DeleteItem) y cómo obtener IDs: leer `references/graphql-queries.md`.

## Casos de Uso

### Roadmap board
Estructura típica:
- Fields: Status (Todo/In Progress/Done), Priority, Quarter, Epic
- Views: By Quarter, By Epic, By Status

### Bug triage board
- Fields: Severity, Reproducible, Owner, First Seen
- Views: By Severity, Needs Triage

### Sprint board
- Fields: Sprint, Story Points, Assignee, Status
- Views: Current Sprint, Next Sprint

## Comandos

### Crear epic con tasks
```
/gh-projects epic <project> "epic title"
```

1. Crear draft item "Epic: X" en el project
2. Crear issues children en repo linked
3. Linkear cada issue al epic via task list
4. Agregar cada issue al project con Status=Todo

### Sync issues → project
```
/gh-projects sync <repo> <project>
```
- Listar issues abiertos en repo
- Agregar al project los que no estén
- Setear Status=Todo por default

### Board snapshot
```
/gh-projects snapshot <project>
```
Reporte actual del board en markdown.

## Reglas

- **Projects v2 ≠ Projects classic.** Este skill NO soporta classic (deprecado).
- **IDs globales**: Projects v2 usa node IDs opacos (`PVT_...`), no números simples.
- **Rate limit**: GitHub API tiene 5000 req/h — generoso pero no infinito.
- **Webhooks disponibles** para automación real-time (fuera de scope de este skill).
