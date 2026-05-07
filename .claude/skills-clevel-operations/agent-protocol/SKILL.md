---
name: agent-protocol
description: "Inter-agent communication protocol for C-suite agent teams. Defines invocation syntax, loop prevention, isolation rules, response formats, and quality loops."
category: "clevel-operations"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Inter-Agent Protocol

How C-suite agents talk to each other. Rules that prevent chaos, loops, and circular reasoning.

## Invocation Syntax

Any agent can query another using:
```
[INVOKE:role|question]
```

**Valid roles:** `ceo`, `cfo`, `cro`, `cmo`, `cpo`, `cto`, `chro`, `coo`, `ciso`

## Response Format

```
[RESPONSE:role]
Key finding: [one line — the actual answer]
Supporting data:
  - [data point 1]
  - [data point 2]
Confidence: [high | medium | low]
Caveat: [one line — what could make this wrong]
[/RESPONSE]
```

## Loop Prevention (Hard Rules)

1. **No Self-Invocation** — An agent cannot invoke itself.
2. **Maximum Depth = 2** — Chains can go A→B→C. Third hop is blocked.
3. **No Circular Calls** — If A called B, B cannot call A in the same chain.
4. **Chain Tracking** — Each invocation carries `[CHAIN: cro → cfo → coo]`.

**When blocked:** Return assumption instead of invoking:
```
[BLOCKED: cannot invoke cfo — circular call detected]
State assumption used instead: [explicit assumption]
```

## Isolation Rules

### Board Meeting Phase 2 (Independent Analysis)
**NO invocations allowed.** Each role forms independent views before cross-pollination. If data is needed: `[ASSUMPTION: ...]`

### Board Meeting Phase 3 (Critic Role)
Executive Mentor can **reference** other roles' outputs but **cannot invoke** them.

### Outside Board Meetings
Invocations allowed freely, subject to loop prevention rules.

## When to Invoke vs When to Assume

**Invoke when:** question requires domain-specific data, error would materially change the recommendation, question is cross-functional.

**Assume when:** data is directionally clear, you're in Phase 2 isolation, chain is at depth 2, question is minor.

## Conflict Resolution

When two invoked agents give conflicting answers: flag explicitly, state resolution approach (conservative / probabilistic / escalate), never silently pick one.

## Quick Reference

| Rule | Behavior |
|------|----------|
| Self-invoke | Always blocked |
| Depth > 2 | Blocked, state assumption |
| Circular | Blocked, state assumption |
| Phase 2 isolation | No invocations |
| Phase 3 critique | Reference only, no invoke |
| Conflict | Surface it, don't hide it |

## Internal Quality Loop

No role presents to the founder without passing through the verification loop. See `references/quality-loop.md` for the full 4-step process: Self-Verification, Peer Verification, Critic Pre-Screen, Course Correction.

## User Communication Standard

All C-suite output follows ONE format. See `references/communication-standard.md` for Standard Output, Proactive Alert, and Board Meeting Output templates.

### Communication Rules (non-negotiable)

1. **Bottom line first.** The founder's time is the scarcest resource.
2. **Results and decisions only.** No process narration.
3. **Max 5 bullets per section.** Longer = reference doc.
4. **Actions have owners and deadlines.** "We should consider" is banned.
5. **Decisions framed as options** with trade-offs and recommendation.
6. **Risks are concrete.** "If X happens, Y breaks, costing $Z."
7. **Silence is an option.** Don't fabricate updates.

## Resources
- `references/invocation-patterns.md` — common cross-functional patterns with examples
- `references/quality-loop.md` — self-verify, peer-verify, critic pre-screen, course correction
- `references/communication-standard.md` — output templates for standard, proactive alert, board meeting
