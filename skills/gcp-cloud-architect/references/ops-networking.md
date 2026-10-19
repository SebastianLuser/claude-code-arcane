# Operate: GCP networking

## Layout

- A **custom-mode VPC** (not the auto-mode default network) per environment; subnets are regional, the VPC is global.
- **Firewall rules** targeted by **service account** or network tag, not by IP; deny by default, allow only what each tier needs. Delete the default network's permissive rules if it exists.
- **Cloud NAT** for outbound internet from private VMs and serverless VPC egress, with a fixed egress IP when partners allowlist it.
- **Private Google Access** on subnets so private workloads reach Google APIs without external IPs.
- **Private Services Access** or **Private Service Connect** for Cloud SQL, Memorystore and other managed services on private IPs.
- Serverless to VPC: **Direct VPC egress** on Cloud Run (or a Serverless VPC Access connector).
- Public HTTP(S): an **external Application Load Balancer** with **Cloud Armor** (WAF rules, rate limiting) in front of Cloud Run, functions or MIGs (serverless NEGs for serverless backends).
- Shared VPC when several projects need one network managed centrally.

## Debug "cannot connect"

1. **Connectivity Tests** (Network Intelligence Center) simulate the path and name the rule or route that drops it:

```bash
gcloud network-management connectivity-tests create api-to-db \
  --source-instance=projects/<p>/zones/<z>/instances/<vm> \
  --destination-ip-address=<db-private-ip> --destination-port=5432 --protocol=TCP
gcloud network-management connectivity-tests describe api-to-db
```

2. **Firewall:** the rule must match the target's service account or tag; check that a higher-priority deny does not win. Firewall Rules Logging shows hits per rule.
3. **Routes:** private services reached through peering need the peering route to be exported and imported.
4. **DNS:** private zones in Cloud DNS must be visible to the VPC that queries them.

**VPC Flow Logs** on production subnets (sampled) give the traffic history when a connection fails intermittently.
