# PAS Format — Problem-Analysis-Solution

For design decisions, balance changes, mechanic evaluation, playtest feedback.

## Format

```markdown
# [Concise title]

## Problem
**What happens:**
- [Concrete fact — what doesn't work or is missing]

**Impact on the player:**
- [Concrete negative experience]

## Analysis
**Why it happens:**
- [Root cause]

**Variables involved:**
- [Variable]: [current value] → [effect]

## Options
### A: [Name]
[1 sentence] — Pro: [advantage] / Con: [disadvantage] / Effort: [low|medium|high]

### B: [Name]
[1 sentence] — Pro / Con / Effort

## Decision
**We choose: Option [X]**
**Rationale:** [1-2 sentences]
**Concrete changes:** [exact values]
**Status:** Decided / Pending / [TBD]
```

## When to use PAS

- Problematic mechanics
- Balance change proposals
- Design decisions (new feature, system change)
- Evaluating playtest feedback

## When NOT to

- Full GDD → use the GDD section
- Technical spec → RFC/ADR
- Bug report → issue tracker
