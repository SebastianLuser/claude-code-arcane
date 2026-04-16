---
name: audit-dev
description: "Auditoría integral para proyectos de desarrollo de software. Revisa arquitectura, código, tests, seguridad, documentación y deuda técnica. Usar cuando se mencione: auditar proyecto, revisar código, audit, code review, tech debt, security audit, o cualquier revisión integral de un proyecto de software."
---

# Software Development Audit

Auditoría integral de código, arquitectura y prácticas para proyectos de desarrollo de software.

## Input

El usuario especifica qué auditar. Argumento opcional: `$ARGUMENTS`

Opciones:
- `full` — auditoría completa (default)
- `architecture` — solo arquitectura y estructura
- `security` — solo seguridad
- `quality` — solo calidad de código y tests
- `api` — solo contratos de API y endpoints
- `deps` — solo dependencias y vulnerabilidades
- Un path específico — auditar solo ese módulo/carpeta

## Phase 1 — Detectar stack y estructura

1. Identificar lenguaje(s), framework(s), package manager
2. Leer archivos de configuración raíz: `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `docker-compose.yml`, etc.
3. Mapear estructura de carpetas (src/, lib/, tests/, etc.)
4. Identificar CI/CD: `.github/workflows/`, `Dockerfile`, deploy configs
5. Leer README y docs existentes para entender el contexto del proyecto

## Phase 2 — Análisis por dimensión

Usar agents en paralelo para cubrir cada dimensión:

### A. Arquitectura y estructura (CRITICAL)

- Organización del proyecto sigue convenciones del stack?
- Separación de responsabilidades clara? (controllers/services/repos, handlers/models, etc.)
- Hay circular dependencies?
- El entry point es claro? Se entiende el flujo de arranque?
- Patrones consistentes? (si usa repository pattern en un lugar, lo usa en todos?)
- Configuración: hardcoded values vs env vars vs config files
- Hay un patrón claro de error handling?

### B. Calidad de código (HIGH)

- Código muerto (funciones/archivos no referenciados)
- Duplicación significativa (misma lógica en múltiples lugares)
- Funciones/métodos excesivamente largos (>50 líneas como red flag)
- Complejidad ciclomática alta (muchos if/switch anidados)
- Naming inconsistente
- TODOs/FIXMEs/HACKs abandonados
- Magic numbers o strings hardcodeados
- Manejo de errores: se ignoran errores? se loguean? se propagan?

### C. Testing (HIGH)

- Existen tests? Qué porcentaje del código cubren?
- Tests unitarios vs integration vs e2e — qué hay y qué falta?
- Los tests son útiles? (testean comportamiento, no implementación)
- Hay tests flaky o que dependen de orden/estado global?
- Test fixtures/factories están organizados?
- Se pueden correr fácilmente? (`npm test`, `go test ./...`, etc.)

### D. Seguridad (CRITICAL)

- Secrets en código o config versionado? (.env en git, API keys hardcoded)
- Input validation en boundaries (API endpoints, form handlers)
- SQL injection posible? (queries construidas con string concat)
- XSS posible? (user input renderizado sin sanitizar)
- Auth/authz implementado correctamente?
- CORS configurado apropiadamente?
- Dependencies con vulnerabilidades conocidas? (npm audit, go vuln, etc.)
- Rate limiting en endpoints públicos?

### E. API y contratos (MEDIUM)

- Endpoints documentados? (OpenAPI/Swagger, README, comments)
- Consistencia en naming de endpoints y respuestas
- Error responses estandarizados?
- Versionado de API?
- Validación de request bodies?
- Paginación implementada para list endpoints?

### F. Dependencias y infra (MEDIUM)

- Dependencias desactualizadas (major versions atrás)
- Dependencias no usadas (instaladas pero no importadas)
- Lock file en git? (package-lock.json, go.sum, etc.)
- Docker: imágenes base actualizadas? Multi-stage builds?
- CI/CD: pipeline corre tests? Tiene lint? Tiene security checks?

### G. Documentación (LOW)

- README útil? (setup, run, test, deploy)
- API documentada?
- Decisiones arquitectónicas documentadas? (ADRs)
- Onboarding: un dev nuevo puede arrancar con lo que hay?

## Phase 3 — Producir reporte

Guardar en la raíz del proyecto como `AUDIT.md`:

```markdown
# Auditoría de Proyecto — [nombre] — [fecha]
**Fecha:** [hoy]
**Stack:** [lenguajes, frameworks, infra]
**Estado general:** [SALUDABLE / NECESITA ATENCIÓN / CRÍTICO]

## RESUMEN EJECUTIVO
[3-5 oraciones: estado general, riesgos principales, fortalezas, próximo paso]

## SCORECARD

| Dimensión | Estado | Nota |
|-----------|--------|------|
| Arquitectura | OK / WARN / CRIT | breve |
| Calidad de código | OK / WARN / CRIT | breve |
| Testing | OK / WARN / CRIT | breve |
| Seguridad | OK / WARN / CRIT | breve |
| API/Contratos | OK / WARN / CRIT | breve |
| Dependencias | OK / WARN / CRIT | breve |
| Documentación | OK / WARN / CRIT | breve |

## HALLAZGOS CRÍTICOS
[Los que hay que arreglar YA — seguridad, data loss, crashes]

## HALLAZGOS IMPORTANTES
[Los que hay que planificar — deuda técnica, gaps de testing, inconsistencias]

## OBSERVACIONES
[Mejoras nice-to-have, sugerencias de refactor, optimizaciones]

## LO QUE ESTÁ BIEN
[Reconocer buenas prácticas, código limpio, buenas decisiones]

## PLAN DE ACCIÓN RECOMENDADO
[Action items priorizados: qué hacer primero, segundo, tercero]

## DETALLES POR DIMENSIÓN
[Secciones expandidas con evidencia específica: paths, líneas, ejemplos]
```

## Rules
- Siempre en español
- Ser específico: citar file paths, líneas, ejemplos de código
- Para cada problema, sugerir una solución concreta con ejemplo
- Usar agents en paralelo para analizar distintas dimensiones
- NO recomendar over-engineering (100% coverage, DI frameworks, etc.)
- Calibrar recomendaciones al tamaño y etapa del proyecto (startup vs enterprise)
- Priorizar hallazgos por impacto real, no por purismo
- Reconocer lo que está bien hecho
- Si el proyecto es pequeño/MVP, ajustar expectativas
