---
name: strategic-alignment
description: "Cascades strategy from boardroom to individual contributor. Detects and fixes misalignment between company goals and team execution through orphan goal detection, silo identification, and realignment protocols."
category: "clevel-operations"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Strategic Alignment Engine

Strategy fails at the cascade, not the boardroom. This skill detects misalignment before it becomes dysfunction.

## Core Framework

### Step 1: Strategy Articulation Test
Ask five people from five teams: "What is the company's most important strategic priority?"
- All five agree: Articulation is clear
- 3-4 similar: Loose alignment — clarify and communicate
- <3 agree: Strategy isn't clear enough to cascade. Fix this first.

**Format test:** Strategy should be statable in one sentence.

### Step 2: Cascade Mapping
Map: Company OKRs → Dept OKRs → Team OKRs → Individual goals. For each: which company goal does this support? Is the connection direct or theoretical?

### Step 3: Alignment Detection (3 failure patterns)

**Orphan goals:** Team goals that don't connect to any company goal. Fix: connect or cut.

**Conflicting goals:** Two teams' goals, when both succeed, create a worse outcome. Classic: Sales closes bad-fit customers; CS scores tank. Fix: cross-functional OKR review before quarter.

**Coverage gaps:** Company OKR with no team ownership. Fix: explicit ownership assignment.

### Step 4: Silo Identification
**Signals:** A department hits their goals while the company misses. "That's not our problem." Data isn't shared between dependent teams.

**Root causes:** Incentive misalignment, no shared goals, no shared language, geography.

### Step 5: Communication Gap Analysis
What the CEO says is not what teams hear. The gap grows with company size. Test across all levels.

### Step 6: Realignment Protocol
Don't start with what's wrong. Re-cascade in a workshop. Fix incentives before fixing goals. Install quarterly alignment check.

## Alignment Score

| Area | Question | /10 |
|------|----------|-----|
| Strategy clarity | Can 5 people state the strategy consistently? | |
| Cascade completeness | Do all team goals connect to company goals? | |
| Conflict detection | Have cross-team conflicts been reviewed? | |
| Coverage | Does each company OKR have team ownership? | |
| Communication | Do behaviors reflect strategy? | |

**Total: /50** — 45-50 excellent, 35-44 good, 20-34 immediate attention, <20 strategic drift.

## Key Questions

- "Ask your newest team member: what's the most important thing we're trying to achieve?"
- "When Team A and Team B both hit goals, does the company always win?"
- "Name a decision made last week influenced by the company strategy."

## Red Flags

- Teams consistently hit goals while company misses targets
- Cross-functional projects take 3x longer than expected
- New initiatives announced without connecting to existing OKRs

## Integration with Other C-Suite Roles

| When... | Work with... | To... |
|---------|-------------|-------|
| New strategy set | CEO + COO | Cascade into rocks before announcing |
| OKR cycle starts | COO | Run cross-team conflict check |
| Post-M&A | CEO + Culture Architect | Detect strategy conflicts between entities |

## Resources
- `references/alignment-playbook.md` — Cascade techniques, quarterly alignment check, common patterns
