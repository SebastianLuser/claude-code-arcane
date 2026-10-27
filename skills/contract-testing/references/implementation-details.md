# Contract Testing Implementation Details

## Consumer (React/RN + Jest)

Use `@pact-foundation/pact` PactV3. Define interactions: `given()` (precondition), `uponReceiving()`, `withRequest()`, `willRespondWith()`. Run the test against the mock server.

**Key matchers:** `like(example)` (same type), `eachLike(example)` (array with shape), `term({ generate, matcher })` (regex). Do not hardcode values.

RN: same `@pact-foundation/pact`, run in Node tests (Jest), never on a device/emulator.

## Provider (Go verify)

Use `pact-go/v2`. `VerifyProvider` with BrokerURL, ProviderVersion (`$GIT_SHA`), PublishVerificationResults true. Implement `StateHandlers` for each consumer precondition (seed DB, mock repos).

Multiple consumers: the provider verifies against all pacts — use `ConsumerVersionSelectors` with `MainBranch: true` + `DeployedOrReleased: true`.

## Pact Broker

- **Self-hosted:** Docker image `pactfoundation/pact-broker` + Postgres
- **PactFlow:** SaaS enterprise (SSO, analytics)
- Tagging: each pact with git SHA + branch. The matrix shows compatibility between versions.

## CI: can-i-deploy gate

In deploy workflows (consumer AND provider): `pact-broker can-i-deploy --pacticipant <name> --version $GIT_SHA --to-environment production`. Blocks if the version has no pacts verified against the version in prod.

## Breaking change detection

Consumer changes an expectation -> publishes a new pact -> webhook triggers verify -> it fails -> broker marks the incompatibility -> `can-i-deploy` blocks. It works in both directions.
