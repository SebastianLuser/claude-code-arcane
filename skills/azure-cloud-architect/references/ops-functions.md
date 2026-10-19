# Operate: Azure Functions

## Plan and settings

- Choose the hosting plan for the workload: consumption-style plans scale to zero and have cold starts; Premium and Dedicated (App Service) plans keep instances warm and support VNet integration and longer runs. Check the current plan list in the docs before choosing: Microsoft has been adding and retiring plans.
- **Managed identity** for every outbound call; connection settings for triggers use identity-based connections (`<CONNECTION>__fullyQualifiedNamespace` and similar) instead of connection strings where the extension supports it.
- Secrets as **Key Vault references** in app settings (`ops-key-vault-identity.md`).
- **Application Insights** connected from the first deploy.

## Deploy

- Build once, deploy the same package to each environment (zip deploy or a container image), from CI with OIDC.
- Use **deployment slots** where the plan supports them: deploy to `staging`, warm it up, then swap. Mark settings that must not move with the swap (per-environment connection strings) as slot settings.

```bash
az functionapp deployment slot swap --name <app> --resource-group <rg> --slot staging --target-slot production
# Rollback: swap again
```

## Triggers that need care

- **Queue and Service Bus:** messages are retried and then moved to a poison or dead-letter queue: make handlers idempotent and alert on that queue's depth.
- **Timer:** schedules are NCRONTAB with seconds (six fields); with several instances only one runs each occurrence, but a long run can overlap the next one.
- **HTTP:** function keys are not user authentication; put real auth (Entra ID, the app's own) in front of anything that is not public.

## Debug

```bash
az functionapp config appsettings list --name <app> --resource-group <rg> --query "[].name"
```

Live logs: Application Insights **Live Metrics** or the portal's log stream (there is no `az functionapp log tail`). After the fact, in Application Insights: `requests` and `exceptions` filtered by `cloud_RoleName`, and the Failures blade. A function that never fires usually has a broken trigger connection setting, a disabled function (`AzureWebJobs.<name>.Disabled`), or a host that failed to start (look at `traces` at host startup).
