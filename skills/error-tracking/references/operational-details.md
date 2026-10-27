# Error Tracking Operational Details

## User Context & Breadcrumbs
- `setUser(id)` — **no minors' email**. `addMetadata('tenant', {id, plan})`
- Automatic breadcrumbs (navigation, fetch, console) + manual ones in critical flows
- The last 50 events before the error = gold for debugging

## PII Scrubbing

```
redactedKeys: ['password', 'token', 'authorization', 'cookie', /dni/i, /cuit/i, /cpf/i, /credit.?card/i]
```

- Minors: only the internal `user.id`, no real email/name
- Respect consent: if the user declined crash reporting -> `pauseSession()`

## Sampling & Noise
- Errors: **always 100%** (do not sample)
- Filter noise: ResizeObserver, chrome-extension, Non-Error promise rejection
- Burst dedupe: same error <5s -> skip

## Grouping
Default by stack+message. Override with `groupingHash` when it groups badly (network errors with a variable URL, validation with a dynamic message).

## Alerts & Routing

| Event | Destination |
|--------|---------|
| New issue production | Slack #alerts-prod |
| Regression (resolved issue reappeared) | Slack + reopen ticket |
| Spike >10x in 5min | PagerDuty on-call |
| Stability <99.5% mobile | Weekly alert |

Anti-fatigue: do not alert on-call for info, staging goes to Slack only.

## Triage Workflow
**Daily:** inbox new 24h -> classify (bug/noise/regression) -> assign -> Jira if >1h
**Weekly:** top 10 by frequency, top 10 by users affected, stability per release
