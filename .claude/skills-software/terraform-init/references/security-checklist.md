# terraform-init — Security Checklist

- [ ] State bucket: versioning, encryption, no public access
- [ ] Providers pinned (`~> major.minor`)
- [ ] No secrets in `variables.tf` defaults
- [ ] Sensitive outputs marked `sensitive = true`
- [ ] Deletion protection ON for prod databases
- [ ] Multi-AZ enabled for prod
- [ ] Security groups: no `allow_all` / `0.0.0.0/0` ingress
- [ ] IAM: least privilege, prefer IRSA/Workload Identity
