---
name: api-design
description: "API design: REST conventions, OpenAPI, versioning, pagination, error format, GraphQL, webhooks."
category: "api"
argument-hint: "[rest|graphql|versioning|docs] [resource-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# api-design — REST, GraphQL, Versioning & Docs

## MANDATORY WORKFLOW

**Antes de recomendar o generar cualquier diseño, completar estos pasos en orden.**

### Step 0: Gather Requirements

Clarificar (o inferir del contexto si ya fue especificado):

1. **¿API nueva o extensión?** (si es extensión, leer la existente primero)
2. **Tipos de clientes:** SPA / mobile / third-party / server-to-server
3. **¿Over-fetch o deeply nested relations?** → influye en REST vs GraphQL
4. **Auth:** JWT / API Key / OAuth / ninguna
5. **¿Versioning desde día 1?** ¿Hay clientes externos que no podemos romper?

Si el usuario ya especificó estos valores, saltar directamente al Step 1.

### Step 1: Recomendar approach

Usar la tabla API Style Decision más abajo para elegir REST / GraphQL / gRPC.
Explicar la elección en 1 oración.

### Step 2: Diseñar + Verificar

Implementar el diseño. Al terminar, validar contra el Checklist al final de este documento.

---

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
- **Non-breaking** (no bump): add optional field, new endpoint, new enum value
- **Breaking** (requires bump): remove/rename field, change type, change status codes

> → Read references/versioning-deprecation.md for deprecation flow, support windows, and webhook outbound details

## Anti-patterns

> → Read references/anti-patterns.md for 10 common API design anti-patterns with corrections

## Checklist
- [ ] URLs plural, no verbs, nesting max 2
- [ ] Correct status codes, RFC 9457 errors with traceId
- [ ] Cursor pagination with `{ data, pagination }` wrapper
- [ ] OpenAPI spec up-to-date and linted, generated types in client
- [ ] Breaking changes trigger version bump
- [ ] Deprecation headers + usage monitoring on old endpoints
- [ ] Rate limit headers, auth documented per endpoint
- [ ] Webhooks signed with HMAC
