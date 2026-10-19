# Operate: Compute Engine

Prefer Cloud Run for new services; this is for the VMs that remain.

## Baseline

- **Managed instance groups** from an **instance template**, regional across zones, with an autohealing health check: a failed VM is recreated.
- **OS Login** for SSH (access by IAM, no keys in metadata) and **IAP TCP forwarding** instead of public SSH: `gcloud compute ssh <vm> --tunnel-through-iap`. No external IP on VMs that do not serve the internet.
- A dedicated service account per VM group with minimal scopes and roles, never the default Compute Engine service account with broad access.
- **Shielded VM** on supported images; disks encrypted by default (CMEK only when required).
- **Snapshot schedules** on stateful disks; images built by a pipeline, not by hand.
- OS patching with VM Manager OS patch management.

## Day to day

```bash
gcloud compute instances describe <vm> --zone <zone> --format="value(status)"
gcloud compute instances get-serial-port-output <vm> --zone <zone>      # boot failures
gcloud compute instance-groups managed list-instances <mig> --region <region>
```

| Problem | Check |
|---|---|
| VM unreachable | Firewall rules for the IAP range `35.235.240.0/20` on port 22, OS Login role, then the serial port output |
| MIG keeps recreating instances | The autohealing health check fails: wrong port or path, or an initial delay too short for startup |
| Disk full | Resize the persistent disk online, then grow the filesystem |
| Instance stopped unexpectedly | Spot VM preemption, or host maintenance: check the operations log |

## Cost

Committed use discounts for steady usage; Spot VMs only for interruptible work; stop or schedule non-production VMs; follow the rightsizing recommendations in the console.
