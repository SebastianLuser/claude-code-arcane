# Operate: Azure networking

## Layout

- One VNet per environment with subnets by role (app integration, private endpoints, data); plan address spaces that do not overlap with peered VNets or on-premises networks.
- **NSGs** on subnets: inbound only what each tier needs, referencing application security groups or service tags instead of raw IP ranges.
- **Private endpoints** for PaaS services (SQL, Storage, Key Vault, Cosmos DB) with public network access disabled on the service.
- **Private DNS zones** linked to the VNet for each private endpoint type (for example `privatelink.database.windows.net`): without them, names still resolve to the public IP and connections fail or leave the network.
- Outbound to the internet through a **NAT gateway** for a stable egress IP; inbound web traffic through **Application Gateway with WAF** or **Front Door**.
- VNet peering is not transitive: hub-and-spoke needs a firewall or route tables in the hub to route spoke-to-spoke.
- **Azure Bastion** for VM access instead of public SSH or RDP.

## Debug "cannot connect"

1. **DNS:** from inside the VNet, does the service name resolve to the private endpoint's private IP? (`nslookup <name>.database.windows.net` from a VM or the app's console.)
2. **NSG:** Network Watcher **IP flow verify** tells which rule allows or denies a given flow.
3. **Route:** Network Watcher **next hop** shows where traffic goes (a firewall or user-defined route can blackhole it).
4. **End to end:** Network Watcher **connection troubleshoot** from a VM or App Service to the target and port.
5. **Service firewall:** the service's own networking settings may still deny the subnet or require the private endpoint.

```bash
az network watcher test-ip-flow --vm <vm> --resource-group <rg> --direction Outbound --protocol TCP \
  --local <vm-ip>:* --remote <target-ip>:1433
```

Enable **VNet flow logs** (Network Watcher) on production VNets to see allowed and denied flows after the fact.
