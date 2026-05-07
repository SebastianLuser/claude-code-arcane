---
name: scrum-master
description: "Data-driven Scrum Master for sprint analytics, Monte Carlo forecasting, multi-dimension health scoring, and retrospective action-item tracking using Python analysis scripts."
category: "agile"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Scrum Master Expert

Data-driven Scrum Master skill combining sprint analytics, probabilistic forecasting, and team development coaching. The unique value is in the three Python analysis scripts and their workflows.

## Analysis Tools & Usage

### 1. Velocity Analyzer (`scripts/velocity_analyzer.py`)

Rolling averages, linear-regression trend detection, and Monte Carlo simulation over sprint history.

```bash
python velocity_analyzer.py sprint_data.json --format text   # Text report
python velocity_analyzer.py sprint_data.json --format json   # JSON output
```

**Outputs**: velocity trend, coefficient of variation, 6-sprint Monte Carlo forecast at 50/70/85/95% confidence intervals, anomaly flags.

**Validation**: If fewer than 3 sprints, stop and prompt. 6+ sprints recommended for statistically significant results.

### 2. Sprint Health Scorer (`scripts/sprint_health_scorer.py`)

Scores team health across 6 weighted dimensions (0-100 grade):

| Dimension | Weight | Target |
|---|---|---|
| Commitment Reliability | 25% | >85% sprint goals met |
| Scope Stability | 20% | <15% mid-sprint changes |
| Blocker Resolution | 15% | <3 days average |
| Ceremony Engagement | 15% | >90% participation |
| Story Completion Distribution | 15% | High ratio of fully done stories |
| Velocity Predictability | 10% | CV <20% |

```bash
python sprint_health_scorer.py sprint_data.json --format text
```

**Validation**: Requires 2+ sprints. Report missing dimensions and ask user to supply gaps.

### 3. Retrospective Analyzer (`scripts/retrospective_analyzer.py`)

Tracks action-item completion, recurring themes, sentiment trends, and team maturity progression.

```bash
python retrospective_analyzer.py sprint_data.json --format text
```

**Outputs**: Action-item completion rate, recurring-theme persistence, team maturity level (forming/storming/norming/performing), improvement-velocity trend.

**Validation**: Requires 3+ retrospectives. With fewer, offer partial theme analysis only.

## Input Requirements

All scripts accept JSON following the schema in `assets/sample_sprint_data.json`. Jira and similar tools can export sprint data; map exported fields to this schema before running.

## Sprint Execution Workflows

### Sprint Planning
1. Run velocity analysis; use 70% confidence interval as recommended commitment ceiling
2. Review health scorer's Commitment Reliability and Scope Stability to calibrate negotiation
3. If CV >20%, surface range estimates rather than single-point forecasts
4. Document capacity assumptions for retrospective comparison

### Daily Standup
1. Track participation and help-seeking patterns for ceremony data
2. Log each blocker with date opened; resolution time feeds Blocker Resolution dimension
3. If blocker unresolved after 2 days, escalate proactively

### Sprint Review
1. Present velocity trend and health score alongside demo for stakeholder context
2. Capture scope-change requests raised during review

### Sprint Retrospective
1. Run all three scripts before the session
2. Open with health score and top-flagged dimensions to focus discussion
3. Use action-item completion rate to determine how many new items the team can absorb (target: 3 or fewer if completion rate <60%)
4. Assign each action item an owner and measurable success criterion
5. Record new action items in sprint data for tracking in next cycle

## Team Development

### Assessment
Run health scorer and retrospective analyzer. Map maturity output to development stage. Supplement with psychological safety pulse survey.

### Intervention

> See references/team-dynamics-framework.md for stage-specific facilitation details.

| Stage | Focus |
|---|---|
| Forming | Structure, process education, trust building |
| Storming | Conflict facilitation, psychological safety |
| Norming | Autonomy building, process ownership transfer |
| Performing | Challenge introduction, innovation support |

### Progress Measurement
- Sprint cadence: re-run health scorer; target +5 points per quarter
- Monthly: psychological safety pulse; target >4.0/5.0
- Quarterly: full maturity re-assessment
- If plateau for 2 consecutive sprints, escalate intervention strategy

## Key Metrics & Targets

| Metric | Target |
|---|---|
| Overall Health Score | >80/100 |
| Psychological Safety Index | >4.0/5.0 |
| Velocity CV | <20% |
| Commitment Reliability | >85% |
| Scope Stability | <15% mid-sprint changes |
| Blocker Resolution Time | <3 days |
| Ceremony Engagement | >90% |
| Retro Action Completion | >70% |

## Limitations

- Fewer than 6 sprints reduces Monte Carlo confidence -- always state confidence intervals
- Missing ceremony/story data suppresses affected scoring dimensions
- Metrics do not replace qualitative observation; combine with direct team interaction
- Techniques optimized for 5-9 member teams; larger groups may require adaptation
