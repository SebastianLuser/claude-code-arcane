---
name: regulatory-affairs-head
description: "Regulatory strategy, FDA submissions, EU MDR CE marking, and global market access for medical devices across FDA, EU, Health Canada, PMDA, and NMPA."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Head of Regulatory Affairs

Regulatory strategy development, submission management, and global market access for medical device organizations.

## Regulatory Strategy Workflow

1. Gather product information (intended use, classification, target markets)
2. Identify applicable regulations per target market (FDA, EU MDR, Health Canada, PMDA, NMPA)
3. Determine optimal regulatory pathway (510(k) vs De Novo vs PMA)
4. Develop regulatory timeline with milestones
5. Estimate resource requirements and budget
6. Identify regulatory risks and mitigation strategies
7. Obtain stakeholder alignment and approval
8. **Validation:** Strategy document approved; timeline accepted; resources allocated

### Pathway Selection Matrix

| Factor | 510(k) | De Novo | PMA |
|--------|--------|---------|-----|
| Predicate Available | Yes | No | N/A |
| Risk Level | Low-Moderate | Low-Moderate | High |
| Review Time | 90 days | 150 days | 180 days |
| User Fee | ~$22K | ~$135K | ~$440K |

For strategy document template and detailed pathway rationale, see [references/fda-submission-guide.md](references/fda-submission-guide.md).

---

## FDA Submission Workflow

### 510(k) Submission

1. Confirm pathway suitability (predicate identified, SE argument supportable)
2. Conduct Pre-Submission meeting if needed
3. Compile submission package (cover letter, device description, SE comparison, testing, labeling)
4. Conduct internal review against FDA RTA checklist
5. Submit via FDA ESG portal with user fee
6. Monitor MDUFA clock and respond to AI/RTA requests
7. **Validation:** Submission accepted; MDUFA date received

For SE comparison example, PMA workflow, common deficiencies, and FDA timeline details, see [references/fda-submission-guide.md](references/fda-submission-guide.md).

---

## EU MDR Submission Workflow

1. Confirm device classification per MDR Annex VIII
2. Select conformity assessment route based on class
3. Engage Notified Body (for Class IIa+)
4. Compile Technical Documentation per Annex II checklist (device description, GSPR, risk management, CER)
5. Establish QMS per ISO 13485
6. Submit application to Notified Body
7. **Validation:** CE certificate issued; DoC signed; EUDAMED registration complete

For GSPR checklist examples, clinical evidence requirements by class, and NB selection criteria, see [references/eu-mdr-submission-guide.md](references/eu-mdr-submission-guide.md).

---

## Global Market Access

Coordinate regulatory approvals across international markets:

1. Define target markets based on business priorities
2. Sequence: Phase 1 (FDA + EU) → Phase 2 (Canada, Australia) → Phase 3 (Japan, China) → Phase 4 (Emerging)
3. Develop master technical file with localization plan
4. Execute parallel or sequential submissions
5. **Validation:** All target market approvals obtained

For market priority matrix and documentation efficiency strategy, see [references/global-regulatory-pathways.md](references/global-regulatory-pathways.md).

---

## Regulatory Intelligence

Monitor and respond to regulatory changes:

1. Monitor FDA Federal Register, EU Official Journal, MDCG guidance, ISO/IEC standards
2. Assess relevance to product portfolio
3. Evaluate impact (timeline, resources, product changes)
4. Develop compliance action plan
5. **Validation:** Changes implemented on schedule

For monitoring sources, impact assessment template, and decision frameworks, see [references/iso-regulatory-requirements.md](references/iso-regulatory-requirements.md).

---

## Tools and References

| Tool | Purpose |
|------|---------|
| [regulatory_tracker.py](scripts/regulatory_tracker.py) | Track submission status and timelines |

| Document | Content |
|----------|---------|
| [fda-submission-guide.md](references/fda-submission-guide.md) | FDA pathways, SE comparison, deficiencies |
| [eu-mdr-submission-guide.md](references/eu-mdr-submission-guide.md) | MDR classification, technical docs, clinical evidence |
| [global-regulatory-pathways.md](references/global-regulatory-pathways.md) | Canada, Japan, China, Australia, Brazil requirements |
| [iso-regulatory-requirements.md](references/iso-regulatory-requirements.md) | ISO 13485, 14971, 10993, IEC 62304/62366 |

---

## Related Skills

| Skill | Integration Point |
|-------|-------------------|
| mdr-745-specialist | Detailed EU MDR technical requirements |
| fda-consultant-specialist | FDA submission deep expertise |
| quality-manager-qms-iso13485 | QMS for regulatory compliance |
| risk-management-specialist | ISO 14971 risk management |
