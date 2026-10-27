---
name: audit-game
description: "Full game project audit: compare GDD, spec docs and code. Detect contradictions, design gaps, balance issues and coherence problems."
category: "gamedev"
argument-hint: "[full|gdd|spec-docs|gdd-vs-code|balance|path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Task
---
# Game Document Audit

Comprehensive audit of documentation and code for video game development projects.

## Input

The user specifies what to audit. Optional argument: `$ARGUMENTS` (e.g., "GDD", "spec-docs", "GDD vs code", "balance", or a specific path)

## Phase 1 — Detect the project and documents

1. Identify the project type (Unity, Unreal, etc.) from the file structure
2. Look for design documents:
   - GDD (Game Design Document) — look in the root, `docs/`, `Documents/`, `Assets/Documents/`
   - Spec docs — look in `spec-docs/`, `specs/`, `design/`
   - Previous audits — look for `*AUDIT*`, `*audit*`
3. Look for gameplay code in the corresponding engine folders
4. If no documents are found → ask the user where they are

## Phase 2 — Gather Context

1. Read the target document(s) in full
2. Read related documents (specs, GDD, project README)
3. Read previous audits if they exist (so already-resolved findings are not repeated)
4. If auditing against code: use agents to explore the current implementation

## Phase 3 — Cross-Reference Analysis

Analyze 5 dimensions: A) Contradictions (CRITICAL), B) Gaps (HIGH), C) Coherence (MEDIUM), D) Balance Red Flags (MEDIUM), E) Milestone completeness (HIGH).

> → Read references/cross-reference-criteria.md for detailed criteria per dimension, severity classification, and output format

## Phase 4 — Produce the report

Save the audit in the appropriate location in the project (next to the GDD or in `docs/`). Sections: Executive Summary, Contradictions, Gaps, Coherence, Balance, Pending Decisions, What Works Well, Next Steps. Each finding in condensed PAS format (5 lines max).

> → Read references/output-template.md for full report template and finding format

## Rules
- Always in the user's language
- CONCISE — each finding fits in 5 lines at most
- Be specific: cite section names, exact values
- For each problem, 1 concrete solution (not 5 options)
- Run mental scenarios to validate formulas and balance
- If comparing against code, use agents to read the real implementation
- Prioritize problems by impact on development
- Acknowledge what is well designed, not only what is broken
