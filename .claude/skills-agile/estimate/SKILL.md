---
name: estimate
description: "Estimates task effort by analyzing complexity, dependencies, historical velocity, and risk factors. Produces a structured estimate with confidence levels."
category: "agile"
argument-hint: "[task-description]"
user-invocable: true
allowed-tools: Read, Glob, Grep
---

## Phase 1: Understand the Task

Read the task description from the argument. If the description is too vague to estimate meaningfully, ask for clarification before proceeding.

Read CLAUDE.md for project context: tech stack, coding standards, architectural patterns, and any estimation guidelines.

Read relevant design documents from `design/gdd/` if the task relates to a documented feature or system.

---

## Phase 2: Scan Affected Code

Identify files and modules that would need to change:

- Assess complexity (size, dependency count, cyclomatic complexity)
- Identify integration points with other systems
- Check for existing test coverage in the affected areas
- Read past sprint data from `production/sprints/` for similar completed tasks and historical velocity

---

## Phase 3: Analyze Complexity Factors

> → Read references/complexity-factors.md for detailed code complexity, scope, risk factors, and estimation guidelines

---

## Phase 4: Generate the Estimate

> → Read references/estimate-template.md for the full estimate output template

Output the estimate with a brief summary: recommended budget, confidence level, and the single biggest risk factor.

This skill is read-only — no files are written. Verdict: **COMPLETE** — estimate generated.

---

## Phase 5: Next Steps

- If confidence is Low: recommend a time-boxed spike (`/prototype`) before committing.
- If the task is > 10 days: recommend breaking it into smaller stories via `/create-stories`.
- To schedule the task: run `/sprint-plan update` to add it to the next sprint.
