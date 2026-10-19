# Operate: Lambda

## Configuration that matters

| Setting | Rule |
|---|---|
| **Memory** | Also sets CPU. Measure: more memory often lowers both duration and cost (AWS Lambda Power Tuning finds the point) |
| **Timeout** | Just above the p99 duration; for API Gateway, below its integration timeout |
| **Reserved concurrency** | Caps one function so it cannot exhaust the account limit or a downstream database |
| **Provisioned concurrency / SnapStart** | Only for latency-sensitive functions where cold starts hurt; both cost money |
| **Execution role** | One role per function, least privilege |
| **Environment** | Secrets come from Secrets Manager or Parameter Store at runtime (cached), not as plain env vars |

## Deploy safely

Publish a version per deploy and point an **alias** (`live`) at it. Shift traffic gradually with CodeDeploy (canary or linear) and alarms that roll back; or at least keep the previous version to repoint the alias:

```bash
aws lambda update-function-code --function-name api --zip-file fileb://dist.zip --publish
aws lambda update-alias --function-name api --name live --function-version <new>
# Rollback
aws lambda update-alias --function-name api --name live --function-version <previous>
```

## Async and event sources

- Asynchronous invocations retry twice by default: make handlers **idempotent** and configure an on-failure destination or a DLQ, or failed events vanish.
- SQS triggers: set `ReportBatchItemFailures` so one bad message does not make the whole batch retry; the queue's visibility timeout must be at least 6× the function timeout.

## Debug

```bash
aws logs tail /aws/lambda/api --follow --since 15m
aws lambda get-function-configuration --function-name api --query "[MemorySize,Timeout,LastUpdateStatus]"
```

CloudWatch metrics to alert on: `Errors`, `Throttles` (concurrency limit hit), `Duration` p99 near the timeout, and for SQS sources `ApproximateAgeOfOldestMessage`. A `Task timed out` in the logs usually means a downstream call without its own timeout.

Database connections from Lambda: every concurrent instance opens its own; put RDS Proxy in front of RDS/Aurora.
