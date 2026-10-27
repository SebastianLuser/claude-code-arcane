# Runbook Lifecycle

## Review
- Mandatory review after every incident that used the runbook
- Quarterly audit: stale (>6 months without a commit), broken URLs, commands that do not run
- Quarterly drills: simulate the scenario, measure whether it helps

## Progressive Automation

```
manual runbook -> script in the repo -> cronjob -> auto-remediation (alert -> webhook -> action)
```

Even once automated, the runbook describes the "why" for when the script fails.
