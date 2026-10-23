# Operate: Azure VMs

Prefer App Service, Container Apps or Functions for new services; this is for the VMs that remain.

## Baseline

- **Virtual Machine Scale Sets** (even with one instance) across **availability zones**, so a failed VM or zone is replaced.
- No public IP; access through **Azure Bastion**, or Microsoft Entra login for VMs with RBAC (`Virtual Machine Administrator Login`).
- **Managed identity** for calls to Azure services; no credentials on the disk.
- **Trusted Launch** (secure boot, vTPM) on supported images; managed disks with encryption at host or Azure Disk Encryption where required.
- Images from **Azure Compute Gallery**, built by a pipeline (Image Builder or Packer), not configured by hand.
- Patching with **Azure Update Manager** and a maintenance schedule.

## Day to day

```bash
az vm get-instance-view --name <vm> --resource-group <rg> --query instanceView.statuses
az vm boot-diagnostics get-boot-log --name <vm> --resource-group <rg>
az vm run-command invoke --name <vm> --resource-group <rg> --command-id RunShellScript --scripts "df -h; free -m"
```

| Problem | Check |
|---|---|
| VM unreachable | NSG and route (`ops-networking.md`), then boot diagnostics and the serial console |
| Boot failure | Boot diagnostics screenshot and log; repair with `az vm repair create` (extension `vm-repair`), which attaches a **copy** of the OS disk to a new repair VM; after fixing it, `az vm repair restore` swaps the disk back |
| Disk full | `run-command` to inspect; expand the managed disk, then the filesystem |
| Unexpected restart | Activity Log and Resource Health: platform maintenance or a host failure |

## Cost

Stopping a VM from the OS still bills compute: **deallocate** it (`az vm deallocate`) or use auto-shutdown for non-production. Right-size with Azure Advisor; reservations or a savings plan for steady usage; Spot VMs only for interruptible work.
