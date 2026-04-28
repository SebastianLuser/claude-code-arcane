---
name: api-versioning
description: "Estrategias de versionado de APIs (REST/GraphQL) para backends Educabot. Define cuándo crear v2, cómo deprecar v1, breaking vs non-breaking changes, deprecation headers, ventanas de soporte y patrones por stack (Go/Gin, NestJS, Fastify, GraphQL). Usar cuando se mencione: versionar API, v2, breaking change, deprecar endpoint, sunset, backwards compatibility, API version, mobile force update."
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

## Implementación

**Patrón clave: dominio sin versión, controllers/DTOs por versión.** Handler convierte DTO ↔ entidad de dominio. La versión nunca filtra al dominio.

**Go (Gin):** route groups `/v1`, `/v2` + middleware `DeprecationHeaders()`. Carpetas: `handlers/v1/`, `handlers/v2/`, `dto/v1/`, `dto/v2/`, `domain/` y `service/` shared.

**NestJS:** `enableVersioning({ type: VersioningType.URI })`. Controllers separados `@Controller({ version: '1' })` / `@Controller({ version: '2' })`.

**Fastify:** plugins por versión registrados con `prefix: '/v1'`, `prefix: '/v2'`.

**OpenAPI:** spec separado por major (`openapi-v1.yaml`). Schemas versionados. `deprecated: true` en endpoints.

## GraphQL — NO se versiona

Evoluciona aditivamente: campos nuevos ignorados por clientes viejos. `@deprecated(reason: "Use X. Removed YYYY-MM-DD")`. Monitorear uso de campos deprecados con tracing.

## Mobile (React Native)

Endpoint `/minimum-version` → `{ "ios": { "min": "2.3.0", "recommended": "2.5.0" } }`. App al iniciar: < min → bloqueo "actualizá"; < recommended → banner soft.

## Anti-patterns

- Breaking change sin nueva versión
- Mantener v1/v2/v3/v4 vivas (backport hell) — max 2
- Versión en body JSON (rompe routing/caché)
- Sin headers Deprecation/Sunset
- Versionar internals (auth, healthchecks, webhooks salientes)
- Bumpear major por non-breaking (inflación)
- No monitorear uso de v1 → apagás a ciegas
- Docs única para todas las versiones
- Changelog inexistente

## Checklist (introducir v2)

- [ ] Confirmar que es realmente breaking (sección 3)
- [ ] ¿Se resuelve con campo opcional o endpoint nuevo en v1?
- [ ] `/v2/` paralelo, reusar dominio/service, duplicar handlers+DTOs
- [ ] OpenAPI spec separado para v2
- [ ] Sunset de v1 definido (min 6m, 12m si mobile)
- [ ] Headers Deprecation+Sunset+Link en v1
- [ ] Logging hits a v1 + dashboard uso v1 vs v2
- [ ] Guía de migración publicada antes del anuncio
- [ ] Contract tests de v1 pasan hasta sunset
- [ ] Mobile: subir min en /minimum-version antes del sunset
- [ ] Plan de rollback si v2 explota
