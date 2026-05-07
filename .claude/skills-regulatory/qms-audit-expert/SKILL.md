---
name: qms-audit-expert
description: "ISO 13485 internal audit expertise — audit planning, execution, nonconformity classification, CAPA verification, and external audit preparation."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# QMS Audit Expert

ISO 13485 internal audit methodology for medical device quality management systems.

## Audit Planning

Plan risk-based internal audit program:

1. List all QMS processes requiring audit
2. Assign risk level (High/Medium/Low) and set frequency
3. Review previous findings and trends
4. Assign qualified auditors (verify independence)
5. Create annual schedule and communicate to process owners
6. **Validation:** All ISO 13485 clauses covered within cycle

### Risk-Based Audit Frequency

| Risk Level | Frequency | Criteria |
|------------|-----------|----------|
| High | Quarterly | Design control, CAPA, production validation |
| Medium | Semi-annual | Purchasing, training, document control |
| Low | Annual | Infrastructure, management review |

For audit scope by clause, auditor independence checklist, and complete question sets, see [references/iso13485-audit-guide.md](references/iso13485-audit-guide.md).

---

## Audit Execution

1. Prepare audit plan, review documentation
2. Conduct opening meeting
3. Collect evidence (document review, interviews, observation, record trace)
4. Classify findings (Major/Minor/Observation)
5. Conduct closing meeting
6. Issue report within 5 business days
7. **Validation:** All scope items covered; findings supported by evidence

### Finding Documentation

```
Requirement: [Specific ISO 13485 clause or procedure]
Evidence: [What was observed, reviewed, or heard]
Gap: [How evidence fails to meet requirement]
```

---

## Nonconformity Management

### Classification Criteria

| Category | Definition | CAPA Required | Timeline |
|----------|------------|---------------|----------|
| Major | Systematic failure or absence of element | Yes | 30 days |
| Minor | Isolated lapse or partial implementation | Recommended | 60 days |
| Observation | Improvement opportunity | Optional | As appropriate |

### Corrective Action Integration

| Severity | CAPA Depth | Verification |
|----------|------------|--------------|
| Major | Full RCA (5-Why, Fishbone) | Next audit or within 6 months |
| Minor | Immediate cause identification | Next scheduled audit |

For classification decision tree and detailed guidance, see [references/nonconformity-classification.md](references/nonconformity-classification.md).

---

## External Audit Preparation

1. Complete all scheduled internal audits
2. Verify all findings closed with effective CAPA
3. Review documentation for currency and accuracy
4. Conduct mock audit (full scope)
5. Brief personnel on audit protocol
6. **Validation:** Mock audit findings addressed before external audit

### Pre-Audit Readiness Checklist

- [ ] Quality Manual current; procedures reflect actual practice
- [ ] Records complete and retrievable; previous findings closed
- [ ] Key personnel available; SMEs identified; escorts assigned
- [ ] Work areas organized; documents at point of use current
- [ ] Equipment calibration status visible; NC product segregated

---

## Tools and References

```bash
python scripts/audit_schedule_optimizer.py --processes processes.json
```

| Document | Content |
|----------|---------|
| [iso13485-audit-guide.md](references/iso13485-audit-guide.md) | Clause-by-clause methodology, questions, evidence |
| [nonconformity-classification.md](references/nonconformity-classification.md) | Severity criteria, decision tree, CAPA integration |

---

## Audit Program Metrics

| Metric | Target |
|--------|--------|
| Schedule compliance | >90% |
| Finding closure rate | >95% |
| Repeat findings | <10% |
| CAPA effectiveness | >90% |
