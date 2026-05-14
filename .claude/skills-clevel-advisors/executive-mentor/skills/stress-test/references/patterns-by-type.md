# Stress Test Patterns by Assumption Type

## Revenue Projections

**Common failures:**
- Bottom-up model assumes 100% of pipeline converts
- Doesn't account for deal slippage, churn, seasonality
- New channel assumed to work before tested at scale

**Stress questions:**
- What's your actual historical win rate on pipeline?
- If your top 3 deals slip to next quarter, what happens to the number?
- What's the model look like if your new sales rep takes 4 months to ramp, not 2?
- If expansion revenue doesn't materialize, what's the growth rate?

**Test:** Build the revenue model from historical win rates, not hoped-for ones.

## Market Size

**Common failures:**
- TAM calculated top-down from industry reports without bottoms-up validation
- Conflating total market with serviceable market
- Assuming 100% of SAM is reachable

**Stress questions:**
- How many companies in your ICP actually exist and can you name them?
- What's your serviceable obtainable market in year 1-3?
- What percentage of your ICP is currently spending on any solution to this problem?
- What does "winning" look like and what market share does that require?

**Test:** Build a list of target accounts. Count them. Multiply by ACV. That's your SAM.

## Competitive Moat

**Common failures:**
- Moat is technology advantage that can be built in 6 months
- Network effects that haven't yet materialized
- Data advantage that requires scale you don't have

**Stress questions:**
- If a well-funded competitor copied your best feature in 90 days, what do customers do?
- What's your retention rate among customers who have tried alternatives?
- Is the moat real today or theoretical at scale?
- What would it cost a competitor to reach feature parity?

**Test:** Ask churned customers why they left and whether a competitor could have kept them.

## Hiring Plan

**Common failures:**
- Time-to-hire assumes standard recruiting cycle, not current market
- Ramp time not modeled (3-6 months before full productivity)
- Key hire dependency: plan only works if specific person is hired

**Stress questions:**
- What happens if the VP Sales hire takes 5 months, not 2?
- What does execution look like if you only hire 70% of planned headcount?
- Which single person, if they left tomorrow, would most damage the plan?
- Is the plan achievable with current team if hiring freezes?

**Test:** Model the plan with 0 net new hires. What still works?

## Competitive Response

**Common failures:**
- Assumes incumbents won't respond (they will if you're winning)
- Underestimates speed of response
- Doesn't model resource asymmetry

**Stress questions:**
- If the market leader copies your product in 6 months, how does pricing change?
- What's your response if a competitor raises $30M to attack your space?
- Which of your customers have vendor relationships with your competitors?
