# Operate: Key Vault and identity

## Identity first

- **Managed identities** for every workload (App Service, Functions, Container Apps, VMs): the code gets tokens from the platform, so there is no secret to store. Prefer a **user-assigned** identity when several resources share the same access or the identity must survive a redeploy.
- **Azure RBAC** at the narrowest scope that works (resource, then resource group); built-in roles before custom ones.
- **GitHub Actions without secrets:** an app registration or user-assigned identity with a **federated credential** for `repo:<org>/<repo>:environment:production`, and in the workflow `azure/login` with `client-id`, `tenant-id` and `subscription-id` plus `permissions: id-token: write`. Scope the credential's subject to one repo and one environment or branch.

## Key Vault

- Use the **Azure RBAC permission model** (roles such as Key Vault Secrets User). Access policies are the legacy model; RBAC is the default for vaults created with API version 2026-02-01 or later. Check older vaults and migrate them.
- **Soft delete** is on by default for new vaults and cannot be disabled once on; retention is 7–90 days (default 90). Old vaults may predate it: check. **Purge protection** is off by default: turn it on for production vaults, so nobody can destroy secrets permanently before the retention ends.
- **Private endpoint** and public network access disabled for production vaults (see `ops-networking.md`).
- One vault per application and environment: access is granted per vault, and a shared vault means shared blast radius.
- Diagnostic settings to Log Analytics, so every secret read is auditable (`ops-monitor-audit.md`).

## Reading secrets

- App Service and Functions: **Key Vault references** in app settings, `@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/<name>/)`, resolved with the app's managed identity.
- Code: the Azure SDK with `DefaultAzureCredential`, which uses the managed identity in Azure and your developer login locally.
- Azure DevOps: a variable group linked to the vault (`ops-pipelines.md`).

## Rotation and expiry

Set expiry dates on secrets and certificates, and subscribe to the Key Vault near-expiry events (Event Grid) to alert or trigger rotation. After a suspected exposure: create a new version, update the consumer, disable the old version, then check the audit logs for reads you do not recognize.

## Troubleshooting `403 Forbidden`

1. Which identity called? (The app's managed identity, not your user.)
2. Does it have a data-plane role on the vault (Key Vault Secrets User), not just Reader on the resource?
3. Is the call coming through the private endpoint when public access is disabled (DNS resolving to the private IP)?
4. Role assignments can take a few minutes to apply.
