---
name: contract-testing
description: Contract testing con Pact para validar acuerdos de API entre consumers (React, React Native) y providers (Go, TS). Genera contratos, publica a broker, corre verify, integra can-i-deploy en CI. Alternativa liviana a E2E tests caros. Usar cuando se mencione: contract testing, Pact, consumer-driven, breaking change API, Pact Broker, PactFlow, can-i-deploy.
---

# Contract Testing (Pact)

## Cuándo usar
- Microservicios donde consumer (web/mobile) y provider (API) evolucionan por separado
- Detectar breaking changes de API antes de deploy
- Reemplazar parcialmente E2E tests costosos y flakey
- Validar integraciones internas: `alizia-web ↔ alizia-api`, `alizia-mobile ↔ alizia-api`, `alizia-api ↔ alizia-auth-service`

## Cuándo NO usar
- APIs de terceros (Stripe, Google, etc.) — usar recorded mocks, no Pact
- Validar lógica de negocio end-to-end — contract testing valida shape+happy path HTTP, no reemplaza integration tests
- Contratos asíncronos triviales sin evolución — overhead no justificado
- Un único equipo controla ambos lados sin CI separado — más fricción que valor

---

## 1. Concepto

**Contract testing** = verificar que consumer y provider acuerdan la **shape** de sus interacciones HTTP (request/response, headers, status codes). Cada lado testea contra el contrato, no contra el otro servicio real.

- **Consumer-driven (Pact)**: el consumer describe lo que espera → provider lo verifica. Default recomendado.
- Alternativas: Spring Cloud Contract (Java), schema-based (OpenAPI diff), Postman Contract Tests.

**Pact vs OpenAPI**:
- OpenAPI = schema declarativo del provider (docs).
- Pact = expectativas reales del consumer (validación ejecutable).
- Son complementarios: OpenAPI para documentación pública, Pact para validación real entre servicios.

---

## 2. Flujo Pact

```
Consumer test (React)
  └── Pact mock server genera pacts/alizia-web-alizia-api.json
        └── pact publish → Pact Broker (self-host o PactFlow)
              └── webhook → trigger provider verify en CI
                    └── Go provider corre verify contra pact del broker
                          └── Resultado publicado al broker
                                └── can-i-deploy gate en CI decide deploy
```

1. Consumer escribe tests usando mock Pact server.
2. Tests generan `pacts/<consumer>-<provider>.json`.
3. Publicar a **Pact Broker** (Docker image gratis, o PactFlow SaaS).
4. Provider corre verification contra el pact del broker.
5. Broker webhook → si consumer cambia el pact, dispara verify del provider en CI.
6. `can-i-deploy` gate bloquea deploys incompatibles.

---

## 3. Consumer: React + Jest

```bash
npm i -D @pact-foundation/pact
```

```ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import { getUser } from '../src/api/users';

const { like, eachLike, term } = MatchersV3;

const provider = new PactV3({
  consumer: 'alizia-web',
  provider: 'alizia-api',
  dir: path.resolve(process.cwd(), 'pacts'),
});

describe('users API contract', () => {
  it('GET /users/123 returns user', async () => {
    provider
      .given('user 123 exists')
      .uponReceiving('get user 123')
      .withRequest({ method: 'GET', path: '/users/123' })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: like({
          id: 123,
          name: 'Ana',
          email: term({ generate: 'ana@educabot.com', matcher: '.+@.+\\..+' }),
          roles: eachLike('student'),
        }),
      });

    await provider.executeTest(async (mockServer) => {
      const user = await getUser(123, { baseURL: mockServer.url });
      expect(user.id).toBe(123);
    });
  });
});
```

**Matchers clave** (flexibilidad, no hardcodear):
- `like(example)` → cualquier valor del mismo tipo.
- `eachLike(example)` → array de N elementos con shape del example.
- `term({ generate, matcher })` → regex match.

---

## 4. Provider: Go verify

```bash
go get github.com/pact-foundation/pact-go/v2
```

```go
package contract_test

import (
    "testing"
    "github.com/pact-foundation/pact-go/v2/provider"
)

func TestPactProvider(t *testing.T) {
    verifier := provider.NewVerifier()

    err := verifier.VerifyProvider(t, provider.VerifyRequest{
        ProviderBaseURL: "http://localhost:8080",
        Provider:        "alizia-api",
        ProviderVersion: os.Getenv("GIT_SHA"),
        BrokerURL:       os.Getenv("PACT_BROKER_URL"),
        BrokerToken:     os.Getenv("PACT_BROKER_TOKEN"),
        PublishVerificationResults: true,
        StateHandlers: provider.StateHandlers{
            "user 123 exists": func(setup bool, s provider.ProviderState) (provider.ProviderStateResponse, error) {
                if setup {
                    seedUser(123, "Ana")
                }
                return nil, nil
            },
        },
    })
    if err != nil {
        t.Fatal(err)
    }
}
```

**Provider states**: consumer declara precondición (`given('user 123 exists')`), provider implementa el setup (seed DB, mock repos, etc.).

---

## 5. React Native

Mismo `@pact-foundation/pact`, correr en **Node tests** (Jest), nunca en device/emulator. El mock server es HTTP Node, no corre en RN runtime.

```ts
// __tests__/contracts/users.pact.test.ts
// idéntico al ejemplo de React, solo importás el cliente API de RN
```

---

## 6. Pact Broker

**Self-hosted** (Docker, gratis):
```yaml
# docker-compose.yml
services:
  broker:
    image: pactfoundation/pact-broker:latest
    ports: ["9292:9292"]
    environment:
      PACT_BROKER_DATABASE_URL: postgres://...
```

**PactFlow** (SaaS): features enterprise (SSO, analytics, secrets management).

**Publicar contrato desde consumer**:
```bash
npx pact-broker publish ./pacts \
  --consumer-app-version=$GIT_SHA \
  --branch=$GIT_BRANCH \
  --broker-base-url=$PACT_BROKER_URL \
  --broker-token=$PACT_BROKER_TOKEN
```

**Tagging**: cada pact taggeado con git SHA + branch. Broker matrix muestra compatibilidad entre versiones.

---

## 7. CI: can-i-deploy gate

```yaml
# .github/workflows/deploy.yml
jobs:
  can-i-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Can I deploy?
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant alizia-web \
            --version $GIT_SHA \
            --to-environment production \
            --broker-base-url $PACT_BROKER_URL \
            --broker-token $PACT_BROKER_TOKEN
  deploy:
    needs: can-i-deploy
    # ...
```

`can-i-deploy` consulta al broker: ¿esta versión del consumer tiene pacts verificados contra la versión del provider en `production`? Si no, **falla y bloquea deploy**.

---

## 8. Breaking change detection

1. Consumer cambia expectation → publica pact nuevo.
2. Webhook del broker dispara provider verify.
3. Provider verify falla → broker marca incompatibilidad.
4. `can-i-deploy` del provider bloquea su deploy hasta resolver.

Funciona en ambos sentidos: provider que rompe contrato también falla verify.

---

## 9. Múltiples consumers

Provider con varios consumers verifica contra **todos los pacts** consumidos:

```go
// BrokerURL sin PactURLs específicos → verify todos los consumers activos
verifier.VerifyProvider(t, provider.VerifyRequest{
    BrokerURL: os.Getenv("PACT_BROKER_URL"),
    ConsumerVersionSelectors: []provider.Selector{
        {MainBranch: true},
        {DeployedOrReleased: true},
    },
})
```

---

## Anti-patterns

- Hardcodear valores concretos sin matchers → contratos frágiles, rompen por cambios cosméticos
- Tratar al pact como mock completo del backend → solo es shape + happy path, no business logic
- Provider verify opcional en CI → rompe toda la value prop del contract testing
- Sin can-i-deploy gate → deployás breaking changes sin saberlo
- Broker sin tagging de branch/version → imposible saber qué es compatible con qué
- Consumer test con TODOS los endpoints del provider → solo testear los que el consumer realmente usa
- Contract testing sin integration tests de flujos críticos → Pact no valida lógica end-to-end
- Usar OpenAPI como reemplazo de Pact → no valida expectativas reales del consumer
- Pact contra APIs de terceros (Stripe, etc.) → usar recorded mocks
- Provider states implementados con estado compartido entre tests → flaky

---

## Checklist

- [ ] Consumer y provider acordaron nombres (`alizia-web`, `alizia-api`)
- [ ] Broker corriendo (self-host Docker o PactFlow)
- [ ] Consumer: tests con `PactV3` usando matchers (`like`, `eachLike`, `term`)
- [ ] Consumer CI publica pacts con `--consumer-app-version=$GIT_SHA --branch=$GIT_BRANCH`
- [ ] Webhook broker → provider CI dispara verify al cambiar pact
- [ ] Provider: `StateHandlers` implementados para cada `given()` del consumer
- [ ] Provider CI publica verification results (`PublishVerificationResults: true`)
- [ ] `can-i-deploy` gate en ambos workflows de deploy (consumer y provider)
- [ ] Branch/version tagging configurado en broker
- [ ] Integration tests cubren flujos críticos que Pact no valida
- [ ] Terceros (Stripe, Google) usan recorded mocks, NO Pact

---

## Output esperado

- `pacts/<consumer>-<provider>.json` generado por tests del consumer
- Broker mostrando matrix de compatibilidad por branch/version
- CI con jobs: `consumer-test + publish` / `provider-verify` / `can-i-deploy`
- Bloqueo automático de deploys incompatibles
- Provider states documentados y reproducibles

---

## Delegación

- **`/scaffold-go`** — scaffolding del provider Go donde vivirá el verify
- **`/api-docs`** — generar OpenAPI complementario para docs públicas
- **`/deploy-check`** — integrar `can-i-deploy` al pre-deploy checklist
- **`/postman`** — mantener colecciones manuales de prueba (no reemplaza Pact)
- **`/audit-dev`** — auditar cobertura de contracts y gaps vs integration tests
- **`/doc-rfc`** — documentar decisión de adoptar Pact y scope de contratos
