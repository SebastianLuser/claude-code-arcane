---
name: monorepo-setup
description: "Monorepo para apps Educabot (TS/Go): pnpm workspaces, Turborepo, Nx, Go workspaces, package boundaries, shared libs, versioning, CI cache, code owners, release strategy. Usar para: monorepo, workspaces, turbo, nx, pnpm, shared packages, libs, packages."
---

# monorepo-setup — Monorepo Structure

Guía para monorepos en Educabot. Cuándo vale la pena, cómo estructurarlo, cómo escalar sin que CI tarde 40min.

## Cuándo usar

- Multiple apps del mismo stack compartiendo código (`ui-kit`, `sdk`, tipos)
- Frontend web + mobile que comparten lógica de negocio (tipos, validators, API client)
- BE con múltiples servicios que comparten protos, auth, logger
- Refactors cross-app atómicos (cambio en lib + consumers en un PR)

## Cuándo NO usar

- Apps sin nada en común (acopla sin valor)
- Teams independientes con cadencias distintas y sin voluntad de coordinar
- Stack heterogéneo donde cada app tiene su toolchain incompatible

---

## 1. Layout recomendado Educabot

### Frontend/TS monorepo (pnpm + Turborepo)
```
alizia/
├── apps/
│   ├── web/                 # React + Vite
│   ├── mobile/              # Expo / RN
│   └── admin/               # React + Vite (dashboard)
├── packages/
│   ├── ui/                  # componentes compartidos
│   ├── sdk/                 # API client tipado
│   ├── config/              # ESLint/TS/Prettier configs
│   ├── types/               # tipos compartidos (o generated)
│   ├── i18n/                # locales + helpers
│   └── utils/
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── tsconfig.base.json
```

### Backend Go
```
alizia-be/
├── cmd/
│   ├── api/                 # entrypoint HTTP
│   ├── worker/              # queue worker
│   └── migrate/             # CLI migrations
├── internal/
│   ├── auth/
│   ├── courses/
│   ├── db/
│   └── http/
├── pkg/                     # exportable (evitar si es privado)
├── go.mod                   # module único por default
└── go.work                  # opcional si hay múltiples modules
```

Para Go, **un solo módulo** salvo que necesites versionar libs públicas por separado. `go.work` solo si tenés múltiples services con deps compartidas en el mismo repo.

---

## 2. Herramienta — decisión

| Tool | Stack | Pros | Cons | Cuándo |
|------|-------|------|------|--------|
| **pnpm workspaces** | TS/JS | Minimal, rápido, `workspace:*` protocol | Sin task runner | Base siempre |
| **Turborepo** | TS/JS | Cache local+remote, pipelines simples | Menos features que Nx | **Default Educabot** |
| **Nx** | TS/JS (+Go plugin) | Potente, generators, graph | Curva + opiniones fuertes | Teams grandes, muchas apps |
| **Bazel** | Poliglota | Hermético, correcto a escala | Complejidad brutal | Google-scale, no Educabot |
| **Lerna** | TS/JS | Histórico | Superseded por Turbo/Nx | Evitar proyectos nuevos |
| **Go workspaces** | Go | Nativo multi-module | Simple | Si hay multi-module |

**Default Educabot:** pnpm + Turborepo para TS. Go module único por servicio.

---

## 3. pnpm workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Dependencias entre paquetes
```json
// apps/web/package.json
{
  "dependencies": {
    "@alizia/ui":    "workspace:*",
    "@alizia/sdk":   "workspace:*",
    "@alizia/types": "workspace:*"
  }
}
```

`workspace:*` = siempre usar la versión local del workspace. En publish real, pnpm lo reescribe.

### Install
```bash
pnpm install           # raíz — instala todo
pnpm --filter web dev  # correr script en un package específico
pnpm -r build          # recursive en todos
```

---

## 4. Turborepo pipeline

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "lint":     { "outputs": [] },
    "typecheck":{ "dependsOn": ["^build"], "outputs": [] },
    "test":     { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "dev":      { "cache": false, "persistent": true }
  }
}
```

`^build` = depende del build de los **upstream** (packages importados).

### Correr
```bash
turbo run build --filter=web...       # web + sus deps
turbo run test --filter=...[main]     # solo lo afectado vs main
```

### Remote cache
```bash
turbo login
turbo link
```

Comparte cache entre devs + CI → build 2da vez es instant. Alternativa self-hosted: `turborepo-remote-cache` en GCS.

---

## 5. TypeScript — configs compartidos

### `packages/config/tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

### `apps/web/tsconfig.json`
```json
{
  "extends": "@alizia/config/tsconfig.base.json",
  "compilerOptions": { "jsx": "react-jsx", "outDir": "dist" },
  "include": ["src"]
}
```

### Path aliases
No abusar — con workspaces ya tenés imports por nombre de package. Path aliases solo **dentro** de un package.

### Project references (opcional)
```json
{ "references": [{ "path": "../../packages/ui" }] }
```

Útil para `tsc --build` incremental. Con Turborepo + `tsc` en cada package suele alcanzar.

---

## 6. Shared packages — buenas prácticas

### `@alizia/ui`
- Solo componentes **sin** dependencia de rutas/auth específicas
- Stories en Storybook (skill `/component-library`)
- Export via `exports` field con subpaths:
```json
{
  "exports": {
    "./button": "./src/button/index.tsx",
    "./icons": "./src/icons/index.ts"
  }
}
```
Evita bundlear todo el paquete al importar una cosa.

### `@alizia/sdk` — API client
- Generado desde OpenAPI/Protobuf → tipos + fetchers
- No incluye estado (TanStack Query lives en apps)
- Acepta auth token via factory / interceptor

### `@alizia/types`
- Tipos puros compartidos frontend ↔ otros packages
- Idealmente **generados** desde schema backend (orval, openapi-typescript) → single source of truth

### Reglas de dependencia (boundaries)
```
apps/*   → packages/*   OK
packages/* → packages/* OK (DAG, sin ciclos)
packages/* → apps/*     ❌ prohibido
```

Enforzar con ESLint plugin `eslint-plugin-boundaries` o `@nx/enforce-module-boundaries`.

---

## 7. CI — estrategia

### Problema
Monorepo con 10 apps → push cambia 1 archivo → CI corre todo = lento.

### Solución: Turborepo filters + cache
```yaml
# GitHub Actions
- uses: pnpm/action-setup@v3
- uses: actions/setup-node@v4
- run: pnpm install --frozen-lockfile
- run: turbo run lint typecheck test build --filter=...[origin/main]
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: educabot
```

`--filter=...[origin/main]` = solo packages afectados.
Remote cache → si otro CI/dev ya buildeó ese commit, se reusa.

### Paralelismo
- Job matrix por app
- Dentro: turbo paraleliza tasks

### Tiempos objetivo
- PR de 1 archivo UI → CI < 2min
- PR de package shared (afecta N apps) → CI < 8min
- Full cold build → < 15min

Si excede → investigar cache hit rate, tests lentos, bundler.

---

## 8. Go — monorepo patterns

### Opción A: 1 module, múltiples `cmd/`
```
go.mod                  // module alizia-be
cmd/api/main.go
cmd/worker/main.go
internal/...
```
Simple. Recomendado para un solo servicio con varios binarios.

### Opción B: `go.work` multi-module
```
// go.work
go 1.23
use (
  ./api
  ./shared
)
```

Cada service tiene su `go.mod`. `shared` es lib interna. Útil cuando:
- Services van a externalizar algún paquete
- Services con ciclos de release distintos

No crear Go monorepo inmenso sin justificación — mantenimiento alto.

### Build selectivo
```bash
go build ./cmd/api
go test ./internal/auth/...
```

CI con `nektos/act` o scripts que detectan packages cambiados via `git diff --name-only`.

---

## 9. Git — code owners y review

```
# .github/CODEOWNERS
/apps/web/           @frontend-team
/apps/mobile/        @mobile-team
/packages/ui/        @frontend-team @design-system-lead
/packages/sdk/       @backend-team @frontend-team
/packages/types/     @backend-team
```

PR con cambios en múltiples paths → reviewers automáticos.

---

## 10. Versionado & release

### Apps (no publican a npm)
- Deploy continuo por app (skill `/deploy-check`)
- Tag por app: `web-v2025.04.14`, `mobile-v1.18.0`
- No semver estricto para apps — fechas o build number

### Libs públicas (si las publicás a npm)
- **Changesets** (`@changesets/cli`) — workflow amigable en monorepo
  - Dev agrega `.changeset/*.md` describiendo cambio
  - CI en main → `changeset version` bump + changelog + PR
  - Merge del PR → `changeset publish` a npm
- Semver estricto

### Libs privadas internas
- `workspace:*` → siempre última del workspace, sin versiones
- No publicar a npm registry

---

## 11. Deps management

### Single version policy (recomendado)
Misma versión de React/Vite/TS en todo el repo. Root `package.json` o `pnpm.overrides`:
```json
{
  "pnpm": {
    "overrides": {
      "react": "^18.3.1",
      "typescript": "5.5.4"
    }
  }
}
```

Evita "funciona en web pero no en mobile" por bumps desalineados.

### Tool para bumps
- **Renovate** (default) con grouping por package compartido
- `pnpm up -r` manual

---

## 12. Dev experience

### `pnpm dev` en raíz
```json
// root package.json
{
  "scripts": {
    "dev":       "turbo run dev --parallel",
    "dev:web":   "turbo run dev --filter=web",
    "build":     "turbo run build",
    "lint":      "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test":      "turbo run test"
  }
}
```

### Hot reload cross-package
- Vite: HMR sigue imports workspace si el package es source (no pre-built)
- Para packages con build step: `tsup --watch` en dev del package

### VSCode workspace
```json
// .vscode/alizia.code-workspace
{ "folders": [
  { "path": "apps/web" },
  { "path": "apps/mobile" },
  { "path": "packages/ui" }
]}
```

---

## 13. Migración gradual (multi-repo → mono)

1. Nuevo repo `monorepo`, vacío
2. `git subtree add` de cada repo → preserva historia
3. Adaptar imports a `@scope/pkg`
4. CI estable antes de seguir
5. Archivar repos viejos con link al nuevo

Si es grande: migrar 1 app por PR, no big bang.

---

## 14. Anti-patterns

- ❌ Monorepo sin workspaces (symlinks manuales, copy-paste) → desync garantizado
- ❌ Shared lib con dependencia circular a una app → boundaries rotos
- ❌ Sin cache en CI → builds de 30min, devs sufren
- ❌ Mismos tests corriendo en 5 jobs por no filtrar
- ❌ Versiones diferentes de React entre apps → bugs sutiles
- ❌ Package "utils" basurero → sin cohesión, todos importan
- ❌ Publish libs privadas a npm público "por si acaso"
- ❌ Sin CODEOWNERS → PRs sin reviewer claro
- ❌ `workspace:*` convertido en versión fija al bundlear → rompés consumers
- ❌ Monorepo para imponer stack único a equipos independientes que no lo quieren
- ❌ Borrar `node_modules` raíz por "bugs random" en vez de `pnpm install`
- ❌ Apps que importan código de otras apps (debe moverse a package)

---

## 15. Checklist review

```markdown
- [ ] pnpm-workspace.yaml con apps/ y packages/
- [ ] turbo.json con pipeline + cache outputs
- [ ] tsconfig base extendido por apps
- [ ] Boundaries lint rule (apps → packages, no al revés)
- [ ] Remote cache configurado (Turbo Cloud o self-host)
- [ ] CI con --filter=...[main] + cache
- [ ] CODEOWNERS configurado
- [ ] Single version de deps críticas (React, TS, Vite)
- [ ] Renovate/Dependabot con grouping
- [ ] Changesets si se publican libs
- [ ] Root scripts: dev, build, lint, test
- [ ] Docs de "cómo empezar" en README
```

---

## 16. Output final

```
✅ Monorepo — Alizia
   📦 pnpm workspaces + Turborepo
   🗂️  apps/ (web, mobile, admin) + packages/ (ui, sdk, types, i18n, config)
   🧠 Boundaries enforced via ESLint
   ⚡ Remote cache Turbo → CI promedio 3min (antes 22min)
   🔒 CODEOWNERS por path
   🧰 Renovate agrupado, single-version policy React/TS
   🚀 Deploy por app (no monorepo deploy)

Próximos pasos:
  1. Generar SDK automáticamente desde OpenAPI (backend)
  2. Storybook en packages/ui (skill /component-library)
  3. Métricas de CI: p95 duration, cache hit rate
```

## Delegación

**Coordinar con:** `frontend-architect`, `backend-architect`, `devex-lead`, `sre-lead`
**Reporta a:** `frontend-architect`

**Skills relacionadas:**
- `/component-library` — packages/ui + Storybook
- `/deploy-check` — deploy por app en monorepo
- `/deps-audit` — gestión de versions alineadas
- `/api-docs` — generar SDK/types desde OpenAPI
- `/changelog` — con changesets si se publican libs
