---
name: code-review
description: "Architectural and quality code review: standards compliance, SOLID principles, testability, performance."
category: "workflow"
argument-hint: "[path-to-file-or-directory]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Task
agent: lead-programmer
---

## Phase 1: Load Target Files

Read target file(s) in full. Read CLAUDE.md for project coding standards.

## Phase 2: Identify Engine Specialists

Read `.claude/docs/technical-preferences.md` → `## Engine Specialists`. Note Primary, Language/Code, Shader, UI specialists. If `[TO BE CONFIGURED]` → skip engine specialist steps.

## Phase 3: ADR Compliance Check

Search for `ADR-NNN` patterns in story file, commits, headers. No references → skip.

Per referenced ADR, read Decision + Consequences sections, classify deviations:

| Severity | Meaning |
|----------|---------|
| ARCHITECTURAL VIOLATION (BLOCKING) | Uses pattern explicitly rejected in ADR |
| ADR DRIFT (WARNING) | Meaningfully diverges from chosen approach |
| MINOR DEVIATION (INFO) | Small difference, doesn't affect architecture |

## Phase 4: Standards Compliance

Identify system category (engine, gameplay, AI, networking, UI, tools). Check: doc comments on public methods, cyclomatic complexity <10/method, methods ≤40 lines, DI (no static singletons), config from data files, interfaces exposed.

## Phase 5: Architecture and SOLID

- **Architecture**: correct dependency direction, no circular deps, proper layer separation, events for cross-system communication, consistent patterns
- **SOLID**: SRP, OCP, LSP, ISP, DIP — check each principle

## Phase 6: Game-Specific Concerns

Frame-rate independence (delta time), no allocations in hot paths, null/empty handling, thread safety, resource cleanup.

## Phase 7: Specialist Reviews (Parallel)

Spawn applicable specialists via Task simultaneously:
- Primary language files → Language/Code Specialist
- Shader files → Shader Specialist
- UI code → UI Specialist
- Cross-cutting → Primary Specialist

### QA Testability Review

For Logic/Integration stories, spawn `qa-tester` in parallel. Evaluate: test hooks exposed, QA test cases map to code paths, acceptance criteria testable, new edge cases covered, side effects tested. For Visual/UI stories: verify manual steps are reachable.

## Phase 8: Output Review

Report sections: Engine Specialist Findings, Testability, ADR Compliance, Standards Compliance (X/6), Architecture, SOLID, Game-Specific Concerns, Positive Observations, Required Changes (violations always here), Suggestions. Verdict: APPROVED / APPROVED WITH SUGGESTIONS / CHANGES REQUIRED.

This skill is read-only.

## Phase 9: Next Steps

- APPROVED → `/story-done [story-path]`
- CHANGES REQUIRED → fix issues, re-run `/code-review`
- ARCHITECTURAL VIOLATION → `/architecture-decision` to record correct approach
