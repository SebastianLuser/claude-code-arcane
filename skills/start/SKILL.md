---
name: start
description: "Adaptive onboarding entry point. Detects project context and routes user to the right division/skill. Use on first session."
category: "workflow"
argument-hint: "[optional project hint]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Task, AskUserQuestion
---
# Start — Onboarding Adaptativo

Entry point para sesiones nuevas. Detecta contexto, hace preguntas clave, rutea a la división apropiada.

## Paso 1: Detectar contexto

Escanear en paralelo: Unity (`ProjectSettings/ProjectVersion.txt`), Unreal (`*.uproject`), Web/Node (`package.json`), Go (`go.mod`), Python (`pyproject.toml`/`requirements.txt`), Flutter (`pubspec.yaml`), Rust (`Cargo.toml`), docs (`README.md`, `CLAUDE.md`, `design/`, `docs/`), session state (`production/session-state/active.md`).

## Paso 2: Determinar etapa

| Estado | Señales |
|--------|---------|
| **A) Greenfield** | Directory vacío o solo Arcane base |
| **B) Idea/concept** | Docs design preliminares, sin implementación |
| **C) Design** | GDDs, specs, architecture docs, poco código |
| **D) Development** | Código existente, tickets activos, sprint en curso |
| **E) Mature** | Production deployed, múltiples milestones, usuarios activos |

## Paso 3: Preguntas adaptativas

AskUserQuestion multi-tab:
- **Tab "Proyecto":** Empezar nuevo / Trabajar existente / Explorar Arcane / Consultar herramientas
- **Tab "Tipo":** Juego / Web app / API-backend / App móvil / Herramienta interna / Otro
- **Tab "Rol":** Developer / Product manager / Designer / PM-Scrum Master / Mix

## Paso 4: Route to division

| Tipo | Rol | División | Skills clave |
|------|-----|----------|-------------|
| Juego | Dev | Game Dev | `/brainstorm`, `/scaffold-unity` (Unity) o `/ue-project-context` (Unreal), `/design-system` |
| Web app | Dev | Software Eng | `/nextjs-scaffold`, `/architecture-decision` |
| API | Dev | Software Eng | `/scaffold-go`, `/scaffold-fastify-ts` |
| Móvil | Dev | Software Eng | `/scaffold-react-native` |
| Juego | Designer | Game Dev | `/brainstorm`, `/quick-design`, `/doc-gdd` |
| Web | Designer | Product | `/ux-design`, `/design-handoff` |
| Any | PM | PMO | `/sprint-plan`, `/clickup`, `/jira-tickets` |

## Paso 5: Set session state

Crear `production/session-state/active.md`: project name, division, stage, user role, next action, stack detected, existing artifacts, recommended flow (3 commands).

## Paso 6: First action

AskUserQuestion: primary recommendation (Recommended), secondary option, "Ver todas las skills", "Solo explorar — chao".

## Routing Cheatsheet

- Game from scratch: `/start` → `/brainstorm` → `/scaffold-unity` (Unity) o `/ue-project-context` (Unreal) → `/art-bible` → `/design-system`
- Web app: `/start` → `/nextjs-scaffold` → `/architecture-decision` → `/api-design`
- Sprint en curso: `/start` → `/clickup status` → `/standup-report`

## Reglas

- Siempre correr primero en sesión nueva
- Nunca asumir — preguntar si contexto ambiguo
- Máximo 3 preguntas
- Output accionable — user sabe qué hacer next
- Guardar preferencias en session state
- Escape hatch: user dice "solo quiero X" → saltear onboarding
