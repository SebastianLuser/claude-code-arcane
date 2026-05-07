---
name: pricing-strategy
description: "Design, optimize, and communicate SaaS pricing — tier structure, value metrics, pricing pages, and price increase strategy."
category: "marketing-strategy"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Pricing Strategy

Expert SaaS pricing and monetization. Pricing is positioning — the right price sits between the next-best alternative and perceived value delivered.

## Before Starting

If `marketing-context.md` exists, read it first. Gather: current state (plans, conversion rate, ARPC, churn), business context (B2B/B2C, segments, competitors, cost structure), and goals (design, optimize, or price increase).

## Modes

- **Mode 1: Design From Scratch** — Value metric, tier structure, price points, pricing page
- **Mode 2: Optimize Existing** — Audit, benchmark, identify improvements
- **Mode 3: Plan a Price Increase** — Strategy that increases revenue without burning customers

---

## The Three Pricing Axes

1. **Value Metric** — What you charge for (per seat, usage, feature, flat, outcome, hybrid)
2. **Packaging** — What's in each tier
3. **Price Point** — The number

Lock in the metric first, then packaging, then test the number.

### Value Metric Selection

| Metric | Best For | Example |
|--------|---------|---------|
| Per seat | Collaboration tools, CRMs | Salesforce, Notion |
| Per usage | APIs, infrastructure, AI | Stripe, OpenAI |
| Per feature | Platform plays | HubSpot |
| Flat fee | SMB tools | Basecamp |

**Red flags:** Per seat when one power user does all work. Flat fee when some customers derive 10x value.

---

## Good-Better-Best Tier Structure

- **Entry (Good):** Limited features/usage, covers costs, NOT free
- **Better (default):** 2-3x entry price, push most customers here, mark as recommended
- **Best:** Enterprise needs — SSO, audit logs, SLA, dedicated support

For detailed tier composition table and model deep dives, see [references/pricing-models.md](references/pricing-models.md).

---

## Value-Based Pricing

Price between next-best alternative and perceived value. Heuristic: 10-20% of documented value.

**Conversion rate signal:** >40% trial-to-paid likely underpriced; 15-30% healthy; <10% too high or funnel friction.

---

## Pricing Research

- **Van Westendorp** — 4 questions to find acceptable price range (n>=30)
- **MaxDiff** — Relative feature value for packaging decisions
- **Competitor Benchmarking** — Map competitor pricing; premium = 20-40% above market

---

## Price Increase Strategies

| Strategy | Risk |
|---------|------|
| New customers only | Low |
| Grandfather + delayed | Medium |
| Tied to value delivery | Low |
| Plan restructure | Medium |
| Uniform increase | Medium-High |

Expected churn from 20-30% increase: 5-15%. If net revenue positive, proceed. For execution checklist and communication templates, see [references/pricing-page-playbook.md](references/pricing-page-playbook.md).

---

## Pricing Page Design

**Above fold:** Plan names, price + billing toggle, 3-5 differentiators, CTA per plan, "Most popular" badge.

**Below fold:** Feature comparison table, FAQ (5 objections), social proof, security badges.

For design specs and copy templates, see [references/pricing-page-playbook.md](references/pricing-page-playbook.md).

---

## Related Skills

- **product-strategist**: Broader monetization strategy
- **copywriting**: Pricing page copy polish
- **churn-prevention**: Fix retention before raising prices
- **ab-test-setup**: Test price points or page layouts
