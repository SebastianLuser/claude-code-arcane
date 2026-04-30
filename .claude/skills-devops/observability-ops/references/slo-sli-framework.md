# SLO / SLI Framework

## SLI Types

| SLI | Measures | Pattern |
|-----|----------|---------|
| **Availability** | Successful requests | `non-5xx / total` |
| **Latency** | Response time | p95 and p99 (never p50 alone) |
| **Quality** | Business transaction success | `success / attempts` |
| **Freshness** | Pipeline recency | `now - last_record < threshold` |

## Service Tier Targets

| Tier | Availability | Latency p95 |
|------|-------------|-------------|
| **1** (login, core API) | 99.95% | < 300ms |
| **2** (reports, dashboards) | 99.5% | < 1s |
| **3** (background jobs) | 99% | N/A |

## Error Budget Policy

| Budget remaining | Action |
|-----------------|--------|
| > 50% | Normal velocity |
| 10-50% | Enforce canary/staged rollouts |
| < 10% | **Feature freeze** — stability only |
| 0% | Freeze + mandatory blameless postmortem |

Must be signed by engineering AND product — otherwise decorative.

## Alerting: Multi-Window Burn-Rate

- **Fast burn (page):** 5min + 1h windows, 14.4x rate — pages on-call
- **Slow burn (ticket):** 30min + 6h windows, 6x rate — non-urgent ticket

## Dashboard Minimum

SLO (30d rolling), error budget remaining, burn rate (1h/6h), top 5 budget-consuming endpoints, incident history.

## Quarterly Review

- Consistently exceeding: raise SLO or allow more experimentation
- Consistently missing: lower temporarily + improvement plan
- Business flows changed: re-evaluate SLIs
