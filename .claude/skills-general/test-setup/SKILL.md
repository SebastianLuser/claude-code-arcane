---
name: test-setup
description: "Scaffold test framework and CI pipeline: tests/ directory, runner config, GitHub Actions workflow. Run once at project setup."
category: "testing"
argument-hint: "[force]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---
# Test Setup

Scaffold automated testing infrastructure. Run once during Technical Setup phase. Output: `tests/` directory + `.github/workflows/tests.yml`.

## Phase 1: Detect Engine & State

1. Read `.claude/docs/technical-preferences.md` → Engine. Not configured → stop: "Run `/setup-engine` first"
2. Check existing: `tests/`, `tests/unit/`, `tests/integration/`, `.github/workflows/`, engine-specific dirs
3. Report findings. If everything exists and no `force` arg → "Already in place. Re-run with `force` to regenerate"
4. `force` skips early-exit but never overwrites existing files

## Phase 2: Present Plan & Get Approval

Show file list to create (skipping existing). Ask approval before proceeding.

## Phase 3: Create Structure

### Directory layout
- `tests/unit/` — isolated unit tests (formulas, state, logic)
- `tests/integration/` — cross-system tests, save/load round-trips
- `tests/smoke/critical-paths.md` — 15-min manual gate (read by `/smoke-check`)
- `tests/evidence/` — screenshot/manual sign-off records
- `tests/README.md` — framework docs (engine, runner, naming conventions, story type → evidence table)

### Engine-specific

**Unity:** `tests/EditMode/README.md` + `tests/PlayMode/README.md`. Naming: `[System]Test.cs` → `Test_Scenario_Expected()`. Runner: Window → Test Runner.

**Unreal:** `Source/Tests/README.md`. Naming: `F[System]Test`, category `MyGame.[System].[Feature]`. Runner: Session Frontend → Automation or `-ExecCmds="Automation RunTests"`.

## Phase 4: CI Workflow

`.github/workflows/tests.yml` — runs on push to main + PRs.

**Unity:** `game-ci/unity-test-runner@v4` for editmode + playmode. Requires `UNITY_LICENSE` secret.

**Unreal:** self-hosted runner with UE Editor. `UE_EDITOR_PATH` env var. `-nullrhi -nosound -unattended`.

Both: upload test results/logs as artifacts.

## Phase 5: Smoke Test Seed

`tests/smoke/critical-paths.md`: core stability (launch, new game, menu inputs), core mechanic (update per sprint), data integrity (save/load), performance (fps, memory).

## Protocol

- Never overwrite existing test files — only create missing ones
- Always ask before creating files (Phase 2 approval required)
- Engine detection is non-negotiable — stop if not configured
- `force` = create missing files even if directory exists, never overwrite
