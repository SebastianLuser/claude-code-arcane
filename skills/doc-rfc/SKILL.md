---
name: doc-rfc
description: "Generate RFC docs: epics, user stories, tasks in Alizia-BE format. Trigger: RFC, technical docs, epic, user story, spec, technical breakdown."
category: "documentation"
argument-hint: "[rfc-title or feature-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
---
# RFC Documentation Generator — Estilo Alizia-BE

Genera documentación técnica estructurada: Épicas → Historias de Usuario → Tareas.

## Input

1. **Qué documentar** (nueva feature, sistema, refactor, migración)
2. **Nombre del proyecto** (para `docs/rfc-{proyecto}/`)
3. **Nivel de detalle** — `epic` (solo épica), `stories` (épica + HUs), `full` (épica + HUs + tareas)
4. **Contexto técnico** (stack, dependencias, restricciones)

## Estructura de carpetas

```
docs/rfc-{proyecto}/
├── decisiones/                    # Decision logs, comparativas técnicas
├── epicas/{NN}-{slug}/
│   ├── {NN}-{slug}.md             # Épica overview
│   └── HU-{N}.{M}-{slug}/
│       ├── HU-{N}.{M}-{slug}.md  # Historia de usuario
│       └── tareas/T-{N}.{M}.{P}-{slug}.md
└── operaciones/                   # Guides operativos
```

## Templates

> → Read templates/epica.md for the epic document skeleton
> → Read templates/hu.md for the user story document skeleton
> → Read templates/tarea.md for the task document skeleton
> → Read templates/decision.md for the technical decision document skeleton

## Numeración

- Épicas: `00`, `01`, `02` (2 dígitos, cronológico)
- Historias: `HU-{épica}.{secuencial}` → `HU-0.1`, `HU-1.2`
- Tareas: `T-{épica}.{HU}.{secuencial}` → `T-0.1.1`, `T-1.2.3`

## Rules

- Siempre en español
- Criterios aceptación verificables (si/no, no ambiguos)
- Tareas lo suficientemente pequeñas para 1 PR
- Incluir paths de archivos cuando sea posible
- Tests aceptación en HU, tests unitarios en tarea
- Decisiones técnicas con ≥2 opciones comparadas
- Links relativos entre documentos
- Si el proyecto ya tiene épicas → numerar secuencialmente
