---
name: soc2-compliance
description: "SOC 2 Type I and Type II compliance — Trust Service Criteria mapping, control matrices, gap analysis, evidence collection, and audit readiness."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# SOC 2 Compliance

SOC 2 Type I and Type II compliance preparation for SaaS companies.

## Overview

### Type I vs Type II

| Aspect | Type I | Type II |
|--------|--------|---------|
| Scope | Design at a point in time | Design AND effectiveness over a period |
| Duration | Snapshot | 3-12 months observation |
| Cost | $20K-$50K | $30K-$100K+ |
| Best For | First-time compliance | Mature organizations, enterprise |

### Typical Journey

```
Gap Assessment → Remediation → Type I → Observation Period → Type II → Annual Renewal
    (4-8 wk)      (8-16 wk)   (4-6 wk)    (6-12 mo)       (4-6 wk)    (ongoing)
```

---

## Trust Service Criteria

**Security (CC1-CC9)** is required for every SOC 2 report. Optional categories:

| Category | When to Select |
|----------|---------------|
| **Availability (A1)** | Customers depend on uptime; you have SLAs |
| **Confidentiality (C1)** | Trade secrets, proprietary, contractually confidential data |
| **Processing Integrity (PI1)** | Data accuracy critical (financial, healthcare, analytics) |
| **Privacy (P1-P8)** | Process PII and customers expect privacy assurance |

For complete TSC sub-criteria, control objectives, and evidence examples, see [references/trust_service_criteria.md](references/trust_service_criteria.md).

---

## Control Matrix Generation

Map each TSC criterion to specific controls, owners, evidence, and testing procedures.

1. Select applicable TSC categories
2. Run `control_matrix_builder.py` to generate baseline matrix
3. Customize controls to match your environment
4. Assign owners and evidence requirements
5. Validate coverage — every selected criterion must have at least one control

For control naming convention and matrix structure, see [references/trust_service_criteria.md](references/trust_service_criteria.md).

---

## Gap Analysis Workflow

1. **Current State** — Document existing controls, map to TSC, collect evidence samples
2. **Gap Identification** — Run `gap_analyzer.py` to find missing, partial, design, or operating gaps
3. **Remediation Planning** — Define actions, owners, priorities, target dates per gap
4. **Timeline** — Critical: 2-4 wk, High: 4-8 wk, Medium: 8-12 wk, Low: 12-16 wk

---

## Evidence Collection

| Control Area | Primary Evidence |
|--------------|-----------------|
| Access Management | User access reviews, provisioning tickets |
| Change Management | Change tickets, approval records |
| Incident Response | Incident tickets, postmortems |
| Vulnerability Mgmt | Scan reports, patch records |
| Encryption | Configuration screenshots, certificate inventory |
| Backup & Recovery | Backup logs, DR test results |

For automation opportunities and continuous monitoring guidance, see [references/evidence_collection_guide.md](references/evidence_collection_guide.md).

---

## Audit Readiness Checklist

- [ ] All controls documented with descriptions, owners, frequencies
- [ ] Evidence collected for entire observation period (Type II)
- [ ] Policies signed and distributed within last 12 months
- [ ] Access reviews completed within required frequency
- [ ] Vulnerability scans current (no critical/high unpatched > SLA)
- [ ] Incident response plan tested within last 12 months
- [ ] Vendor risk assessments current
- [ ] DR/BCP tested and documented within last 12 months

| Score | Rating |
|-------|--------|
| 90-100% | Audit Ready |
| 75-89% | Minor Gaps — address before audit |
| 50-74% | Significant Gaps — remediation required |
| <50% | Not Ready |

---

## Vendor Management

Every vendor accessing customer data must be assessed. For vendor risk tiers, subservice organization handling, and assessment requirements, see [references/evidence_collection_guide.md](references/evidence_collection_guide.md).

---

## Tools and References

```bash
python scripts/control_matrix_builder.py --categories security --format md
python scripts/evidence_tracker.py --matrix controls.json --status
python scripts/gap_analyzer.py --controls current_controls.json --type type1
```

| Document | Content |
|----------|---------|
| [trust_service_criteria.md](references/trust_service_criteria.md) | All 5 TSC categories with sub-criteria and evidence |
| [evidence_collection_guide.md](references/evidence_collection_guide.md) | Evidence types, automation, vendor management |
| [type1_vs_type2.md](references/type1_vs_type2.md) | Detailed comparison, timeline, cost, upgrade path |

---

## Cross-References

- **gdpr-dsgvo-expert** — SOC 2 Privacy criteria overlaps with GDPR
- **information-security-manager-iso27001** — ISO 27001 Annex A maps to SOC 2 Security
- **isms-audit-expert** — Audit methodology transfers to SOC 2 preparation
