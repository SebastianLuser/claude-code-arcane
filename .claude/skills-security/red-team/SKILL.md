---
name: red-team
description: "Plan and execute authorized red team engagements: MITRE ATT&CK kill-chain planning, technique scoring, choke point identification, OPSEC risk assessment, and crown jewel targeting."
category: "security"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Red Team

Red team engagement planning and attack path analysis for authorized offensive security simulations. This is NOT vulnerability scanning (see security-pen-testing) or incident response (see incident-response).

**All red team activities require written authorization** -- signed RoE, defined scope, executive approval. The tool will not generate output without `--authorized`.

---

## Workflow

### Step 1: Define Scope

Agree upon crown jewels and success criteria in the RoE before any technique is executed.

**Crown jewel types:** Domain Controller, Database servers, Payment systems, Source code repositories, Cloud management plane.

### Step 2: Build Engagement Plan

```bash
# External access scenario
python3 scripts/engagement_planner.py \
  --techniques T1059,T1078,T1003 --access-level external \
  --authorized --json

# Internal with crown jewel targeting
python3 scripts/engagement_planner.py \
  --techniques T1059,T1078,T1021,T1550,T1003 --access-level internal \
  --crown-jewels "Database,Active Directory" --authorized --json

# List all 29 supported techniques
python3 scripts/engagement_planner.py --list-techniques
```

**Access levels:**
- external: No internal access, internet-facing techniques only
- internal: Network foothold, no credentials
- credentialed: Valid credentials, full kill chain available

### Step 3: Analyze Kill Chain

Techniques are organized into 11 kill-chain phases (Reconnaissance through Impact) and scored by effort:

```
effort_score = detection_risk x (len(prerequisites) + 1)
```

Lower effort = easier to execute without triggering detection. The planner identifies **choke points** -- techniques required by multiple paths to crown jewels. Hardening a choke point has multiplied defensive value.

Full kill-chain phases, technique scoring reference, and choke point methodology: `references/attack-path-methodology.md`

### Step 4: Assess OPSEC Risks

| Tactic | Primary Risk | Mitigation |
|--------|-------------|------------|
| Credential Access | LSASS triggers EDR | Use DCSync/Kerberoasting where possible |
| Execution | PowerShell command-line logging | AMSI bypass or alternative execution |
| Lateral Movement | NTLM generates event 4624 type 3 | Use Kerberos; avoid NTLM over network |
| Exfiltration | Large transfers trigger DLP | Stage data, slow exfil if stealth required |

**OPSEC checklist before each phase:** Is technique in scope? Will it generate monitored logs? Is there a less-detectable alternative? If detected, does it reveal the full operation?

### Step 5: Execute and Document

Log each technique, timestamp, and outcome in real time. Post-engagement: compile findings, map detection gaps, remediation recommendations.

---

## Tool Reference

### engagement_planner.py

```bash
# Assumed breach tabletop
python3 scripts/engagement_planner.py \
  --techniques T1059,T1078,T1021,T1550,T1003,T1048 \
  --access-level credentialed \
  --crown-jewels "Active Directory,S3 Data Bucket" \
  --target-count 20 --authorized --json

# Compare across access levels
for level in external internal credentialed; do
  python3 scripts/engagement_planner.py \
    --techniques T1059,T1078,T1003,T1021 \
    --access-level "${level}" --authorized --json | jq '.total_effort_score'
done
```

**Exit codes:** 0 = plan generated, 1 = missing authorization or invalid technique, 2 = scope violation.

---

## Anti-Patterns

1. **Operating without written authorization** -- unauthorized testing is criminal under CFAA and equivalent laws
2. **Skipping kill-chain phase ordering** -- each phase builds foundation for the next
3. **Not defining crown jewels first** -- engagements without success criteria drift into open-ended hunting
4. **Ignoring OPSEC risks** -- use them to understand detection exposure, not to avoid it entirely
5. **Not documenting techniques in real time** -- retroactive documentation is unreliable
6. **Not cleaning up artifacts** -- persistence mechanisms and staged data must be removed post-exercise
7. **Testing only path of least resistance** -- validate detection across multiple paths

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| threat-detection | Red team TTPs validate threat hunting hypotheses |
| incident-response | Red team activity should trigger incident response procedures |
| cloud-security | Cloud misconfigurations become attack path targets |
| security-pen-testing | Pen testing targets specific vulnerabilities; red team simulates full kill chains |
