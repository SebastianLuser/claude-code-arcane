---
name: revenue-operations
description: "Analyze sales pipeline health, revenue forecasting accuracy, and go-to-market efficiency metrics for SaaS revenue optimization. Calculates pipeline coverage, MAPE, Magic Number, LTV:CAC, and Rule of 40."
category: "business"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Revenue Operations

Pipeline analysis, forecast accuracy tracking, and GTM efficiency measurement for SaaS revenue teams.

> **Output formats:** All scripts support `--format text` (human-readable) and `--format json` (dashboards/integrations).

## Quick Start

```bash
# Analyze pipeline health and coverage
python scripts/pipeline_analyzer.py --input assets/sample_pipeline_data.json --format text

# Track forecast accuracy over multiple periods
python scripts/forecast_accuracy_tracker.py assets/sample_forecast_data.json --format text

# Calculate GTM efficiency metrics
python scripts/gtm_efficiency_calculator.py assets/sample_gtm_data.json --format text
```

## Tools Overview

### 1. Pipeline Analyzer

Analyzes pipeline health including coverage ratios, stage conversion rates, deal velocity, aging risks, and concentration risks.

**Key Metrics:** Pipeline Coverage Ratio (healthy: 3-4x), Stage Conversion Rates, Sales Velocity, Deal Aging, Concentration Risk, Coverage Gap Analysis.

### 2. Forecast Accuracy Tracker

Tracks forecast accuracy over time using MAPE, detects systematic bias, analyzes trends, and provides category-level breakdowns.

**Accuracy Ratings:**

| Rating | MAPE Range | Interpretation |
|--------|-----------|----------------|
| Excellent | <10% | Highly predictable, data-driven process |
| Good | 10-15% | Reliable forecasting with minor variance |
| Fair | 15-25% | Needs process improvement |
| Poor | >25% | Significant forecasting methodology gaps |

### 3. GTM Efficiency Calculator

Calculates core SaaS GTM efficiency metrics with industry benchmarking and improvement recommendations.

| Metric | Formula | Target |
|--------|---------|--------|
| Magic Number | Net New ARR / Prior Period S&M Spend | >0.75 |
| LTV:CAC | (ARPA x Gross Margin / Churn Rate) / CAC | >3:1 |
| CAC Payback | CAC / (ARPA x Gross Margin) months | <18 months |
| Burn Multiple | Net Burn / Net New ARR | <2x |
| Rule of 40 | Revenue Growth % + FCF Margin % | >40% |
| Net Dollar Retention | (Begin ARR + Expansion - Contraction - Churn) / Begin ARR | >110% |

## Workflows

### Weekly Pipeline Review

1. Verify input data is current and complete
2. Run `pipeline_analyzer.py`
3. Cross-check output totals against CRM source
4. Review: coverage ratio (>3x?), aging deals, concentration risk, funnel shape
5. Document with `assets/pipeline_review_template.md`

### Forecast Accuracy Review (Monthly/Quarterly)

1. Verify all forecast periods have corresponding actuals
2. Run `forecast_accuracy_tracker.py`
3. Analyze: MAPE trending down? Which reps/segments have highest error? Systematic bias?
4. Document with `assets/forecast_report_template.md`

### GTM Efficiency Audit (Quarterly)

1. Verify revenue, cost, and customer figures reconcile with finance
2. Run `gtm_efficiency_calculator.py`
3. Benchmark: Magic Number (>0.75), LTV:CAC (>3:1), CAC Payback (<18mo), Rule of 40 (>40%)
4. Document with `assets/gtm_dashboard_template.md`

## Reference Documentation

| Reference | Description |
|-----------|-------------|
| [references/revops-metrics-guide.md](references/revops-metrics-guide.md) | Complete metrics hierarchy, definitions, formulas |
| [references/pipeline-management-framework.md](references/pipeline-management-framework.md) | Pipeline best practices, stage definitions, conversion benchmarks |
| [references/gtm-efficiency-benchmarks.md](references/gtm-efficiency-benchmarks.md) | SaaS benchmarks by stage, industry standards |

## Templates

| Template | Use Case |
|----------|----------|
| `assets/pipeline_review_template.md` | Weekly/monthly pipeline inspection |
| `assets/forecast_report_template.md` | Forecast accuracy reporting |
| `assets/gtm_dashboard_template.md` | GTM efficiency dashboard for leadership |
