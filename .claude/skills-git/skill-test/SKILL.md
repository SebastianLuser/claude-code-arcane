---
name: skill-test
description: "Validate skill files for structural compliance and behavioral correctness. Three modes: static (linter), spec (behavioral), audit (coverage report)."
category: "testing"
argument-hint: "static [skill-name | all] | spec [skill-name] | category [skill-name | all] | audit"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write
---

# Skill Test

Validates `.claude/skills/*/SKILL.md` for structural compliance and behavioral correctness.

## Modes

| Mode | Command | Purpose | Cost |
|------|---------|---------|------|
| `static` | `/skill-test static [name\|all]` | 7 structural checks per skill | Low (~1k/skill) |
| `spec` | `/skill-test spec [name]` | Behavioral assertions from test spec | Medium (~5k/skill) |
| `category` | `/skill-test category [name\|all]` | Category-specific rubric metrics | Low (~2k/skill) |
| `audit` | `/skill-test audit` | Coverage report — skills, agents, test dates | Low (~3k total) |

## Phase 1: Parse Arguments

`static [name]` → 7 checks on one skill. `static all` → all skills (Glob `.claude/skills/*/SKILL.md`). `spec [name]` → read skill + test spec, evaluate assertions. `category [name|all]` → category rubric from `CCGS Skill Testing Framework/quality-rubric.md`. `audit` (or no arg) → read catalog, list all, show coverage. Missing/unrecognized → output usage and stop.

## Phase 2A: Static Mode

> → Read references/static-checks.md for the 7 structural validation checks and verdict criteria

## Phase 2B: Spec Mode

> → Read references/spec-mode-procedure.md for behavioral testing procedure

## Phase 2D: Category Mode

> → Read references/category-mode-procedure.md for rubric evaluation procedure

## Phase 2C: Audit Mode

> → Read references/audit-mode-procedure.md for coverage report procedure

## Phase 3: Next Steps

> → Read references/next-steps-guide.md for post-run suggestions by mode
