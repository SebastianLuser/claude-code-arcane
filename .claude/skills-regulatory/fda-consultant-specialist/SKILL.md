---
name: fda-consultant-specialist
description: "FDA regulatory consulting — 510(k)/PMA/De Novo pathway guidance, QSR (21 CFR 820) compliance, HIPAA assessments, and device cybersecurity."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# FDA Consultant Specialist

FDA regulatory consulting for medical device manufacturers covering submission pathways, QSR, HIPAA, and device cybersecurity.

## FDA Pathway Selection

```
Predicate device exists?
├── YES → Substantially equivalent?
│   ├── YES → 510(k) (Traditional / Special / Abbreviated)
│   └── NO → PMA or De Novo
└── NO → Novel device?
    ├── Low-to-moderate risk → De Novo
    └── High risk (Class III) → PMA
```

| Pathway | When to Use | Timeline | Cost |
|---------|-------------|----------|------|
| 510(k) Traditional | Predicate exists, design changes | 90 days | $21,760 |
| De Novo | Novel, low-moderate risk | 150 days | $134,676 |
| PMA | Class III, no predicate | 180+ days | $425,000+ |

For pathway decision matrices and Pre-Submission strategy, see [references/fda_submission_guide.md](references/fda_submission_guide.md).

---

## 510(k) Submission Process

1. Identify predicate device(s) and compare intended use
2. Determine testing requirements
3. Complete performance testing and device description
4. Document SE comparison, finalize labeling
5. Assemble and submit via eSTAR
6. Monitor review, respond to AI requests
7. **Validation:** SE letter received

For required sections (21 CFR 807.87) and common RTA issues, see [references/fda_submission_guide.md](references/fda_submission_guide.md).

---

## QSR Compliance (21 CFR Part 820)

| Section | Title | Focus |
|---------|-------|-------|
| 820.20 | Management Responsibility | Quality policy, management review |
| 820.30 | Design Controls | Input, output, V&V, transfer |
| 820.40 | Document Controls | Approval, distribution, changes |
| 820.100 | CAPA | Root cause, corrective actions |

For design controls workflow and CAPA process details, see [references/qsr_compliance_requirements.md](references/qsr_compliance_requirements.md).

---

## HIPAA for Medical Devices

Applies to devices that create, store, transmit, or access PHI. Requires:
- **Administrative** safeguards (security officer, risk analysis, training)
- **Physical** safeguards (facility access, workstation security)
- **Technical** safeguards (access control, audit logs, encryption TLS 1.2+)

For applicability matrix, safeguard details, and risk assessment steps, see [references/hipaa_compliance_framework.md](references/hipaa_compliance_framework.md).

---

## Device Cybersecurity

### Premarket Requirements

| Element | Description |
|---------|-------------|
| Threat Model | STRIDE analysis, attack trees, trust boundaries |
| Security Controls | Authentication, encryption, access control |
| SBOM | Software Bill of Materials (CycloneDX or SPDX) |
| Security Testing | Penetration testing, vulnerability scanning |

For device tier classification, postmarket obligations, and vulnerability disclosure process, see [references/device_cybersecurity_guidance.md](references/device_cybersecurity_guidance.md).

---

## Tools and References

| Script | Purpose |
|--------|---------|
| `fda_submission_tracker.py` | Track submission milestones and timelines |
| `qsr_compliance_checker.py` | Assess 21 CFR 820 compliance |
| `hipaa_risk_assessment.py` | Evaluate HIPAA safeguards |

| Document | Content |
|----------|---------|
| [fda_submission_guide.md](references/fda_submission_guide.md) | Submission requirements and checklists |
| [qsr_compliance_requirements.md](references/qsr_compliance_requirements.md) | 21 CFR 820 implementation guide |
| [hipaa_compliance_framework.md](references/hipaa_compliance_framework.md) | HIPAA Security Rule and BAA requirements |
| [device_cybersecurity_guidance.md](references/device_cybersecurity_guidance.md) | FDA cybersecurity, SBOM, threat modeling |
| [fda_capa_requirements.md](references/fda_capa_requirements.md) | CAPA process and root cause analysis |
