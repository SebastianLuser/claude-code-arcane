---
name: design-handoff
description: "Convertir un diseño de Figma en spec técnica + ticket en ClickUp/Jira + component code stub. Workflow cross-tool de design handoff. Usar cuando el usuario mencione: design handoff, pasar de Figma a dev, implementar diseño, spec de componente, handoff a desarrollo."
argument-hint: "[figma-node-id or url]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Design Handoff Workflow

Figma → spec doc → ticket (ClickUp/Jira) → component code stub → links bidireccionales.

`/design-handoff <figma_url> [--target clickup|jira] [--stack react|vue|flutter]`

## Paso a Paso

### 1. Inspeccionar Figma
Usar `figma` skill: GET node data → extraer dimensions, layout, states, interactions, tokens usados, assets a exportar.

### 2. Generar Spec

Documento estructurado con: purpose (1-2 oraciones), anatomy (pseudo-component tree), variants table (variant/description/props), states table (state/description/trigger — default/hover/active/loading/error/empty), design tokens (colors/typography/spacing/radius/shadow), measurements table (element/dimension), interactions (click/hover/keyboard), responsive breakpoints (desktop ≥1024, tablet 768-1023, mobile <768), accessibility (focus visible, ARIA, keyboard nav, contrast 4.5:1, text alternatives), assets to export (file + output dir).

### 3. Crear Ticket

**ClickUp:** createTask con list_id, name `[Component] Implementar X`, spec embebido en description, tags: frontend/component/design-ready.

**Jira:** POST issue con project key, summary, ADF description, Task type, labels.

### 4. Generar Code Stub

React+TS stub: component file (interface con props de variants/states, JSX con semantic HTML, CSS module imports) + CSS module file (tokens como CSS vars). Stub compilable — no pseudo-code.

Assets: export desde Figma al directorio del repo.

### 5. Linkear Todo

En ticket: link a spec doc + Figma + PR reference cuando exista.

## Config

`.claude/config/design-handoff.yml`: default_target, default_list_id, stack, components_dir, assets_dir, designers mapping (figma_email → clickup_id/jira_email).

## Reglas

- Spec embebido en ticket — el dev no abre 3 tabs
- Assets exportados al repo inmediatamente
- Code stub compilable (`npm run build` funciona)
- Link bidireccional: spec ↔ Figma ↔ ticket ↔ code
