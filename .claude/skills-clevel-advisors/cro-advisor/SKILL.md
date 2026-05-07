---
name: cro-advisor
description: "Revenue leadership for B2B SaaS companies. Revenue forecasting, sales model design, pricing strategy, net revenue retention, and sales team scaling."
category: "clevel-advisors"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# CRO Advisor

Revenue frameworks for building predictable, scalable revenue engines — from $1M ARR to $100M and beyond.

## Core Responsibilities

| Area | What the CRO Owns | Reference |
|------|------------------|-----------|
| **Revenue Forecasting** | Pipeline model, scenario planning, board forecast | `references/sales_playbook.md` |
| **Sales Model** | PLG vs. sales-led vs. hybrid, team structure | `references/sales_playbook.md` |
| **Pricing Strategy** | Value-based pricing, packaging, price increases | `references/pricing_strategy.md` |
| **NRR & Retention** | Expansion revenue, churn prevention, health scoring | `references/nrr_playbook.md` |
| **Sales Team Scaling** | Quota setting, ramp planning, capacity modeling | `references/sales_playbook.md` |

## Diagnostic Questions

**Revenue Health:**
- What's your NRR? Below 100% means everything else is a leaky bucket.
- What percentage of ARR comes from expansion vs. new logo?

**Pipeline & Forecasting:**
- Pipeline coverage ratio (pipeline / quota)? Under 3x is a problem.
- Stage-by-stage conversion rate? Where do deals die?

**Pricing:**
- If fewer than 20% of prospects push back on price, you're underpriced.

## Revenue Metrics

| Metric | Target | Red Flag |
|--------|--------|----------|
| ARR Growth YoY | 2x+ at early stage | Decelerating 2+ quarters |
| NRR | > 110% | < 100% |
| GRR (gross retention) | > 85% annual | < 80% |
| Pipeline Coverage | 3x+ quota | < 2x entering quarter |
| Magic Number | > 0.75 | < 0.5 |
| Quota Attainment % | 60-70% of reps | < 50% |

**Revenue Waterfall:** Opening ARR + New Logo + Expansion - Contraction - Churn = Closing ARR

## Red Flags

- NRR declining two quarters in a row — customer value story is broken
- Pipeline coverage below 3x entering the quarter — already forecasting a miss
- < 50% of sales team quota-attaining — comp plan, ramp, or quota calibration issue
- Magic Number below 0.5 — sales spend not converting to revenue
- Single customer > 15% of ARR — concentration risk

## Integration with Other C-Suite Roles

| When... | CRO works with... | To... |
|---------|------------------|-------|
| Pricing changes | CPO + CFO | Align value positioning, model margin impact |
| Headcount plan | CFO + CHRO | Justify sales hiring with capacity model |
| NRR declining | CPO + COO | Root cause: product gaps or CS process failures |
| Pipeline SLA | CMO | MQL → SQL conversion, CAC by channel |

## Proactive Triggers

- NRR < 100% → leaky bucket, retention must be fixed before pouring more in
- Pipeline coverage < 3x → forecast at risk, flag to CEO immediately
- Top customer concentration > 20% ARR → single-point-of-failure revenue risk

## Reasoning Technique: Chain of Thought

Pipeline math must be explicit: leads → MQLs → SQLs → opportunities → closed. Show conversion rates at each stage.

## Communication

All output passes the Internal Quality Loop before reaching the founder (see `agent-protocol/SKILL.md`).
- Output format: Bottom Line → What (with confidence) → Why → How to Act → Your Decision
- Every finding tagged: verified, medium confidence, or assumed.

## Resources
- `references/sales_playbook.md` — Sales process, MEDDPICC, comp plans, hiring
- `references/pricing_strategy.md` — Pricing models, value-based pricing, packaging
- `references/nrr_playbook.md` — NRR deep dive, churn anatomy, health scoring, expansion
