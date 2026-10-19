# Blue-green on managed platforms

Blue-green keeps the old version (blue) running while the new one (green) is deployed and checked without traffic. The switch is a traffic change, and so is the rollback: no rebuild, no redeploy, seconds instead of minutes.

| | Blue-green | Canary | Rolling |
|---|---|---|---|
| Rollback | Instant: move traffic back | Instant while traffic is partial | Redeploy the old version |
| Cost | Two full versions for a while | Small extra | None |
| Fits | Big changes, a fixed cutover time, checking green with real config before users see it | Gradual exposure measured by metrics | Small, low-risk changes |

## Cloud Run

```bash
# Deploy green without traffic, reachable at its own tagged URL
gcloud run deploy api --image "$IMAGE:$GIT_SHA" --no-traffic --tag green

# Smoke-test https://green---api-<hash>.run.app, then switch
gcloud run services update-traffic api --to-tags green=100

# Rollback: send traffic back to the previous revision
gcloud run services update-traffic api --to-revisions api-<previous-revision>=100
```

For canary instead, use partial values (`--to-tags green=10`) and the progression in `canary-auto-rollback.md`.

## Vercel

Every deployment is immutable and keeps its URL, so production is a pointer:

- Disable auto-assignment of production domains when you need a controlled cutover, deploy, check the deployment URL, then `vercel promote <deployment-url>`.
- Rollback: `vercel rollback` (or Instant Rollback in the dashboard) points production back at the previous deployment.
- Environment variables are bound per deployment: a rollback also brings back the old values, which can break if a secret was rotated in between.

## AWS ECS

ECS supports blue-green either with its built-in deployment strategy or through CodeDeploy, both with two target groups behind the load balancer, a test listener for green, and automatic rollback on CloudWatch alarms. Check which one the service already uses (`aws ecs describe-services` → `deploymentController`) before changing it.

## Rules

- **The database is shared** between blue and green: only backward-compatible migrations (expand/contract in the main skill). Green can never require a schema blue cannot read.
- **Check green before the switch** with the production config: health endpoint, a smoke test of the critical path, logs free of errors.
- **Keep blue alive** for the rollback window (at least one business peak), then retire it.
- Background workers and cron jobs must not run in both colors at once, or jobs run twice: switch them explicitly.
- Sessions and caches: sticky sessions or cache keys tied to a version break on the switch; prefer stateless or shared stores.
