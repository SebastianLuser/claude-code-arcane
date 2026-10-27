# API Versioning — Implementation by Framework

## Key pattern

Unversioned domain, controllers/DTOs per version. The handler converts DTO <-> domain entity. The version never leaks into the domain.

## Go (Gin)

Route groups `/v1`, `/v2` + `DeprecationHeaders()` middleware.

Folders: `handlers/v1/`, `handlers/v2/`, `dto/v1/`, `dto/v2/`, shared `domain/` and `service/`.

## NestJS

`enableVersioning({ type: VersioningType.URI })`. Separate controllers `@Controller({ version: '1' })` / `@Controller({ version: '2' })`.

## Fastify

Per-version plugins registered with `prefix: '/v1'`, `prefix: '/v2'`.

## OpenAPI

Separate spec per major (`openapi-v1.yaml`). Versioned schemas. `deprecated: true` on endpoints.

## GraphQL — NOT versioned

Evolves additively: old clients ignore new fields. `@deprecated(reason: "Use X. Removed YYYY-MM-DD")`. Monitor usage of deprecated fields with tracing.

## Mobile (React Native)

Endpoint `/minimum-version` -> `{ "ios": { "min": "2.3.0", "recommended": "2.5.0" } }`. App on startup: < min -> "please update" block; < recommended -> soft banner.
