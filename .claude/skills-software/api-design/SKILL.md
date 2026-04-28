---
name: api-design
description: "API design decisions: REST conventions, OpenAPI, versioning, pagination, error format, GraphQL criteria, webhooks."
argument-hint: "[rest|graphql|versioning|docs] [resource-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# api-design — REST, GraphQL, Versioning & Docs

## API Style Decision

| Style | Use when |
|-------|----------|
| **REST** | Default. CRUD-dominant, cacheable, broad client support |
| **GraphQL** | Multiple clients with very different shapes, deep nested relations, significant over-fetch |
| **gRPC** | Internal service-to-service, streaming, strict contracts, performance-critical |

## REST Conventions

- **URLs:** plural nouns, kebab-case, nesting max 2 levels, no verbs. Pattern: `/api/v1/resources/{id}/sub-resources`
- **Verbs:** GET (read), POST (create, use Idempotency-Key if critical), PUT (full replace), PATCH (partial), DELETE
- **Pagination:** cursor keyset over offset (offset drifts with concurrent writes, re-scans rows)
- **Response wrapper:** `{ "data": [...], "pagination": { "cursor": "...", "hasMore": true } }`
- **Filtering/sorting:** `?filter[status]=active&sort=-createdAt&fields=id,name`
- **Dates:** ISO 8601 UTC. **IDs:** opaque (never auto-increment — reveals volume)
- **Rate limiting headers:** X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After

## Error Format — RFC 9457 Problem Details

Fields: `type` (URI), `title`, `status`, `detail`, `traceId` (log correlation).
Never invent a custom format. Never expose stack traces in production.

## Schema-first Approach

1. **Recommended:** OpenAPI spec first, generate types + client code
2. **Alternative (Fastify):** Code-first with Zod, auto-generate OpenAPI via @fastify/swagger
3. **Monorepo:** Share schemas in `packages/api-types` between backend and frontend
4. **Tooling:** Lint (Spectral), mock (Prism), docs (Redocly/Scalar)

## Versioning

- **Default:** URL path (`/v1/`) — simple, cacheable, grep-friendly
- **Non-breaking** (no bump): add optional field, new endpoint, new enum value, relax validation
- **Breaking** (requires bump): remove/rename field, change type, change status codes, tighten validation, change date/ID/pagination format

### Deprecation Flow
1. Announce via changelog + docs
2. Response headers: `Deprecation: true`, `Sunset: <date>`, `Link: <migration-guide>`
3. Monitor usage by client_id. Reminders at 1 month and 1 week before sunset
4. Return `410 Gone` after sunset

**Support windows:** Web 6 months min, Mobile 12 months + min-version forcing, max 2 major versions alive.

## Webhooks Outbound
- HMAC signature: `X-Signature: sha256=<hmac(payload, secret)>`
- Timestamp anti-replay: reject if delta > 5 min
- Retry exponential backoff: 1m, 5m, 30m, 2h, 12h
- Minimal payload + URL for detail fetch; dashboard for failed deliveries

## Anti-patterns
- Verbs in URLs, status 200 with error body
- Custom error format instead of RFC 9457
- OFFSET pagination on large tables
- Breaking change without version bump
- Stack traces in production responses
- 3+ major versions alive, no Deprecation/Sunset headers
- GraphQL without depth/complexity limits
- Webhooks without HMAC signature
- Hand-maintained OpenAPI that drifts from code

## Checklist
- [ ] URLs plural, no verbs, nesting max 2
- [ ] Correct status codes, RFC 9457 errors with traceId
- [ ] Cursor pagination with `{ data, pagination }` wrapper
- [ ] OpenAPI spec up-to-date and linted, generated types in client
- [ ] Breaking changes trigger version bump
- [ ] Deprecation headers + usage monitoring on old endpoints
- [ ] Rate limit headers, auth documented per endpoint
- [ ] Webhooks signed with HMAC
