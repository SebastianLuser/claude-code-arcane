---
name: audit-game
description: "Full game project audit: compare GDD, spec docs and code. Detect contradictions, design gaps, balance issues and coherence problems."
category: "gamedev"
argument-hint: "[full|gdd|spec-docs|gdd-vs-code|balance|path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Task
---
# Game Document Audit

Auditoría integral de documentación y código para proyectos de desarrollo de videojuegos.

## Input

El usuario especifica qué auditar. Argumento opcional: `$ARGUMENTS` (e.g., "GDD", "spec-docs", "GDD vs code", "balance", o un path específico)

## Phase 1 — Detectar proyecto y documentos

1. Identificar el tipo de proyecto (Unity, Unreal, etc.) por la estructura de archivos
2. Buscar documentos de diseño:
   - GDD (Game Design Document) — buscar en raíz, `docs/`, `Documents/`, `Assets/Documents/`
   - Spec docs — buscar en `spec-docs/`, `specs/`, `design/`
   - Auditorías previas — buscar `*AUDIT*`, `*audit*`
3. Buscar código de gameplay en las carpetas del engine correspondiente
4. Si no encuentra documentos → preguntar al usuario dónde están

## Phase 2 — Gather Context

1. Leer el/los documento(s) target completamente
2. Leer documentos relacionados (specs, GDD, README del proyecto)
3. Leer auditorías previas si existen (para no repetir hallazgos ya resueltos)
4. Si se audita contra código: usar agents para explorar la implementación actual

## Phase 3 — Cross-Reference Analysis

Analizar 5 dimensiones: A) Contradicciones (CRITICAL), B) Gaps (HIGH), C) Coherencia (MEDIUM), D) Balance Red Flags (MEDIUM), E) Completitud milestone (HIGH).

> → Read references/cross-reference-criteria.md for detailed criteria per dimension, severity classification, and output format

## Phase 4 — Producir reporte

Guardar la auditoría en la ubicación apropiada del proyecto (junto al GDD o en `docs/`). Secciones: Resumen Ejecutivo, Contradicciones, Gaps, Coherencia, Balance, Decisiones Pendientes, Lo Que Está Bien, Próximos Pasos. Cada hallazgo en formato PAS condensado (5 líneas max).

> → Read references/output-template.md for full report template and finding format

## Rules
- Siempre en español
- CONCISO — cada hallazgo cabe en 5 líneas máximo
- Ser específico: citar nombres de sección, valores exactos
- Para cada problema, 1 solución concreta (no 5 opciones)
- Correr escenarios mentales para validar fórmulas y balance
- Si se compara contra código, usar agents para leer la implementación real
- Priorizar problemas por impacto en el desarrollo
- Reconocer lo que está bien diseñado, no solo lo que está roto
