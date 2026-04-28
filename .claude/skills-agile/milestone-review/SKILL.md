---
name: milestone-review
description: "Generates a comprehensive milestone progress review including feature completeness, quality metrics, risk assessment, and go/no-go recommendation. Use at milestone checkpoints or when evaluating readiness for a milestone deadline."
argument-hint: "[milestone-name|current] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Task, AskUserQuestion
---

## Phase 0: Parse Arguments

Extract milestone name (`current` = most recent). Resolve review mode: `--review` arg > `production/review-mode.txt` > default `lean`. See `.claude/docs/director-gates.md`.

## Phase 1: Load Milestone Data

Read milestone definition from `production/milestones/`. Read all sprint reports within this milestone from `production/sprints/`.

## Phase 2: Scan Codebase Health

Scan for TODO/FIXME/HACK markers. Check risk register at `production/risk-register/`.

## Phase 3: Generate Review

Report sections:
- **Overview**: target date, current date, days remaining, sprints completed
- **Feature Completeness**: tables for Fully Complete (acceptance criteria, test status), Partially Complete (% done, remaining, risk), Not Started (priority, can cut, impact)
- **Quality Metrics**: open bugs by severity, test coverage, performance vs budget
- **Code Health**: TODO/FIXME/HACK counts, critical tech debt
- **Risk Assessment**: table (risk, status, impact, mitigation)
- **Velocity Analysis**: planned vs completed, trend, adjusted estimate
- **Scope Recommendations**: Protect (must ship), At Risk (may cut), Cut Candidates (can defer)
- **Go/No-Go**: GO / CONDITIONAL GO / NO-GO with conditions and rationale
- **Action Items**: table (action, owner, deadline)

## Phase 3b: Producer Risk Assessment

Review mode: `solo`/`lean` → skip PR-MILESTONE. `full` → spawn `producer` via Task with gate PR-MILESTONE. Pass: milestone name/date, completion %, blocked stories, velocity, cut candidates. Producer verdict (ON TRACK / AT RISK / OFF TRACK) informs recommendation — do not GO against OFF TRACK without user acknowledgement.

## Phase 4: Save Review

Ask to write to `production/milestones/[milestone-name]-review.md`.

## Phase 5: Next Steps

- `/gate-check` for formal phase gate if milestone marks a phase boundary
- `/sprint-plan` to adjust next sprint based on scope recommendations
