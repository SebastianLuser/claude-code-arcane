---
name: information-security-manager-iso27001
description: "ISO 27001 ISMS implementation — security risk assessment, control implementation, certification, incident response, and compliance verification."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Information Security Manager - ISO 27001

Implement and manage Information Security Management Systems (ISMS) aligned with ISO 27001:2022 and healthcare regulatory requirements.

## Quick Start

```bash
# Run security risk assessment
python scripts/risk_assessment.py --scope "patient-data-system" --output risk_register.json

# Check compliance status
python scripts/compliance_checker.py --standard iso27001 --controls-file controls.csv

# Generate gap analysis report
python scripts/compliance_checker.py --standard iso27001 --gap-analysis --output gaps.md
```

---

## Tools

### risk_assessment.py

Automated security risk assessment following ISO 27001 Clause 6.1.2:

```bash
python scripts/risk_assessment.py --scope "cloud-infrastructure" --template healthcare --output risks.json
```

Output: asset inventory, threat/vulnerability mapping, risk scores, treatment recommendations.

### compliance_checker.py

Verify ISO 27001/27002 control implementation status:

```bash
python scripts/compliance_checker.py --standard iso27001 --gap-analysis --output gaps.md
```

Output: control implementation status, compliance % by domain, remediation recommendations.

---

## Workflow 1: ISMS Implementation

1. **Define Scope** — Identify interested parties, ISMS boundaries, internal/external issues
2. **Conduct Risk Assessment** — Identify assets, assess threats/vulnerabilities, calculate risk levels
3. **Select Controls** — Map risks to ISO 27002 controls (organizational, people, physical, technological)
4. **Establish Monitoring** — Define security metrics (incidents, control effectiveness, training completion)
5. **Validation:** Statement of Applicability documents all controls with justification

For detailed ISMS implementation steps, see [references/iso27001-controls.md](references/iso27001-controls.md).

---

## Workflow 2: Security Risk Assessment

1. **Asset Identification** — Inventory information, software, hardware, services, people assets
2. **Threat Analysis** — Map threats per asset category with likelihood
3. **Vulnerability Assessment** — Document technical, process, and people vulnerabilities
4. **Risk Evaluation** — Calculate `Risk = Likelihood x Impact`, assign treatment plans

| Risk Level | Score | Treatment |
|------------|-------|-----------|
| Critical | 20-25 | Immediate action required |
| High | 15-19 | Treatment plan within 30 days |
| Medium | 10-14 | Treatment plan within 90 days |
| Low | 5-9 | Accept or monitor |

For asset classification criteria, threat modeling, and risk calculation methods, see [references/risk-assessment-guide.md](references/risk-assessment-guide.md).

---

## Workflow 3: Incident Response

1. **Detection** — Log incident within 15 minutes of detection
2. **Triage** — Classify severity (Critical=immediate, High=1hr, Medium=4hr, Low=24hr)
3. **Containment** — Isolate systems, preserve evidence, block threat vectors
4. **Recovery** — Restore from clean backups, verify integrity, document timeline
5. **Validation:** Post-incident report completed within 5 business days

For response procedures, escalation matrices, and recovery checklists, see [references/incident-response.md](references/incident-response.md).

---

## Certification Readiness

### Before Stage 1 Audit

- [ ] ISMS scope documented and approved
- [ ] Information security policy published
- [ ] Risk assessment completed
- [ ] Statement of Applicability finalized
- [ ] Internal audit conducted
- [ ] Management review completed

### Before Stage 2 Audit

- [ ] Controls implemented and operational
- [ ] Evidence of effectiveness available
- [ ] Staff trained and aware
- [ ] Metrics collected for 3+ months

---

## References

| Document | Content |
|----------|---------|
| [iso27001-controls.md](references/iso27001-controls.md) | Control selection, implementation, evidence requirements |
| [risk-assessment-guide.md](references/risk-assessment-guide.md) | Methodology, asset classification, threat modeling |
| [incident-response.md](references/incident-response.md) | Response procedures, escalation, recovery |
