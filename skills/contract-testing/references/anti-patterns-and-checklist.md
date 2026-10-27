# Contract Testing Anti-Patterns & Checklist

## Anti-patterns

- Hardcoding values without matchers — brittle contracts
- Pact as a full backend mock — shape + happy path only
- Optional provider verify in CI
- No can-i-deploy gate
- Broker without branch/version tagging
- Consumer tests ALL endpoints — only the ones it actually uses
- No integration tests for critical flows (Pact does not validate e2e)
- OpenAPI as a replacement for Pact
- Pact against third-party APIs
- Provider states with state shared across tests — flaky

## Checklist

- [ ] Consumer and provider names agreed
- [ ] Broker running (Docker or PactFlow)
- [ ] Consumer: PactV3 tests with matchers (like, eachLike, term)
- [ ] Consumer CI publishes pacts with version+branch
- [ ] Broker webhook -> provider CI verify when a pact changes
- [ ] Provider: StateHandlers for each given()
- [ ] Provider CI publishes verification results
- [ ] can-i-deploy gate in both workflows
- [ ] Branch/version tagging configured
- [ ] Integration tests cover flows Pact does not validate
- [ ] Third parties use recorded mocks, NOT Pact
