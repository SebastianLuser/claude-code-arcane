---
name: ci-cd-setup
description: "Genera workflows de GitHub Actions para stacks Educabot (Go, TS Fastify, React+Vite, React Native/Expo). CI (lint + test + build) + CD (Docker push a GHCR, deploy, EAS builds). Usar para: ci, cd, github actions, pipeline, workflow, automatizar deploy, release."
---

# ci-cd-setup — GitHub Actions Pipeline Generator

Genera **workflows de GitHub Actions** listos para copiar a `.github/workflows/` en proyectos Educabot. Builds, tests, linters, push a registry, deploy y OTA updates (Expo).

## Cuándo usar

- Nuevo repo que necesita CI desde día 1
- Agregar CD a un repo con CI pero sin deploy automatizado
- Migrar de Jenkins/CircleCI/GitLab CI a GitHub Actions
- Setup inicial de release pipeline (tags → prod)

## Principios

1. **Fail fast** — lint antes de test, test antes de build
2. **Caching agresivo** — `actions/cache` + setup-* con cache built-in
3. **Matrix builds** cuando aporten (Node versions, OS). Evitar matrix innecesaria
4. **Concurrency** — cancelar runs viejos del mismo branch
5. **Secrets por entorno** (GitHub Environments + required reviewers para prod)
6. **Pin actions por SHA** en prod-critical (o al menos major version)
7. **Reusable workflows** para lógica compartida entre repos

## Preguntas previas

1. **Stack**: Go / TS Fastify / React+Vite / React Native / monorepo
2. **Registry destino**: GHCR (default) / ECR / GCR / Docker Hub
3. **Deploy target**: K8s / ECS / Cloud Run / Railway / Vercel / stores (mobile)
4. **Branching**: trunk-based (main + tags) / gitflow (main + develop)
5. **Environments**: dev / staging / prod (¿cuáles aplican?)
6. **Secrets existentes** en repo: listar los que ya están configurados

---

## 1. Convenciones comunes

### `.github/workflows/` layout

```
.github/
├── workflows/
│   ├── ci.yml              # PRs + pushes a main
│   ├── cd-staging.yml      # auto-deploy a staging desde main
│   ├── cd-production.yml   # deploy desde tags v*
│   └── release.yml         # genera release notes + tag
├── dependabot.yml
└── CODEOWNERS
```

### Triggers estándar

```yaml
on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]
  workflow_dispatch:  # trigger manual
```

### Concurrency (cancelar runs obsoletos)

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

---

## 2. Go backend — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
          cache: true
      - name: golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: v1.61

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U test"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
          cache: true
      - run: go test -race -coverprofile=coverage.out ./...
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test?sslmode=disable
      - uses: codecov/codecov-action@v4
        with:
          files: coverage.out

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.23', cache: true }
      - run: CGO_ENABLED=0 go build -o /tmp/app ./cmd/server
```

---

## 3. TypeScript Fastify — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push: { branches: [main] }
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U test"
          --health-interval 5s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm run typecheck
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test
      - run: npm test -- --coverage
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test
      - run: npm run build
```

---

## 4. React + Vite — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push: { branches: [main] }
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --run
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  e2e:
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

---

## 5. React Native + Expo — `.github/workflows/eas-build.yml`

```yaml
name: EAS Build

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      profile:
        type: choice
        options: [development, preview, production]
        default: preview

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --non-interactive --profile ${{ inputs.profile || 'production' }} --platform all

  ota-update:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - uses: expo/expo-github-action@v8
        with: { eas-version: latest, token: ${{ secrets.EXPO_TOKEN }} }
      - run: npm ci
      - run: eas update --auto --non-interactive
```

---

## 6. CD — Docker build & push a GHCR

`.github/workflows/cd.yml`:

```yaml
name: CD

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix=sha-

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          platforms: linux/amd64,linux/arm64
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
          sbom: true

  deploy-staging:
    if: github.ref == 'refs/heads/main'
    needs: build-push
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: echo "deploy to staging — k8s/ECS/CloudRun según proyecto"

  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: build-push
    runs-on: ubuntu-latest
    environment: production  # required reviewers en GH
    steps:
      - run: echo "deploy to prod"
```

---

## 7. Release — changelog + tag

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'semver (ej: 1.2.3)'
        required: true

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: orhun/git-cliff-action@v3
        with:
          config: cliff.toml
          args: --tag v${{ inputs.version }}
        env:
          OUTPUT: CHANGELOG.md
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add CHANGELOG.md
          git commit -m "chore: release v${{ inputs.version }}"
          git tag v${{ inputs.version }}
          git push && git push --tags
      - uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ inputs.version }}
          body_path: CHANGELOG.md
```

---

## 8. Dependabot — `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    groups:
      minor-patch:
        update-types: [minor, patch]
  - package-ecosystem: gomod
    directory: /
    schedule: { interval: weekly }
  - package-ecosystem: docker
    directory: /
    schedule: { interval: weekly }
```

---

## 9. Secrets & Environments

### Secrets de repo (no rotar por PR)
- `GITHUB_TOKEN` (auto)
- `CODECOV_TOKEN`
- `EXPO_TOKEN` (mobile)

### Environments con required reviewers
- **staging**: auto-deploy desde main, sin review
- **production**: required review (1-2 aprobadores), secrets propios (`PROD_DB_URL`, `PROD_API_KEY`)

### Secrets que NUNCA van al workflow
- Credenciales de DB prod → inyectar desde K8s/ECS secrets manager
- API keys de terceros → usar OIDC con AWS/GCP donde se pueda

### OIDC (sin long-lived secrets)

```yaml
permissions:
  id-token: write
  contents: read

- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789:role/gha-deploy
    aws-region: us-east-1
```

---

## 10. Reusable workflows

`.github/workflows/reusable-docker-publish.yml`:

```yaml
on:
  workflow_call:
    inputs:
      image-name: { type: string, required: true }
      dockerfile: { type: string, default: Dockerfile }
    secrets:
      registry-token: { required: true }

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.registry-token }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          file: ${{ inputs.dockerfile }}
          push: true
          tags: ghcr.io/educabot/${{ inputs.image-name }}:${{ github.sha }}
```

Uso desde otro repo:
```yaml
jobs:
  publish:
    uses: educabot/shared-workflows/.github/workflows/reusable-docker-publish.yml@main
    with: { image-name: alizia-backend }
    secrets:
      registry-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## 11. CODEOWNERS

```
# .github/CODEOWNERS
* @educabot/platform

/frontend/ @educabot/frontend-lead
/backend/  @educabot/backend-lead
/.github/  @educabot/platform @educabot/sre
```

---

## 12. Checklist pre-merge

- [ ] CI corre en PR + main
- [ ] Concurrency group configurado
- [ ] Caching de deps (npm/go mod) activo
- [ ] Coverage se publica
- [ ] Build produce artifact reproducible
- [ ] Secrets en Environments, no en repo-level para prod
- [ ] Dependabot habilitado
- [ ] CODEOWNERS aplica a archivos críticos
- [ ] Actions pineadas por versión (no `@master`)

---

## 13. Anti-patterns

- ❌ `uses: actions/checkout@master` — no pin
- ❌ Secrets en `env:` de workflow público
- ❌ `npm install` en vez de `npm ci`
- ❌ Test después de build (build es caro, test rápido)
- ❌ Un solo job gigante → perdés paralelismo
- ❌ No usar `concurrency` → runs duplicados consumen minutos
- ❌ Deploy a prod sin manual gate ni tag
- ❌ Push de `:latest` sin tag semántico

---

## Output final

```
✅ Workflows generados en .github/workflows/:
   - ci.yml           (lint + test + build)
   - cd.yml           (docker push + deploy)
   - release.yml      (tag + changelog + GH release)
   - dependabot.yml   (updates semanales)
   - CODEOWNERS

Próximos pasos:
  1. Configurar secrets en repo settings
  2. Crear Environments (staging, production) con required reviewers para prod
  3. Primer push a main → verificar CI verde
  4. Primer tag vX.Y.Z → verificar deploy a prod
```

## Delegación

**Coordinar con:** `platform-lead`, `sre-lead`, `devops-lead`
**Reporta a:** `cloud-architect`

**Skills relacionadas:**
- `/docker-setup` — Dockerfiles que consume este CI
- `/k8s-deploy` — target de deploy
- `/deploy-check` — pre-deploy verification
- `/changelog` — genera CHANGELOG.md consumido por release.yml
