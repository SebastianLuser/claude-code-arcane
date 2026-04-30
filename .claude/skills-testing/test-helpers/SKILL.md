---
name: test-helpers
description: "Generate test helper libraries: assertion utilities, factories, mocks tailored to project patterns. Outputs tests/helpers/."
category: "testing"
argument-hint: "[system-name | all | scaffold]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write
---
# Test Helpers

Output: `tests/helpers/` with engine-specific helpers. Run after `/test-setup`, when tests repeat boilerplate, or when starting tests for a new system.

## Arguments

| Mode | Behavior |
|------|----------|
| `[system-name]` | Helpers for a specific system |
| `all` | Helpers for all systems with test files |
| `scaffold` | Base helper library only (first run) |
| No arg | `scaffold` if no helpers exist, else `all` |

## Detection

- Read `.claude/docs/technical-preferences.md` → Engine, Language, Framework
- No engine → stop: "Run `/setup-engine` first"
- Scan `tests/**/*_test.*` (up to 5 files): extract setup, assertion, factory, mock patterns
- Read `design/gdd/systems-index.md`, in-scope GDDs, `docs/architecture/tr-registry.yaml`

## Base Helpers (per engine)

**Unity (NUnit/C#):** `GameAssertions.cs` (AssertInRange, AssertEventRaised, AssertHasComponent) + `GameFactory.cs` (MakeGameObject, MakeScriptableObject)

**Unreal (C++):** `GameTestHelpers.h` (GAME_TEST_ASSERT_IN_RANGE, GAME_TEST_ASSERT_VALID, GAME_TEST_ASSERT_SPAWNED macros + CreateTestWorld helper)

## System-Specific Helpers

For each system, read its GDD → extract data types, formula bounds, edge cases. Generate `tests/helpers/[system]_factory.[ext]` with factory functions + domain constants from GDD.

Pattern: constants from GDD bounds, factory methods for minimal test objects (attacker, target, etc.), domain assertion wrappers.

## Write Output

Present summary of files to create → ask approval → write. **Never overwrite existing files** — skip with message if file exists.

## Protocol

- Never overwrite existing helpers (may contain hand-written customizations)
- Helpers reflect GDD bounds and constants, not invented values
- Generated code is a starting point — adapt to actual class structure
- Ask before writing to `tests/`
