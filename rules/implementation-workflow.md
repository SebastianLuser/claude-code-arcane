# Implementation Workflow Rule

Before starting a non-trivial implementation task, present the user with work mode options using AskUserQuestion, so they choose how much planning the task gets before any code is written.

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
- Options (4):
  1. **Plan + Goal (Recommended)** — "Plan detallado de CÓMO + goal de HASTA DÓNDE llegar. Lo más completo: el plan guía la ejecución, el goal define cuándo frenar y qué validar."
  2. **Action Plan** — "Solo plan paso a paso. Sin goal de sesión — implementamos hasta terminar el plan."
  3. **Goal-driven** — "Solo objetivo verificable con checkpoints. Sin plan formal."
  4. **Directo** — "Arrancamos sin ceremonia. Para tareas claras y rápidas."

## After selection

- **Plan + Goal:** First define the verifiable session goal with validation criteria. Then EnterPlanMode and design the implementation plan linked to the goal. Plan includes explicit stop conditions (goal met, blocker, scope creep). After approval, create tasks and execute. After each significant step, check progress against the goal. When goal is met, STOP and run the goal review below.
- **Action Plan:** Use EnterPlanMode, design the approach, get approval, create tasks, then implement step by step. No formal goal — implement until the plan is done.
- **Goal-driven:** Help the user define a verifiable goal statement and 2-4 checkpoints, create tasks, implement toward each checkpoint. No formal plan. When the last checkpoint is met, run the goal review below.
- **Directo:** Proceed immediately without ceremony.

## Progress file

In **Plan + Goal** and **Goal-driven** mode, keep `.claude/session-state/active.md` up to date. A compaction or a new session loses the conversation, not this file: `session-start.sh` shows its first lines when a session starts and after every compaction.

- **Create it** when the goal is set. If `.claude/session-state/` does not exist yet, create it with a `.gitignore` containing `*`, so the file never lands in a commit.
- **Update it** at every checkpoint, and always before a compaction.
- **Close it** when the task ends: set `Status: closed` and record the final verification result.
- Keep it under 30 lines:

```markdown
# <task>
Status: in progress | closed
Goal: <verifiable outcome>
Criteria: <how we know it is done>
Plan:
- [x] <step done>
- [ ] <step pending>
Decisions: <decision> — <why>
Next: <the next concrete step>
Not verified: <what has not been checked yet>
```

Directo and Action Plan tasks do not need it.

## Goal review

In **Plan + Goal** and **Goal-driven** mode, whoever did the work does not decide it is done. When the goal looks met, start one `general-purpose` subagent with a clean context. Its prompt carries only:

- the goal and the criteria from `active.md`;
- the diff against the base branch, untracked files included;
- how to verify: test, build and type-check commands, and how to start the app;
- if the task changed a web UI: the paths of the Playwright screenshots, or that the user declined Playwright;
- the instructions below, verbatim.

Never pass your reasoning or a summary of the conversation: the reviewer judges the work, not the story behind it.

> You are reviewing finished work against its goal. Do not trust any reported result: run every verification yourself. Check each criterion against the code and your own runs. If the diff touches authentication, user input, database queries, file system paths, external APIs, cryptography or payments, also check that input is validated at the boundary, queries are parameterized, no secret is in code or logs, every new path checks authorization, and errors leak no internals. If the task changed a web UI, there are no Playwright screenshots and you cannot produce them, the verdict is FAIL, unless the user declined Playwright: then note "visual result not verified". Answer with `PASS` or `FAIL` on the first line, then one line per criterion with its evidence (the command and its result, or `file:line`), then what is missing.

Then:

1. Show the user the reviewer's verdict as it came, before your own comments.
2. **FAIL:** fix what it found and review again with a new subagent. After a second FAIL, stop and bring both verdicts to the user.
3. **PASS:** close `active.md` with the verdict.

## Before writing new code

In every mode, search in this order and take the first option that fully works:

1. **The codebase**: a helper, component or pattern that already does it.
2. **The standard library** or a platform feature.
3. **A dependency the project already has.**
4. **A new dependency**, only when 1–3 cannot do it. Name the package and why before installing it.

## Key principles

- One question, not a wall of text — present options and wait
- Respect the user's choice — if they pick "directo", do not add planning overhead
- Plans should be concise — 10-15 lines max, not a document
- Goals must be verifiable — "login works with OAuth" not "improve login"
- Never block urgent work — bugs in production skip this flow entirely
