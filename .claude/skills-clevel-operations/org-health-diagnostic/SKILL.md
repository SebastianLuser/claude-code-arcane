---
name: org-health-diagnostic
description: "Cross-functional organizational health check combining signals from all C-suite roles. Scores 8 dimensions on a traffic-light scale with drill-down recommendations."
category: "clevel-operations"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Org Health Diagnostic

Eight dimensions. Traffic lights. Real benchmarks. Surfaces the problems you don't know you have.

## The 8 Dimensions

### 1. Financial Health (CFO)
Runway (Green: >12mo), Burn multiple (Green: <1.5x), Gross margin (Green: >70%), Revenue concentration (Green: <15%).

### 2. Revenue Health (CRO)
NRR (Green: >110%), Logo churn (Green: <5%), Pipeline coverage (Green: >3x), CAC payback (Green: <12mo).

### 3. Product Health (CPO)
NPS (Green: >40), DAU/MAU ratio (Green: >40%), Core feature adoption (Green: >60%), CSAT (Green: >4.2/5).

### 4. Engineering Health (CTO)
Deployment frequency (Green: daily), Change failure rate (Green: <5%), MTTR (Green: <1h), Tech debt ratio (Green: <20%).

### 5. People Health (CHRO)
Regrettable attrition (Green: <10%), Engagement (Green: eNPS >30), Time-to-fill (Green: <45d), Manager:IC ratio (Green: 1:5-1:8).

### 6. Operational Health (COO)
OKR completion (Green: >70%), Decision cycle time (Green: <48h), Process maturity (1-5 scale).

### 7. Security Health (CISO)
Security incidents (Green: 0), Compliance status (current), Vulnerability remediation (Green: 100% SLA), Pen test (Green: <12mo).

### 8. Market Health (CMO)
CAC trend (improving), Win rate (Green: >25%), Organic vs paid lead mix (more organic = healthier).

## Scoring & Traffic Lights

Each dimension scored 1-10: Green (7-10) healthy, Yellow (4-6) watch, Red (1-3) action required within 30 days.

## Dimension Interactions

| If this dimension is red... | Watch these next |
|-----------------------------|------------------|
| Financial Health | People → Engineering → Product |
| Revenue Health | Financial → People → Market |
| People Health | Engineering → Product → Revenue |
| Engineering Health | Product → Revenue |
| Operational Health | All dimensions degrade over time |

## Dashboard Output Format

```
ORG HEALTH DIAGNOSTIC — [Company] — [Date]
Stage: [Seed/A/B/C]   Overall: [Score]/10   Trend: [↑/→/↓]

DIMENSION SCORES
Financial    [status] [score]  [summary]
Revenue      [status] [score]  [summary]
Product      [status] [score]  [summary]
Engineering  [status] [score]  [summary]
People       [status] [score]  [summary]
Operations   [status] [score]  [summary]
Security     [status] [score]  [summary]
Market       [status] [score]  [summary]

TOP PRIORITIES (red items with actions)
WATCH (cascade risks)
```

## Graceful Degradation

Missing metric → excluded from score, flagged as "[data needed]". Score still valid for available dimensions.

## Resources
- `references/health-benchmarks.md` — benchmarks by stage (Seed, A, B, C)
