# Anti-patterns — Async Ops

- No idempotency (double-charge/send)
- Sync webhook processing before 200 (timeout cascades)
- No signature verification (forgery)
- Signing body without timestamp (replay)
- Unbounded retries without DLQ (flood on recovery)
- Retries without jitter (thundering herd)
- No outbox (events lost between commit and enqueue)
- Single queue for all types (starvation)
- Cron on all pods without lock (N executions)
- No graceful shutdown (lost jobs)
- Secrets/PII in payloads
- Missing correlation IDs
- `removeOnComplete: true` on important jobs
- Giant payloads in Redis
