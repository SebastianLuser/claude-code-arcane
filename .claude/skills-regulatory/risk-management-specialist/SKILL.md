---
name: risk-management-specialist
description: "ISO 14971 risk management for medical devices — risk analysis, FMEA, risk evaluation, risk control, and post-production monitoring."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Risk Management Specialist

ISO 14971:2019 risk management implementation throughout the medical device lifecycle.

## Risk Management Planning

Establish risk management process per ISO 14971:

1. Define scope (device identification, lifecycle stages, applicable standards)
2. Establish risk acceptability criteria (probability P1-P5, severity S1-S5)
3. Assign responsibilities (risk lead, SMEs, approval authorities)
4. Define verification activities and acceptance criteria
5. Plan production and post-production monitoring
6. Obtain plan approval and establish risk management file
7. **Validation:** Plan approved; acceptability criteria defined; file established

### Risk Acceptability Matrix (5x5)

| Probability \ Severity | Negligible | Minor | Serious | Critical | Catastrophic |
|------------------------|------------|-------|---------|----------|--------------|
| **Frequent (P5)** | Medium | High | High | Unacceptable | Unacceptable |
| **Probable (P4)** | Medium | Medium | High | High | Unacceptable |
| **Occasional (P3)** | Low | Medium | Medium | High | High |
| **Remote (P2)** | Low | Low | Medium | Medium | High |
| **Improbable (P1)** | Low | Low | Low | Medium | Medium |

| Level | Action Required |
|-------|-----------------|
| Low | Document and accept |
| Medium | Reduce if practicable (ALARP); document rationale |
| High | Reduction required; demonstrate ALARP |
| Unacceptable | Design change mandatory |

---

## Risk Analysis

1. Define intended use and reasonably foreseeable misuse
2. Select analysis method (FMEA, FTA, HAZOP, Use Error Analysis)
3. Identify hazards by category (electrical, mechanical, thermal, biological, chemical, software, use error)
4. Determine hazardous situations and sequences of events
5. Estimate probability and severity of harm
6. Document in hazard analysis worksheet
7. **Validation:** All hazard categories addressed; all hazards documented

For probability/severity criteria definitions, hazard categories checklist, and analysis method selection guide, see [references/risk-analysis-methods.md](references/risk-analysis-methods.md).

---

## Risk Evaluation

1. Calculate initial risk level from probability x severity
2. Compare to risk acceptability criteria
3. Determine: Acceptable (document), ALARP (control), Unacceptable (mandatory control)
4. Complete benefit-risk analysis if applicable
5. **Validation:** All risks evaluated; acceptability determined; rationale documented

For ALARP demonstration requirements, benefit-risk triggers, and evaluation decision tree, see [references/iso14971-implementation-guide.md](references/iso14971-implementation-guide.md).

---

## Risk Control

1. Identify control options following hierarchy: inherent safety (Priority 1) → protective measures (Priority 2) → information for safety (Priority 3)
2. Analyze control for new hazards introduced
3. Implement control in design
4. Execute verification and document results
5. Evaluate residual risk with control in place
6. **Validation:** Control implemented; verification passed; residual risk acceptable

For risk control option analysis template, verification methods, and residual risk evaluation, see [references/risk-assessment-templates.md](references/risk-assessment-templates.md).

---

## Post-Production Risk Management

Monitor and update risk management throughout product lifecycle:

1. Identify information sources (complaints, service reports, vigilance, literature, clinical studies)
2. Establish collection procedures and review triggers
3. Analyze incoming information for risk relevance
4. Update risk management file as needed
5. Conduct periodic risk management review
6. **Validation:** Information sources monitored; file current; reviews completed

For information sources table, update triggers, and periodic review requirements, see [references/iso14971-implementation-guide.md](references/iso14971-implementation-guide.md).

---

## Risk Assessment Templates

See [references/risk-assessment-templates.md](references/risk-assessment-templates.md) for hazard analysis worksheet, risk control option analysis, and FMEA templates.

---

## Tools and References

| Tool | Purpose |
|------|---------|
| [risk_matrix_calculator.py](scripts/risk_matrix_calculator.py) | Calculate risk levels and FMEA RPN |

| Document | Content |
|----------|---------|
| [iso14971-implementation-guide.md](references/iso14971-implementation-guide.md) | Complete ISO 14971:2019 implementation with templates |
| [risk-analysis-methods.md](references/risk-analysis-methods.md) | FMEA, FTA, HAZOP, Use Error Analysis methods |
| [risk-assessment-templates.md](references/risk-assessment-templates.md) | Hazard worksheet, risk control templates, decision frameworks |

---

## Related Skills

| Skill | Integration Point |
|-------|-------------------|
| quality-manager-qms-iso13485 | QMS integration |
| capa-officer | Risk-based CAPA |
| regulatory-affairs-head | Regulatory submissions |
| quality-documentation-manager | Risk file management |
