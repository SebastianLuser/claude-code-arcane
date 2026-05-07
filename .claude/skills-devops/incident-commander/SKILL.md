---
name: incident-commander
description: "Manage technology incidents end-to-end: severity classification, timeline reconstruction, stakeholder communication, and post-incident review with RCA frameworks."
category: "devops"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Incident Commander

Comprehensive incident response framework from detection through resolution and post-incident review. Implements structured processes for severity classification, timeline reconstruction, and blameless PIRs.

---

## Workflow

### Step 1: Classify Severity

Analyze the incident and assign SEV1-SEV4 using the severity matrix:

```bash
echo '{"description": "Users reporting 500 errors, database connections timing out", "affected_users": "80%", "business_impact": "high"}' | python scripts/incident_classifier.py
```

| Level | Definition | Response Time | Update Cadence |
|-------|-----------|---------------|----------------|
| SEV1 | Complete service failure affecting all users | 5 min IC assigned | Every 15 min |
| SEV2 | Significant degradation, >25% users affected | 15 min on-call | Every 30 min |
| SEV3 | Limited impact, workarounds available | 2 hours biz hours | At milestones |
| SEV4 | Minimal impact, cosmetic, dev/test issues | 1-2 business days | Standard cycle |

Full severity criteria, escalation paths, and decision trees: `references/incident_severity_matrix.md`

### Step 2: Establish Command

**IC Responsibilities:**
1. Own the response process and make resource allocation decisions
2. Provide regular stakeholder updates and manage external comms
3. Coordinate handoffs, drive toward resolution
4. Lead post-incident review and preventive measures

**Decision authority by severity:**
- SEV1/2: IC has full authority, bias toward action, document decisions for later review
- SEV3/4: Standard ticket-based handling, no special escalation

### Step 3: Communicate

Use severity-appropriate templates from `references/communication_templates.md`:
- Initial notification (SEV1/2)
- Executive summary (SEV1)
- Customer-facing communication
- Status page updates

Stakeholder cadence matrix: `references/communication_templates.md`

### Step 4: Reconstruct Timeline

```bash
python scripts/timeline_reconstructor.py --input events.json --gap-analysis --format markdown
```

Processes timestamped events from multiple sources into a chronological narrative with phase detection (detection, triage, mitigation, resolution) and gap analysis.

### Step 5: Generate Post-Incident Review

```bash
python scripts/pir_generator.py --incident incident_data.json --timeline timeline.md --rca-method fishbone --output pir.md
```

Applies RCA frameworks (5 Whys, Fishbone, Timeline, Bow Tie) and generates actionable follow-up items. See `references/rca_frameworks_guide.md` for framework selection guidance.

---

## Tools

### incident_classifier.py
Severity classification from incident descriptions. Outputs severity level, recommended response teams, initial actions, and communication templates.

```bash
python scripts/incident_classifier.py --input incident.json --format text
echo "Database is down affecting all users" | python scripts/incident_classifier.py --format text
```

### timeline_reconstructor.py
Reconstructs chronological timelines from timestamped events with phase detection and duration analysis.

```bash
python scripts/timeline_reconstructor.py --input events.json --gap-analysis --format markdown
```

### pir_generator.py
Generates structured PIR documents with multiple RCA frameworks and automated action items.

```bash
python scripts/pir_generator.py --incident incident.json --rca-method fishbone --output pir.md
```

---

## Best Practices

**During Response:**
- Stay composed; make decisive calls with incomplete information
- Document all actions, decisions, and rationale in real time
- Prefer rollbacks to risky fixes under pressure
- Validate fixes before declaring resolution

**Post-Incident:**
- Blameless culture: focus on system failures, not individual mistakes
- Assign action items with specific owners and due dates
- Share PIRs broadly; update runbooks from lessons learned

---

## Anti-Patterns

1. **Skipping the IC role for SEV1** -- uncoordinated response leads to duplicated effort and missed communication
2. **Undocumented decisions** -- every SEV1 decision must be logged with timestamp and rationale
3. **Declaring resolution before validation** -- confirm fix with monitoring data before updating status
4. **Action items without owners** -- unassigned items never get completed

---

## Reference Documentation

| Document | Contents |
|----------|----------|
| `references/incident_severity_matrix.md` | Full SEV1-4 criteria, escalation paths, decision trees |
| `references/communication_templates.md` | Notification templates, stakeholder cadence, customer comms |
| `references/rca_frameworks_guide.md` | 5 Whys, Fishbone, Timeline, Bow Tie methodology |
| `references/incident-response-framework.md` | IC role details, runbook generation, integration points |
| `references/sla-management-guide.md` | SLA tracking and management during incidents |
