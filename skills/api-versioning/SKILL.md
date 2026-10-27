---
name: api-versioning
description: "API versioning: breaking/non-breaking changes, deprecation headers, sunset, v2 introduction. Go/Gin, NestJS, Fastify, GraphQL."
category: "api"
argument-hint: "[deprecate v1|introduce v2|audit]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# API Versioning

Guide to versioning APIs in Educabot backends (Go + TS) consumed by web (React+Vite) and mobile (React Native).

## Strategies

| Strategy | Example | Verdict |
|---|---|---|
| **URL path** | `/v1/users` | **Educabot default** — visible, cacheable, easy |
| Header | `API-Version: 2026-01-15` | Optional complement (date-based pinning) |
| Query param | `/users?version=2` | Avoid — clutters URLs, caching problems |
| Content negotiation | `Accept: vnd.educabot.v2+json` | Avoid — over-engineering |

Only MAJOR changes the URL (`/v1` → `/v2`). MINOR/PATCH are transparent.

## Breaking vs Non-breaking

**Non-breaking** (no v2 needed): add an optional request/response field, new endpoint, new enum value (if clients tolerate unknown values), relax validations, required → optional.

**Breaking** (v2 needed): remove a response field, change a type, rename a field/endpoint, change status codes, optional → required, change date/ID/pagination format, change semantics, tighten validations.

## Deprecation Flow

1. **Announce** — changelog, email, migration ticket
2. **Runtime headers** — `Deprecation: true` + `Sunset: <date>` + `Link: <migration-docs>` + `Warning: 299`
3. **Monitor usage** — log hits with user-agent/client_id, dashboard of who uses v1
4. **Reminders** — 1 month and 1 week before the sunset
5. **Shut down** — `410 Gone` with a body pointing to the docs

## Support Windows

| Context | Window |
|----------|---------|
| Web (React) | 6 months |
| Mobile (RN) | 12 months + minimum-version forcing |
| External API | 12+ months |
| Internal backend | Weeks (coordinating deploys) |

Max 2 majors live in parallel. Never 3+.

> → Read references/implementation-by-framework.md for implementation patterns per framework (Go, NestJS, Fastify, OpenAPI, GraphQL, Mobile)

> → Read references/anti-patterns-and-checklist.md for anti-patterns list and v2 introduction checklist
