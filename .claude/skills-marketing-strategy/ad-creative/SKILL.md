---
name: ad-creative
description: "Generate, iterate, and scale ad creative for paid advertising across Google, Meta, LinkedIn, and X. Covers platform specs, creative frameworks, and quality validation."
category: "marketing-strategy"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Ad Creative

Performance creative director — produce ad copy that passes platform review, stops the scroll, and drives action at scale.

## Before Starting

If `marketing-context.md` exists, read it first. Gather: product and offer (value prop, what customer gets), audience (job title, pain point, objections), platform and funnel stage, performance data (if iterating).

## Modes

- **Mode 1: Generate from Scratch** — Extract core message → map funnel stage → generate headlines → write body copy → quality check
- **Mode 2: Iterate from Data** — Audit current copy → identify winning pattern → 3-5 variations on theme + 2-3 new angles
- **Mode 3: Scale Variations** — Lock core message → vary one element → adapt across platforms → creative matrix

---

## Platform Specs Quick Reference

| Platform | Headline | Body | Notes |
|----------|----------|------|-------|
| Google RSA | 30 chars (x15) | 90 chars (x4) | Max 3 pinned |
| Meta Feed | 40 chars | 125 chars primary | Image text <20% |
| LinkedIn | 70 chars | 150 chars intro | No click-bait |
| Twitter/X | 70 chars | 280 chars total | Hook in first line |

For full specs including image sizes, video lengths, and rejection triggers, see [references/platform-specs.md](references/platform-specs.md).

---

## Creative Framework by Funnel Stage

- **Awareness** — Lead with the problem. Frame: Problem → Amplify → Hint at solution
- **Consideration** — Lead with the solution. Frame: Solution → Mechanism → Proof
- **Decision** — Lead with proof. Frame: Proof → Risk removal → Urgency

For the full framework catalog with examples by platform, see [references/creative-frameworks.md](references/creative-frameworks.md).

---

## Headline Formulas

- **Benefit-First:** `[Verb] [specific outcome] [qualifier]` — "Cut churn by 30%"
- **Curiosity:** `[Surprising/counterintuitive angle]` — "Why your best customers leave at 90 days"
- **Social Proof:** `[Number] [people] [outcome]` — "1,200 SaaS teams use this"
- **Problem Agitation:** `[Describe pain vividly]` — "Still losing 40% of signups?"

---

## Quality Checklist

- [ ] Character counts within limits
- [ ] No ALL CAPS (except acronyms), no excessive punctuation
- [ ] No platform trademarks in copy
- [ ] Headline stands alone without description
- [ ] Specific claims ("save 3 hours" not "save time")
- [ ] CTA matches landing page offer
- [ ] Language matches how audience talks about problem

---

## Output Format

```
[AD SET NAME] | [Platform] | [Funnel Stage]
Headline: "..." (28 chars)
Body: "..." (112 chars)
CTA: "Learn More"
Notes: Formula type, confidence level
```

---

## Related Skills

- **paid-ads**: Campaign strategy, targeting, budget (not copy)
- **ab-test-setup**: Plan which variants to test
- **copywriting**: Landing page copy (not platform-constrained ads)
