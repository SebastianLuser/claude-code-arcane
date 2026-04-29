---
name: audit-dev
description: "Auditoría integral de software: arquitectura, código, tests, seguridad, docs y deuda técnica."
category: "workflow"
argument-hint: "[full|architecture|security|quality|api|deps]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Task
---
# Software Development Audit

## Input

Arg: `full` (default), `architecture`, `security`, `quality`, `api`, `deps`, o path específico.

## Phase 1 — Detectar stack y estructura

Identificar lenguajes/frameworks/package manager. Leer configs raíz. Mapear carpetas. Identificar CI/CD. Leer README/docs.

## Phase 2 — Análisis por dimensión (agents en paralelo)

| Dimensión | Severidad | Qué buscar |
|-----------|-----------|------------|
| Arquitectura | CRITICAL | Convenciones del stack, separación responsabilidades, circular deps, entry point claro, patrones consistentes, config hardcoded, error handling |
| Calidad código | HIGH | Código muerto, duplicación, funciones >50 líneas, complejidad ciclomática, naming inconsistente, TODOs abandonados, magic numbers, errores ignorados |
| Testing | HIGH | Existencia y cobertura, unit/integration/e2e balance, tests útiles (comportamiento no implementación), flaky/estado global, fixtures, facilidad de ejecución |
| Seguridad | CRITICAL | Secrets en código, input validation, SQL injection, XSS, auth/authz, CORS, deps vulnerables, rate limiting |
| API/Contratos | MEDIUM | Documentación (OpenAPI), naming consistente, error responses estándar, versionado, validation, paginación |
| Dependencias/Infra | MEDIUM | Deps desactualizadas/no usadas, lock file, Docker (base images, multi-stage), CI pipeline (tests, lint, security) |
| Documentación | LOW | README útil, API docs, ADRs, onboarding posible |

## Phase 3 — Producir reporte

Guardar como `AUDIT.md` en raíz. Secciones: fecha/stack/estado general, resumen ejecutivo (3-5 oraciones), scorecard (tabla dimensión/estado OK-WARN-CRIT/nota), hallazgos críticos, hallazgos importantes, observaciones, lo que está bien, plan de acción recomendado, detalles por dimensión con evidencia (paths, líneas).

## Rules

- Español siempre. Citar file paths y líneas
- Solución concreta por problema
- Agents en paralelo por dimensión
- NO over-engineering (100% coverage, DI frameworks)
- Calibrar al tamaño/etapa del proyecto
- Priorizar por impacto real, no purismo
- Reconocer lo bien hecho
