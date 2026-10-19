# Operate: EC2

Prefer Fargate or Lambda for new services; this is for the EC2 instances that remain (legacy apps, workloads that need a full VM).

## Baseline

- Launch from a **launch template** in an **Auto Scaling group**, even for one instance: a failed instance is replaced automatically.
- **IMDSv2 required** (`HttpTokens: required`): blocks the SSRF path that steals instance credentials through the metadata service.
- An **instance profile** (role) for AWS access, never access keys on the disk.
- No SSH from the internet: **SSM Session Manager** for shell access, Patch Manager for OS updates.
- Encrypted EBS volumes (enable EBS encryption by default per region).
- An AMI pipeline (Image Builder or Packer) instead of configuring instances by hand.

## Day to day

```bash
aws ssm start-session --target <instance-id>
aws ec2 describe-instance-status --instance-ids <id>      # system and instance status checks
aws ec2 get-console-output --instance-id <id> --latest    # boot failures
```

| Problem | Check |
|---|---|
| Instance status check failing | Out of memory, full disk, kernel or boot error: read the console output |
| System status check failing | AWS host problem: stop and start (moves to a new host), or let the ASG replace it |
| Disk full | `df -h` via Session Manager; grow the EBS volume online, then the filesystem |
| High CPU on burstable types (t3/t4g) | CPU credits exhausted: check `CPUCreditBalance`, move to unlimited mode or a non-burstable type |

## Cost

Right-size with Compute Optimizer recommendations; Graviton (arm64) instances usually cost less for the same work; cover steady usage with a Compute Savings Plan; stop non-production instances outside working hours.
