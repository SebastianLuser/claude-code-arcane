# Operate: Cloud Audit Logs

## Log types

| Type | Records | Default |
|---|---|---|
| **Admin Activity** | Changes to configuration and IAM (create, delete, `SetIamPolicy`) | Always on, cannot be disabled |
| **System Event** | Google-initiated changes (live migration, autoscaler) | Always on |
| **Data Access** | Reads of configuration or data, and data writes | Off by default for all services except some BigQuery services; billed when enabled |
| **Policy Denied** | Access denied by a security policy (VPC Service Controls, organization policy) | On |

Enable Data Access logs only for sensitive services (Secret Manager, Cloud Storage buckets with personal data, Cloud SQL admin) at the organization or folder level, so new projects inherit them.

## Keep them

- Logs have a default retention in the `_Default` and `_Required` buckets; for longer investigation windows, create an **aggregated sink** at the organization or folder level to a log bucket with longer retention, BigQuery (for SQL analysis) or Cloud Storage (cheap archive with retention lock).
- Restrict who can read Data Access logs (`roles/logging.privateLogViewer`): they may contain sensitive fields.

## Queries (Logs Explorer)

```text
-- IAM policy changes
protoPayload.methodName="SetIamPolicy"

-- Everything one principal did
protoPayload.authenticationInfo.principalEmail="<user-or-sa>"

-- Service account key creation (should not happen)
protoPayload.methodName="google.iam.admin.v1.CreateServiceAccountKey"

-- Secret reads (needs Data Access logs on Secret Manager)
protoPayload.serviceName="secretmanager.googleapis.com" AND protoPayload.methodName:"AccessSecretVersion"
```

## Alerts

Create **log-based alerting policies** (or log-based metrics with alerts) for: IAM changes at the organization or project level, service account key creation, firewall rules allowing `0.0.0.0/0`, changes to log sinks or buckets (someone hiding their tracks), and Cloud SQL instances made public. Security Command Center covers many of these findings out of the box; enable it before building custom rules.
