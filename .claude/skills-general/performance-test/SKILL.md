---
name: performance-test
description: "Performance y load testing para apps Educabot (Go/TS/React/RN): k6 scripts, smoke/load/stress/soak/spike, thresholds por SLO, CI integration, reporte."
category: "testing"
argument-hint: "[smoke|load|stress|soak|spike]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# performance-test — Load & Performance Testing

Framework basado en **k6** (Grafana Labs) — scripting JS, ejecución Go, integración Prometheus/Grafana.

## Test Types

| Tipo | Objetivo | Duración | VUs |
|------|----------|----------|-----|
| **Smoke** | Verificar sin error grueso | 1-2min | 1-5 |
| **Load** | Carga esperada sostenida | 15-30min | N esperado |
| **Stress** | Encontrar breaking point | 30-60min | Ramp hasta romper |
| **Soak** | Degradación/leaks sostenido | 2-8h | N esperado |
| **Spike** | Resiliencia picos súbitos | 5-15min | 0→10x→0 |

## Project Structure

```
perf/k6/
  config/envs.js, thresholds.js
  lib/auth.js, data.js
  scenarios/smoke.js, load-api.js, stress-login.js, soak-dashboard.js
  results/  (gitignored)
```

## Thresholds from SLOs

SLO availability 99.9% → `http_req_failed: rate<0.001`. SLO p95 <500ms → `http_req_duration: p(95)<500`. Test falla (exit 1) si no se cumple → gate en CI.

## Execution

```bash
k6 run k6/scenarios/smoke.js
BASE_URL=https://staging.educabot.com k6 run k6/scenarios/load-api.js
k6 run -o experimental-prometheus-rw k6/scenarios/load-api.js
```

## CI Integration

- Scheduled weekly (lunes 3am) con `workflow_dispatch` manual
- **Solo smoke en PRs** — stress/soak en scheduled/manual
- Upload `results/summary.json` como artifact

## Key Metrics

| Métrica | Qué significa |
|---------|---------------|
| `http_req_duration` | Latencia total (DNS+TCP+TLS+server) |
| `http_req_waiting` | TTFB — latencia server |
| `http_req_failed` | Error rate |
| `iterations` | Completaciones del flow |

## Quick Diagnosis

| Señal | Probable causa |
|-------|---------------|
| p95 alto + error rate bajo | Server lento → profiler (pprof/clinic.js) |
| Error rate sube con VUs | Saturación → pool DB, file descriptors, CPU |
| p99 >> p95 | Long-tail → GC, cold cache, head-of-line blocking |
| Throughput plateau | Bottleneck identificado (DB/CPU/red) |

## Checklist

- [ ] Avisar al team (Slack)
- [ ] Confirmar env staging/perf (NO prod sin autorización)
- [ ] Feature flags para disable paths destructivos
- [ ] Monitorear dashboards en tiempo real
- [ ] Plan rollback si rompe shared resources
- [ ] Teardown data generada post-test

## Anti-patterns

- Load test contra prod sin aviso, thresholds sin relación a SLO
- Stress en cada PR (ruidoso, costoso), test users compartidos con reales
- Sin think time (tráfico irreal), confundir VUs = RPS
- No limpiar data generada, correr desde laptop (red falsea p95)

## Grafana Dashboard

Import template ID 19665 (k6 Prometheus): RPS por endpoint, p50/p95/p99, error rate por status, VUs vs throughput.
