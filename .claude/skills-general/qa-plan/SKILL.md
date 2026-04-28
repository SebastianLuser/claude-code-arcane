---
name: qa-plan
description: "Generate a QA test plan for a sprint or feature. Reads GDDs and story files, classifies stories by test type (Logic/Integration/Visual/UI), and produces a structured test plan covering automated tests required, manual test cases, smoke test scope, and playtest sign-off requirements. Run before sprint begins or when starting a major feature."
argument-hint: "[sprint | feature: system-name | story: path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion
agent: qa-lead
---

# QA Plan

Generates structured QA plan for sprint/feature/story. Reads story files + GDDs, classifies by test type, produces plan with automated tests, manual checks, smoke scope, playtest requirements. **Run before sprint begins.**

Output: `production/qa/qa-plan-[sprint-slug]-[date].md`

## Phase 1: Parse Scope

- **`sprint`** — read latest file in `production/sprints/`, extract story paths (prefer `sprint-status.yaml` if exists)
- **`feature: [name]`** — glob `production/epics/*/story-*.md`, filter by system name
- **`story: [path]`** — single file
- **No argument** — AskUserQuestion: Current sprint / Specific feature / Specific story / Full epic

Missing story files → note as MISSING, continue with rest.

## Phase 2: Load Inputs

Per story extract: title/ID, story type, acceptance criteria, implementation files, engine notes, GDD/ADR references, estimate, dependencies.

Supporting context (once): `design/gdd/systems-index.md`, GDD Acceptance Criteria + Formulas sections for each referenced GDD, `docs/architecture/control-manifest.md` forbidden patterns.

## Phase 3: Classify Stories

| Story Type | Indicators |
|------------|-----------|
| **Logic** | Calculations, formulas, thresholds, state transitions, data validation |
| **Integration** | ≥2 systems interacting, events across boundaries, save/load, network |
| **Visual/Feel** | Animation, VFX, shaders, timing, screen shake, audio sync |
| **UI** | Menus, HUD, buttons, screens, tooltips, panels |
| **Config/Data** | Balance tuning, data files, configuration only |

Mixed stories: assign primary by highest implementation risk, note secondary. Show classification summary table before Phase 4.

## Phase 4: Generate Test Plan

Sections:
- **Test Summary** — table: story, type, automated test required, manual verification required
- **Automated Tests Required** — per story: test file path, what to test (formulas/rules/transitions), edge cases (zero/max/invalid + GDD edge cases), estimated test count. No GDD formula → flag gap
- **Manual QA Checklist** — per story: verification method, sign-off (designer/lead/qa), evidence to capture, concrete checklist items. Subjective criteria → supplemented with benchmark
- **Smoke Test Scope** — launch, new session, primary mechanic, regression risks, save/load, performance
- **Playtest Requirements** — table: story, goal (question to answer), min sessions, target player type. Notes path for sign-off
- **Definition of Done** — all ACs verified, test files exist (Logic/Integration), manual evidence (Visual/UI), smoke passes, no regressions, code reviewed, story status updated

Use actual story titles and GDD content — no placeholder text.

## Phase 5: Write Output

Show plan (or summary if very long). "May I write to `production/qa/qa-plan-[sprint-slug]-[date].md`?"

After writing: share with team before sprint, run `/smoke-check sprint` after implementation, create test files at listed paths before marking done.

## Protocol

- Never write without asking
- Classify conservatively: ambiguous Logic/Integration → Integration (needs both test types)
- Don't invent test cases beyond ACs and GDD formulas — flag gaps instead
- Playtest requirements are advisory — user decides borderline cases
- AskUserQuestion only for scope selection; rest is present-then-approve
