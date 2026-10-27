---
owner: {owner-email}
service: {service-name}
last_reviewed: {YYYY-MM-DD}
last_used_in_incident: {YYYY-MM-DD}
---
# {ALERT_NAME}

## Severity

{SEV1 (>50% affected) | SEV2 (partial degradation) | SEV3 (informational)}

## Symptoms

- What the user sees: {description}
- What fires the alert: {alert condition}
- Dashboards: [{dashboard-name}]({dashboard-url})

## Impact Assessment

- What is broken: {description}
- How many it affects: {number/percentage}
- Since when: {timestamp or "since the alert fired"}
- School hours: {yes/no — if it is during school hours, raise severity by 1}

## Diagnostic Steps

```bash
# Step 1: {description}
{exact-copy-pasteable-command}

# Step 2: {description}
{exact-copy-pasteable-command}
```

**Decision criterion:** If {metric} > {threshold} -> go to Mitigation. If not -> check {something else}.

## Mitigation

Stop the bleeding — not a permanent fix.

```bash
# Option A: Rollback
{rollback-command}

# Option B: Scale up
{scale-command}
```

## Resolution

Permanent fix (it can take hours):

1. {step}
2. {step}
3. {step}

## Rollback Plan

If the fix makes things worse:

```bash
{fix-rollback-command}
```

## Escalation Path

| Time | Action | Contact | Channel |
|--------|--------|----------|-------|
| 0-15 min | Primary on-call | {name} | {slack-channel} |
| 15-30 min | Secondary on-call | {name} | {slack-channel} |
| 30-45 min | Engineering Manager | {name} | {phone} |
| 45+ min | CTO | {name} | {phone} |

## Post-incident

- [ ] Create a postmortem with `/incident`
- [ ] Jira action items created
- [ ] Update this runbook with what was learned
- [ ] Review with the team at the next retro
