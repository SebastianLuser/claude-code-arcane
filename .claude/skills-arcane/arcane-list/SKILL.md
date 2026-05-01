---
name: arcane-list
description: "List all available Arcane profiles and skills from the source repo, marking installed ones."
category: "arcane"
user-invocable: true
allowed-tools: Read, Bash, Glob, Grep
---
# /arcane-list — List available profiles and skills

List all profiles and skills available in the Arcane source repo, so you can see what's available to add.

## Steps

1. Read `.claude/arcane-manifest.json` to find the `source` path (Arcane repo location)
2. If no manifest, ask the user for the Arcane repo path
3. From the source repo, list:
   - **Base profiles** from `profiles/*.profile` where Type = base
   - **Addon profiles** from `profiles/*.profile` where Type = addon
   - **All skills** organized by pool (`skills-*` directories)
4. Mark skills that are already installed in the current project with `[installed]`

## Output format

```
=== Available Profiles ===
Base:
  backend-ts     Backend TypeScript — Fastify, Prisma, Zod
  backend-go     Backend Go — scaffold, DB, auth, API design
  frontend       Frontend React + Vite + TypeScript
  ...

Addons:
  +agile         Gestión de proyecto — sprints, standups
  +testing       Testing avanzado — contract, performance
  ...

=== Skills by Pool ===
skills-backend (37):
  api-design [installed], api-docs, api-versioning [installed], ...
skills-frontend (9):
  accessibility, cdn-setup, csp-headers, ...
...
```
