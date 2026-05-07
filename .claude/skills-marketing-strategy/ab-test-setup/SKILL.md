---
name: ab-test-setup
description: "Plan, design, and implement A/B tests and experiments with statistical rigor. Covers hypothesis frameworks, sample sizing, metrics, and result analysis."
category: "marketing-strategy"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# A/B Test Setup

Expert experimentation and A/B testing — design tests that produce statistically valid, actionable results.

## Before Starting

If `.claude/product-marketing-context.md` exists, read it first. Then understand: test context (what to improve, what change), current state (baseline conversion, traffic), constraints (complexity, timeline, tools).

## Core Principles

1. **Start with a hypothesis** — Specific prediction based on data, not "let's see what happens"
2. **Test one thing** — Single variable per test
3. **Statistical rigor** — Pre-determine sample size, don't peek and stop early
4. **Measure what matters** — Primary metric tied to business value, secondary for context, guardrail to prevent harm

---

## Hypothesis Framework

```
Because [observation/data],
we believe [change]
will cause [expected outcome]
for [audience].
We'll know this is true when [metrics].
```

---

## Test Types

| Type | Description | Traffic Needed |
|------|-------------|----------------|
| A/B | Two versions, single change | Moderate |
| A/B/n | Multiple variants | Higher |
| MVT | Multiple changes in combinations | Very high |

For detailed sample size tables and duration calculations, see [references/sample-size-guide.md](references/sample-size-guide.md).

---

## Metrics Selection

- **Primary:** Single metric that matters most, tied to hypothesis
- **Secondary:** Support interpretation (e.g., time on page, plan distribution)
- **Guardrail:** Things that shouldn't get worse (e.g., support tickets, refund rate)

---

## Running the Test

### Pre-Launch Checklist
- [ ] Hypothesis documented
- [ ] Primary metric defined
- [ ] Sample size calculated
- [ ] Variants implemented and QA'd
- [ ] Tracking verified

### During: Monitor for technical issues, check segment quality, document external factors. Do NOT peek, change variants, or add new traffic sources.

---

## Analyzing Results

1. Reach sample size? If not, result is preliminary
2. Statistically significant? (95% confidence = p < 0.05)
3. Effect size meaningful? Compare to MDE
4. Secondary metrics consistent?
5. Guardrail concerns?
6. Segment differences? (mobile vs desktop, new vs returning)

| Result | Action |
|--------|--------|
| Significant winner | Implement variant |
| Significant loser | Keep control, learn why |
| No difference | Need more traffic or bolder test |

---

## Documentation

Document every test: hypothesis, variants (with screenshots), results, decision, learnings. For templates, see [references/test-templates.md](references/test-templates.md).

---

## Related Skills

- **page-cro** — Ideas for what to test
- **analytics-tracking** — Measurement infrastructure
- **campaign-analytics** — Fold results into campaign attribution
- **marketing-context** — Align hypotheses with ICP and positioning
