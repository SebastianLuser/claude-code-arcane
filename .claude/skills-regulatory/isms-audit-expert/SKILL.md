---
name: isms-audit-expert
description: "ISMS audit management for ISO 27001 — audit planning, control assessment, finding classification, and certification support."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# ISMS Audit Expert

Internal and external ISMS audit management for ISO 27001 compliance.

## Audit Program Management

### Risk-Based Audit Schedule

| Risk Level | Frequency | Examples |
|------------|-----------|----------|
| Critical | Quarterly | Privileged access, vulnerability management, logging |
| High | Semi-annual | Access control, incident response, encryption |
| Medium | Annual | Policies, awareness training, physical security |
| Low | Annual | Documentation, asset inventory |

### Annual Audit Planning

1. Review previous findings and risk assessment results
2. Identify high-risk controls and recent incidents
3. Determine scope based on ISMS boundaries
4. Assign independent auditors
5. Obtain management approval
6. **Validation:** Plan covers all Annex A controls within certification cycle

---

## Audit Execution

1. Review ISMS documentation, previous reports
2. Prepare audit plan with interview schedule and checklists
3. **Opening Meeting** — Confirm scope, methodology, logistics
4. **Evidence Collection** — Interview owners, review records, observe processes, inspect configs
5. **Control Verification** — Test design and operation, sample transactions
6. **Closing Meeting** — Present findings, clarify inaccuracies, agree timelines
7. **Validation:** All in-scope controls assessed with documented evidence

For detailed control testing procedures by Annex A control, see [references/security-control-testing.md](references/security-control-testing.md).

---

## Finding Management

| Severity | Definition | Response Time |
|----------|------------|---------------|
| Major Nonconformity | Control failure creating significant risk | 30 days |
| Minor Nonconformity | Isolated deviation with limited impact | 90 days |
| Observation | Improvement opportunity | Next audit cycle |

### Corrective Action Workflow

1. Auditee acknowledges finding
2. Root cause analysis within 10 days
3. Corrective action plan submitted
4. Actions implemented
5. Auditor verifies effectiveness
6. **Validation:** Root cause addressed, recurrence prevented

---

## Certification Support

### Stage 1 Preparation

- [ ] ISMS scope statement
- [ ] Information security policy (signed)
- [ ] Statement of Applicability
- [ ] Risk assessment and treatment plan
- [ ] Internal audit results (past 12 months)
- [ ] Management review minutes

### Stage 2 Preparation

- [ ] All Stage 1 findings addressed
- [ ] ISMS operational for minimum 3 months
- [ ] Security awareness training records
- [ ] Access review documentation

---

## Tools and References

```bash
python scripts/isms_audit_scheduler.py --year 2025 --output audit_plan.json
```

| Document | Content |
|----------|---------|
| [iso27001-audit-methodology.md](references/iso27001-audit-methodology.md) | Audit program structure, pre-audit, certification |
| [security-control-testing.md](references/security-control-testing.md) | Technical verification for ISO 27002 controls |
| [cloud-security-audit.md](references/cloud-security-audit.md) | Cloud provider assessment, IAM review |

---

## Audit Performance Metrics

| KPI | Target |
|-----|--------|
| Audit plan completion | 100% |
| Finding closure rate | >90% within SLA |
| Major nonconformities | 0 at certification |
