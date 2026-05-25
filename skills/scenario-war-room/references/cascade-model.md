# 6-Step Cascade Model (Detailed)

## Step 1: Define Scenario Variables (max 3)
State each variable with:
- **What changes** — specific, quantified if possible
- **Probability** — your best estimate
- **Timeline** — when it hits

```
Variable A: Top customer (28% ARR) gives 60-day termination notice
  Probability: 15% | Timeline: Within 90 days

Variable B: Series A fundraise delayed 6 months beyond target close
  Probability: 25% | Timeline: Q3

Variable C: Lead engineer resigns
  Probability: 20% | Timeline: Unknown
```

## Step 2: Domain Impact Mapping

For each variable, each relevant role models impact:

| Domain | Owner | Models |
|--------|-------|--------|
| Cash & runway | CFO | Burn impact, runway change, bridge options |
| Revenue | CRO | ARR gap, churn cascade risk, pipeline |
| Product | CPO | Roadmap impact, PMF risk |
| Engineering | CTO | Velocity impact, key person risk |
| People | CHRO | Attrition cascade, hiring freeze implications |
| Operations | COO | Capacity, OKR impact, process risk |
| Security | CISO | Compliance timeline risk |
| Market | CMO | CAC impact, competitive exposure |

## Step 3: Cascade Effect Mapping

This is the core. Show how Variable A triggers consequences in domains that trigger Variable B's effects:

```
TRIGGER: Customer churn ($560K ARR)
  ↓
CFO: Runway drops 14 → 8 months
  ↓
CHRO: Hiring freeze; retention risk increases (morale hit)
  ↓
CTO: 3 open engineering reqs frozen; roadmap slips
  ↓
CPO: Q4 feature launch delayed → customer retention risk
  ↓
CRO: NRR drops; existing accounts see reduced velocity → more churn risk
  ↓
CFO: [Secondary cascade — potential death spiral if not interrupted]
```

Name the cascade explicitly. Show where it can be interrupted.

## Step 4: Severity Matrix

Model three scenarios:

| Scenario | Definition | Recovery |
|----------|------------|---------|
| **Base** | One variable hits; others don't | Manageable with plan |
| **Stress** | Two variables hit simultaneously | Requires significant response |
| **Severe** | All variables hit; full cascade | Existential; requires board intervention |

For each severity level:
- Runway impact
- ARR impact
- Headcount impact
- Timeline to unacceptable state (trigger point)

## Step 5: Trigger Points (Early Warning Signals)

Define the measurable signal that tells you a scenario is unfolding **before** it's confirmed:

```
Trigger for Customer Churn Risk:
  - Sponsor goes dark for >3 weeks
  - Usage drops >25% MoM
  - No Q1 QBR confirmed by Dec 1

Trigger for Fundraise Delay:
  - <3 term sheets after 60 days of process
  - Lead investor requests >30-day extension on DD
  - Competitor raises at lower valuation (market signal)

Trigger for Engineering Attrition:
  - Glassdoor activity from engineering team
  - 2+ referral interview requests from engineers
  - Above-market offer counter-required in last 3 months
```

## Step 6: Hedging Strategies

For each scenario: actions to take **now** (before the scenario materializes) that reduce impact if it does.

| Hedge | Cost | Impact | Owner | Deadline |
|-------|------|--------|-------|---------|
| Establish $500K credit line | $5K/year | Buys 3 months if churn hits | CFO | 60 days |
| 12-month retention bonus for 3 key engineers | $90K | Locks team through fundraise | CHRO | 30 days |
| Diversify to <20% revenue concentration per customer | Sales effort | Reduces single-customer risk | CRO | 2 quarters |
| Compress fundraise timeline, start parallel process | CEO time | Closes before runways merge | CEO | Immediate |
