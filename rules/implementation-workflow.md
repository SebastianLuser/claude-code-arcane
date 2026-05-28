# Implementation Workflow Rule

Before starting any non-trivial implementation task, you MUST present the user with work mode options using AskUserQuestion. This is mandatory — do not skip it and jump to coding.

## When to trigger

Present work mode options when the user:
- Asks to implement a new feature ("agregá X", "implementá Y", "hacé Z")
- Describes a task involving multiple files or architectural decisions
- Asks for a refactor, migration, or significant change
- Says "quiero hacer", "necesito", "hay que" followed by implementation work

## When NOT to trigger

Skip the work mode selection when:
- The user asks a question ("¿qué hace esto?", "¿cómo funciona?")
- The task is a small fix (typo, 1-3 line change, obvious bug)
- The user explicitly says "directo", "sin plan", "ya sé qué hacer", "just do it"
- A plan or goal is already active in the current conversation
- The user is running a specific skill (/commit, /check, /code-review, etc.)
- It's an emergency or hotfix scenario

## The question

Use AskUserQuestion exactly like this:

- Question: "¿Cómo querés encarar esta tarea?"
- Header: "Work mode"
- Options:
  1. **Action Plan (Recommended)** — "Definimos un plan paso a paso antes de implementar. Ideal para features y refactors."
  2. **Goal-driven** — "Seteamos un objetivo verificable para la sesión y trabajamos con checkpoints."
  3. **Directo** — "Arrancamos a implementar sin plan formal. Para tareas claras y rápidas."

## After selection

- **Action Plan:** Use EnterPlanMode, design the approach, get approval, create tasks, then implement step by step.
- **Goal-driven:** Help the user define a verifiable goal statement and 2-4 checkpoints, create tasks, implement toward each checkpoint.
- **Directo:** Proceed immediately without ceremony.

## Key principles

- One question, not a wall of text — present options and wait
- Respect the user's choice — if they pick "directo", do not add planning overhead
- Plans should be concise — 10-15 lines max, not a document
- Goals must be verifiable — "login works with OAuth" not "improve login"
- Never block urgent work — bugs in production skip this flow entirely
