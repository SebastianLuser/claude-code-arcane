---
name: product-manager-toolkit
description: "Comprehensive PM toolkit with RICE prioritization, customer interview analysis, PRD templates, discovery frameworks, and go-to-market strategies."
category: "agile"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Product Manager Toolkit

Essential tools and frameworks for modern product management, from discovery to delivery.

## Quick Start

```bash
# Create sample data file
python scripts/rice_prioritizer.py sample

# Run prioritization with team capacity
python scripts/rice_prioritizer.py sample_features.csv --capacity 15

# Analyze interview transcript
python scripts/customer_interview_analyzer.py interview_transcript.txt
```

## Core Workflows

### Feature Prioritization Process

```
Gather -> Score -> Analyze -> Plan -> Validate -> Execute
```

1. **Gather Feature Requests**: Customer feedback, sales requests, tech debt, strategic initiatives
2. **Score with RICE**: `python scripts/rice_prioritizer.py features.csv --capacity 20`
   See `references/frameworks.md` for RICE formula and scoring guidelines.
3. **Analyze Portfolio**: Quick wins vs big bets distribution, effort concentration, strategic alignment gaps
4. **Generate Roadmap**: Quarterly capacity allocation, dependency identification, stakeholder communication
5. **Validate Results**:
   - Compare top priorities against strategic goals
   - Run sensitivity analysis (what if estimates are wrong by 2x?)
   - Validate effort estimates with engineering
6. **Execute and Iterate**: Share roadmap, track actual vs estimated effort, revisit quarterly

### Customer Discovery Process

```
Plan -> Recruit -> Interview -> Analyze -> Synthesize -> Validate
```

1. **Plan Research**: Define research questions, identify target segments, create interview script
2. **Recruit Participants**: 5-8 interviews per segment, mix of power users and churned users
3. **Conduct Interviews**: Semi-structured format, focus on problems not solutions, record with permission
4. **Analyze Insights**: `python scripts/customer_interview_analyzer.py transcript.txt`
   Extracts: pain points, feature requests, JTBD patterns, sentiment, key themes, notable quotes
5. **Synthesize Findings**: Group similar pain points, identify patterns (3+ mentions = pattern), map to opportunity areas
6. **Validate Solutions**: Create solution hypotheses, test with low-fidelity prototypes, measure behavior

### PRD Development Process

```
Scope -> Draft -> Review -> Refine -> Approve -> Track
```

Select template from `references/prd_templates.md`:

| Template | Use Case | Timeline |
|----------|----------|----------|
| Standard PRD | Complex features, cross-team | 6-8 weeks |
| One-Page PRD | Simple features, single team | 2-4 weeks |
| Feature Brief | Exploration phase | 1 week |
| Agile Epic | Sprint-based delivery | Ongoing |

## Tools Reference

### RICE Prioritizer

RICE framework implementation with portfolio analysis, configurable weights, and multiple output formats.

```bash
python scripts/rice_prioritizer.py sample                          # Create sample data
python scripts/rice_prioritizer.py features.csv                    # Default capacity (10)
python scripts/rice_prioritizer.py features.csv --capacity 20      # Custom capacity
python scripts/rice_prioritizer.py features.csv --output json      # JSON output
python scripts/rice_prioritizer.py features.csv --output csv       # CSV output
```

> See references/input-output-examples.md for CSV format, sample outputs, and integration examples.

### Customer Interview Analyzer

NLP-based analysis extracting pain points, feature requests, JTBD patterns, sentiment, themes, and competitor mentions.

```bash
python scripts/customer_interview_analyzer.py interview.txt        # Text report
python scripts/customer_interview_analyzer.py interview.txt json   # JSON output
```

## Common Pitfalls

| Pitfall | Prevention |
|---------|------------|
| **Solution-First** | Start every PRD with problem statement |
| **Analysis Paralysis** | Set time-boxes for research phases |
| **Feature Factory** | Define success metrics before building |
| **Ignoring Tech Debt** | Reserve 20% capacity for maintenance |
| **Stakeholder Surprise** | Weekly async updates, monthly demos |
| **Metric Theater** | Tie metrics to user value delivered |

## Best Practices

- **PRDs**: Start with problem, include success metrics, state out-of-scope, use visuals, version control
- **Prioritization**: Mix quick wins with strategic bets, consider opportunity cost, buffer 20%, revisit quarterly
- **Discovery**: Ask "why" five times, focus on past behavior, avoid leading questions, validate qual with quant

## Reference Documents

- `references/prd_templates.md` - PRD templates for different contexts
- `references/frameworks.md` - RICE, MoSCoW, Kano, JTBD framework documentation
- `references/input-output-examples.md` - Detailed I/O examples
