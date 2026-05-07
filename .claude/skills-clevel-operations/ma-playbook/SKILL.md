---
name: ma-playbook
description: "M&A strategy for acquiring companies or being acquired. Due diligence, valuation, integration, and deal structure frameworks."
category: "clevel-operations"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# M&A Playbook

Frameworks for both sides of M&A: acquiring companies and being acquired.

## When You're Acquiring

### Strategic Rationale (answer before anything else)
- **Buy vs Build:** Can you build this faster/cheaper? If yes, don't acquire.
- **Acqui-hire vs Product vs Market:** What are you really buying?
- **Integration complexity:** How hard is it to merge into your company?

### Due Diligence Checklist
| Domain | Key Questions | Red Flags |
|--------|--------------|-----------|
| Financial | Revenue quality, concentration, burn rate | >30% revenue from 1 customer |
| Technical | Code quality, tech debt, architecture fit | Monolith with no tests |
| Legal | IP ownership, litigation, contracts | Key IP owned by individuals |
| People | Key person risk, culture fit, retention | Founders have no lockup/earnout |
| Market | Market position, competitive threats | Declining market share |

### Valuation Approaches
- **Revenue multiple:** 2-15x ARR for SaaS (industry-dependent)
- **Comparable transactions:** What similar companies sold for
- **Acqui-hire:** $1-3M per engineer in hot markets

## When You're Being Acquired

### Preparation (6-12 months before)
1. Clean up financials
2. Document all IP and contracts
3. Reduce customer concentration
4. Lock up key employees
5. Build the data room
6. Engage an M&A advisor

### Negotiation Points
| Term | What to Watch |
|------|--------------|
| Valuation | Earnout traps (unreachable targets) |
| Earnout | Milestone definitions, measurement period |
| Lockup | Duration, conditions |
| Employee retention | Who gets offers, at what terms |

## Red Flags (Both Sides)

- No clear strategic rationale beyond "it's a good deal"
- Culture clash visible during DD and ignored
- Key people not locked in before close
- Integration plan doesn't exist

## Integration with C-Suite Roles

| Role | Contribution |
|------|-------------------|
| CEO | Strategic rationale, negotiation lead |
| CFO | Valuation, deal structure, financing |
| CTO | Technical due diligence, integration architecture |
| CHRO | People due diligence, retention planning |
| COO | Integration execution, process merge |

## Resources
- `references/integration-playbook.md` — 100-day post-acquisition integration plan
- `references/due-diligence-checklist.md` — comprehensive DD checklist by domain
