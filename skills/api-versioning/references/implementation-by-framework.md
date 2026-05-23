# API Versioning — Implementation by Framework

## Patrón clave

Dominio sin versión, controllers/DTOs por versión. Handler convierte DTO <-> entidad de dominio. La versión nunca filtra al dominio.

## Go (Gin)

Route groups `/v1`, `/v2` + middleware `DeprecationHeaders()`.

Carpetas: `handlers/v1/`, `handlers/v2/`, `dto/v1/`, `dto/v2/`, `domain/` y `service/` shared.

## NestJS

`enableVersioning({ type: VersioningType.URI })`. Controllers separados `@Controller({ version: '1' })` / `@Controller({ version: '2' })`.

## Fastify

Plugins por versión registrados con `prefix: '/v1'`, `prefix: '/v2'`.

## OpenAPI

Spec separado por major (`openapi-v1.yaml`). Schemas versionados. `deprecated: true` en endpoints.

## GraphQL — NO se versiona

Evoluciona aditivamente: campos nuevos ignorados por clientes viejos. `@deprecated(reason: "Use X. Removed YYYY-MM-DD")`. Monitorear uso de campos deprecados con tracing.

## Mobile (React Native)

Endpoint `/minimum-version` -> `{ "ios": { "min": "2.3.0", "recommended": "2.5.0" } }`. App al iniciar: < min -> bloqueo "actualizá"; < recommended -> banner soft.
