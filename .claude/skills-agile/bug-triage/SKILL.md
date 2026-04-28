---
name: bug-triage
description: "Read all open bugs in production/qa/bugs/, re-evaluate priority vs. severity, assign to sprints, surface systemic trends, and produce a triage report. Run at sprint start or when the bug count grows enough to need re-prioritization."
argument-hint: "[sprint | full | trend]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# Bug Triage

Processes open bug backlog into prioritized, sprint-assigned action list. Output: `production/qa/bug-triage-[date].md`.

## Arguments

| Mode | Behavior |
|------|----------|
| `sprint` | Triage against current sprint, assign fixable bugs |
| `full` | All bugs regardless of sprint |
| `trend` | Read-only trend analysis |
| No arg | Sprint if exists, else full |

## Load Bug Backlog

Sources (priority order): `production/qa/bugs/*.md` → `production/qa/bugs.md` → qa-plan "Bugs Found" tables. No bugs → stop. Load sprint context from `production/sprints/` (most recent). Load severity reference from `.claude/docs/coding-standards.md` if exists.

## Classification

### Severity (impact)

| Level | Definition |
|-------|-----------|
| S1 Critical | Crash, data loss, complete feature failure |
| S2 High | Major feature broken, game playable |
| S3 Medium | Degraded with workaround |
| S4 Low | Cosmetic, no gameplay impact |

### Priority (urgency)

| Level | Definition |
|-------|-----------|
| P1 Fix this sprint | Blocks QA/release, regression |
| P2 Fix soon | Before next major milestone |
| P3 Backlog | No active blocking impact |
| P4 Won't fix | Accepted risk / out of scope |

### Assignment

Sprint mode: P1/P2 → assign to sprint if capacity, else flag overflow. Full mode: P1 → current sprint, P2 → next sprint, P3+ → backlog.

### Systemic Flags

- 3+ bugs same system same sprint → design/implementation quality issue
- 2+ S1/S2 same story → story needs reopen/re-review
- Bug against Complete story → regression, reopen in tracking

## Trend Analysis

- Volume: total open, opened/closed this sprint, net change
- Hot spots: most bugs by system, highest S1/S2 ratio
- Age: bugs >2 sprints old, unassigned S1/S2
- Regressions: bugs against completed stories

## Report

Triage summary table (P1-P4 counts) + P1 bugs table (ID/system/severity/summary/assigned/story) + P2 table + P3/P4 table + systemic issues + trend analysis + recommended actions (top 3).

Present report → ask write approval → `production/qa/bug-triage-[date].md`.

## Protocol

- Never close/Won't Fix without user approval — surface as P4 candidates
- Never auto-assign to sprint at capacity — flag overflow
- Severity is objective; priority is team decision — present as recommendations
- Trend data is informational — don't block work on trends alone
