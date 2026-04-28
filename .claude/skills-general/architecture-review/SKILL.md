---
name: architecture-review
description: "Validates architecture against all GDDs: traceability matrix, coverage gaps, cross-ADR conflicts, engine compatibility, PASS/CONCERNS/FAIL verdict."
argument-hint: "[focus: full | coverage | consistency | engine | single-gdd path | rtm]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Task, AskUserQuestion
agent: technical-director
model: opus
---
# architecture-review

## Modes

| Argument | Scope |
|----------|-------|
| `full` / none | All phases |
| `coverage` | Traceability only — GDD requirements without ADR |
| `consistency` | Cross-ADR conflict detection only |
| `engine` | Engine compatibility audit only |
| `single-gdd [path]` | Architecture coverage for one GDD |
| `rtm` | Full Requirements Traceability Matrix (GDD → ADR → Story → Test) |

## Phase 1: Load

1. **L0 Summary Scan**: Grep `## Summary` from all GDDs and ADRs (fast, low tokens)
2. **L1/L2 Full Load** (per mode): GDDs, ADRs, engine reference docs, `technical-preferences.md`, `consistency-failures.md`
3. Report: "Loaded [N] GDDs, [M] ADRs, engine: [name+version]"

## Phase 2: Extract Technical Requirements

Pre-load `docs/architecture/tr-registry.yaml` for stable IDs. For each GDD extract:
- Data structures, performance constraints, engine capabilities, cross-system comms, state persistence, threading, platform requirements
- Assign TR-IDs: reuse existing registry IDs for matching requirements, new sequential ID for new ones

## Phase 3: Traceability Matrix

For each TR, search ADRs for coverage: **Covered** (explicit) / **Partial** (ambiguous) / **Gap** (none).

### Phase 3b: Story & Test Linkage (rtm mode)
Extend matrix with story files (`production/epics/**/*.md`) and test files. Status: COVERED / MISSING / NONE / NO STORY.

## Phase 4: Cross-ADR Conflicts

Detect: data ownership, integration contract, performance budget, dependency cycle, pattern, state management conflicts. For each → describe both claims, impact, resolution options.

**Dependency ordering**: Topological sort of ADRs. Flag unresolved deps, cycles. Output recommended implementation order.

## Phase 5: Engine Compatibility

- Version consistency across ADRs
- Post-cutoff API consistency
- Deprecated API references (from `deprecated-apis.md`)
- Missing Engine Compatibility sections
- Spawn engine specialist for second opinion

### Phase 5b: GDD Revision Flags
For HIGH RISK engine findings → check if GDDs make contradicted assumptions. Table: GDD | Assumption | Reality | Action.

## Phase 6: Architecture Doc Coverage

If `docs/architecture/architecture.md` exists → verify all systems appear, data flows covered, no orphaned architecture.

## Phase 7: Report

Output: Traceability Summary, Coverage Gaps (with suggested ADRs), Cross-ADR Conflicts, ADR Dependency Order, GDD Revision Flags, Engine Issues, Architecture Coverage.

**Verdict**: PASS (all covered, no conflicts) / CONCERNS (gaps but no blockers) / FAIL (critical gaps or blocking conflicts).

## Phase 8: Write

AskUserQuestion: write review report + traceability index + TR registry, or report only, or nothing. Update `consistency-failures.md` with conflicts. Update session state.

## Phase 9: Handoff

Top 3 ADRs to create → `/gate-check pre-production` when blockers resolved → rerun after each new ADR.

## Protocol
- Read silently, show matrix before asking anything
- Ask before writing. Verdict is advisory — user decides
- If agent BLOCKED → surface, assess deps, offer skip/retry/stop, always produce partial report
