---
name: start
description: "Onboarding adaptativo al Arcane. Detecta contexto del proyecto y guía al usuario a la división/skill correcta. USAR SIEMPRE en primera sesión de un proyecto nuevo. Usar cuando el usuario mencione: start, empezar, arrancar, primera vez, onboarding, qué hago, por dónde empiezo."
---

# Start — Onboarding Adaptativo

Entry point para sesiones nuevas. Detecta contexto, hace preguntas clave, y rutea al usuario a la división apropiada.

## Flujo

### Paso 1: Detectar contexto existente

Escanear en paralelo:
```bash
# Proyecto Unity?
ls ProjectSettings/ProjectVersion.txt 2>/dev/null

# Unreal?
ls *.uproject 2>/dev/null

# Web/Node?
ls package.json 2>/dev/null

# Go?
ls go.mod 2>/dev/null

# Python?
ls pyproject.toml requirements.txt 2>/dev/null

# Flutter?
ls pubspec.yaml 2>/dev/null

# Rust?
ls Cargo.toml 2>/dev/null

# Existing docs?
ls README.md CLAUDE.md design/ docs/ 2>/dev/null

# Existing session state?
ls production/session-state/active.md 2>/dev/null
```

### Paso 2: Determinar etapa del proyecto

Posibles estados:

**A) Sin proyecto (greenfield)**
- Directory vacío o solo Arcane base
- No hay código ni design docs

**B) Idea/concept stage**
- Docs design preliminares
- No hay implementación

**C) Design stage**
- GDDs, specs, architecture docs
- Poco o nada de código

**D) Development stage**
- Código existente
- Tickets activos
- Sprint en curso

**E) Mature project (existing work)**
- Production deployed
- Múltiples milestones
- Usuarios activos

### Paso 3: Ask adaptive questions

Con AskUserQuestion (multi-tab):

**Tab 1 — "Proyecto":** ¿Qué querés hacer?
- Empezar un proyecto nuevo
- Trabajar en un proyecto existente
- Explorar el Arcane (qué tiene)
- Consultar herramientas (ClickUp, Jira, etc.)

**Tab 2 — "Tipo":** ¿Qué tipo de proyecto?
- Juego (Unity/Unreal/web)
- Aplicación web (frontend+backend)
- API / backend service
- App móvil (iOS/Android)
- Herramienta interna
- Otro / no aplica

**Tab 3 — "Rol":** ¿Qué rol vas a ocupar?
- Developer (escribir código)
- Product manager (specs, roadmap)
- Designer (UI/UX)
- PM/Scrum Master (gestionar sprint)
- Mix / full-stack

### Paso 4: Route to division

Basado en respuestas, recomendar división(es):

| Tipo | Rol | División primaria | Skills clave |
|------|-----|------------------|--------------|
| Juego | Dev | Division 1 (Game Dev) | `/brainstorm`, `/setup-engine`, `/design-system` |
| Web app | Dev | Division 2 (Software Eng) | `/scaffold-nextjs`, `/create-architecture` |
| API | Dev | Division 2 | `/scaffold-go`, `/scaffold-fastapi`, `/design-api` |
| Móvil | Dev | Division 2 | `/scaffold-flutter`, `/scaffold-react-native` |
| Juego | Designer | Division 1 | `/brainstorm`, `/quick-design`, `/doc-gdd` |
| Web | Designer | Division 4 (Product) | `/ux-design`, `/design-handoff` |
| Any | PM | Division 5 (PMO) | `/sprint-planning`, `/clickup`, `/jira-tickets` |

### Paso 5: Set session state

Crear `production/session-state/active.md`:
```markdown
# Active Session — [date]

**Project:** [name]
**Division:** [primary division]
**Stage:** [A-E]
**User role:** [role]
**Next action:** [suggested command]

## Context
- Stack detected: [X, Y, Z]
- Existing artifacts: [list]
- Active tickets: [count]

## Recommended flow
1. [command 1]
2. [command 2]
3. [command 3]
```

### Paso 6: First action

Ofrecer al user las 3 opciones más relevantes:
```
AskUserQuestion:
- "¿Qué hacemos primero?"
- Options:
  - [Primary recommendation] (Recommended)
  - [Secondary option]
  - "Ver todas las skills disponibles"
  - "Solo quería explorar — chao"
```

## Routing Cheatsheet

### Para empezar de cero un game
```
/start → Division 1 → /brainstorm → /setup-engine → /art-bible → /design-system
```

### Para empezar una web app
```
/start → Division 2 → /scaffold-nextjs (o apropiado) → /create-architecture → /design-api
```

### Para un sprint en curso
```
/start → Division 5 → /clickup status (o jira) → /standup-report
```

### Para integración de herramientas
```
/start → Division 8 → /sync-all init → /standup-report setup
```

## Context Files Loaded

Cuando se corre `/start`, load estos archivos:
- `CLAUDE.md` — project config
- `.claude/docs/division-structure.md`
- `.claude/docs/agent-hierarchy.md`
- `production/session-state/active.md` (si existe)

## Reglas

- **Siempre correr primero** en sesión nueva
- **Nunca asumir** — hacer preguntas si el contexto es ambiguo
- **Máximo 3 preguntas** para no sobreabrumar
- **Output accionable** — al final, el user sabe qué hacer next
- **Remember preferences**: guardar en session state para no re-preguntar
- **Escape hatch**: user siempre puede decir "solo quiero X" y saltarse onboarding
