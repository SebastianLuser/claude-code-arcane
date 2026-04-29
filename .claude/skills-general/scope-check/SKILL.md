---
name: scope-check
description: "Analyze feature or sprint for scope creep: compare current vs original plan, flag additions, quantify bloat, recommend cuts."
category: "workflow"
argument-hint: "[feature-name or sprint-N]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
model: haiku
---

# Scope Check

This skill is read-only — it reports findings but writes no files.

Compares original planned scope against current state to detect, quantify, and triage
scope creep.

**Argument:** `$ARGUMENTS[0]` — feature name, sprint number, or milestone name.

---

## Phase 1: Find the Original Plan

Locate the baseline scope document for the given argument:

- **Feature name** -> read `design/gdd/[feature].md` or matching file in `design/`
- **Sprint number** (e.g., `sprint-3`) -> read `production/sprints/sprint-03.md` or similar
- **Milestone** -> read `production/milestones/[name].md`

If the document is not found, report the missing file and stop. Do not proceed without
a baseline to compare against.

---

## Phase 2: Read the Current State

Check what has actually been implemented or is in progress:

- Scan the codebase for files related to the feature/sprint
- Read git log for commits related to this work (`git log --oneline --since=[start-date]`)
- Check for TODO/FIXME comments that indicate unfinished scope additions
- Check active sprint plan if the feature is mid-sprint

---

## Phase 3: Compare Original vs Current Scope

> → Read references/report-template.md for full comparison report template, verdict table, and scoring rules

---

## Phase 4: Verdict

Assign a canonical verdict based on net scope change (<=10% PASS, 10-25% CONCERNS, >25% FAIL). Output the verdict prominently.

---

## Phase 5: Next Steps

After presenting the report, offer concrete follow-up:

- **PASS** -> no action required. Suggest re-running before next milestone.
- **CONCERNS** -> offer to identify the 2-3 additions with best cut ratio. Reference `/sprint-plan update` to formally re-scope.
- **FAIL** -> recommend escalating to producer. Reference `/sprint-plan update` for re-planning or `/estimate` to re-baseline timeline.

Always end with:
> "Run `/scope-check [name]` again after cuts are made to verify the verdict improves."
