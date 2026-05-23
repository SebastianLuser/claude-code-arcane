# Review Checklist — Async Ops

- [ ] Inbound: signature verified, anti-replay, idempotent, async processing
- [ ] Outbound: outbox pattern, HMAC signature, retry schedule, DLQ
- [ ] Subscriber URLs validated for SSRF
- [ ] Queues separated by criticality; jobs idempotent with timeout
- [ ] Retry + backoff + jitter; rate limiter on workers calling external APIs
- [ ] Graceful shutdown; DLQ with alerts and replay
- [ ] Metrics exported; correlation ID propagated through all chains
- [ ] No secrets/PII in payloads; Bull Board behind auth
