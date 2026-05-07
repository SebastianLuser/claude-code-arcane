---
name: quality-documentation-manager
description: "Document control for medical device QMS — numbering, version control, change management, and 21 CFR Part 11 compliance."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Quality Documentation Manager

Document control system design and management for ISO 13485-compliant quality management systems.

## Document Control Workflow

1. Assign document number per numbering procedure
2. Create document using controlled template
3. Route for review to required reviewers
4. Address review comments and document responses
5. Obtain required approval signatures
6. Assign effective date and distribute
7. Update Document Master List
8. **Validation:** Document accessible at point of use; obsolete versions removed

### Document Lifecycle Stages

| Stage | Definition |
|-------|------------|
| Draft | Under creation or revision — not for use |
| Review | Circulated for review |
| Approved | All signatures obtained |
| Effective | Training complete, released |
| Superseded | Replaced by newer revision |
| Obsolete | Archived per retention schedule |

### Document Types and Prefixes

| Prefix | Type | Typical Content |
|--------|------|-----------------|
| QM | Quality Manual | QMS overview, scope, policy |
| SOP | Standard Operating Procedure | Process-level procedures |
| WI | Work Instruction | Task-level step-by-step |
| TF | Template/Form | Controlled forms |
| SPEC | Specification | Product/process specs |

For numbering format, category codes, revision designation, and reviewer requirements, see [references/document-control-procedures.md](references/document-control-procedures.md).

---

## Approval and Review Process

1. Author completes draft and submits for review
2. Reviewers provide comments within 5-10 business days
3. Author addresses comments with disposition (Accept/Reject/Defer)
4. Approvers sign and date
5. **Validation:** All required reviewers completed; all comments addressed

For approval matrix, signature requirements, and comment disposition details, see [references/document-control-procedures.md](references/document-control-procedures.md).

---

## Change Control Process

1. Identify need for change and complete Change Request Form
2. Document Control assigns change number
3. Route to reviewers for impact assessment
4. Obtain approvals based on change classification
5. Author implements approved changes
6. Update revision number and change history
7. **Validation:** Changes match approved scope; change history complete

### Change Classification

| Class | Definition | Approval Level |
|-------|------------|----------------|
| Administrative | No content impact | Document Control |
| Minor | Limited content change | Process Owner + QA |
| Major | Significant content change | Full review cycle |
| Emergency | Urgent safety/compliance | Expedited + retrospective |

For impact assessment checklist and change history documentation, see [references/document-control-procedures.md](references/document-control-procedures.md).

---

## 21 CFR Part 11 Compliance

Electronic record and signature controls for FDA compliance.

### Key Requirements

- Validate system for accuracy and reliability
- Implement secure audit trail for all changes
- Restrict system access to authorized individuals
- Generate accurate copies in human-readable format
- Electronic signatures must be unique, at least 2 components, linked to record

For full Part 11 scope, audit trail requirements, electronic signature manifestation, and system controls checklist, see [references/21cfr11-compliance-guide.md](references/21cfr11-compliance-guide.md).

---

## Document Control Metrics

| Metric | Target |
|--------|--------|
| Document cycle time | <30 days |
| Review completion rate | >95% on time |
| Change request backlog | <10 open |
| Overdue review rate | <5% |
| Audit finding rate | <2 per audit |

---

## Tools and References

| Tool | Purpose |
|------|---------|
| [document_validator.py](scripts/document_validator.py) | Validate document metadata and Part 11 controls |

| Document | Content |
|----------|---------|
| [document-control-procedures.md](references/document-control-procedures.md) | Numbering, lifecycle, review/approval, change control, retention |
| [21cfr11-compliance-guide.md](references/21cfr11-compliance-guide.md) | Part 11 scope, electronic records/signatures, validation, gap assessment |

---

## Regulatory Requirements

### ISO 13485:2016 Clause 4.2

| Sub-clause | Requirement |
|------------|-------------|
| 4.2.4 | Control of documents |
| 4.2.5 | Control of records |

### FDA 21 CFR 820

| Section | Requirement |
|---------|-------------|
| 820.40 | Document controls |
| 820.180 | General record requirements |
| 820.181 | Device master record |
