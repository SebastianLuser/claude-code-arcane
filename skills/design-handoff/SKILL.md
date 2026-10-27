---
name: design-handoff
description: "Design handoff: Figma design to tech spec + ClickUp/Jira ticket + component code stub. Full cross-tool handoff workflow."
category: "design"
argument-hint: "[figma-node-id or url]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Design Handoff Workflow

Figma → spec doc → ticket (ClickUp/Jira) → component code stub → bidirectional links.

`/design-handoff <figma_url> [--target clickup|jira] [--stack react|vue|flutter]`

## Step by Step

### 1. Inspect Figma
Use the `figma` skill: GET node data → extract dimensions, layout, states, interactions, tokens used, assets to export.

### 2. Generate the Spec

Structured document with: purpose (1-2 sentences), anatomy (pseudo-component tree), variants table (variant/description/props), states table (state/description/trigger — default/hover/active/loading/error/empty), design tokens (colors/typography/spacing/radius/shadow), measurements table (element/dimension), interactions (click/hover/keyboard), responsive breakpoints (desktop ≥1024, tablet 768-1023, mobile <768), accessibility (focus visible, ARIA, keyboard nav, contrast 4.5:1, text alternatives), assets to export (file + output dir).

### 3. Create the Ticket

**ClickUp:** createTask with list_id, name `[Component] Implement X`, spec embedded in the description, tags: frontend/component/design-ready.

**Jira:** POST issue with project key, summary, ADF description, Task type, labels.

### 4. Generate the Code Stub

React+TS stub: component file (interface with props from variants/states, JSX with semantic HTML, CSS module imports) + CSS module file (tokens as CSS vars). A compilable stub — not pseudo-code.

Assets: export from Figma into the repo directory.

### 5. Link Everything

In the ticket: link to the spec doc + Figma + PR reference once it exists.

## Config

`.claude/config/design-handoff.yml`: default_target, default_list_id, stack, components_dir, assets_dir, designers mapping (figma_email → clickup_id/jira_email).

## Rules

- Spec embedded in the ticket — the dev does not open 3 tabs
- Assets exported to the repo immediately
- Compilable code stub (`npm run build` works)
- Bidirectional link: spec ↔ Figma ↔ ticket ↔ code
