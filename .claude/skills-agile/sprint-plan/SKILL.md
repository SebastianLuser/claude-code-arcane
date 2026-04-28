---
name: sprint-plan
description: "Generates a new sprint plan or updates an existing one based on the current milestone, completed work, and available capacity. Pulls context from production documents and design backlogs."
argument-hint: "[new|update|status] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task, AskUserQuestion
context: |
  !ls production/sprints/ 2>/dev/null
---
## Phase 0: Parse Arguments

Mode: `new`, `update`, or `status`. Resolve review mode: `--review` arg → `production/review-mode.txt` → default `lean`.

## Phase 1: Gather Context

Read: current milestone (`production/milestones/`), previous sprint (`production/sprints/`) for velocity/carryover, design docs (`design/gdd/`) for ready features, risk register (`production/risk-register/`).

## Phase 2: Generate Output

### `new` — Sprint Plan

Sprint goal (1 sentence toward milestone) + capacity (total days, 20% buffer, available) + tasks in 3 tiers (Must Have/Should Have/Nice to Have — tables: ID/task/owner/est days/dependencies/ACs) + carryover from previous + risks table + external dependencies + DoD checklist (Must Have done, ACs pass, QA plan exists, tests pass, smoke check, QA sign-off, no S1/S2 bugs, docs updated, code reviewed).

### `status` — Status Report

Progress X/Y tasks (Z%) + completed/in-progress/not-started/blocked tables + burndown assessment (on track/behind/ahead + what to cut if behind) + emerging risks.

## Phase 3: Sprint Status YAML

Write `production/sprint-status.yaml` — machine-readable source of truth for story status. Fields per story: id, name, file, priority (must-have/should-have/nice-to-have), status (backlog/ready-for-dev/in-progress/review/done/blocked), owner, estimate_days, blocker, completed. Updated by `/story-done`.

## Phase 4: Producer Feasibility Gate

Solo/lean → skip. Full → spawn `producer` gate PR-SPRINT with proposed stories, capacity, carryover, milestone constraints. UNREALISTIC → revise story selection. CONCERNS → surface to user. Then ask write approval → `production/sprints/sprint-[N].md`.

## Phase 5: QA Plan Gate

Glob for `production/qa/qa-plan-sprint-[N].md`. Found → note in output. Not found → surface explicitly: sprint without QA plan means undefined test requirements. AskUserQuestion: run `/qa-plan sprint` now (recommended) or skip (with warning block added to sprint plan doc).

## Phase 6: Next Steps

- `/qa-plan sprint` — required before implementation
- `/story-readiness [story-file]` — validate before starting
- `/dev-story [story-file]` — begin implementing
- `/sprint-status` — check progress mid-sprint
- `/scope-check [epic]` — verify no scope creep
