---
name: incident-response
description: "Classify and triage security incidents through the full NIST SP 800-61 lifecycle: SEV1-4 severity scoring, false positive filtering, forensic evidence collection, and escalation routing."
category: "devops"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Incident Response

Full lifecycle incident response from initial triage through forensic collection, severity declaration, and escalation routing. This is NOT threat hunting (see threat-detection) or post-incident review (see incident-commander).

---

## Workflow

### Step 1: Classify the Event

```bash
python3 scripts/incident_triage.py --input event.json --classify --false-positive-check --json
```

The triage tool classifies events into 14 incident types, scores severity, filters false positives, and determines escalation paths.

**Exit codes:** 0 = SEV3/4 (standard handling), 1 = SEV2 (1-hour bridge), 2 = SEV1 (immediate war room).

### Step 2: Determine Severity

| Level | Criteria | Escalation Path |
|-------|----------|-----------------|
| SEV1 | Confirmed ransomware; active PII exfil >10K records; domain controller breach; CloudTrail disabled | SOC Lead -> CISO -> CEO -> Board |
| SEV2 | Unauthorized access to sensitive systems; credential compromise with priv-esc; lateral movement confirmed | SOC Lead -> CISO |
| SEV3 | Suspected unauthorized access (unconfirmed); malware contained; single account compromise | SOC Lead -> Security Manager |
| SEV4 | Alert with no confirmed impact; policy violation with no data risk | L3 Analyst queue |

**Auto-escalation triggers:** ransomware note found, active exfiltration confirmed, CloudTrail/SIEM disabled, second system compromised, C-suite account accessed.

### Step 3: Filter False Positives

Five filters run before escalation: CI/CD agent activity, test environment tagging, scheduled job patterns, whitelisted service accounts, scanner activity. Recurring false positives should be tuned at the detection layer.

### Step 4: Collect Forensic Evidence

Follow DFRWS six-phase framework (Identification -> Preservation -> Collection -> Examination -> Analysis -> Presentation). Collect volatile evidence first (RAM, running processes, network connections) before any containment action.

**Chain of custody:** SHA-256 hash at acquisition, UTC timestamp, tool provenance, investigator identity, transfer log.

### Step 5: Escalate and Notify

Regulatory notification deadlines (clock starts at incident declaration):

| Framework | Deadline |
|-----------|----------|
| GDPR | 72 hours |
| PCI-DSS v4.0 | 24 hours to acquirer |
| HIPAA (>500 individuals) | 60 days |
| SEC Rule | 4 business days |
| NIS2 | 24-hour early warning; 72-hour notification |

Full deadline reference with penalties: `references/regulatory-deadlines.md`

---

## Tool Reference

### incident_triage.py

```bash
# Classify with false positive filtering
python3 scripts/incident_triage.py --input event.json --classify --false-positive-check --json

# Force severity for tabletop exercises
python3 scripts/incident_triage.py --input event.json --severity sev1 --json

# Read from stdin
echo '{"event_type": "ransomware", "host": "prod-db-01"}' | \
  python3 scripts/incident_triage.py --classify --json
```

**Input schema:** `{"event_type": "...", "host": "...", "user": "...", "source_ip": "...", "timestamp": "...", "raw_payload": {}}`

---

## Anti-Patterns

1. **Starting notification clock at investigation completion** -- regulatory clocks start at discovery, not investigation end
2. **Containing before collecting volatile evidence** -- rebooting destroys RAM and active connections
3. **Skipping false positive verification** -- escalating every alert degrades SOC credibility
4. **Undocumented command decisions** -- every SEV1 decision needs timestamp and rationale
5. **Bypassing human approval for containment** -- automated containment without approval can cause outages and destroy evidence
6. **Single-source classification** -- collect at least two independent signals before declaring SEV1

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| threat-detection | Confirmed hunting findings escalate here for triage |
| cloud-security | Cloud posture findings may trigger incident classification |
| red-team | Red team findings validate detection coverage |
| security-pen-testing | Exploited pen test vulnerabilities escalate for active incident handling |
