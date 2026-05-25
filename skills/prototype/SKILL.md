---
name: prototype
description: "Rapid prototyping workflow. Skips normal standards to quickly validate a game concept or mechanic. Produces throwaway code and a structured prototype report."
category: "design"
argument-hint: "[concept-description] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task
agent: prototyper
isolation: worktree
---

## Phase 1: Define the Question

Resolve review mode: `--review` arg > `production/review-mode.txt` > default `lean`. See `.claude/docs/director-gates.md`.

Read concept description. Identify core question the prototype must answer. If vague, state question explicitly before proceeding.

## Phase 2: Load Project Context

Read CLAUDE.md for stack/engine/frameworks — prototype uses compatible tooling.

## Phase 3: Plan the Prototype

Define in 3-5 bullets: core question, minimum code needed, what to skip (error handling, polish, architecture). Present plan, confirm if scope unclear.

## Phase 4: Implement

Ask to create `prototypes/[concept-name]/`. Every file starts with `// PROTOTYPE - NOT FOR PRODUCTION` header (question + date).

Relaxed standards: hardcode values, placeholder assets, skip error handling, simplest approach, copy don't import. Run prototype, collect measurable data (frame times, interaction counts, feel).

## Phase 5: Generate Prototype Report

Report sections: Hypothesis, Approach, Result (observations not opinions), Metrics (frame time, feel assessment with specifics, action counts, iteration count), Recommendation (PROCEED / PIVOT / KILL with evidence), If Proceeding (architecture, perf targets, scope, effort), If Pivoting (alternative direction), If Killing (why + what instead), Lessons Learned.

Ask to write to `prototypes/[concept-name]/REPORT.md`.

## Phase 6: Creative Director Review

Review mode: `solo`/`lean` → skip CD-PLAYTEST. `full` → spawn `creative-director` via Task with gate CD-PLAYTEST. Pass report, design question, pillars/core fantasy. CD verdict overrides prototyper recommendation — update REPORT.md if different.

## Phase 7: Summary and Next Steps

Output: core question, result, prototyper recommendation, CD final decision, link to report.

- **PROCEED**: `/design-system` for production GDD or `/architecture-decision`
- **PIVOT**: `/prototype [revised-concept]`
- **KILL**: report is the deliverable

### Constraints

- Prototype code NEVER imports from production; production NEVER imports from prototypes
- If PROCEED, production implementation from scratch — no prototype refactoring
- Timebox: 1-3 days. If scope grows, stop and simplify the question
