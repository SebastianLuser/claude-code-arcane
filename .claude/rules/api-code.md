---
paths:
  - "src/api/**"
  - "src/routes/**"
  - "src/controllers/**"
  - "src/handlers/**"
  - "api/**"
  - "design/api/**"
  - "**/*.openapi.yaml"
  - "**/*.proto"
  - "**/schema.graphql"
---

# API Design Rules

- Contract first: every public endpoint has an OpenAPI / GraphQL SDL / `.proto` definition in `design/api/` before implementation. Code generated from contract when the stack supports it.
- Versioning is explicit: URL-based (`/v1/users`) or header-based (`Accept: application/vnd.app.v1+json`). Pick one per service and never mix.
- Breaking changes require a new version. Never break an existing version — deprecate with sunset header and documented timeline.
- Resource-oriented URLs (REST): `/users/{id}/posts`, not `/getUserPosts`. Verbs are HTTP methods, not path segments.
- HTTP status codes used correctly: 2xx success, 4xx client error, 5xx server error. No `200 {success: false}`. No `500` for bad input.
- Error responses follow a single schema project-wide. Include: `error.code` (stable, machine-readable), `error.message` (human), `error.details` (field-level for validation). Example: RFC 7807 Problem Details.
- Idempotency: every non-GET endpoint that performs a state change either is naturally idempotent (PUT/DELETE by id) or accepts an `Idempotency-Key` header.
- Pagination is cursor-based for unbounded lists. Offset pagination only for small finite sets. Always document `has_more` + next cursor in the response.
- Authentication is explicit: every endpoint documents whether it requires auth and what scope/role. No hidden "just send the cookie" contracts.
- Rate limits are documented. Return `429` with `Retry-After` header. Include `X-RateLimit-*` headers on every response.
- Pagination, filtering, sorting are consistent across endpoints — pick a convention (`?sort=-created_at&filter[status]=active`) and stick to it.
- Validate input at the boundary: schema-validate the request body, typed parse into a DTO, reject early with 400 + field errors.
- No PII in URLs (path or query) — put it in the body. URLs end up in logs, proxies, browser history.

## Versioning Deprecation Policy

- Deprecation: mark in docs + `Deprecation` + `Sunset` headers + emit metric on use
- Minimum deprecation window: 90 days for external APIs, 30 days for internal
- Removal: only after metrics show <0.1% traffic and all known consumers confirmed migrated

## Anti-Patterns

- Tunneling everything through `POST /graphql` or `POST /rpc` when REST fits
- Endpoints that return different shapes based on query params
- Error messages that leak stack traces, SQL, or internal paths to clients
- Undocumented side effects (endpoint that also sends an email without saying so in the contract)
