# Contract Testing Implementation Details

## Consumer (React/RN + Jest)

Usar `@pact-foundation/pact` PactV3. Definir interacciones: `given()` (precondicion), `uponReceiving()`, `withRequest()`, `willRespondWith()`. Ejecutar test contra mock server.

**Matchers clave:** `like(example)` (mismo tipo), `eachLike(example)` (array con shape), `term({ generate, matcher })` (regex). No hardcodear valores.

RN: mismo `@pact-foundation/pact`, correr en Node tests (Jest), nunca en device/emulator.

## Provider (Go verify)

Usar `pact-go/v2`. `VerifyProvider` con BrokerURL, ProviderVersion (`$GIT_SHA`), PublishVerificationResults true. Implementar `StateHandlers` para cada precondicion del consumer (seed DB, mock repos).

Multiples consumers: provider verifica contra todos los pacts — usar `ConsumerVersionSelectors` con `MainBranch: true` + `DeployedOrReleased: true`.

## Pact Broker

- **Self-hosted:** Docker image `pactfoundation/pact-broker` + Postgres
- **PactFlow:** SaaS enterprise (SSO, analytics)
- Tagging: cada pact con git SHA + branch. Matrix muestra compatibilidad entre versiones.

## CI: can-i-deploy gate

En workflows de deploy (consumer Y provider): `pact-broker can-i-deploy --pacticipant <name> --version $GIT_SHA --to-environment production`. Bloquea si version no tiene pacts verificados contra version en prod.

## Breaking change detection

Consumer cambia expectation -> publica pact nuevo -> webhook dispara verify -> falla -> broker marca incompatibilidad -> `can-i-deploy` bloquea. Funciona en ambos sentidos.
