---
name: contract-testing
description: "Contract testing con Pact para validar acuerdos de API entre consumers (React, React Native) y providers (Go, TS). Genera contratos, publica a broker, corre verify, integra can-i-deploy en CI. Alternativa liviana a E2E tests caros. Usar cuando se mencione: contract testing, Pact, consumer-driven, breaking change API, Pact Broker, PactFlow, can-i-deploy."
argument-hint: "[consumer|provider|setup]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Contract Testing (Pact)

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| Microservicios con consumer y provider evolucionando separado | APIs terceros (Stripe, Google) — usar recorded mocks |
| Detectar breaking changes API antes de deploy | Validar lógica e2e — Pact valida shape, no business logic |
| Reemplazar parcialmente E2E tests costosos/flakey | Contratos asíncronos triviales sin evolución |
| Integraciones internas: `alizia-web ↔ alizia-api`, mobile ↔ api | Un equipo controla ambos lados sin CI separado |

## Concepto

Consumer-driven contract testing: consumer describe lo que espera → provider lo verifica. Cada lado testea contra el contrato, no contra el otro servicio real. Complementario a OpenAPI (docs) — Pact valida expectativas ejecutables.

## Flujo

1. Consumer escribe tests usando mock Pact server → genera `pacts/<consumer>-<provider>.json`
2. Publicar a **Pact Broker** (Docker self-host gratis, o PactFlow SaaS) con `--consumer-app-version=$GIT_SHA --branch=$GIT_BRANCH`
3. Webhook broker → dispara provider verify en CI
4. Provider corre verification con StateHandlers para cada `given()` del consumer
5. Resultado publicado al broker
6. `can-i-deploy` gate bloquea deploys incompatibles

## Consumer (React/RN + Jest)

Usar `@pact-foundation/pact` PactV3. Definir interacciones: `given()` (precondición), `uponReceiving()`, `withRequest()`, `willRespondWith()`. Ejecutar test contra mock server.

**Matchers clave:** `like(example)` (mismo tipo), `eachLike(example)` (array con shape), `term({ generate, matcher })` (regex). No hardcodear valores.

RN: mismo `@pact-foundation/pact`, correr en Node tests (Jest), nunca en device/emulator.

## Provider (Go verify)

Usar `pact-go/v2`. `VerifyProvider` con BrokerURL, ProviderVersion (`$GIT_SHA`), PublishVerificationResults true. Implementar `StateHandlers` para cada precondición del consumer (seed DB, mock repos).

Múltiples consumers: provider verifica contra todos los pacts — usar `ConsumerVersionSelectors` con `MainBranch: true` + `DeployedOrReleased: true`.

## Pact Broker

- **Self-hosted:** Docker image `pactfoundation/pact-broker` + Postgres
- **PactFlow:** SaaS enterprise (SSO, analytics)
- Tagging: cada pact con git SHA + branch. Matrix muestra compatibilidad entre versiones.

## CI: can-i-deploy gate

En workflows de deploy (consumer Y provider): `pact-broker can-i-deploy --pacticipant <name> --version $GIT_SHA --to-environment production`. Bloquea si versión no tiene pacts verificados contra versión en prod.

## Breaking change detection

Consumer cambia expectation → publica pact nuevo → webhook dispara verify → falla → broker marca incompatibilidad → `can-i-deploy` bloquea. Funciona en ambos sentidos.

## Anti-patterns

- Hardcodear valores sin matchers — contratos frágiles
- Pact como mock completo del backend — solo shape + happy path
- Provider verify opcional en CI
- Sin can-i-deploy gate
- Broker sin tagging branch/version
- Consumer testea TODOS los endpoints — solo los que realmente usa
- Sin integration tests de flujos críticos (Pact no valida e2e)
- OpenAPI como reemplazo de Pact
- Pact contra APIs terceros
- Provider states con estado compartido entre tests — flaky

## Checklist

- [ ] Consumer y provider nombres acordados
- [ ] Broker corriendo (Docker o PactFlow)
- [ ] Consumer: tests PactV3 con matchers (like, eachLike, term)
- [ ] Consumer CI publica pacts con version+branch
- [ ] Webhook broker → provider CI verify al cambiar pact
- [ ] Provider: StateHandlers para cada given()
- [ ] Provider CI publica verification results
- [ ] can-i-deploy gate en ambos workflows
- [ ] Branch/version tagging configurado
- [ ] Integration tests cubren flujos que Pact no valida
- [ ] Terceros usan recorded mocks, NO Pact

## Delegación

- `/scaffold-go` — provider Go scaffold
- `/api-docs` — OpenAPI complementario
- `/deploy-check` — integrar can-i-deploy
- `/doc-rfc` — documentar decisión de adoptar Pact
