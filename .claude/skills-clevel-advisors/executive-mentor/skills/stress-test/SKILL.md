---
name: stress-test
description: "Business assumption stress testing sub-skill. Takes any assumption and breaks it before the market does — revenue projections, market size, competitive moat, hiring velocity."
category: "clevel-advisors"
user-invocable: false
allowed-tools: Read, Glob, Grep, Bash
---

# /em:stress-test — Business Assumption Stress Testing

**Command:** `/em:stress-test <assumption>`

Take any business assumption and break it before the market does. Revenue projections. Market size. Competitive moat. Hiring velocity. Customer retention.

## Why Most Assumptions Are Wrong

Founders are optimists by nature. **The most dangerous assumptions are the ones everyone agrees on.** Stress testing isn't pessimism. It's calibration.

## The Stress-Test Methodology

### Step 1: Isolate the Assumption
State it explicitly. Not "our market is large" but "the TAM for B2B spend management in German SMEs is 2.3B EUR." The more specific, the more testable.

### Step 2: Find the Counter-Evidence
For every assumption, actively search for evidence that it's wrong. Who has tried this and failed? What data contradicts this? What's the base rate?

### Step 3: Model the Downside

| Scenario | Assumption Value | Probability | Impact |
|----------|-----------------|-------------|--------|
| Base case | [Original value] | ? | |
| Bear case | -30% | ? | |
| Stress case | -50% | ? | |
| Catastrophic | -80% | ? | |

Key question at each level: **Does the business survive?**

### Step 4: Calculate Sensitivity
If this one assumption changes, how much does the outcome change? High sensitivity = the assumption is a key lever.

### Step 5: Propose the Hedge
- **Validation hedge** — test before betting (pilot, customer conversation, experiment)
- **Contingency hedge** — if wrong, what's plan B?
- **Early warning hedge** — leading indicator that tells you it's breaking before it's too late

## Stress Test Patterns

See `references/patterns-by-type.md` for detailed patterns covering: Revenue Projections, Market Size, Competitive Moat, Hiring Plan, and Competitive Response.

## The Stress Test Output

```
ASSUMPTION: [Exact statement]
SOURCE: [Where this came from]

COUNTER-EVIDENCE
• [Specific evidence that challenges this assumption]
• [Comparable failure case]

DOWNSIDE MODEL
• Bear case (-30%): [Impact on plan]
• Stress case (-50%): [Impact on plan]
• Catastrophic (-80%): [Does the business survive?]

SENSITIVITY
This assumption has [HIGH / MEDIUM / LOW] sensitivity.
A 10% change → [X] change in outcome.

HEDGE
• Validation: [How to test before betting]
• Contingency: [Plan B if wrong]
• Early warning: [Leading indicator to watch — and threshold to act]
```
