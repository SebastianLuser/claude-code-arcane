# Verifying each step and testing the runbook

## Expected result per step

Every step that changes something states how to see that it worked, so the on-call person knows whether to go on or stop:

```markdown
### 3. Shift traffic to the previous revision
gcloud run services update-traffic api --to-revisions api-00042-abc=100 --region us-east1

**Expected:** the command prints `100% api-00042-abc`.
**Check:** the 5xx rate on <dashboard link> drops below 1% within 5 minutes.
**If not:** go to Escalation; do not repeat the step.
```

A step without an expected result is a step the reader cannot judge at 3 a.m.

## Verification section

After Mitigation and after Resolution, one block that proves the incident is over, using the same signals that fired the alert:

- The alert has resolved, not just been silenced.
- The SLI is back within the SLO for at least one alert window (for example 15 minutes).
- A user-level check passes: the smoke test, a real login, a test checkout.
- No new errors appeared somewhere else (dependencies, queues, the cost dashboard).

## Rollback per step

The runbook's rollback plan covers the fix. Steps that change state (failover, a config change, scaling down) also say how to undo **that step**, right under it. Steps that only read do not need one.

## Testing the runbook

A runbook nobody has run is a guess. Test it before it is needed:

| Test | How | When |
|---|---|---|
| **Read-through** | Someone who did not write it follows it on paper and marks every unclear step | Before merging it |
| **Staging run** | Run every command against staging; fix commands that fail, flags that changed, links that broke | Before merging, and after infra changes |
| **Drill** | Simulate the alert (fault injection, a test alert) and have the on-call person resolve it with the runbook only; time it | Quarterly, rotating through the default runbooks |

Record in the frontmatter: `last_tested`, how (`staging` or `drill`), and the time it took. A drill that needed knowledge outside the runbook produces a change to the runbook.

## Example (short)

```markdown
# HighErrorRate5xx — alizia-api
Severity: SEV2 (SEV1 during school hours)

## Symptoms
5xx above 5% for 5 minutes; users see "Algo salió mal" on save. Dashboard: <link>

## Diagnostic
1. Was there a deploy in the last hour?
   gcloud run revisions list --service alizia-api --region us-east1 --limit 3
   **Decision:** a revision younger than the alert → Mitigation A. Otherwise → step 2.
2. Is the database healthy? Connections on <dashboard link>.
   **Decision:** above 90% of the pool → `database-connection-exhausted.md`.

## Mitigation A — roll back the deploy
gcloud run services update-traffic alizia-api --to-revisions <previous>=100 --region us-east1
**Expected:** 100% on the previous revision. **Check:** 5xx below 1% within 5 min.
**Undo:** --to-revisions <current>=100

## Verification
Alert resolved; 5xx below 1% for 15 min; smoke test `npm run smoke -- --env prod` passes.

## Escalation
15 min without improvement → backend lead (<channel>); 30 min → engineering manager.
```
