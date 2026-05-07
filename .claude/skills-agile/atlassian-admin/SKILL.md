---
name: atlassian-admin
description: "Atlassian Administrator for managing Jira, Confluence, Bitbucket users, permissions, security, integrations, SSO, and org-wide governance."
category: "agile"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Atlassian Administrator Expert

## Workflows

### User Provisioning
1. Create user account: `admin.atlassian.com > User management > Invite users`
   - REST API: `POST /rest/api/3/user` with `{"emailAddress": "...", "displayName": "...","products": [...]}`
2. Add to appropriate groups: `admin.atlassian.com > User management > Groups > [group] > Add members`
3. Assign product access (Jira, Confluence) via `admin.atlassian.com > Products > [product] > Access`
4. Configure default permissions per group scheme
5. Send welcome email with onboarding info
6. **NOTIFY**: Relevant team leads of new member
7. **VERIFY**: Confirm user appears active and can log in

### User Deprovisioning
1. **CRITICAL**: Audit user's owned content and tickets
   - Jira: `GET /rest/api/3/search?jql=assignee={accountId}` to find open issues
   - Confluence: `GET /wiki/rest/api/user/{accountId}/property` to find owned spaces/pages
2. Reassign ownership of: Jira projects, Confluence spaces, open issues, filters and dashboards
3. Remove from all groups and revoke product access
4. Deactivate account: `admin.atlassian.com > User management > [user] > Deactivate`
5. **VERIFY**: Confirm `GET /rest/api/3/user?accountId={accountId}` returns `"active": false`
6. Document deprovisioning in audit log

### Group Management
1. Create groups: `admin.atlassian.com > User management > Groups > Create group`
   - Structure by: Teams (engineering, product, sales), Roles (admins, users, viewers), Projects
2. Define group purpose and membership criteria (document in Confluence)
3. Assign default permissions per group
4. **VERIFY**: Confirm group members via `GET /rest/api/3/group/member?groupName={name}`
5. Regular review and cleanup (quarterly)

### Permission Scheme Design

> See references/security-hardening-guide.md for detailed permission schemes and SSO configuration.

**Jira Permission Schemes** (`Jira Settings > Issues > Permission Schemes`):
- **Public Project**: All users can view, members can edit
- **Team Project**: Team members full access, stakeholders view
- **Restricted Project**: Named individuals only

**Confluence Permission Schemes** (`Confluence Admin > Space permissions`):
- **Public Space**: All users view, space members edit
- **Team Space**: Team-specific access
- **Restricted Space**: Named individuals and groups

**Best Practices**: Use groups not individual permissions, principle of least privilege, regular permission audits.

### Marketplace App Management
1. Evaluate app need and security at `marketplace.atlassian.com`
2. Review vendor security documentation (penetration test reports, SOC 2)
3. Test app in sandbox environment
4. Install app: `admin.atlassian.com > Products > [product] > Apps > Find new apps`
5. Configure app settings per vendor documentation
6. **VERIFY**: Confirm app appears in `GET /rest/plugins/1.0/` and health check passes

## Global Configuration

> See references/user-provisioning-checklist.md for SSO, integration setup, and system performance details.

### Jira Global Settings (`Jira Settings > Issues`)
- **Issue Types**: Create and manage org-wide issue types; define issue type schemes
- **Workflows**: Create global workflow templates; manage workflow schemes
- **Custom Fields**: Create org-wide custom fields; manage field configurations and context
- **Notification Schemes**: Configure default notification rules; manage email templates

### Confluence Global Settings (`Confluence Admin`)
- **Blueprints & Templates**: Create org-wide templates at `Configuration > Global Templates and Blueprints`
- **Themes & Appearance**: Configure org branding at `Configuration > Themes`
- **Macros**: Enable/disable macros at `Configuration > Macro usage`

### Security Settings (`admin.atlassian.com > Security`)
- Password policies, session timeout, API token management
- Data residency configuration
- Audit logs: enable comprehensive logging, retain per policy (minimum 7 years for SOC 2/GDPR)

## Governance & Policies

### Access Governance
- Quarterly review of all user access
- Limit org admins to 2-3 individuals; audit admin actions monthly
- Require MFA for all admins: `Security > Authentication policies > Require 2FA`

### Naming Conventions
- **Jira**: Project keys 3-4 uppercase letters; issue types Title Case; custom fields prefixed
- **Confluence**: Spaces use Team/Project prefix; pages descriptive; labels lowercase, hyphen-separated

### Change Management
- **Major Changes**: Announce 2 weeks in advance; test in sandbox; create rollback plan; post-implementation review
- **Minor Changes**: Announce 48 hours in advance; document in change log

## Disaster Recovery

**Backup Strategy**: Daily automated backups; weekly manual verification; 30-day retention; offsite storage.
**Recovery Testing**: Quarterly recovery drills; document procedures; measure RTO and RPO.

**Incident Severity Levels**: P1 Critical (15 min response), P2 High (1 hour), P3 Medium (4 hours), P4 Low (24 hours).

## Metrics & Reporting

- **System Health**: Active users, storage utilization, API rate limits, response times
- **Usage Analytics**: Most active projects/spaces, content creation trends, search patterns
- **Compliance Metrics**: Access review completion, security audit findings, failed login attempts

## Handoff Protocols

| Partner | Sends TO | Receives FROM |
|---------|----------|---------------|
| **Jira Expert** | Global workflows, custom fields, permission schemes | Project-specific config needs |
| **Confluence Expert** | Global templates, space permission schemes, blueprints | Space-specific needs |
| **Senior PM** | Usage analytics, capacity planning, compliance status | Strategic planning input |
| **Scrum Master** | Team access, board config options, integrations | Workflow needs |
