# Contract Testing Anti-Patterns & Checklist

## Anti-patterns

- Hardcodear valores sin matchers — contratos fragiles
- Pact como mock completo del backend — solo shape + happy path
- Provider verify opcional en CI
- Sin can-i-deploy gate
- Broker sin tagging branch/version
- Consumer testea TODOS los endpoints — solo los que realmente usa
- Sin integration tests de flujos criticos (Pact no valida e2e)
- OpenAPI como reemplazo de Pact
- Pact contra APIs terceros
- Provider states con estado compartido entre tests — flaky

## Checklist

- [ ] Consumer y provider nombres acordados
- [ ] Broker corriendo (Docker o PactFlow)
- [ ] Consumer: tests PactV3 con matchers (like, eachLike, term)
- [ ] Consumer CI publica pacts con version+branch
- [ ] Webhook broker -> provider CI verify al cambiar pact
- [ ] Provider: StateHandlers para cada given()
- [ ] Provider CI publica verification results
- [ ] can-i-deploy gate en ambos workflows
- [ ] Branch/version tagging configurado
- [ ] Integration tests cubren flujos que Pact no valida
- [ ] Terceros usan recorded mocks, NO Pact
