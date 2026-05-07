---
name: quality-manager-qmr
description: "QMR governance — management review, quality KPIs, quality objectives, regulatory compliance oversight, and quality culture per ISO 13485 Clause 5.5.2."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Senior Quality Manager Responsible Person (QMR)

Quality system accountability, management review leadership, and regulatory compliance oversight per ISO 13485 Clause 5.5.2 requirements.

## QMR Responsibilities

### ISO 13485 Clause 5.5.2 Requirements

| Responsibility | Scope | Evidence |
|----------------|-------|----------|
| QMS effectiveness | Monitor system performance and suitability | Management review records |
| Reporting to management | Communicate QMS performance to top management | Quality reports, dashboards |
| Quality awareness | Promote regulatory and quality requirements | Training records, communications |
| Liaison with external parties | Interface with regulators, Notified Bodies | Meeting records, correspondence |

### Authority Boundaries

| Decision Type | QMR Authority | Escalation Required |
|---------------|---------------|---------------------|
| Process changes within QMS | Approve with owner | Major process redesign |
| Document approval | Final QA approval | Policy-level changes |
| Nonconformity disposition | Accept/reject with MRB | Product release decisions |
| Supplier quality actions | Quality holds, audits | Supplier termination |
| Audit scheduling | Adjust internal audit schedule | External audit timing |

---

## Management Review Workflow

Conduct management reviews per ISO 13485 Clause 5.6:

1. Schedule management review (minimum annually, typically quarterly)
2. Notify all required attendees minimum 2 weeks prior
3. Collect required inputs from process owners (audits, complaints, CAPA, process performance)
4. Compile input summary report with trend analysis
5. Distribute agenda and input package 1 week prior
6. Conduct review meeting per agenda
7. **Validation:** All required inputs reviewed; decisions documented with owners and due dates

For input/output templates, attendee requirements, and the full management review input template, see [references/management-review-guide.md](references/management-review-guide.md).

---

## Quality KPI Management

Establish, monitor, and report quality performance indicators using SMART criteria.

### Core Quality KPIs

| Category | KPI | Target |
|----------|-----|--------|
| Process | First Pass Yield | >95% |
| Process | Nonconformance Rate | <1% |
| CAPA | CAPA Closure Rate | >90% |
| CAPA | CAPA Effectiveness | >85% |
| Audit | Finding Closure Rate | >90% |
| Customer | Complaint Rate | <0.1% |
| Customer | Satisfaction Score | >4.0/5.0 |

For KPI review frequency, performance response matrix, and dashboard templates, see [references/quality-kpi-framework.md](references/quality-kpi-framework.md).

---

## Quality Objectives

Establish measurable quality objectives per ISO 13485 Clause 5.4.1:

1. Review prior year objective achievement
2. Analyze quality performance trends and gaps
3. Align with organizational strategic plan
4. Draft objectives with measurable targets
5. Validate resource availability
6. Obtain executive approval
7. Communicate objectives organization-wide
8. **Validation:** Each objective is measurable, has owner, target, and timeline

For objective structure template, categories, and quarterly review process, see [references/quality-kpi-framework.md](references/quality-kpi-framework.md).

---

## Quality Culture Assessment

Assess and improve organizational quality culture annually:

1. Design or select quality culture survey instrument
2. Administer survey with 2-week response window
3. Analyze results by department, role, and tenure
4. Develop action plan for culture gaps
5. **Validation:** Response rate >60%; action plan addresses bottom 3 scores

For culture dimensions, survey categories, and improvement actions, see [references/management-review-guide.md](references/management-review-guide.md).

---

## Regulatory Compliance Oversight

For multi-jurisdictional compliance matrix, monitoring workflow, regulatory authority interface procedures, inspection readiness checklist, and escalation/investment decision frameworks, see [references/management-review-guide.md](references/management-review-guide.md).

---

## Tools and References

| Tool | Purpose |
|------|---------|
| [management_review_tracker.py](scripts/management_review_tracker.py) | Track review inputs, actions, metrics |

| Document | Content |
|----------|---------|
| [management-review-guide.md](references/management-review-guide.md) | ISO 13485 Clause 5.6, input/output templates, regulatory oversight, culture assessment |
| [quality-kpi-framework.md](references/quality-kpi-framework.md) | KPI categories, targets, calculations, objectives, dashboard templates |

---

## Related Skills

| Skill | Integration Point |
|-------|-------------------|
| quality-manager-qms-iso13485 | QMS process management |
| capa-officer | CAPA system oversight |
| qms-audit-expert | Internal audit program |
| quality-documentation-manager | Document control oversight |
