---
name: reverse-document
description: "Generate design or architecture documents from existing implementation. Works backwards from code/prototypes to create missing planning docs."
category: "documentation"
argument-hint: "<type> <path> (e.g., 'design src/gameplay/combat' or 'architecture src/core')"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

# Reverse Documentation

Analyzes existing implementation and generates design/architecture documentation. Use when: built without design doc, inherited undocumented codebase, prototyped and need to formalize, need to document "why" behind code.

## Phase 1: Parse Arguments

Format: `/reverse-document <type> <path>`

| Type | Output | Template |
|------|--------|----------|
| `design` | GDD section | `design/gdd/[system].md` |
| `architecture` | ADR | `docs/architecture/[decision].md` |
| `concept` | Concept doc from prototype | `design/concepts/[name].md` |

Path: directory or file to analyze.

## Phase 2: Analyze Implementation

**Design docs:** mechanics, rules, formulas, gameplay values, state machines, edge cases, system dependencies.

**Architecture docs:** patterns (ECS, singleton, observer), technical decisions (threading, serialization), dependencies/coupling, performance characteristics, constraints/trade-offs.

**Concept docs:** core mechanic, emergent gameplay patterns, what worked/didn't, technical feasibility, player fantasy/feel.

## Phase 3: Ask Clarifying Questions

**Never assume intent.** Ask about "why", not just "what":
- Design: resource system intent (pacing vs strategic depth?), mechanic priority (core pillar or supporting?), value scaling (intentional or needs rebalancing?)
- Architecture: pattern choice motivation (testability, decoupling, legacy?), performance decisions
- Concept: intended pillar emphasis, emergent behaviors (feature or bug?)

## Phase 4: Present Findings

Show discovered mechanics/patterns/formulas + unclear intent areas. Wait for user clarification before drafting.

## Phase 5: Draft Document

| Analyzing... | Use template |
|-------------|-------------|
| `src/gameplay/*` | design-doc-from-implementation.md |
| `src/core/*`, `src/ai/*`, `src/networking/*` | architecture-doc-from-code.md |
| `prototypes/*` | concept-doc-from-prototype.md |
| `src/ui/*` | design-doc-from-implementation.md |

Capture: what exists (mechanics/patterns), why it exists (clarified intent), what's missing (gaps/edge cases), follow-up work (tuning, missing features).

## Phase 6: Show Draft and Request Approval

Show key sections + additions made + sections marked incomplete. "May I write this to [filepath]?" Wait for approval. On approval: Verdict: **COMPLETE**. On decline: Verdict: **BLOCKED**.

## Phase 7: Write with Metadata

Frontmatter: `status: reverse-documented`, `source: [path]`, `date: [today]`, `verified-by: [user]`. Note at top: "Reverse-engineered from existing implementation."

## Phase 8: Flag Follow-Up

Suggest related work: balance checks, ADRs for decisions, missing edge cases, design doc extensions. Don't auto-execute.

## Protocol

1. Analyze first → 2. Question intent → 3. Present findings → 4. User clarifies → 5. Draft → 6. Show + get approval → 7. Write → 8. Flag follow-up. **Never assume intent. Always ask before documenting "why".**
