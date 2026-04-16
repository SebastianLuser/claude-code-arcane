---
name: deploy-check
description: "Pre-deploy checklist automatizada: tests, secrets, migrations, env vars, build, lint. Usar cuando se mencione: deploy, pre-deploy, deploy check, antes de subir, checklist de deploy, vamos a producción."
---

# Pre-Deploy Checklist

Verificación automatizada antes de hacer deploy.

## Process

Ejecutar todos los checks en paralelo donde sea posible:

### 1. Git Status
```bash
git status --short
git log --oneline -5
```
- Branch actual
- Hay cambios sin commitear?
- Está actualizado con remote?

### 2. Tests
Detectar test runner y ejecutar:

| Stack | Comando |
|-------|---------|
| Go | `go test ./...` |
| Node | `npm test` / `yarn test` / `pnpm test` |
| Python | `pytest` / `python -m pytest` |
| Unity | (skip — no CLI tests) |

### 3. Build
| Stack | Comando |
|-------|---------|
| Go | `go build ./...` |
| Node/TS | `npm run build` / `tsc --noEmit` |
| Python | (skip) |
| Docker | `docker build .` (dry run) |

### 4. Lint
| Stack | Comando |
|-------|---------|
| Go | `golangci-lint run` (si existe .golangci.yml) |
| Node | `npm run lint` (si existe script) |
| Python | `ruff check .` / `flake8` |

### 5. Secrets Check
```bash
# Buscar patterns de secrets en código trackeado
git diff --cached --name-only | xargs grep -l -i "password\|secret\|api_key\|token" 2>/dev/null
```
- Archivos .env trackeados?
- API keys hardcoded?
- Credentials en código?

### 6. Migrations
- Hay migrations pendientes de aplicar?
- Hay migrations nuevas sin commitear?
- Las migrations tienen down/rollback?

### 7. Dependencies
```bash
# Go
go mod tidy && git diff go.mod go.sum

# Node
npm audit --production

# Python
pip-audit 2>/dev/null || safety check 2>/dev/null
```

### 8. ENV Vars
- Todas las env vars requeridas están en el entorno de deploy?
- Comparar .env.example vs configuración de deploy

### Reporte

```markdown
# Pre-Deploy Check — [proyecto] — [fecha]
**Branch:** [branch]
**Target:** [production/staging]

| Check | Estado | Detalle |
|-------|--------|---------|
| Git limpio | PASS/FAIL | cambios sin commitear |
| Tests | PASS/FAIL | X passed, Y failed |
| Build | PASS/FAIL | compila correctamente |
| Lint | PASS/FAIL | N warnings, M errors |
| Secrets | PASS/FAIL | no secrets en código |
| Migrations | PASS/FAIL | N pendientes |
| Dependencies | PASS/WARN | N vulnerabilidades |
| Env vars | PASS/WARN | M faltantes |

## Resultado: [READY TO DEPLOY / BLOCKERS FOUND]

### Blockers (si hay)
1. [Descripción del blocker + cómo solucionarlo]
```

## Rules
- Si algún check FALLA → el resultado es BLOCKERS FOUND
- No ejecutar tests si no hay test suite (marcar como SKIP)
- En español
- Ser específico en los errores: qué archivo, qué línea, qué fix
