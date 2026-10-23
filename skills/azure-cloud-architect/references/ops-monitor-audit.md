# Operate: Azure Monitor and audit

## Where the evidence is

| Log | Records | Where to send it |
|---|---|---|
| **Activity Log** | Control-plane operations on resources: who created, changed, deleted, assigned roles | Diagnostic setting at the subscription → Log Analytics workspace (table `AzureActivity`) |
| **Resource logs** | Data-plane operations per service (Key Vault reads, SQL audit, Storage access) | Diagnostic settings per resource → the same workspace |
| **Microsoft Entra logs** | Sign-ins and directory changes (`SigninLogs`, `AuditLogs`) | Entra diagnostic settings → the workspace |

One Log Analytics workspace per environment (or a central security workspace), with retention set for investigations. Enforce diagnostic settings with **Azure Policy** (`DeployIfNotExists` built-in policies) so new resources are covered without anyone remembering.

## Queries (KQL)

```kusto
// Who changed role assignments in the last 7 days
AzureActivity
| where TimeGenerated > ago(7d)
| where OperationNameValue has "Microsoft.Authorization/roleAssignments"
| project TimeGenerated, Caller, OperationNameValue, ActivityStatusValue, ResourceGroup

// Failed sign-ins by user and location
SigninLogs
| where TimeGenerated > ago(1d) and ResultType != "0"
| summarize failures = count() by UserPrincipalName, Location
| order by failures desc

// Key Vault secret reads by caller (needs Key Vault diagnostic settings)
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.KEYVAULT" and OperationName == "SecretGet"
| summarize reads = count() by CallerIPAddress, identity_claim_appid_g
```

Column names differ between resource-specific and `AzureDiagnostics` tables: check the schema in the workspace before saving a query as an alert.

## Alerts worth having

Role assignments at subscription scope; deletion of resource locks; Key Vault purge or soft-delete changes; NSG rules opening ports to `*`; sign-ins from unexpected countries; Defender for Cloud high-severity recommendations. Activity Log alerts fire on control-plane events; log search alerts run KQL on a schedule. Check the Azure Monitor pricing page before creating many log search alerts: they are billed per rule.

**Microsoft Defender for Cloud** covers much of this out of the box; enable it before building custom rules.
