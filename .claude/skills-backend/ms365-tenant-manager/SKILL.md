---
name: ms365-tenant-manager
description: "Automate Microsoft 365 tenant setup, Azure AD user management, Exchange Online configuration, security policies, and compliance reporting with PowerShell scripts for Global Administrators."
category: "backend"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Microsoft 365 Tenant Manager

Expert guidance and automation for Microsoft 365 Global Administrators managing tenant setup, user lifecycle, security policies, and organizational optimization.

> **Note:** This skill may create or modify files in your project. It will ask before writing.

## Quick Start

### Run a Security Audit

```powershell
Connect-MgGraph -Scopes "Directory.Read.All","Policy.Read.All","AuditLog.Read.All"
Get-MgSubscribedSku | Select-Object SkuPartNumber, ConsumedUnits, @{N="Total";E={$_.PrepaidUnits.Enabled}}
Get-MgPolicyAuthorizationPolicy | Select-Object AllowInvitesFrom, DefaultUserRolePermissions
```

### Bulk Provision Users from CSV

```powershell
# CSV columns: DisplayName, UserPrincipalName, Department, LicenseSku
Import-Csv .\new_users.csv | ForEach-Object {
    $passwordProfile = @{ Password = (New-Guid).ToString().Substring(0,16) + "!"; ForceChangePasswordNextSignIn = $true }
    New-MgUser -DisplayName $_.DisplayName -UserPrincipalName $_.UserPrincipalName `
               -Department $_.Department -AccountEnabled -PasswordProfile $passwordProfile
}
```

### Create a Conditional Access Policy (MFA for Admins)

```powershell
$adminRoles = (Get-MgDirectoryRole | Where-Object { $_.DisplayName -match "Admin" }).Id
$policy = @{
    DisplayName = "Require MFA for Admins"
    State = "enabledForReportingButNotEnforced"   # Start in report-only mode
    Conditions = @{ Users = @{ IncludeRoles = $adminRoles } }
    GrantControls = @{ Operator = "OR"; BuiltInControls = @("mfa") }
}
New-MgIdentityConditionalAccessPolicy -BodyParameter $policy
```

## Best Practices

### Tenant Setup

1. Enable MFA before adding users
2. Configure named locations for Conditional Access
3. Use separate admin accounts with PIM
4. Verify custom domains (and DNS propagation) before bulk user creation
5. Apply Microsoft Secure Score recommendations

### Security Operations

1. Start Conditional Access policies in report-only mode
2. Review Sign-in logs for 48 h before enforcing a new policy
3. Never hardcode credentials in scripts -- use Azure Key Vault or `Get-Credential`
4. Enable unified audit logging for all operations
5. Conduct quarterly security reviews and Secure Score check-ins

### PowerShell Automation

1. Prefer Microsoft Graph (`Microsoft.Graph` module) over legacy MSOnline
2. Include `try/catch` blocks for error handling
3. Implement `Write-Host`/`Write-Warning` logging for audit trails
4. Use `-WhatIf` or dry-run output before bulk destructive operations
5. Test in a non-production tenant first

## Detailed Workflows

> See references/workflow-scripts.md for complete PowerShell scripts covering new tenant setup, security hardening, and user offboarding workflows.

## Reference Guides

| Reference | Contents |
|-----------|----------|
| references/powershell-templates.md | Ready-to-use script templates, Conditional Access examples, bulk provisioning |
| references/security-policies.md | Conditional Access config, MFA strategies, DLP and retention policies |
| references/troubleshooting.md | Common error resolutions, PowerShell module issues, permission troubleshooting |

## Limitations

| Constraint | Impact |
|------------|--------|
| Global Admin required | Full tenant setup needs highest privilege |
| API rate limits | Bulk operations may be throttled |
| License dependencies | E3/E5 required for advanced features |
| Hybrid scenarios | On-premises AD needs additional configuration |
| PowerShell prerequisites | Microsoft.Graph module required |

### Required PowerShell Modules

```powershell
Install-Module Microsoft.Graph -Scope CurrentUser
Install-Module ExchangeOnlineManagement -Scope CurrentUser
Install-Module MicrosoftTeams -Scope CurrentUser
```
