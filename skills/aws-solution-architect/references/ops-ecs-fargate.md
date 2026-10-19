# Operate: ECS on Fargate

## Pieces

| Piece | Holds |
|---|---|
| **Task definition** | Image (by tag or digest), CPU/memory, env, secrets (`valueFrom` a Secrets Manager or SSM ARN), log config, health check |
| **Task execution role** | What ECS needs to start the task: pull from ECR, read the secrets, write logs |
| **Task role** | What your code may call (S3, SQS…). Never put app permissions on the execution role |
| **Service** | Desired count, network (private subnets, security group), load balancer target group, deployment settings, auto scaling |

## Deploy

```bash
# New revision from the JSON, then roll the service to it
aws ecs register-task-definition --cli-input-json file://taskdef.json
aws ecs update-service --cluster prod --service api --task-definition api:<revision>
aws ecs wait services-stable --cluster prod --services api
```

- Enable the **deployment circuit breaker with rollback**, so a revision whose tasks never get healthy rolls back on its own.
- `minimumHealthyPercent: 100` and `maximumPercent: 200` keep full capacity during a rolling deploy.
- The ALB health check path and the container health check must both pass; a slow-starting app needs a `healthCheckGracePeriodSeconds`.
- Blue-green on ECS: see `/rollback-strategy` → blue-green.

## Debug a task that will not stay up

```bash
aws ecs describe-services --cluster prod --services api --query "services[0].events[:10]"
aws ecs list-tasks --cluster prod --service-name api --desired-status STOPPED
aws ecs describe-tasks --cluster prod --tasks <task-arn> --query "tasks[0].[stoppedReason,containers[].reason,containers[].exitCode]"
```

| `stoppedReason` / symptom | Usual cause |
|---|---|
| `CannotPullContainerError` | No route to ECR (private subnet without NAT or VPC endpoints) or the execution role lacks ECR permissions |
| `ResourceInitializationError` with secrets | Execution role cannot read the secret or its KMS key |
| `Essential container exited` | The app crashed: read its logs (`aws logs tail /ecs/api --follow`) |
| Exit code 137 | Out of memory: raise the task memory or fix the leak |
| Tasks start, then the ALB drains them | Health check path, port or grace period wrong |

`aws ecs execute-command` gives a shell in a running task when ECS Exec is enabled on the service; enable it only where needed.

## Scaling

Target tracking on CPU or memory works for most APIs; for queue workers, scale on the SQS backlog per task. Set a sensible minimum (at least 2 tasks across 2 AZs for anything user-facing).
