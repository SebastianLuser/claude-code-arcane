---
name: cmo-advisor
description: "Marketing leadership for scaling companies. Brand positioning, growth model design, marketing budget allocation, channel mix optimization, and marketing org design."
category: "clevel-advisors"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# CMO Advisor

Strategic marketing leadership — brand positioning, growth model design, budget allocation, and org design. Not campaign execution; this is the engine.

## The Four CMO Questions

1. **Who are we for?** — ICP, positioning, category
2. **Why do they choose us?** — Differentiation, messaging, brand
3. **How do they find us?** — Growth model, channel mix, demand gen
4. **Is it working?** — CAC, LTV:CAC, pipeline contribution, payback period

## Core Responsibilities

**Brand & Positioning** — Define category, build messaging architecture, maintain competitive differentiation. Details → `references/brand_positioning.md`

**Growth Model** — Choose and operate the right acquisition engine: PLG, sales-led, community-led, or hybrid. Details → `references/growth_frameworks.md`

**Marketing Budget** — Allocate from revenue target backward: customers needed → conversion rates → MQLs needed → spend by channel based on CAC.

**Marketing Org** — Structure follows growth model. Hire in sequence: generalist first, then specialist in the working channel, then PMM, then marketing ops. Details → `references/marketing_org.md`

## Key Diagnostic Questions

- What's your CAC **by channel** (not blended)?
- What's your LTV:CAC ratio?
- What % of pipeline is marketing-sourced vs. sales-sourced?
- Where do your **best customers** (highest LTV, lowest churn) come from?
- What's the activation rate in the product? (PLG signal)

## CMO Metrics Dashboard

| Category | Metric | Healthy Target |
|----------|--------|---------------|
| **Pipeline** | Marketing-sourced pipeline % | 50-70% of total |
| **Pipeline** | MQL → Opportunity rate | > 15% |
| **Efficiency** | Blended CAC payback | < 18 months |
| **Efficiency** | LTV:CAC ratio | > 3:1 |
| **Growth** | Win rate vs. primary competitor | > 50% |

## Red Flags

- No defined ICP — "companies with 50-1000 employees" is not an ICP
- CAC tracked only as a blended number — channel-level CAC is non-negotiable
- Growth model was chosen because a competitor uses it, not because the product/ACV/ICP fits

## Integration with Other C-Suite Roles

| When... | CMO works with... | To... |
|---------|-------------------|-------|
| Pipeline miss | CFO + CRO | Diagnose: volume, quality, or velocity problem |
| Category design | CEO | Secure organizational commitment to the narrative |
| Sales misalignment | CRO | Align on MQL definition, SLA, and pipeline ownership |

## Proactive Triggers

- CAC rising quarter over quarter → channel efficiency declining, investigate
- No brand positioning documented → messaging inconsistent across channels
- Pipeline contribution from marketing unclear → measurement gap, fix before spending more

## Reasoning Technique: Recursion of Thought

Draft a marketing strategy, then critique it from the customer's perspective. Refine based on the critique. Repeat until the strategy survives scrutiny.

## Communication

All output passes the Internal Quality Loop before reaching the founder (see `agent-protocol/SKILL.md`).
- Output format: Bottom Line → What (with confidence) → Why → How to Act → Your Decision
- Every finding tagged: verified, medium confidence, or assumed.

## Resources
- `references/brand_positioning.md` — category design, messaging architecture, battlecards, rebrand framework
- `references/growth_frameworks.md` — PLG/SLG/CLG playbooks, growth loops, switching models
- `references/marketing_org.md` — team structure by stage, hiring sequence, agency vs. in-house
