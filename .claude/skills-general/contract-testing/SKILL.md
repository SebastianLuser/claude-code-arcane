---
name: contract-testing
description: "Pact contract testing: generate consumer-driven contracts, verify providers, publish to broker, run can-i-deploy. Go/TS/RN."
category: "testing"
argument-hint: "[consumer|provider|setup]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Contract Testing (Pact)

## Cuando usar / NO usar

| Usar | NO usar |
|------|---------|
| Microservicios con consumer y provider evolucionando separado | APIs terceros (Stripe, Google) — usar recorded mocks |
| Detectar breaking changes API antes de deploy | Validar logica e2e — Pact valida shape, no business logic |
| Reemplazar parcialmente E2E tests costosos/flakey | Contratos asincronos triviales sin evolucion |
| Integraciones internas: `alizia-web <-> alizia-api`, mobile <-> api | Un equipo controla ambos lados sin CI separado |

## Concepto

Consumer-driven contract testing: consumer describe lo que espera -> provider lo verifica. Cada lado testea contra el contrato, no contra el otro servicio real. Complementario a OpenAPI (docs) — Pact valida expectativas ejecutables.

## Flujo

1. Consumer escribe tests usando mock Pact server -> genera `pacts/<consumer>-<provider>.json`
2. Publicar a **Pact Broker** (Docker self-host gratis, o PactFlow SaaS) con `--consumer-app-version=$GIT_SHA --branch=$GIT_BRANCH`
3. Webhook broker -> dispara provider verify en CI
4. Provider corre verification con StateHandlers para cada `given()` del consumer
5. Resultado publicado al broker
6. `can-i-deploy` gate bloquea deploys incompatibles

> → Read references/implementation-details.md for consumer/provider setup, broker config, CI gate, and breaking change detection

> → Read references/anti-patterns-and-checklist.md for anti-patterns and implementation checklist

## Delegacion

- `/scaffold-go` — provider Go scaffold
- `/api-docs` — OpenAPI complementario
- `/deploy-check` — integrar can-i-deploy
- `/doc-rfc` — documentar decision de adoptar Pact
