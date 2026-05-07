---
name: tech-stack-evaluator
description: "Evaluate and compare technology stacks, frameworks, and cloud providers with weighted scoring, TCO analysis, security assessment, ecosystem health scoring, and migration planning."
category: "backend"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Technology Stack Evaluator

Evaluate and compare technologies, frameworks, and cloud providers with data-driven analysis and actionable recommendations.

## Capabilities

| Capability | Description |
|------------|-------------|
| Technology Comparison | Compare frameworks and libraries with weighted scoring |
| TCO Analysis | Calculate 5-year total cost including hidden costs |
| Ecosystem Health | Assess GitHub metrics, npm adoption, community strength |
| Security Assessment | Evaluate vulnerabilities and compliance readiness |
| Migration Analysis | Estimate effort, risks, and timeline for migrations |
| Cloud Comparison | Compare AWS, Azure, GCP for specific workloads |

## Quick Start

### Compare Two Technologies

```
Compare React vs Vue for a SaaS dashboard.
Priorities: developer productivity (40%), ecosystem (30%), performance (30%).
```

### Calculate TCO

```
Calculate 5-year TCO for Next.js on Vercel.
Team: 8 developers. Hosting: $2500/month. Growth: 40%/year.
```

### Assess Migration

```
Evaluate migrating from Angular.js to React.
Codebase: 50,000 lines, 200 components. Team: 6 developers.
```

## Input Formats

The evaluator accepts three input formats:

**Text** - Natural language queries
**YAML** - Structured input for automation
**JSON** - Programmatic integration

## Analysis Types

### Quick Comparison (200-300 tokens)
- Weighted scores and recommendation
- Top 3 decision factors
- Confidence level

### Standard Analysis (500-800 tokens)
- Comparison matrix
- TCO overview
- Security summary

### Full Report (1200-1500 tokens)
- All metrics and calculations
- Migration analysis
- Detailed recommendations

## Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `stack_comparator.py` | Compare technologies with weighted criteria | `python scripts/stack_comparator.py --help` |
| `tco_calculator.py` | Calculate total cost of ownership | `python scripts/tco_calculator.py --input assets/sample_input_tco.json` |
| `ecosystem_analyzer.py` | Analyze ecosystem health metrics | `python scripts/ecosystem_analyzer.py --technology react` |
| `security_assessor.py` | Evaluate security posture | `python scripts/security_assessor.py --technology express --compliance soc2,gdpr` |
| `migration_analyzer.py` | Estimate migration complexity | `python scripts/migration_analyzer.py --from angular-1.x --to react` |

## Confidence Levels

| Level | Score | Interpretation |
|-------|-------|----------------|
| High | 80-100% | Clear winner, strong data |
| Medium | 50-79% | Trade-offs present, moderate uncertainty |
| Low | < 50% | Close call, limited data |

## When to Use

- Comparing frontend/backend frameworks for new projects
- Evaluating cloud providers for specific workloads
- Planning technology migrations with risk assessment
- Calculating build vs. buy decisions with TCO
- Assessing open-source library viability

## When NOT to Use

- Trivial decisions between similar tools (use team preference)
- Mandated technology choices (decision already made)
- Emergency production issues (use monitoring tools)

## References

| Document | Content |
|----------|---------|
| `references/metrics.md` | Detailed scoring algorithms and calculation formulas |
| `references/examples.md` | Input/output examples for all analysis types |
| `references/workflows.md` | Step-by-step evaluation workflows |
