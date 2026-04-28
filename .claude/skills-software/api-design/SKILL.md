---
name: api-design
description: "API design decisions: REST conventions, OpenAPI, versioning, pagination, error format, GraphQL criteria, webhooks. DO NOT TRIGGER when: consumir APIs externas (no diseñarlas), documentar API existente sin cambios, troubleshooting de un endpoint puntual."
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

| # | ❌ No hacer | ✅ Hacer en cambio |
|---|------------|-------------------|
| 1 | Verbos en URLs (`/getUser`, `/createOrder`) | Sustantivos plurales: `GET /users`, `POST /orders` |
| 2 | Status 200 con cuerpo de error | Código HTTP correcto (400/401/404/500) + RFC 9457 body |
| 3 | Formato de error custom inventado | RFC 9457 Problem Details con `type`, `title`, `status`, `traceId` |
| 4 | OFFSET pagination en tablas grandes | Cursor keyset con `{ data, pagination: { cursor, hasMore } }` |
| 5 | Breaking change sin version bump | Bump a `/v2/`; mantener `/v1/` con Deprecation + Sunset headers |
| 6 | 3+ versiones vivas en paralelo | Máx 2 versiones; sunset activo sobre la más vieja |
| 7 | Stack traces en responses de producción | Log interno con traceId; response solo incluye `traceId` |
| 8 | GraphQL sin límites de profundidad/complejidad | depth limit + query complexity scoring obligatorio |
| 9 | Webhooks sin firma HMAC | `X-Signature: sha256=<hmac>` + reject si delta timestamp >5min |
| 10 | OpenAPI mantenido a mano (drift con código) | Code-first (Zod+swagger) o spec-first con Spectral lint en CI |

## Checklist
- [ ] URLs plural, no verbs, nesting max 2
- [ ] Correct status codes, RFC 9457 errors with traceId
- [ ] Cursor pagination with `{ data, pagination }` wrapper
- [ ] OpenAPI spec up-to-date and linted, generated types in client
- [ ] Breaking changes trigger version bump
- [ ] Deprecation headers + usage monitoring on old endpoints
- [ ] Rate limit headers, auth documented per endpoint
- [ ] Webhooks signed with HMAC
