---
name: sales-engineer
description: "Analyze RFP/RFI responses for coverage gaps, build competitive feature comparison matrices, and plan proof-of-concept engagements for pre-sales engineering. Covers bid/no-bid decisions, demo preparation, and technical proposals."
category: "business"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Sales Engineer

Pre-sales engineering skill covering a 5-phase workflow: Discovery, Solution Design, Demo, POC, and Proposal.

## 5-Phase Workflow

### Phase 1: Discovery & Research

**Objective:** Understand customer requirements, technical environment, and business drivers.

- Conduct technical discovery calls with stakeholders
- Map customer's current architecture and pain points
- Identify integration requirements and constraints
- Run `rfp_response_analyzer.py` to score initial requirement alignment

```bash
python scripts/rfp_response_analyzer.py assets/sample_rfp_data.json --format json > phase1_rfp_results.json
```

**Gate:** Coverage score must be >50% and must-have gaps <=3 before proceeding.

### Phase 2: Solution Design

**Objective:** Design a solution architecture that addresses customer requirements.

- Map product capabilities to customer requirements
- Build competitive differentiation strategy using `competitive_matrix_builder.py`
- Create solution architecture diagrams

```bash
python scripts/competitive_matrix_builder.py competitive_data.json --format json > phase2_competitive.json
```

**Gate:** At least one strong differentiator per customer priority.

### Phase 3: Demo Preparation & Delivery

**Objective:** Deliver compelling technical demonstrations tailored to stakeholder priorities.

- Build demo environment matching customer's use case
- Create demo script with talking points per stakeholder role
- Prepare objection handling responses
- Use `assets/demo_script_template.md` for structured preparation

### Phase 4: POC & Evaluation

**Objective:** Execute a structured proof-of-concept that validates the solution.

- Define POC scope, success criteria, and timeline
- Run `poc_planner.py` to generate the complete POC plan
- Track progress against success criteria
- Use `assets/poc_scorecard_template.md` for evaluation

```bash
python scripts/poc_planner.py poc_data.json --format json > phase4_poc_plan.json
```

**Gate:** Scorecard score >60% across all evaluation dimensions for go recommendation.

### Phase 5: Proposal & Closing

- Compile POC results and success metrics
- Create technical proposal with `assets/technical_proposal_template.md`
- Address outstanding objections with evidence
- Conduct win/loss analysis post-decision

## Python Automation Tools

| Script | Purpose | Usage |
|--------|---------|-------|
| `rfp_response_analyzer.py` | Parse RFP requirements, score coverage, bid/no-bid | `python scripts/rfp_response_analyzer.py data.json` |
| `competitive_matrix_builder.py` | Feature comparison, competitive scores, differentiators | `python scripts/competitive_matrix_builder.py data.json` |
| `poc_planner.py` | POC plans, timeline, scorecard, go/no-go | `python scripts/poc_planner.py data.json` |

### Bid/No-Bid Logic

- **Bid:** Coverage >70% AND must-have gaps <=3
- **Conditional Bid:** Coverage 50-70% OR must-have gaps 2-3
- **No-Bid:** Coverage <50% OR must-have gaps >3

## Reference Knowledge Bases

| Reference | Description |
|-----------|-------------|
| `references/rfp-response-guide.md` | RFP/RFI response best practices, compliance matrix, bid/no-bid framework |
| `references/competitive-positioning-framework.md` | Competitive analysis methodology, battlecard creation, objection handling |
| `references/poc-best-practices.md` | POC planning methodology, success criteria, evaluation frameworks |

## Asset Templates

| Template | Purpose |
|----------|---------|
| `assets/technical_proposal_template.md` | Technical proposal with executive summary and implementation plan |
| `assets/demo_script_template.md` | Demo script with agenda and objection handling |
| `assets/poc_scorecard_template.md` | POC evaluation scorecard with weighted scoring |
