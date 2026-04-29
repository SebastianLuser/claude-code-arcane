# Error Tracking Operational Details

## User Context & Breadcrumbs
- `setUser(id)` — **no email de menores**. `addMetadata('tenant', {id, plan})`
- Breadcrumbs auto (navigation, fetch, console) + manuales en flows criticos
- Ultimos 50 eventos antes del error = oro para debugging

## PII Scrubbing

```
redactedKeys: ['password', 'token', 'authorization', 'cookie', /dni/i, /cuit/i, /cpf/i, /credit.?card/i]
```

- Menores: solo `user.id` interno, no email/nombre real
- Respetar consent: si usuario rechazo crash reporting -> `pauseSession()`

## Sampling & Ruido
- Errors: **100% siempre** (no samplear)
- Filtrar ruido: ResizeObserver, chrome-extension, Non-Error promise rejection
- Dedupe burst: mismo error <5s -> skip

## Grouping
Default por stack+message. Override con `groupingHash` cuando agrupa mal (network errors con URL variable, validation con mensaje dinamico).

## Alertas & Routing

| Evento | Destino |
|--------|---------|
| New issue production | Slack #alerts-prod |
| Regression (resolved reaparecio) | Slack + reopen ticket |
| Spike >10x en 5min | PagerDuty on-call |
| Stability <99.5% mobile | Alert weekly |

Anti-fatiga: no alertar info a on-call, staging solo Slack.

## Triage Workflow
**Diario:** inbox new 24h -> clasificar (bug/noise/regression) -> asignar -> Jira si >1h
**Weekly:** top 10 frecuencia, top 10 users afectados, stability por release
