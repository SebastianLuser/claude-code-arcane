---
name: retrospective
description: "Generates a sprint or milestone retrospective by analyzing completed work, velocity, blockers, and patterns. Produces actionable insights for the next iteration."
category: "agile"
argument-hint: "[sprint-N|milestone-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write
context: |
  !git log --oneline --since="2 weeks ago" 2>/dev/null
---
## Phase 1: Parse & Check Existing

Determine scope: sprint (`sprint-N`) or milestone. Check for existing retro (`production/retrospectives/retro-[slug]-*.md` or `production/sprints/sprint-[N]-retrospective.md`). If found → offer update existing or start fresh.

## Phase 2: Load Data

Read sprint/milestone plan from `production/sprints/` or `production/milestones/`. No data → offer manual input or stop. Extract planned tasks, estimates, owners, goals. Read git log for the period.

## Phase 3: Analyze

Compare plan vs actual:
- Tasks completed as planned / completed modified / carried over / added mid-sprint / descoped
- TODO/FIXME/HACK counts (compare to previous retro if available)
- Previous retro action items: addressed?
- Recurring problems? Velocity trend?

## Phase 4: Generate Retrospective

### Metrics table
Planned vs actual: tasks, completion rate, story points, bugs found/fixed, unplanned tasks, commits.

### Velocity Trend
Last 3 sprints: planned/completed/rate. Trend: increasing/stable/decreasing + 1 sentence why.

### What Went Well / Poorly
Specific observations backed by data. No blame — focus on systemic causes.

### Blockers table
Blocker / duration / resolution / prevention.

### Estimation Accuracy
Most over/underestimated tasks with variance and likely cause. Overall accuracy (% within ±20%). Analysis: consistent bias? Which task types?

### Carryover Analysis
Tasks carried over: original sprint, times carried, reason, action (complete/descope/redesign).

### Technical Debt Status
TODO/FIXME/HACK counts vs previous. Trend + areas of concern.

### Previous Action Items Follow-Up
Status of each (Done/In Progress/Not Started).

### Action Items (MAX 3-5)
Each with owner, priority, deadline. Specific and measurable.

### Process Improvements
2-3 actionable items with expected benefit.

### Summary
2-3 sentences: overall assessment + single most important change.

## Phase 5: Save

Present retro + top findings. Ask write approval → `production/sprints/sprint-[N]-retrospective.md`.

## Guidelines

- Honest and specific — use data, not vague statements
- Systemic issues, not individual blame
- 3-5 action items max, each with owner + deadline
- Check previous action items — recurring unaddressed items = process smell
- Milestone retros: also evaluate goal achievement + project timeline impact
