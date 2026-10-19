# Operate: CloudTrail (audit)

CloudTrail records who called which AWS API, when and from where. It is the first source in a security incident (`/incident-response`).

## Setup

- One **organization trail** for all accounts and regions, writing to an S3 bucket in a separate log-archive account, with log file validation on.
- The bucket: Block Public Access, versioning, Object Lock or a deny-delete policy, lifecycle to cheaper storage after the retention you need for investigations.
- Send the trail to CloudWatch Logs as well if you want metric filters and alarms on specific events.
- **Data events** (S3 object reads/writes, Lambda invokes) are off by default and billed separately: enable them only for sensitive buckets or functions.

## Alarms worth having

| Event | Why |
|---|---|
| Root account login or API call | The root user should never be used day to day |
| `ConsoleLogin` failures in bursts | Password guessing |
| IAM changes: `CreateAccessKey`, `AttachUserPolicy`, `PutRolePolicy`, `UpdateAssumeRolePolicy` | Persistence after a compromise |
| `StopLogging`, `DeleteTrail`, `PutEventSelectors` | Someone hiding their tracks |
| Security group changes opening `0.0.0.0/0` | Exposure |

Amazon GuardDuty analyses CloudTrail, VPC Flow Logs and DNS logs for these patterns and more; turning it on is usually cheaper than building every rule.

## Investigate

```bash
# Last 90 days of management events, no setup needed
aws cloudtrail lookup-events --lookup-attributes AttributeKey=Username,AttributeValue=<user> --max-results 50
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=CreateAccessKey
```

For longer ranges or SQL queries over the trail, query the S3 logs with Athena or use CloudTrail Lake. In a compromised-credential incident, list every event by the access key ID from the first possible exposure, then look for the persistence events above.
