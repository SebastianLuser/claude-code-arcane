---
paths:
  - "src/api/**"
  - "src/server/**"
  - "services/**"
  - "internal/**"
  - "cmd/**"
  - "src/handlers/**"
  - "src/controllers/**"
  - "src/services/**"
  - "src/repositories/**"
---

# Backend Code Rules

- Clean architecture: handler → service → repository. No skipping layers, no reverse dependencies.
- Dependency injection over singletons — handlers receive services, services receive repos.
- All external I/O (DB, HTTP, queue) goes through a repository or client interface — never called directly from handlers or business logic.
- Context propagation: every request-scoped call must carry a `context.Context` / `AbortController` / equivalent. Deadlines and cancellation are not optional.
- Errors are typed (custom error classes / sentinel values), not string-matched. Wrap errors with context (`fmt.Errorf("charge user: %w", err)`) — don't swallow them.
- Boundary validation: validate and sanitize all input AT the handler layer. Services trust the handler; don't double-validate.
- Database access: transactions for multi-write ops, explicit read/write separation if using replicas. Never build SQL with string concatenation — use parameterized queries or query builders.
- Logging: structured logs (JSON) with `request_id`, `user_id`, `trace_id`. No `fmt.Println`, no `console.log` in production paths.
- Metrics: emit latency + error-rate + throughput counters on every public endpoint. Use the project's metrics library, not custom globals.
- No business logic in handlers — handlers only parse input, call a service, shape response. Services own the domain rules.
- Configuration via env vars only — no hardcoded URLs, no hardcoded credentials, no hardcoded timeouts. Fail fast at boot if required env is missing.
- Graceful shutdown: handle SIGTERM, drain in-flight requests, close DB pools before exit.

## Anti-Patterns

- Global state / package-level mutable variables
- ORM magic in hot paths — use raw SQL when performance matters and profile says so
- Nested business logic in DB queries (computed columns that reimplement rules)
- Silent retries with no backoff, no max attempts, no circuit breaker
- Returning raw DB rows as HTTP responses — always go through a DTO / view model
