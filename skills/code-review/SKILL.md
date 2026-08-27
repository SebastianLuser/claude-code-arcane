---
name: code-review
description: "Architectural and quality code review: standards compliance, SOLID principles, testability, performance. Usar para revisar un archivo o directorio antes de mergear, o cuando se pide code review."
category: "workflow"
argument-hint: "[path-to-file-or-directory]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Task
---

## Phase 1: Load Target Files

Read target file(s) in full. Read CLAUDE.md for project coding standards.

## Phase 2: Resolve which specialists exist

**Do not invent specialist names.** List what is actually installed:

!`ls .claude/agents/*/ 2>/dev/null | sed 's/\.md$//' | tr '\n' ' ' || echo "NO-AGENTS-INSTALLED"`

Rules:

- Only spawn an agent whose file appeared in that listing. A `Task` call naming
  an agent that is not installed does not fail loudly - it falls back to a
  general-purpose agent with no specialised prompt, which reads broadly, burns
  its turn budget, and returns a generic summary. That is worse than not
  spawning at all.
- If the listing is empty or `NO-AGENTS-INSTALLED`, **skip Phase 7 entirely**
  and do the whole review inline. Say so in the report.
- Match by role, not by guess: a reviewer for the stack under review
  (`react-engineer`, `go-engineer`, `nestjs-engineer`, `unity-specialist`,
  `unreal-specialist`…), plus `qa-engineer` for testability when installed.

## Phase 3: ADR Compliance Check

Search for `ADR-NNN` patterns in story file, commits, headers. No references → skip.

Per referenced ADR, read Decision + Consequences sections, classify deviations:

| Severity | Meaning |
|----------|---------|
| ARCHITECTURAL VIOLATION (BLOCKING) | Uses pattern explicitly rejected in ADR |
| ADR DRIFT (WARNING) | Meaningfully diverges from chosen approach |
| MINOR DEVIATION (INFO) | Small difference, doesn't affect architecture |

## Phase 4: Standards Compliance

Identify system category from the code under review. Check: doc comments on public methods, cyclomatic complexity <10/method, methods ≤40 lines, DI (no static singletons), config from data files, interfaces exposed.

## Phase 5: Architecture and SOLID

- **Architecture**: correct dependency direction, no circular deps, proper layer separation, events for cross-system communication, consistent patterns
- **SOLID**: SRP, OCP, LSP, ISP, DIP — check each principle

## Phase 6: Runtime-loop concerns — only for game/realtime projects

**Skip this phase unless the project actually has a frame loop.** Signal: a
Unity, Unreal or Godot project file, or a render/tick loop in the code under
review. On a backend or web project this phase produces noise, not findings.

When it applies: frame-rate independence (delta time), no allocations in hot
paths, null/empty handling, thread safety, resource cleanup.

## Phase 7: Specialist Reviews (Parallel)

Only if Phase 2 found installed agents. **At most 3 in parallel** — beyond that
the wall-clock cost outweighs the extra coverage.

| Trigger in the diff | Spawn (only if installed) |
|---------------------|---------------------------|
| Primary language of the changed files | the matching `*-engineer` / `*-specialist` |
| Shader / material files | `unity-shader-specialist` or `technical-artist` |
| UI / component code | `ui-lead` or `ue-umg-specialist` |
| Test or testability questions | `qa-engineer` |

Give each one the file list and the specific question. Do **not** ask an agent
to "review this" — ask what you actually need decided.

### Testability review

When `qa-engineer` is installed, ask it: are test hooks exposed, do test cases
map to code paths, are acceptance criteria testable, are new edge cases and
side effects covered. For visual/UI changes: are the manual steps reachable.

## Phase 8: Output Review

Report sections: Specialist Findings (name which agents ran, and say plainly if
none were installed), Testability, ADR Compliance, Standards Compliance (X/6),
Architecture, SOLID, Runtime-loop Concerns (omit if skipped), Positive
Observations, Required Changes (violations always here), Suggestions.

Verdict: APPROVED / APPROVED WITH SUGGESTIONS / CHANGES REQUIRED.

This skill is read-only: it writes no files. The report is the deliverable.

## Phase 9: Next Steps

- APPROVED → `/story-done [story-path]`
- CHANGES REQUIRED → fix issues, re-run `/code-review`
- ARCHITECTURAL VIOLATION → `/architecture-decision` to record correct approach
