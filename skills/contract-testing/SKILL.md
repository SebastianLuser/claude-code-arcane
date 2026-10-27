---
name: contract-testing
description: "Pact contract testing: generate consumer-driven contracts, verify providers, publish to broker, run can-i-deploy. Go/TS/RN."
category: "testing"
argument-hint: "[consumer|provider|setup]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Contract Testing (Pact)

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| Microservices with consumer and provider evolving separately | Third-party APIs (Stripe, Google) — use recorded mocks |
| Detecting API breaking changes before deploy | Validating e2e logic — Pact validates shape, not business logic |
| Partially replacing expensive/flaky E2E tests | Trivial async contracts that never evolve |
| Internal integrations: `alizia-web <-> alizia-api`, mobile <-> api | One team controls both sides without separate CI |

## Concept

Consumer-driven contract testing: the consumer describes what it expects -> the provider verifies it. Each side tests against the contract, not against the other real service. Complementary to OpenAPI (docs) — Pact validates executable expectations.

## Flow

1. The consumer writes tests using the Pact mock server -> generates `pacts/<consumer>-<provider>.json`
2. Publish to the **Pact Broker** (free self-hosted Docker, or PactFlow SaaS) with `--consumer-app-version=$GIT_SHA --branch=$GIT_BRANCH`
3. Broker webhook -> triggers provider verify in CI
4. The provider runs verification with StateHandlers for each consumer `given()`
5. Result published to the broker
6. The `can-i-deploy` gate blocks incompatible deploys

> → Read references/implementation-details.md for consumer/provider setup, broker config, CI gate, and breaking change detection

> → Read references/anti-patterns-and-checklist.md for anti-patterns and implementation checklist

## Delegation

- `/scaffold-go` — Go provider scaffold
- `/api-docs` — complementary OpenAPI
- `/deploy-check` — integrate can-i-deploy
- `/doc-rfc` — document the decision to adopt Pact
