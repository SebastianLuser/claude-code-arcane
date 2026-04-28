---
name: skill-test
description: "Validate skill files for structural compliance and behavioral correctness. Three modes: static (linter), spec (behavioral), audit (coverage report)."
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

## Phase 2A: Static Mode — 7 Checks

| Check | What | Verdict |
|-------|------|---------|
| 1 — Frontmatter | `name`, `description`, `argument-hint`, `user-invocable`, `allowed-tools` present | FAIL if any absent |
| 2 — Phases | ≥2 numbered phase headings (`## Phase N`, `## N.`, or ≥2 `##` headings) | FAIL if <2 |
| 3 — Verdict Keywords | Contains ≥1 of: PASS, FAIL, CONCERNS, APPROVED, BLOCKED, COMPLETE, READY, COMPLIANT, NON-COMPLIANT | FAIL if none |
| 4 — Collaborative Protocol | "May I write" / "before writing" / "approval" near file-write instructions | WARN if absent; FAIL if `allowed-tools` includes Write/Edit but no ask-before-write |
| 5 — Next-Step Handoff | Final section mentions another skill, "next step", or follow-up | WARN if absent |
| 6 — Fork Complexity | If `context: fork`, must have ≥5 phase headings | WARN if <5 |
| 7 — Argument Hint | Non-empty; documented modes should match hint | WARN if empty or mismatch |

**Output:** per-skill table of check results + verdict (COMPLIANT / WARNINGS / NON-COMPLIANT). For `static all`: summary table + aggregate counts.

## Phase 2B: Spec Mode

1. Locate skill at `.claude/skills/[name]/SKILL.md` + spec path from `CCGS Skill Testing Framework/catalog.yaml`
2. Read both files completely
3. For each test case: read fixture, expected behavior, assertions. Mark each PASS / PARTIAL / FAIL via reasoning evaluation
4. Protocol compliance: "May I write" before writes, findings before approval, next-step handoff, no auto-create files
5. Output report with per-case verdicts + protocol compliance + overall verdict
6. Offer to write results to `CCGS Skill Testing Framework/results/` and update catalog.yaml (`last_spec`, `last_spec_result`)

## Phase 2D: Category Mode

1. Locate skill + `category:` from catalog.yaml. `utility` category → evaluate U1 (static) + U2 (gate mode) only
2. Read rubric section from `CCGS Skill Testing Framework/quality-rubric.md`
3. Read skill fully, evaluate each rubric metric → PASS / FAIL / WARN with gap description
4. Output report with per-metric results + fix recommendations
5. Offer to update catalog.yaml (`last_category`, `last_category_result`)

## Phase 2C: Audit Mode

1. Read `CCGS Skill Testing Framework/catalog.yaml`
2. Glob all skills + read agents section from catalog
3. Build coverage tables: has spec, last static/spec/category dates+results, priority
4. Output report with skill table + agent table + priority gaps summary
5. Offer follow-up: `static all`, `category all`, or `spec [name]`

## Phase 3: Next Steps

- After `static [name]` → suggest `spec [name]`
- After `static all` with failures → address NON-COMPLIANT first
- After `spec` PASS → update catalog, find next spec gap
- After `spec` FAIL → review failing assertions, update skill or spec
- After `audit` → start with critical-priority gaps, use spec template
