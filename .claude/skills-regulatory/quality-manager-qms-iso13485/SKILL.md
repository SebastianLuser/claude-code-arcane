---
name: quality-manager-qms-iso13485
description: "ISO 13485 QMS implementation and maintenance — document control, internal auditing, process validation, supplier qualification, and certification."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Quality Manager - QMS ISO 13485 Specialist

ISO 13485:2016 Quality Management System implementation, maintenance, and certification support for medical device organizations.

## QMS Implementation Workflow

1. Conduct gap analysis against ISO 13485:2016 requirements
2. Prioritize gaps by regulatory criticality, risk to product safety, and resource requirements
3. Develop implementation roadmap with milestones
4. Establish Quality Manual per Clause 4.2.2 (scope, process interactions, procedure references)
5. Create required documented procedures
6. Deploy processes with training
7. **Validation:** Gap analysis complete; Quality Manual approved; all procedures documented and trained

For gap analysis matrix template and QMS structure, see [references/qms-process-templates.md](references/qms-process-templates.md).

---

## Document Control

Establish and maintain document control per ISO 13485 Clause 4.2.3:

1. Assign document number: `[TYPE]-[AREA]-[SEQUENCE]-[REV]`
2. Draft using approved template
3. Route for review and collect approvals
4. Update Document Master List
5. **Validation:** Document numbered correctly; all reviewers signed

For numbering conventions, area codes, change control, and review schedule, see [references/qms-process-templates.md](references/qms-process-templates.md).

---

## Internal Audit

Plan and execute internal audits per ISO 13485 Clause 8.2.4:

1. Identify processes and assess risk factors for audit frequency
2. Assign qualified, independent auditors
3. Prepare audit plan with scope and checklist
4. Collect evidence (document review, record sampling, observation, interviews)
5. Classify findings (Major NC / Minor NC / Observation)
6. Issue audit report within 5 business days
7. **Validation:** All processes covered; findings supported by evidence

For audit program template and finding classification guide, see [references/qms-process-templates.md](references/qms-process-templates.md).

---

## Process Validation

Validate special processes per ISO 13485 Clause 7.5.6:

1. Identify processes requiring validation (output cannot be verified by inspection)
2. Write validation protocol (process description, parameters, acceptance criteria)
3. Execute IQ (equipment installed correctly), OQ (parameter ranges verified), PQ (production conditions met)
4. Write validation report with conclusions
5. **Validation:** IQ/OQ/PQ complete; acceptance criteria met; report approved

For validation documentation requirements, revalidation triggers, and special process examples, see [references/qms-process-templates.md](references/qms-process-templates.md).

---

## Supplier Qualification

Evaluate and approve suppliers per ISO 13485 Clause 7.4:

1. Categorize: A (Critical), B (Major), C (Minor)
2. Evaluate: quality system (30%), history (25%), delivery (20%), capability (15%), financial (10%)
3. Score: >80 Approved, 60-80 Conditional, <60 Not approved
4. For Category A: on-site audit + quality agreement
5. **Validation:** Evaluation scored; qualification records complete

For evaluation criteria details, category requirements, and performance metrics, see [references/qms-process-templates.md](references/qms-process-templates.md).

---

## QMS Process Reference

For detailed requirements and audit questions for each ISO 13485:2016 clause, see [references/iso13485-clause-requirements.md](references/iso13485-clause-requirements.md).

### Mandatory Documented Procedures

| Procedure | Clause |
|-----------|--------|
| Document Control | 4.2.3 |
| Record Control | 4.2.4 |
| Internal Audit | 8.2.4 |
| NC Product Control | 8.3 |
| Corrective Action | 8.5.2 |
| Preventive Action | 8.5.3 |

---

## Decision Frameworks

For exclusion justification (Clause 4.2.2), nonconformity disposition decision tree, and CAPA initiation criteria, see [references/iso13485-clause-requirements.md](references/iso13485-clause-requirements.md).

---

## Tools and References

| Tool | Purpose |
|------|---------|
| [qms_audit_checklist.py](scripts/qms_audit_checklist.py) | Generate audit checklists by clause or process |

| Document | Content |
|----------|---------|
| [iso13485-clause-requirements.md](references/iso13485-clause-requirements.md) | Clause requirements, audit questions, decision frameworks |
| [qms-process-templates.md](references/qms-process-templates.md) | Gap analysis, audit program, document control, CAPA, supplier, training |

---

## Related Skills

| Skill | Integration Point |
|-------|-------------------|
| quality-manager-qmr | Management review, quality policy |
| capa-officer | CAPA system management |
| qms-audit-expert | Advanced audit techniques |
| quality-documentation-manager | DHF, DMR, DHR management |
| risk-management-specialist | ISO 14971 integration |
