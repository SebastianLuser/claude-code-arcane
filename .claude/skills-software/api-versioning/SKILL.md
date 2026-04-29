---
name: api-versioning
description: "API versioning: breaking/non-breaking changes, deprecation headers, sunset, v2 introduction. Go/Gin, NestJS, Fastify, GraphQL."
category: "api"
argument-hint: "[deprecate v1|introduce v2|audit]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# API Versioning

Guía para versionar APIs en backends Educabot (Go + TS) consumidas por web (React+Vite) y mobile (React Native).

## Estrategias

| Estrategia | Ejemplo | Veredicto |
|---|---|---|
| **URL path** | `/v1/users` | **Default Educabot** — visible, cacheable, fácil |
| Header | `API-Version: 2026-01-15` | Complemento opcional (date-based pinning) |
| Query param | `/users?version=2` | Evitar — ensucia URLs, problemas caché |
| Content negotiation | `Accept: vnd.educabot.v2+json` | Evitar — over-engineering |

Solo MAJOR cambia URL (`/v1` → `/v2`). MINOR/PATCH transparentes.

## Breaking vs Non-breaking

**Non-breaking** (no requiere v2): agregar campo opcional request/response, nuevo endpoint, nuevo enum value (si clientes toleran desconocidos), relajar validaciones, required → opcional.

**Breaking** (requiere v2): remover campo response, cambiar tipo, renombrar campo/endpoint, cambiar status codes, opcional → required, cambiar formato fechas/IDs/paginación, cambiar semántica, endurecer validaciones.

## Deprecation Flow

1. **Anunciar** — changelog, email, ticket de migración
2. **Headers en runtime** — `Deprecation: true` + `Sunset: <date>` + `Link: <migration-docs>` + `Warning: 299`
3. **Monitorear uso** — log hits con user-agent/client_id, dashboard quién usa v1
4. **Recordatorios** — 1 mes y 1 semana antes del sunset
5. **Apagar** — `410 Gone` con body apuntando a docs

## Ventanas de Soporte

| Contexto | Ventana |
|----------|---------|
| Web (React) | 6 meses |
| Mobile (RN) | 12 meses + minimum-version forcing |
| API externa | 12+ meses |
| Backend interno | Semanas (coordinando deploys) |

Max 2 majors vivas en paralelo. Nunca 3+.

> → Read references/implementation-by-framework.md for implementation patterns per framework (Go, NestJS, Fastify, OpenAPI, GraphQL, Mobile)

> → Read references/anti-patterns-and-checklist.md for anti-patterns list and v2 introduction checklist
