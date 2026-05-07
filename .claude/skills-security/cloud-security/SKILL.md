---
name: cloud-security
description: "Assess cloud infrastructure for IAM privilege escalation, public storage exposure, open security groups, and IaC security gaps across AWS, Azure, and GCP with MITRE ATT&CK mapping."
category: "security"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Cloud Security

Cloud security posture assessment for IAM privilege escalation, public storage exposure, network misconfiguration, and IaC security gaps. This is NOT incident response for active cloud compromise (see incident-response) or application scanning (see security-pen-testing).

---

## Workflow

### Step 1: Run Posture Checks

```bash
# IAM privilege escalation analysis
python3 scripts/cloud_posture_check.py policy.json --check iam --json

# S3 public access assessment
python3 scripts/cloud_posture_check.py bucket_config.json --check s3 --json

# Security group open port analysis
python3 scripts/cloud_posture_check.py sg.json --check sg --json

# All checks with severity modifier
python3 scripts/cloud_posture_check.py config.json --check all \
  --provider aws --severity-modifier internet-facing --json
```

**Exit codes:** 0 = no high/critical, 1 = high (remediate in 24h), 2 = critical (remediate immediately).

**Severity modifiers:** Use `--severity-modifier internet-facing` for public resources, `--severity-modifier regulated-data` for PCI/HIPAA/GDPR workloads. Both bump severity by one level.

### Step 2: Analyze IAM Policies

Critical privilege escalation patterns:

| Pattern | Key Action Combination |
|---------|------------------------|
| Lambda PassRole escalation | iam:PassRole + lambda:CreateFunction |
| EC2 instance profile abuse | iam:PassRole + ec2:RunInstances |
| Self-attach policy escalation | iam:AttachUserPolicy + sts:GetCallerIdentity |
| Policy version backdoor | iam:CreatePolicyVersion + iam:ListPolicies |
| Credential harvesting | iam:CreateAccessKey + iam:ListUsers |

Full escalation combos, severity guide, and least privilege recommendations: `references/cspm-checks.md`

### Step 3: Assess Storage Exposure

| Check | Critical Condition |
|-------|-------------------|
| Public access block | Any of four flags missing/false |
| Bucket ACL | public-read-write |
| Bucket policy | Principal: "*" with Allow |
| Default encryption | No encryption configuration |

### Step 4: Check Network Exposure

| Port | Service | Severity (0.0.0.0/0) |
|------|---------|----------------------|
| 22 | SSH | Critical |
| 3389 | RDP | Critical |
| 3306/5432/27017 | Databases | High |
| 6379/9200 | Redis/Elasticsearch | High |
| 0-65535 | All traffic | Critical |

### Step 5: Review IaC

Catch misconfigurations at definition time in Terraform, CloudFormation, Kubernetes manifests, and Helm charts. Integrate into CI/CD as a pre-apply gate.

---

## Cloud Provider Coverage

| Check Type | AWS | Azure | GCP |
|-----------|-----|-------|-----|
| IAM privilege escalation | Full | Partial | Partial |
| Storage public access | Full | Partial | Partial |
| Network exposure | Full | Partial | Partial |
| IaC scanning | Full | Partial | Partial |

---

## Anti-Patterns

1. **Running IAM analysis without checking escalation combos** -- individual actions may look safe; danger is in combinations
2. **Only bucket-level public access block** -- account-level and bucket-level both required
3. **Skipping internet-facing modifier for public resources** -- high findings on public infra should be treated as critical
4. **Checking only administrator policies** -- escalation paths often originate from innocuous-looking policies
5. **Remediating without root cause analysis** -- document why permissions were granted before removing
6. **Not applying regulated-data modifier** -- same finding on a PHI bucket is much more severe

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| incident-response | Critical findings may trigger incident classification |
| threat-detection | Over-permissioned roles are lateral movement hunting targets |
| red-team | Cloud misconfigurations become attack path targets |
| security-pen-testing | Cloud findings feed into infrastructure security assessments |
