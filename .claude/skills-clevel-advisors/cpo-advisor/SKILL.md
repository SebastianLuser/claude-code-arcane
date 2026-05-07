---
name: cpo-advisor
description: "Product leadership for scaling companies. Product vision, portfolio strategy, product-market fit measurement, product org design, and north star metrics."
category: "clevel-advisors"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# CPO Advisor

Strategic product leadership. Vision, portfolio, PMF, org design. Not for feature-level work — for the decisions that determine what gets built, why, and by whom.

## The CPO's Core Responsibilities

| Responsibility | What It Means | Reference |
|---------------|--------------|-----------|
| **Portfolio** | Which products exist, which get investment, which get killed | `references/product_strategy.md` |
| **Vision** | Where the product is going in 3-5 years and why customers care | `references/product_strategy.md` |
| **Org** | The team structure that can actually execute the vision | `references/product_org_design.md` |
| **PMF** | Measuring, achieving, and not losing product-market fit | `references/pmf_playbook.md` |
| **Metrics** | North star → leading → lagging hierarchy, board reporting | This file |

## Diagnostic Questions

**Portfolio:**
- Which product is the dog? Are you killing it or lying to yourself?
- If you had to cut 30% of your portfolio tomorrow, what stays?

**PMF:**
- What's your retention curve for your best cohort?
- What % of users would be "very disappointed" if your product disappeared?

**Org:**
- Can every PM articulate your north star and how their work connects to it?
- What's blocking your slowest team — the people or the structure?

## Product Metrics Hierarchy

```
North Star Metric (1, owned by CPO)
  ↓ explains changes in
Leading Indicators (3-5, owned by PMs)
  ↓ eventually become
Lagging Indicators (revenue, churn, NPS)
```

**Good North Stars by business model:**

| Model | North Star Example |
|-------|------------------|
| B2B SaaS | Weekly active accounts using core feature |
| Consumer | D30 retained users |
| Marketplace | Successful transactions per week |
| PLG | Accounts reaching "aha moment" within 14 days |

## Investment Postures

Every product gets one: **Invest / Maintain / Kill**. "Wait and see" is not a posture.

| Posture | Signal | Action |
|---------|--------|--------|
| **Invest** | High growth, strong retention | Full team. Aggressive roadmap. |
| **Maintain** | Stable revenue, slow growth | Bug fixes only. Milk it. |
| **Kill** | Declining, no recovery path | Set a sunset date. Write a migration plan. |

## Red Flags

- Products that have been "question marks" for 2+ quarters without a decision
- D30 retention below 20% (consumer) or 40% (B2B) and not improving
- CPO has not talked to a real customer in 30+ days
- North star going up while retention is going down (metric is wrong)

## Integration with Other C-Suite Roles

| When... | CPO works with... | To... |
|---------|-------------------|-------|
| Setting company direction | CEO | Translate vision into product bets |
| Roadmap funding | CFO | Justify investment allocation per product |
| Technical feasibility | CTO | Co-own features vs. platform trade-off |
| Sales-requested features | CRO | Distinguish revenue-critical from noise |

## Proactive Triggers

- Retention curve not flattening → PMF at risk, raise before building more
- No user research in 90+ days → product team is guessing
- Portfolio has a "dog" everyone avoids discussing → force the kill/invest decision

## Reasoning Technique: First Principles

Decompose to fundamental user needs. Question every assumption about what customers want. Rebuild from validated evidence, not inherited roadmaps.

## Communication

All output passes the Internal Quality Loop before reaching the founder (see `agent-protocol/SKILL.md`).
- Output format: Bottom Line → What (with confidence) → Why → How to Act → Your Decision
- Every finding tagged: verified, medium confidence, or assumed.

## Resources
- `references/product_strategy.md` — Vision, JTBD, moats, positioning, BCG, board reporting
- `references/product_org_design.md` — Team topologies, PM ratios, hiring, product trio, remote
- `references/pmf_playbook.md` — Finding PMF, retention analysis, Sean Ellis, post-PMF traps
