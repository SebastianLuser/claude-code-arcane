---
name: deps-audit
description: "Audit dependencies: outdated packages, vulnerabilities, unused deps, license compliance."
category: "operations"
argument-hint: "[full|security|outdated|unused|licenses]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Dependencies Audit

Auditoría completa de dependencias del proyecto.

## Process

### 1. Detectar package manager

| Manager | Archivo | Comando outdated | Comando audit |
|---------|---------|-----------------|---------------|
| Go modules | `go.mod` | `go list -m -u all` | `govulncheck ./...` |
| npm | `package.json` | `npm outdated` | `npm audit` |
| yarn | `yarn.lock` | `yarn outdated` | `yarn audit` |
| pnpm | `pnpm-lock.yaml` | `pnpm outdated` | `pnpm audit` |
| pip | `requirements.txt` | `pip list --outdated` | `pip-audit` / `safety check` |
| poetry | `pyproject.toml` | `poetry show --outdated` | `poetry audit` |
| cargo | `Cargo.toml` | `cargo outdated` | `cargo audit` |

### 2. Checks a ejecutar

#### A. Vulnerabilidades conocidas
Ejecutar el audit tool del package manager. Clasificar por severidad: critical, high, medium, low.

#### B. Dependencias desactualizadas
- **Major version atrás** → riesgo de incompatibilidad + parches de seguridad faltantes
- **Minor version atrás** → features y fixes disponibles
- **Patch atrás** → bugfixes disponibles

#### C. Dependencias no usadas
```bash
# Go
go mod tidy -v 2>&1 | grep "unused"

# Node (con depcheck)
npx depcheck 2>/dev/null

# Manual: buscar imports
```

#### D. Lock file
- Existe lock file? (`go.sum`, `package-lock.json`, `yarn.lock`, `poetry.lock`)
- Está en git?
- Está sincronizado con el manifest?

#### E. Typosquatting
Para cada dependencia **directa**, buscar nombres que imitan a un paquete conocido: una letra de más o de menos (`expresss`, `lodahs`), separador cambiado (`python-dateutil` vs `dateutil`), scope falso (`@types-node/x`). Ante la duda:
```bash
npm view <pkg> time.created maintainers repository   # creado hace días, 1 maintainer, sin repo → sospechoso
npm view <pkg> scripts                               # postinstall en una librería que no compila nada → sospechoso
```
`npm audit signatures` verifica las firmas del registry y la provenance de lo instalado.

#### F. Diff del lockfile
Si el audit corre sobre una rama o un PR, comparar el lockfile contra la base:
```bash
git diff <base> -- package-lock.json pnpm-lock.yaml yarn.lock go.sum poetry.lock
```
Señales: paquetes nuevos que nadie agregó al manifest, `resolved` apuntando a otro host que el registry, `integrity` que cambia sin cambio de versión. En CI: `lockfile-lint --path package-lock.json --allowed-hosts npm --validate-https`.

Para defensas de instalación (scripts, edad mínima de versión) y la respuesta ante un paquete comprometido: `/supply-chain-security`.

### 3. Reporte

```markdown
# Dependencies Audit — [proyecto] — [fecha]
**Package manager:** [go/npm/pip/etc.]
**Total dependencias:** [N directas, M transitivas]

## Estado: [CLEAN / WARNINGS / CRITICAL]

## Vulnerabilidades
| Severidad | Paquete | Versión actual | Fix disponible | CVE |
|-----------|---------|---------------|----------------|-----|
| CRITICAL | pkg-x | 1.2.3 | 1.2.4 | CVE-2024-... |

## Desactualizadas (major)
| Paquete | Actual | Última | Cambio |
|---------|--------|--------|--------|

## Desactualizadas (minor/patch)
| Paquete | Actual | Última |
|---------|--------|--------|

## No usadas
| Paquete | Evidencia |
|---------|-----------|

## Typosquatting y lockfile
| Paquete | Señal | Acción |
|---------|-------|--------|

## Lock file
- Existe: [SI/NO]
- En git: [SI/NO]
- Sincronizado: [SI/NO]

## Recomendaciones
1. [Acción prioritaria + comando para ejecutar]
```

## Rules
- Priorizar vulnerabilidades CRITICAL y HIGH
- Para cada vulnerabilidad, incluir el comando de fix si es simple
- No ejecutar updates automáticos sin confirmación del usuario
- En español
