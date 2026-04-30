# API Versioning — Anti-patterns & Checklist

## Anti-patterns

- Breaking change sin nueva versión
- Mantener v1/v2/v3/v4 vivas (backport hell) — max 2
- Versión en body JSON (rompe routing/caché)
- Sin headers Deprecation/Sunset
- Versionar internals (auth, healthchecks, webhooks salientes)
- Bumpear major por non-breaking (inflación)
- No monitorear uso de v1 -> apagás a ciegas
- Docs única para todas las versiones
- Changelog inexistente

## Checklist (introducir v2)

- [ ] Confirmar que es realmente breaking (sección 3)
- [ ] Se resuelve con campo opcional o endpoint nuevo en v1?
- [ ] `/v2/` paralelo, reusar dominio/service, duplicar handlers+DTOs
- [ ] OpenAPI spec separado para v2
- [ ] Sunset de v1 definido (min 6m, 12m si mobile)
- [ ] Headers Deprecation+Sunset+Link en v1
- [ ] Logging hits a v1 + dashboard uso v1 vs v2
- [ ] Guía de migración publicada antes del anuncio
- [ ] Contract tests de v1 pasan hasta sunset
- [ ] Mobile: subir min en /minimum-version antes del sunset
- [ ] Plan de rollback si v2 explota
