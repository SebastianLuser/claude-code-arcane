---
name: scenario-war-room
description: "Cross-functional what-if modeling for cascading multi-variable scenarios. Models compound adversity across all business functions simultaneously."
category: "clevel-operations"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Scenario War Room

Model cascading what-if scenarios across all business functions. Not single-assumption stress tests — compound adversity that shows how one problem creates the next.

## What This Is Not

- **Not** a single-assumption stress test (that's `/em:stress-test`)
- **Not** financial modeling only — every function gets modeled
- **Not** worst-case-only — models 3 severity levels
- **Not** paralysis by analysis — outputs concrete hedges and triggers

## Framework: 6-Step Cascade Model

See `references/cascade-model.md` for the full detailed methodology with examples.

1. **Define Scenario Variables (max 3)** — What changes, probability, timeline
2. **Domain Impact Mapping** — Each role models impact on their domain
3. **Cascade Effect Mapping** — Show how Variable A triggers consequences that trigger Variable B
4. **Severity Matrix** — Base (1 variable), Stress (2 variables), Severe (all variables)
5. **Trigger Points** — Measurable early warning signals before scenarios are confirmed
6. **Hedging Strategies** — Actions to take NOW that reduce impact

## Output Format

```
SCENARIO: [Name]
Variables: [A, B, C]
Most likely path: [which combination, with probability]

SEVERITY LEVELS
Base (A only): [impact] — recovery: [actions]
Stress (A+B): [impact] — recovery: [actions]
Severe (A+B+C): [impact] — existential risk: [yes/no]

CASCADE MAP
[A → domain impact → B trigger → domain impact → end state]

EARLY WARNING SIGNALS
- [Signal → which scenario it indicates]

HEDGES (take these actions now)
1. [Action] — cost — impact — owner — deadline

RECOMMENDED DECISION
[One paragraph. What to do, in what order, and why.]
```

## Rules for Good War Room Sessions

- **Max 3 variables per scenario.** More is noise.
- **Quantify or estimate.** "$420K ARR at risk over 60 days" not "revenue drops."
- **Don't stop at first-order effects.** Damage is in the cascade.
- **Model recovery, not just impact.** Every scenario needs a "what we do" path.

## Common Scenarios by Stage

**Seed:** Co-founder leaves + product misses launch. Funding runs out + bridge terms unfavorable.
**Series A:** Miss ARR target + fundraise delayed. Key customer churns + competitor raises.
**Series B:** Market contraction + burn multiple spikes. Lead investor wants pivot + team resists.

## Integration with C-Suite Roles

| Scenario Type | Primary Roles | Cascade To |
|--------------|---------------|------------|
| Revenue miss | CRO, CFO | CMO, COO, CHRO |
| Key person departure | CHRO, COO | CTO (if eng), CRO (if sales) |
| Fundraise failure | CFO, CEO | COO, CHRO |
| Security breach | CISO, CTO | CEO, CFO, CRO |

## Resources
- `references/scenario-planning.md` — Shell methodology, pre-mortem, Monte Carlo, cascade frameworks
- `references/cascade-model.md` — detailed 6-step methodology with examples
