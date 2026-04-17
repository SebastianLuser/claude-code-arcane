---
name: performance-test
description: "Performance y load testing para apps Educabot (Go/TS backends, React/RN frontends): k6 scripts, smoke/load/stress/soak/spike, thresholds por SLO, integración CI, reporte con p95/p99/error rate. Usar para: load test, stress test, benchmark, k6, performance, latencia, throughput."
argument-hint: "[smoke|load|stress|soak|spike]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# performance-test — Load & Performance Testing

Framework para testear performance de APIs y flujos end-to-end en apps Educabot. Basado en **k6** (Grafana Labs) — scripting en JS, ejecución en Go, buena integración con Prometheus/Grafana.

## Cuándo usar

- Pre-launch de feature con tráfico esperado alto
- Antes de scaling decisions (¿aguanta N RPS?)
- Validar SLOs definidos en `observability-setup`
- Regresión de performance post-refactor
- Capacity planning trimestral

## Cuándo NO usar

- Para benchmarks micro (usar `go test -bench` o `vitest bench`)
- Para testear DoS/saturación de terceros
- Si no hay SLO definido — primero definilo, después testealo

---

## 1. Tipos de test

| Tipo | Objetivo | Duración | VUs |
|------|----------|----------|-----|
| **Smoke** | Verificar que no hay error grueso | 1-2min | 1-5 |
| **Load** | Comportamiento con carga esperada | 15-30min | N esperado |
| **Stress** | Encontrar el breaking point | 30-60min | ramp-up hasta romper |
| **Soak** | Degradación/leaks con carga sostenida | 2-8h | N esperado |
| **Spike** | Resiliencia a picos súbitos | 5-15min | 0 → 10x → 0 |

---

## 2. Estructura del proyecto

```
perf/
├── k6/
│   ├── config/
│   │   ├── envs.js          # URLs por env
│   │   └── thresholds.js    # SLO-derived
│   ├── lib/
│   │   ├── auth.js          # login helpers
│   │   └── data.js          # test data gen
│   ├── scenarios/
│   │   ├── smoke.js
│   │   ├── load-api.js
│   │   ├── stress-login.js
│   │   └── soak-dashboard.js
│   └── results/             # gitignored
└── README.md
```

---

## 3. k6 base script

### `k6/lib/auth.js`
```js
import http from 'k6/http';
import { check } from 'k6';

export function login(baseUrl, email, password) {
  const res = http.post(`${baseUrl}/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login' },
  });
  check(res, { 'login 200': (r) => r.status === 200 });
  return res.json('token');
}
```

### `k6/config/thresholds.js`
```js
export const apiThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
};

export const dashboardThresholds = {
  'http_req_duration{endpoint:dashboard}': ['p(95)<800'],
  'http_req_failed{endpoint:dashboard}': ['rate<0.005'],
};
```

### `k6/scenarios/load-api.js`
```js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import { login } from '../lib/auth.js';
import { apiThresholds } from '../config/thresholds.js';

const BASE = __ENV.BASE_URL || 'https://staging.educabot.com';
const USER = __ENV.TEST_USER;
const PASS = __ENV.TEST_PASS;

const loginTrend = new Trend('login_duration', true);

export const options = {
  scenarios: {
    steady_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // ramp-up
        { duration: '20m', target: 50 },  // sustained
        { duration: '2m', target: 0 },    // ramp-down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: apiThresholds,
};

export function setup() {
  const token = login(BASE, USER, PASS);
  return { token };
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  group('dashboard', () => {
    const res = http.get(`${BASE}/api/dashboard`, { headers, tags: { endpoint: 'dashboard' } });
    check(res, {
      '200': (r) => r.status === 200,
      'has data': (r) => r.json('items')?.length > 0,
    });
  });

  group('list courses', () => {
    const res = http.get(`${BASE}/api/courses`, { headers, tags: { endpoint: 'courses' } });
    check(res, { '200': (r) => r.status === 200 });
  });

  sleep(Math.random() * 3 + 1); // 1-4s think time
}

export function handleSummary(data) {
  return {
    'results/summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

---

## 4. Scenarios por tipo

### Smoke — `smoke.js`
```js
export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};
```

### Stress — `stress-login.js`
```js
export const options = {
  executor: 'ramping-arrival-rate',
  scenarios: {
    stress: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { duration: '5m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '5m', target: 400 },
        { duration: '5m', target: 0 },
      ],
    },
  },
};
```

### Spike — `spike.js`
```js
export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '30s', target: 500 },   // spike
    { duration: '3m', target: 500 },
    { duration: '30s', target: 10 },    // recover
    { duration: '2m', target: 10 },
  ],
};
```

### Soak — `soak.js`
```js
export const options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '4h', target: 100 },    // sostener
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

---

## 5. Data generation

### `k6/lib/data.js`
```js
import { SharedArray } from 'k6/data';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const users = new SharedArray('users', () =>
  JSON.parse(open('../data/test-users.json'))
);

export function randomUser() {
  return users[Math.floor(Math.random() * users.length)];
}

export function fakeEmail() {
  return `perf-${randomString(8)}@test.educabot.com`;
}
```

> **Importante:** Test users deben ser dedicados (no reales), en env `staging` o `perf`, con teardown al final.

---

## 6. Ejecución local

```bash
# smoke rápido
k6 run k6/scenarios/smoke.js

# load con env vars
BASE_URL=https://staging.educabot.com \
TEST_USER=perf@test.com \
TEST_PASS=xxx \
k6 run k6/scenarios/load-api.js

# output a Prometheus (via remote write)
k6 run -o experimental-prometheus-rw \
  K6_PROMETHEUS_RW_SERVER_URL=http://prom:9090/api/v1/write \
  k6/scenarios/load-api.js
```

---

## 7. CI integration — `.github/workflows/perf.yml`

```yaml
name: Performance Test
on:
  schedule: [{ cron: '0 3 * * 1' }]   # lunes 03:00 UTC
  workflow_dispatch:
    inputs:
      scenario:
        description: 'smoke | load | stress | soak | spike'
        required: true
        default: 'smoke'

jobs:
  k6:
    runs-on: ubuntu-latest
    timeout-minutes: 120
    steps:
      - uses: actions/checkout@v4

      - uses: grafana/setup-k6-action@v1

      - name: Run k6
        env:
          BASE_URL: ${{ secrets.STAGING_BASE_URL }}
          TEST_USER: ${{ secrets.PERF_TEST_USER }}
          TEST_PASS: ${{ secrets.PERF_TEST_PASS }}
          K6_PROMETHEUS_RW_SERVER_URL: ${{ secrets.PROM_REMOTE_WRITE }}
        run: |
          k6 run -o experimental-prometheus-rw \
            perf/k6/scenarios/${{ github.event.inputs.scenario || 'smoke' }}.js

      - name: Upload summary
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-summary
          path: results/summary.json
```

> **No ejecutar stress/soak en cada PR** — reservar para scheduled runs o manual dispatch. PRs solo corren smoke.

---

## 8. Thresholds desde SLOs

Si tus SLOs (ver `observability-setup`) dicen:
- **Availability** 99.9% → `http_req_failed: rate<0.001`
- **Latency p95** < 500ms → `http_req_duration: p(95)<500`

Entonces en k6:
```js
thresholds: {
  http_req_failed: ['rate<0.001'],
  http_req_duration: ['p(95)<500', 'p(99)<1500'],
}
```

El test **falla** (exit 1) si no se cumplen → gate natural en CI.

---

## 9. Análisis del reporte

Métricas clave que k6 reporta:

| Métrica | Qué significa |
|---------|---------------|
| `http_reqs` | Total requests |
| `http_req_duration` | Latencia total (incluye DNS+TCP+TLS+server) |
| `http_req_waiting` | TTFB — latencia del server |
| `http_req_failed` | Error rate |
| `iterations` | Completaciones de `default()` |
| `vus` | Active virtual users |
| `data_sent/received` | Throughput bytes |

### Diagnóstico rápido

- **p95 alto + error rate bajo** → server lento pero funciona → profiler (pprof/clinic.js)
- **Error rate sube con VUs** → saturación → revisar pool de DB, file descriptors, CPU
- **p99 mucho mayor que p95** → long-tail → GC, cold cache, head-of-line blocking
- **Throughput plateau** → bottleneck identificado (DB/CPU/red)

---

## 10. Integración con Grafana

Dashboard template: importar [ID 19665](https://grafana.com/grafana/dashboards/19665) (k6 Prometheus).

Panels útiles:
- RPS por endpoint
- p50/p95/p99 por endpoint
- Error rate por status code
- VUs activos vs throughput

---

## 11. Antes de correr stress/soak en prod

- [ ] Avisar al team (Slack `#engineering`)
- [ ] Confirmar que es env de staging/perf (NO prod a menos que sea chaos test autorizado)
- [ ] Feature flag para disable paths destructivos
- [ ] Monitorear dashboards en tiempo real
- [ ] Plan de rollback si algo rompe prod-shared (DB compartida, etc.)
- [ ] Teardown de data generada

---

## 12. Anti-patterns

- ❌ Load test contra prod sin aviso
- ❌ Thresholds inventados sin relación a SLO
- ❌ Correr stress en cada PR (CI ruidoso, costoso)
- ❌ Test users compartidos con gente real
- ❌ Ignorar think time (sleep) → tráfico irreal
- ❌ VUs = RPS → confusión conceptual (1 VU puede hacer N req/s)
- ❌ No limpiar data generada → DB basura
- ❌ Correr smoke desde laptop → red del dev falsea p95

---

## Output final

```
✅ Load test completado — load-api.js
   📊 VUs max: 50 | Duration: 24m | Iterations: 38,204
   ⚡ p95: 420ms | p99: 880ms | error rate: 0.3%
   🎯 Thresholds: all passed
   📈 Dashboard: <link Grafana>

Próximos pasos:
  1. Review p99 outliers (hay 3 picos > 2s)
  2. Capacity plan: aguanta 50 VUs sostenido → ~150 RPS
  3. Próximo: stress test para encontrar breaking point
```

## Delegación

**Coordinar con:** `sre-lead`, `backend-architect`, `observability-engineer`
**Reporta a:** `sre-lead`, `cto`

**Skills relacionadas:**
- `/observability-setup` — métricas y SLOs que alimentan thresholds
- `/deploy-check` — smoke perf como gate pre-deploy
- `/incident` — si el test revela regresión bloqueante
- `/k8s-deploy` — HPA config debería derivar de resultados de load test
