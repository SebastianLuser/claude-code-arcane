---
name: customer-success-manager
description: "Monitor customer health, predict churn risk, and identify expansion opportunities using weighted scoring models for SaaS customer success. Three Python CLI tools produce health scores, churn risk tiers, and expansion recommendations."
category: "business"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Customer Success Manager

Production-grade customer success analytics with multi-dimensional health scoring, churn risk prediction, and expansion opportunity identification. Three Python CLI tools provide deterministic, repeatable analysis using standard library only.

## Quick Start

```bash
# Health scoring
python scripts/health_score_calculator.py assets/sample_customer_data.json
python scripts/health_score_calculator.py assets/sample_customer_data.json --format json

# Churn risk analysis
python scripts/churn_risk_analyzer.py assets/sample_customer_data.json

# Expansion opportunity scoring
python scripts/expansion_opportunity_scorer.py assets/sample_customer_data.json
```

All scripts support `--format text` (default) and `--format json` for integrations.

## Scripts

### 1. health_score_calculator.py

Multi-dimensional customer health scoring with trend analysis and segment-aware benchmarking.

| Dimension | Weight | Metrics |
|-----------|--------|---------|
| Usage | 30% | Login frequency, feature adoption, DAU/MAU ratio |
| Engagement | 25% | Support ticket volume, meeting attendance, NPS/CSAT |
| Support | 20% | Open tickets, escalation rate, avg resolution time |
| Relationship | 25% | Executive sponsor engagement, multi-threading depth, renewal sentiment |

**Classification:** Green (75-100), Yellow (50-74), Red (0-49)

### 2. churn_risk_analyzer.py

Identify at-risk accounts with behavioral signal detection and tier-based intervention recommendations.

| Signal Category | Weight | Indicators |
|----------------|--------|------------|
| Usage Decline | 30% | Login trend, feature adoption change, DAU/MAU change |
| Engagement Drop | 25% | Meeting cancellations, response time, NPS change |
| Support Issues | 20% | Open escalations, unresolved critical, satisfaction trend |
| Relationship Signals | 15% | Champion left, sponsor change, competitor mentions |
| Commercial Factors | 10% | Contract type, pricing complaints, budget cuts |

**Risk Tiers:** Critical (80-100), High (60-79), Medium (40-59), Low (0-39)

### 3. expansion_opportunity_scorer.py

Identify upsell, cross-sell, and expansion opportunities with revenue estimation and priority ranking.

**Expansion Types:** Upsell (higher tier), Cross-sell (new modules), Expansion (additional seats/departments)

## Input Requirements

All scripts accept a JSON file as positional input argument. See `assets/sample_customer_data.json` for complete schema examples. Required fields vary per script -- see the script `--help` output for details.

## Best Practices

1. **Combine signals**: Use all three scripts together for a complete customer picture
2. **Act on trends, not snapshots**: A declining Green is more urgent than a stable Yellow
3. **Calibrate thresholds**: Adjust segment benchmarks per `references/health-scoring-framework.md`
4. **Prepare with data**: Run scripts before every QBR and executive meeting

## Reference Guides

| Reference | Description |
|-----------|-------------|
| `references/health-scoring-framework.md` | Complete health scoring methodology, dimension definitions, threshold calibration |
| `references/cs-playbooks.md` | Intervention playbooks for each risk tier, onboarding, renewal, expansion procedures |
| `references/cs-metrics-benchmarks.md` | Industry benchmarks for NRR, GRR, churn rates, health scores by segment |

## Templates

| Template | Purpose |
|----------|---------|
| `assets/qbr_template.md` | Quarterly Business Review presentation structure |
| `assets/success_plan_template.md` | Customer success plan with goals and milestones |
| `assets/onboarding_checklist_template.md` | 90-day onboarding checklist with phase gates |

## Limitations

- **No real-time data**: Scripts analyze point-in-time snapshots from JSON input files
- **No CRM integration**: Data must be exported manually from your CRM/CS platform
- **Deterministic only**: No predictive ML -- scoring is algorithmic based on weighted signals
- **Revenue estimates**: Expansion revenue estimates are approximations based on usage patterns
