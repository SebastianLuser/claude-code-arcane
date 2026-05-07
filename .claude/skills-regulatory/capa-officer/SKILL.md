---
name: capa-officer
description: "CAPA system management for medical device QMS — root cause analysis, corrective action planning, effectiveness verification, and CAPA metrics."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# CAPA Officer

Corrective and Preventive Action (CAPA) management within Quality Management Systems.

## CAPA Investigation Workflow

1. Document trigger event with objective evidence
2. Assess significance and determine CAPA necessity
3. Form investigation team with relevant expertise
4. Collect data and evidence systematically
5. Select and apply appropriate RCA methodology
6. Identify root cause(s) with supporting evidence
7. Develop corrective and preventive actions
8. **Validation:** Root cause explains all symptoms; if eliminated, problem would not recur

### CAPA Necessity Determination

| Trigger Type | CAPA Required | Criteria |
|--------------|---------------|----------|
| Customer complaint (safety) | Yes | Any involving patient/user safety |
| Internal audit finding (Major) | Yes | Systematic failure or absence |
| Nonconformance (recurring) | Yes | Same NC type 3+ times |
| External audit finding | Yes | All Major and Minor findings |
| Customer complaint (quality) | Evaluate | Based on severity and frequency |
| Trend analysis | Evaluate | Based on significance |

---

## Root Cause Analysis

Select methodology based on problem characteristics:

- **5 Why Analysis** — Single-cause issues with linear causation
- **Fishbone Diagram (6M)** — Complex systemic issues with 3-6 factors
- **Fault Tree Analysis** — Safety-critical or system reliability issues
- **Human Factors Analysis** — Human error as suspected primary cause
- **FMEA** — Proactive risk assessment

### Root Cause Validation Checklist

- [ ] Root cause verified with objective evidence
- [ ] If eliminated, problem would not recur
- [ ] Within organizational control
- [ ] Explains all observed symptoms

For complete RCA method details, decision tree, 5-Why template with example, and fishbone categories, see [references/rca-methodologies.md](references/rca-methodologies.md).

---

## Corrective Action Planning

| Type | Purpose | Timeline |
|------|---------|----------|
| Containment | Stop immediate impact | 24-72 hours |
| Correction | Fix specific occurrence | 1-2 weeks |
| Corrective | Eliminate root cause | 30-90 days |
| Preventive | Prevent in other areas | 60-120 days |

For action plan template, effectiveness indicators, and implementation timeline, see [references/effectiveness-verification-guide.md](references/effectiveness-verification-guide.md).

---

## Effectiveness Verification

1. Allow adequate implementation period (30-90 days minimum)
2. Collect post-implementation data
3. Compare to pre-implementation baseline
4. Evaluate against success criteria
5. Verify no recurrence during verification period
6. **Validation:** All criteria met with objective evidence

### Verification Timeline

| CAPA Severity | Wait Period | Verification Window |
|---------------|-------------|---------------------|
| Critical | 30 days | 30-90 days |
| Major | 60 days | 60-180 days |
| Minor | 90 days | 90-365 days |

For verification methods, effectiveness determination decision tree, and closure requirements, see [references/effectiveness-verification-guide.md](references/effectiveness-verification-guide.md).

---

## CAPA Metrics

| Metric | Target |
|--------|--------|
| CAPA cycle time | <60 days average |
| Overdue rate | <10% |
| First-time effectiveness | >90% |
| Recurrence rate | <5% |

---

## Tools and References

| Tool | Purpose |
|------|---------|
| [capa_tracker.py](scripts/capa_tracker.py) | Generate CAPA status reports and metrics |

| Document | Content |
|----------|---------|
| [rca-methodologies.md](references/rca-methodologies.md) | 5-Why, Fishbone, FTA, Human Factors, FMEA templates |
| [effectiveness-verification-guide.md](references/effectiveness-verification-guide.md) | Verification planning, methods, action plans, closure |

---

## Regulatory Requirements

### ISO 13485:2016 Clause 8.5

- 8.5.2 Corrective Action: Eliminate cause of nonconformity
- 8.5.3 Preventive Action: Eliminate potential nonconformity

### FDA 21 CFR 820.100

Required elements: procedures, quality data analysis, cause investigation, action identification, effectiveness verification, management review submission.
