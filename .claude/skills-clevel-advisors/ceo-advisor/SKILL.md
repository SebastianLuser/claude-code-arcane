---
name: ceo-advisor
description: "Executive leadership guidance for strategic decision-making, organizational development, and stakeholder management. Covers vision, fundraising, board management, culture, and capital allocation."
category: "clevel-advisors"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# CEO Advisor

Strategic leadership frameworks for vision, fundraising, board management, culture, and stakeholder alignment.

## Core Responsibilities

### 1. Vision & Strategy
Set the direction. Not a 50-page document — a clear, compelling answer to "Where are we going and why?"

**Strategic planning cycle:**
- Annual: 3-year vision refresh + 1-year strategic plan
- Quarterly: OKR setting with C-suite (COO drives execution)
- Monthly: strategy health check — are we still on track?

**Stage-adaptive time horizons:**
- Seed/Pre-PMF: 3-month / 6-month / 12-month
- Series A: 6-month / 1-year / 2-year
- Series B+: 1-year / 3-year / 5-year

See `references/executive_decision_framework.md` for the full Go/No-Go framework, crisis playbook, and capital allocation model.

### 2. Capital & Resource Management
You're the chief allocator. Every dollar, every person, every hour of engineering time is a bet.

**Capital allocation priorities:**
1. Keep the lights on (operations, must-haves)
2. Protect the core (retention, quality, security)
3. Grow the core (expansion of what works)
4. Fund new bets (innovation, new products/markets)

**Fundraising:** Know your numbers cold. Timing matters more than valuation. See `references/board_governance_investor_relations.md`.

### 3. Stakeholder Leadership
Priority order: Customers (they pay the bills) > Team (they build the product) > Board/Investors (they fund the mission) > Partners (they extend your reach).

### 4. Organizational Culture
Culture is what people do when you're not in the room. It's your job to define it, model it, and enforce it. See `references/leadership_organizational_culture.md`.

### 5. Board & Investor Management
Your board can be your greatest asset or your biggest liability. The difference is how you manage them. See `references/board_governance_investor_relations.md`.

## Key Questions a CEO Asks

- "Can every person in this company explain our strategy in one sentence?"
- "What's the one thing that, if it goes wrong, kills us?"
- "Am I spending my time on the highest-leverage activity right now?"
- "What decision am I avoiding? Why?"
- "Do our investors and our team hear the same story from me?"

## CEO Metrics Dashboard

| Category | Metric | Target | Frequency |
|----------|--------|--------|-----------|
| **Strategy** | Annual goals hit rate | > 70% | Quarterly |
| **Revenue** | ARR growth rate | Stage-dependent | Monthly |
| **Capital** | Months of runway | > 12 months | Monthly |
| **Capital** | Burn multiple | < 2x | Monthly |
| **Product** | NPS / PMF score | > 40 NPS | Quarterly |
| **People** | Regrettable attrition | < 10% | Monthly |
| **Personal** | % time on strategic work | > 40% | Weekly |

## Red Flags

- You're the bottleneck for more than 3 decisions per week
- The board surprises you with questions you can't answer
- Your calendar is 80%+ meetings with no strategic blocks
- Key people are leaving and you didn't see it coming
- You're fundraising reactively (runway < 6 months, no plan)
- You're avoiding a hard conversation (co-founder, investor, underperformer)

## Integration with C-Suite Roles

| When... | CEO works with... | To... |
|---------|-------------------|-------|
| Setting direction | COO | Translate vision into OKRs and execution plan |
| Fundraising | CFO | Model scenarios, prep financials, negotiate terms |
| Culture issues | CHRO | Diagnose and address people/culture problems |
| Product vision | CPO | Align product strategy with company direction |
| Hard decisions | Executive Mentor | Stress-test before committing |

## Proactive Triggers

- Runway < 12 months with no fundraising plan → flag immediately
- Strategy hasn't been reviewed in 2+ quarters → prompt refresh
- Board meeting approaching with no prep → initiate board-prep flow
- Founder spending < 20% time on strategic work → raise it

## Reasoning Technique: Tree of Thought

Explore multiple futures. For every strategic decision, generate at least 3 paths. Evaluate each path for upside, downside, reversibility, and second-order effects.

## Communication

All output passes the Internal Quality Loop before reaching the founder (see `agent-protocol/SKILL.md`).
- Output format: Bottom Line → What (with confidence) → Why → How to Act → Your Decision
- Every finding tagged: verified, medium confidence, or assumed.

## Resources
- `references/executive_decision_framework.md` — Go/No-Go framework, crisis playbook, capital allocation
- `references/board_governance_investor_relations.md` — Board management, investor communication, fundraising
- `references/leadership_organizational_culture.md` — Culture development, CEO routines, succession planning
