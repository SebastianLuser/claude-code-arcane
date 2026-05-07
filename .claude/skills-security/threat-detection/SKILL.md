---
name: threat-detection
description: "Proactive threat hunting with hypothesis scoring, IOC sweep generation, z-score anomaly detection, and MITRE ATT&CK signal prioritization across SIEM/EDR telemetry."
category: "security"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Threat Detection

Proactive discovery of attacker activity through hypothesis-driven hunting, IOC analysis, and behavioral anomaly detection. This is NOT incident response (see incident-response) or red team operations (see red-team).

---

## Workflow

### Step 1: Score a Hunting Hypothesis

```bash
python3 scripts/threat_signal_analyzer.py --mode hunt \
  --hypothesis "Lateral movement via PtH using compromised service account" \
  --actor-relevance 3 --control-gap 2 --data-availability 2 --json
```

**Scoring formula:** priority = (actor_relevance x 3) + (control_gap x 2) + (data_availability x 1)

| Factor | Weight | Description |
|--------|--------|-------------|
| Actor relevance | x3 | How closely does TTP match known actors in your sector? |
| Control gap | x2 | How many controls would miss this behavior? |
| Data availability | x1 | Do you have the telemetry to test this? |

### Step 2: Run IOC Sweep

```bash
python3 scripts/threat_signal_analyzer.py --mode ioc --ioc-file iocs.json --json
```

**IOC staleness thresholds:** IPs/domains: 30 days, file hashes: 90 days, URLs: 14 days, mutex names: 180 days. Stale IOCs are excluded from sweep generation.

**IOC file format:** `{"ips": [...], "domains": [...], "hashes": [...]}`

### Step 3: Detect Anomalies

```bash
python3 scripts/threat_signal_analyzer.py --mode anomaly \
  --events-file telemetry.json --baseline-mean 100 --baseline-std 25 --json
```

**Z-score thresholds:**
- < 2.0: Normal, no action
- 2.0-2.9: Soft anomaly, log and increase sampling
- >= 3.0: Hard anomaly, escalate to hunt analyst

Baselines require 14+ days of historical telemetry. Recompute after incidents, infrastructure changes, or seasonal shifts.

### Step 4: Triage and Escalate

Confirm or dismiss all anomaly findings. Escalate confirmed activity to incident-response. Document new detection rules from findings.

**Exit codes:** 0 = no high-priority findings, 1 = medium signals, 2 = high-priority confirmed.

---

## High-Value Hunt Targets

| Hypothesis | MITRE ID | Data Source | Priority Signal |
|-----------|----------|-------------|-----------------|
| WMI lateral movement | T1047 | WMI logs, EDR | WMI from WINRM, unusual parent-child |
| LOLBin defense evasion | T1218 | Process creation | certutil/regsvr32/mshta with network |
| Beaconing C2 | T1071.001 | Proxy/DNS logs | Regular intervals with jitter |
| Pass-the-Hash | T1550.002 | Windows 4624 type 3 | NTLM from unexpected source |
| LSASS memory access | T1003.001 | EDR memory events | OpenProcess on lsass from non-system |
| Kerberoasting | T1558.003 | Windows 4769 | High volume TGS requests |

Full hunt playbooks and tactic coverage matrix: `references/hunt-playbooks.md`

---

## Deception and Honeypots

Any interaction with a deception asset is an automatic SEV2 -- unambiguous signal requiring investigation.

| Asset Type | Placement | ATT&CK Technique |
|-----------|-----------|-----------------|
| Honeypot credentials | Password vault | T1555 |
| Honey tokens (fake AWS keys) | Git repos, S3 | T1552.004 |
| Honey files (passwords.xlsx) | File shares | T1074 |
| Honey accounts (dormant AD) | Active Directory | T1078.002 |
| Honeypot services | DMZ, flat segments | T1046, T1190 |

---

## Anti-Patterns

1. **Hunting without a hypothesis** -- broad queries generate noise; always start with a testable question
2. **Using stale IOCs** -- IOCs older than threshold generate false positives and degrade SOC credibility
3. **Skipping baseline establishment** -- anomaly detection without 14+ days of baseline produces noise
4. **Hunting only known techniques** -- include open-ended anomaly analysis for novel TTPs
5. **Not closing the feedback loop** -- hunt findings must produce new detection rules
6. **Treating every anomaly as confirmed** -- high z-scores require human triage before escalation
7. **Ignoring honeypot alerts** -- any deception asset interaction is high-fidelity

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| incident-response | Confirmed threats escalate for triage and containment |
| red-team | Red team TTPs inform hunt hypothesis prioritization |
| cloud-security | Over-permissioned roles and open storage are hunting targets |
| security-pen-testing | Pen test findings identify attack surfaces to monitor |
