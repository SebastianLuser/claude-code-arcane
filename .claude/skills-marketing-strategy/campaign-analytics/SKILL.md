---
name: campaign-analytics
description: "Analyze campaign performance with multi-touch attribution, funnel conversion analysis, and ROI calculation across channels."
category: "marketing-strategy"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Campaign Analytics

Campaign performance analysis with multi-touch attribution, funnel analysis, and ROI calculation. Three Python CLI tools — standard library only, no external dependencies.

## Typical Workflow

```bash
# Step 1 — Attribution: which channels drive conversions
python scripts/attribution_analyzer.py campaign_data.json --model time-decay

# Step 2 — Funnel: where prospects drop off
python scripts/funnel_analyzer.py funnel_data.json

# Step 3 — ROI: profitability and benchmarks
python scripts/campaign_roi_calculator.py campaign_data.json
```

All scripts support `--format text` (default) and `--format json` for integrations.

---

## Scripts

### 1. attribution_analyzer.py

Five attribution models:

| Model | Description | Best For |
|-------|-------------|----------|
| First-Touch | 100% to first interaction | Brand awareness |
| Last-Touch | 100% to last interaction | Direct response |
| Linear | Equal credit all touchpoints | Balanced evaluation |
| Time-Decay | More credit to recent | Short sales cycles |
| Position-Based | 40/20/40 split | Full-funnel marketing |

### 2. funnel_analyzer.py

Stage-to-stage conversion rates, bottleneck identification, segment comparison.

### 3. campaign_roi_calculator.py

ROI, ROAS, CPA, CPL, CAC, CTR, CVR — flags underperforming campaigns against industry benchmarks.

---

## Input Requirements

All scripts accept a JSON file. Use `python -m json.tool your_file.json` to validate syntax.

For complete input schemas (journey, funnel, campaign), sample data, and validation rules, see [references/attribution-models-guide.md](references/attribution-models-guide.md).

---

## Reference Guides

| Guide | Location | Purpose |
|-------|----------|---------|
| Attribution Models | [references/attribution-models-guide.md](references/attribution-models-guide.md) | Models with formulas, selection criteria, input schemas |
| Campaign Benchmarks | [references/campaign-metrics-benchmarks.md](references/campaign-metrics-benchmarks.md) | Benchmarks by channel and vertical |
| Funnel Optimization | [references/funnel-optimization-framework.md](references/funnel-optimization-framework.md) | Stage-by-stage strategies, bottlenecks |

---

## Best Practices

1. **Use multiple attribution models** — Compare 3+ to triangulate channel value
2. **Match time-decay half-life** to average sales cycle length
3. **Segment funnels** by channel, cohort, geography
4. **Benchmark against your own history first** — industry benchmarks provide context only
5. **Include all costs** — creative, tooling, labor alongside media spend

---

## Limitations

- Descriptive metrics only (no statistical significance testing)
- Standard library only (not optimized for >100K journeys)
- Offline analysis (static JSON snapshots)
- Single-currency; simplified time-decay; no cross-device tracking

## Related Skills

- **analytics-tracking**: For setting up tracking (not analyzing data)
- **ab-test-setup**: For designing experiments from analytics insights
- **marketing-ops**: For routing insights to execution
