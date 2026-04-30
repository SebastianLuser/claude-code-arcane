# Anti-Patterns

- 100% sampling in prod — explosive cost
- Missing propagation — orphaned spans / broken traces
- PII in attributes — compliance violation
- No log-to-trace correlation — cannot jump from log to trace
- Forgetting `span.End()` — memory leak
- No OTel Collector — cannot tail-sample or filter PII
- SLO of 100% — impossible, blocks all deploys
- Infra-centric SLIs (CPU/RAM) — causes, not user experience
- SLO without budget policy — nobody acts on it
- Only p50 latency — ignores painful tail
- Single fixed-threshold alert — guaranteed fatigue
- Same SLO for all services — batch jobs != core API
