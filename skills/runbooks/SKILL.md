---
name: runbooks
description: "Create and maintain executable operational runbooks for on-call. Step by step with exact commands to resolve incidents without depending on the author."
category: "operations"
argument-hint: "[create <name> | list | update <name>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Operational Runbooks (Educabot)

Runbook = an executable step-by-step document for on-call. Goal: any on-call engineer resolves the incident without depending on the author. A 3am flight manual, not narrative documentation.

## 10 Mandatory Sections

| # | Section | Content |
|---|---------|-----------|
| 1 | Title + alert name | H1 = the literal Alertmanager alert name |
| 2 | Severity | SEV1 (>50% affected), SEV2 (partial degradation), SEV3 (informational) |
| 3 | Symptoms | What the user sees + what fires the alert + dashboard links |
| 4 | Impact assessment | What is broken, for how many, since when. School hours raise it by +1 |
| 5 | Diagnostic steps | **Exact copy-pasteable commands** with decision criteria |
| 6 | Mitigation | Stop the bleeding: rollback revision / scale up |
| 7 | Resolution | Permanent fix (it can take hours) |
| 8 | Rollback plan | What to do if the fix makes things worse |
| 9 | Escalation path | Who, in what order, with times (15min/30min/45min) |
| 10 | Post-incident | Postmortem template link, Jira action items, update the runbook |

> → Read templates/runbook.md for the fill-in-the-blank runbook skeleton

## Location

- `docs/runbooks/<service>/<alert-name>.md` — named 1:1 with the alert
- Every alert in Alertmanager must have a `runbook_url` annotation
- NEVER only in Notion/Confluence without a link from the alert

## Educabot Default Runbooks

Every service must have at least:
- `high-error-rate-5xx.md`, `database-connection-exhausted.md`, `redis-down.md`
- `cloud-run-deploy-failed.md`, `stripe-webhook-backlog.md`, `disk-space-critical.md`
- `certificate-expiring.md`, `pubsub-consumer-lag.md`, `login-failures-spike.md`

## Frontmatter

```yaml
owner: juan.perez@educabot.com
service: alizia-api
last_reviewed: 2026-04-10
last_used_in_incident: 2026-03-28
```

## References

> → Read references/writing-principles.md for runbook writing principles
> → Read references/anti-patterns.md for common anti-patterns to avoid
> → Read references/lifecycle.md for review cycle and automation progression
> → Read references/checklist.md for the validation checklist
> → Read references/verify-and-test.md for the expected result of each step, the verification section, per-step rollback, how to test a runbook (read-through, staging, drill) and a complete example
