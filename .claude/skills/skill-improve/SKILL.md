---
name: skill-improve
description: "Improve a skill using a test-fix-retest loop. Runs static checks, proposes targeted fixes, rewrites the skill, re-tests, and keeps or reverts based on score change."
argument-hint: "[skill-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Bash
---

# Skill Improve

Test → fix → retest → keep or revert loop on a single skill.

## Phase 1: Parse Argument

Read skill name from first arg. Verify `.claude/skills/[name]/SKILL.md` exists. If missing → stop.

## Phase 2: Baseline Test

Run `/skill-test static [name]`. Record FAILs, WARNs, which checks failed (1-7).

### Phase 2b: Category Baseline

Look up `category:` in `catalog.yaml`. If not assigned → skip. If found, run `/skill-test category [name]`, record category FAILs/WARNs. If both baselines are 0 FAILs + 0 WARNs → stop ("already passes all checks").

## Phase 3: Diagnose

Read full skill file. For each failing/warning check, identify exact gap:

| Check | Gap if failing |
|-------|---------------|
| 1 | Missing frontmatter field |
| 2 | Fewer phases than minimum |
| 3 | No verdict keywords in body |
| 4 | Write/Edit in tools but no ask-before-write language |
| 5 (warn) | No follow-up/next-step section |
| 6 (warn) | `context: fork` with <5 phases |
| 7 (warn) | argument-hint empty or mismatched with modes |

For category checks: identify text gaps (e.g., G2: missing director prompts, A2: no per-section May-I-write, T3: BLOCKED not surfaced). Show full diagnosis before proposing changes.

## Phase 4: Propose Fix

Targeted fix per failure/warning as before/after blocks. Only change what's failing. Ask to write improved version.

## Phase 5: Write and Retest

Save current content for revert. Write improved skill. Re-run static (+ category if applicable). Display comparison: Before → After for both dimensions.

## Phase 6: Verdict

- **Combined score improved** → "Changes kept." Show what was fixed.
- **Same or worse** → "Score did not improve." Ask to revert via `git checkout`.

## Phase 7: Next Steps

- `/skill-test static all` to find next skill with failures
- `/skill-improve [next-name]` to continue loop
- `/skill-test audit` for overall coverage
