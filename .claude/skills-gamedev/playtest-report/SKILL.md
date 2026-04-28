---
name: playtest-report
description: "Generates a structured playtest report template or analyzes existing playtest notes into a structured format. Use this to standardize playtest feedback collection and analysis."
argument-hint: "[new|analyze path-to-notes] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Task, AskUserQuestion
---

## Phase 1: Parse Arguments

Resolve review mode: `--review` arg > `production/review-mode.txt` > default `lean`. See `.claude/docs/director-gates.md`.

Modes: `new` → blank template, `analyze [path]` → structured findings from raw notes.

## Phase 2A: New Template Mode

Generate template with sections: Session Info (date, build, duration, tester, platform, input method, session type), Test Focus, First Impressions (understood goal/controls, emotional response), Gameplay Flow (worked well, pain points with severity, confusion points, moments of delight), Bugs Encountered (table: description, severity, reproducible), Feature-Specific Feedback (per feature: understood purpose, engaging, suggestions), Quantitative Data (deaths, time per area, items used, features discovered vs missed), Overall Assessment (play again, difficulty, pacing, session length), Top 3 Priorities.

## Phase 2B: Analyze Mode

Read raw notes. Cross-reference with design documents. Fill template with structured findings. Flag observations that conflict with design intent.

## Phase 3: Action Routing

| Bucket | Route |
|--------|-------|
| Design changes | `/propagate-design-change [path]` for downstream impacts |
| Balance adjustments | `/balance-check [system]` before tuning |
| Bugs | `/bug-report` to formally track |
| Polish items | Add to `production/` polish backlog |

## Phase 3b: Creative Director Review

Review mode: `solo`/`lean` → skip CD-PLAYTEST. `full` → spawn `creative-director` via Task with gate CD-PLAYTEST. Pass report, pillars/core fantasy, hypothesis. Add `## Creative Director Assessment` if CONCERNS/REJECT.

## Phase 4: Save Report

Ask to write to `production/qa/playtests/playtest-[date]-[tester].md`.

## Phase 5: Next Steps

- Act on highest-priority finding category first
- Design changes → `/design-review` on updated GDD
- Bugs → `/bug-triage` to update priorities
