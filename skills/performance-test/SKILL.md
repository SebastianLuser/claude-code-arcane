---
name: performance-test
description: "Performance and load testing for Educabot apps (Go/TS/React/RN): k6 scripts, smoke/load/stress/soak/spike, SLO-based thresholds, CI integration, report."
category: "testing"
argument-hint: "[smoke|load|stress|soak|spike]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# performance-test — Load & Performance Testing

Framework based on **k6** (Grafana Labs) — JS scripting, Go execution, Prometheus/Grafana integration.

## Test Types

| Type | Goal | Duration | VUs |
|------|----------|----------|-----|
| **Smoke** | Verify there are no gross errors | 1-2min | 1-5 |
| **Load** | Sustained expected load | 15-30min | Expected N |
| **Stress** | Find the breaking point | 30-60min | Ramp until it breaks |
| **Soak** | Sustained degradation/leaks | 2-8h | Expected N |
| **Spike** | Resilience to sudden peaks | 5-15min | 0→10x→0 |

## Project Structure

```
perf/k6/
  config/envs.js, thresholds.js
  lib/auth.js, data.js
  scenarios/smoke.js, load-api.js, stress-login.js, soak-dashboard.js
  results/  (gitignored)
```

## Thresholds from SLOs

SLO availability 99.9% → `http_req_failed: rate<0.001`. SLO p95 <500ms → `http_req_duration: p(95)<500`. The test fails (exit 1) if it is not met → CI gate.

## Execution

```bash
k6 run k6/scenarios/smoke.js
BASE_URL=https://staging.educabot.com k6 run k6/scenarios/load-api.js
k6 run -o experimental-prometheus-rw k6/scenarios/load-api.js
```

## CI Integration

- Scheduled weekly (Monday 3am) with manual `workflow_dispatch`
- **Smoke only on PRs** — stress/soak on scheduled/manual
- Upload `results/summary.json` as an artifact

## Key Metrics

| Metric | What it means |
|---------|---------------|
| `http_req_duration` | Total latency (DNS+TCP+TLS+server) |
| `http_req_waiting` | TTFB — server latency |
| `http_req_failed` | Error rate |
| `iterations` | Flow completions |

## Quick Diagnosis

| Signal | Likely cause |
|-------|---------------|
| High p95 + low error rate | Slow server → profiler (pprof/clinic.js) |
| Error rate rises with VUs | Saturation → DB pool, file descriptors, CPU |
| p99 >> p95 | Long tail → GC, cold cache, head-of-line blocking |
| Throughput plateau | Bottleneck identified (DB/CPU/network) |

## Checklist

- [ ] Notify the team (Slack)
- [ ] Confirm staging/perf env (NO prod without authorization)
- [ ] Feature flags to disable destructive paths
- [ ] Monitor dashboards in real time
- [ ] Rollback plan if it breaks shared resources
- [ ] Tear down generated data after the test

## Anti-patterns

- Load testing prod without notice, thresholds unrelated to the SLO
- Stress on every PR (noisy, expensive), test users shared with real ones
- No think time (unrealistic traffic), confusing VUs = RPS
- Not cleaning up generated data, running from a laptop (the network skews p95)

## Grafana Dashboard

Import template ID 19665 (k6 Prometheus): RPS per endpoint, p50/p95/p99, error rate per status, VUs vs throughput.
