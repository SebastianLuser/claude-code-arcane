---
name: product-strategist
description: "Strategic product leadership toolkit for OKR cascade generation, quarterly planning, competitive landscape analysis, product vision documents, and team scaling proposals."
category: "agile"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Product Strategist

Strategic toolkit for Head of Product to drive vision, alignment, and organizational excellence.

## Core Capabilities

| Capability | Description | Tool |
|------------|-------------|------|
| **OKR Cascade** | Generate aligned OKRs from company to team level | `okr_cascade_generator.py` |
| **Alignment Scoring** | Measure vertical and horizontal alignment | Built into generator |
| **Strategy Templates** | 5 pre-built strategy types | Growth, Retention, Revenue, Innovation, Operational |
| **Team Configuration** | Customize for your org structure | `--teams` flag |

## Quick Start

```bash
# Growth strategy with default teams
python scripts/okr_cascade_generator.py growth

# Retention strategy with custom teams
python scripts/okr_cascade_generator.py retention --teams "Engineering,Design,Data"

# Revenue strategy with 40% product contribution
python scripts/okr_cascade_generator.py revenue --contribution 0.4

# Export as JSON for integration
python scripts/okr_cascade_generator.py growth --json > okrs.json
```

## Workflow: Quarterly Strategic Planning

### Step 1: Define Strategic Focus

| Strategy | When to Use |
|----------|-------------|
| **Growth** | Scaling user base, market expansion |
| **Retention** | Reducing churn, improving LTV |
| **Revenue** | Increasing ARPU, new monetization |
| **Innovation** | Market differentiation, new capabilities |
| **Operational** | Improving efficiency, scaling operations |

See `references/strategy_types.md` for detailed guidance.

### Step 2: Gather Input Metrics

Provide current/target values: MAU, NPS, conversion rates, revenue metrics.

### Step 3: Configure Teams & Run Generator

```bash
python scripts/okr_cascade_generator.py growth --teams "Core,Platform,Mobile,AI" --contribution 0.3
```

### Step 4: Review Alignment Scores

| Score | Target | Action if Below |
|-------|--------|-----------------|
| Vertical Alignment | >90% | Ensure all objectives link to parent |
| Horizontal Alignment | >75% | Check for team coordination gaps |
| Coverage | >80% | Validate all company OKRs are addressed |
| Balance | >80% | Redistribute if one team is overloaded |
| **Overall** | **>80%** | <60% needs restructuring |

### Step 5: Refine, Validate, and Export

Before finalizing:
- Review generated objectives with stakeholders
- Adjust team assignments based on capacity
- Validate contribution percentages are realistic
- Ensure no conflicting objectives across teams
- Set up tracking cadence (bi-weekly check-ins)

```bash
python scripts/okr_cascade_generator.py growth --json > q1_okrs.json
```

## OKR Cascade Generator

**Strategies:** `growth` | `retention` | `revenue` | `innovation` | `operational`

| Option | Description | Default |
|--------|-------------|---------|
| `--teams`, `-t` | Comma-separated team names | Growth,Platform,Mobile,Data |
| `--contribution`, `-c` | Product contribution to company OKRs (0-1) | 0.3 (30%) |
| `--json`, `-j` | Output as JSON instead of dashboard | False |
| `--metrics`, `-m` | Metrics as JSON string | Sample metrics |

> See `references/examples/sample_growth_okrs.json` for a complete output example.

## Reference Documents

| Document | Description |
|----------|-------------|
| `references/okr_framework.md` | OKR methodology, writing guidelines, alignment scoring |
| `references/strategy_types.md` | Detailed breakdown of all 5 strategy types with examples |
| `references/examples/sample_growth_okrs.json` | Complete sample output for growth strategy |

## Best Practices

### OKR Cascade
- Limit to 3-5 objectives per level, each with 3-5 key results
- Key results must be measurable with current and target values
- Validate parent-child relationships before finalizing

### Alignment Scoring
- Target >80% overall alignment; investigate any score below 60%
- Balance scores ensure no team is overloaded
- Horizontal alignment prevents conflicting goals across teams

### Team Configuration
- Configure teams to match your actual org structure
- Adjust contribution percentages based on team size
- Platform/Infrastructure teams often support all objectives
