---
name: gdpr-dsgvo-expert
description: "GDPR and German DSGVO compliance — codebase privacy scanning, DPIA generation, data subject rights tracking, and compliance workflows."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# GDPR/DSGVO Expert

Tools and guidance for EU GDPR and German BDSG compliance.

## Tools

### GDPR Compliance Checker

Scans codebases for potential GDPR compliance issues:

```bash
python scripts/gdpr_compliance_checker.py /path/to/project
python scripts/gdpr_compliance_checker.py . --json --output report.json
```

Detects personal data patterns, special category data, risky code patterns (logging PII, missing consent, unencrypted data). Outputs compliance score (0-100) with prioritized recommendations.

### DPIA Generator

Generates Data Protection Impact Assessment per Art. 35:

```bash
python scripts/dpia_generator.py --template > input.json
python scripts/dpia_generator.py --input input.json --output dpia_report.md
```

Assesses DPIA triggers (systematic monitoring, large-scale special data, automated decision-making).

### Data Subject Rights Tracker

Manages requests under GDPR Articles 15-22:

```bash
python scripts/data_subject_rights_tracker.py add --type access --subject "John Doe" --email "john@example.com"
python scripts/data_subject_rights_tracker.py list
python scripts/data_subject_rights_tracker.py report --output compliance.json
```

Supports: Access (Art. 15), Rectification (Art. 16), Erasure (Art. 17), Restriction (Art. 18), Portability (Art. 20), Objection (Art. 21). All rights must be fulfilled within **30 days**.

---

## Workflows

### New Processing Activity Assessment

1. Run compliance checker on codebase
2. Review findings, address critical/high issues
3. Determine if DPIA required (check threshold criteria)
4. If required, generate DPIA
5. Document in records of processing activities

### Data Subject Request Handling

1. Log request → 2. Verify identity → 3. Gather data → 4. Generate response template → 5. Send response → 6. Monitor compliance

### German BDSG Compliance

1. DPO required if 20+ employees processing personal data automatically
2. Review Section 26 BDSG for employee data
3. Comply with Section 4 BDSG for video surveillance
4. Register DPO with supervisory authority

---

## Key GDPR Concepts

### Legal Bases (Art. 6)

- **Consent**: Marketing, newsletters, analytics (freely given, specific, informed)
- **Contract**: Order fulfillment, service delivery
- **Legal obligation**: Tax records, employment law
- **Legitimate interests**: Fraud prevention, security (requires balancing test)

For complete legal basis guidance, special category requirements, international transfers, and breach notification, see [references/gdpr_compliance_guide.md](references/gdpr_compliance_guide.md).

For German-specific requirements (DPO threshold, employment data, video surveillance, credit scoring), see [references/german_bdsg_requirements.md](references/german_bdsg_requirements.md).

For DPIA methodology (threshold criteria, WP29 indicators, risk assessment, templates), see [references/dpia_methodology.md](references/dpia_methodology.md).

---

## References

| Document | Content |
|----------|---------|
| [gdpr_compliance_guide.md](references/gdpr_compliance_guide.md) | Art. 6 legal bases, data subject rights, accountability, transfers, breach |
| [german_bdsg_requirements.md](references/german_bdsg_requirements.md) | DPO threshold, employment data, video, scoring |
| [dpia_methodology.md](references/dpia_methodology.md) | DPIA process, risk assessment, templates |
