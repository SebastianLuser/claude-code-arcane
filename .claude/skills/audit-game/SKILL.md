---
name: audit-game
description: "Auditoría integral para proyectos de juegos. Compara GDD, spec docs y código. Detecta contradicciones, gaps de diseño, problemas de balance y coherencia. Usar cuando se mencione: auditar juego, revisar GDD, audit game, balance check, o cualquier revisión de documentación de game design."
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

### A. Contradicciones (CRITICAL)
- **Doc vs Doc**: Comparar secciones del GDD contra spec docs. Flaggear donde describan la misma mecánica de forma diferente (fórmulas, valores, flujo, terminología).
- **Doc vs Code**: Comparar comportamiento documentado vs implementado. Flaggear donde el código hace algo diferente a lo que dicen los docs.
- **Contradicciones internas**: Flaggear donde el MISMO documento dice dos cosas diferentes sobre la misma mecánica.

Para cada contradicción:
```
| Aspecto | Fuente A dice | Fuente B dice | Severidad | Recomendación |
```

### B. Gaps y contenido faltante (HIGH)
- Secciones con [TBD], vacías o placeholder
- Mecánicas referenciadas pero nunca definidas
- Sistemas que dependen de decisiones no tomadas (dependencias bloqueantes)
- Fórmulas, valores o números de balance faltantes
- Items/enemigos/bosses listados sin stats concretos

Clasificar cada gap:
- **Bloqueante**: No se puede implementar sin esta decisión
- **Importante**: Debe definirse antes del vertical slice / milestone actual
- **Nice to have**: Puede esperar

### C. Coherencia y lógica (MEDIUM)
- El sistema tiene sentido lógico? (mecánica que contradice pilares del juego)
- Edge cases no cubiertos? ("qué pasa cuando X Y Z al mismo tiempo?")
- Las fórmulas producen valores razonables? Correr math mental con escenarios ejemplo
- Terminología consistente? (mismo concepto con nombres diferentes en distintos lugares)
- Las curvas de dificultad tienen sentido?

### D. Balance Red Flags (MEDIUM)
- Estrategias dominantes sin counterplay
- Opciones inútiles que son estrictamente peores que alternativas
- Mecánicas de snowball / death spiral
- Economía rota (items muy baratos/caros relativo al income)
- Ratios de daño/HP que hacen combates muy rápidos o muy lentos

### E. Completitud para milestone actual (HIGH)
- El scope del milestone/prototype lista todo lo necesario?
- Todos los sistemas en scope están definidos en el doc?
- Hay dependencias ocultas (Sistema A necesita Sistema B que no está en scope)?

## Phase 4 — Producir reporte

Guardar la auditoría en la ubicación apropiada del proyecto (junto al GDD o en `docs/`):

```markdown
# Auditoría del GDD — [fecha]
**Fecha:** [hoy]
**Estado:** [SALUDABLE / NECESITA ATENCIÓN / CRÍTICO]
**Scope:** [qué se auditó contra qué]

## RESUMEN EJECUTIVO
[2-3 oraciones: salud general, problema más grande, próximo paso recomendado]

## 1. CONTRADICCIONES
[Tabla, ordenada por severidad]

## 2. GAPS / CONTENIDO FALTANTE
[Agrupado por Bloqueante / Importante / Nice to Have]

## 3. COHERENCIA Y LÓGICA
[Issues de edge cases, terminología, lógica]

## 4. BALANCE RED FLAGS
[Problemas de balance con escenarios ejemplo]

## 5. DECISIONES PENDIENTES
[Lista priorizada con opciones y recomendaciones]

## 6. LO QUE ESTÁ BIEN
[Qué funciona bien — no solo criticar, reconocer buen diseño]

## 7. PRÓXIMOS PASOS
[Action items concretos, ordenados por prioridad]
```

## Formato de hallazgos

Cada hallazgo del reporte debe seguir formato PAS condensado (ver `/doc-pas`):

```markdown
### [Título del hallazgo] — [CRITICAL/HIGH/MEDIUM]

**Problema:** [1-2 oraciones: qué está mal y qué impacto tiene]
**Análisis:** [1-2 oraciones: por qué pasa]
**Solución:** [1-2 oraciones: qué hacer, con valores concretos]
```

NO escribir párrafos largos explicando el problema. NO divagar con recomendaciones genéricas. Bullet points y números concretos.

## Rules
- Siempre en español
- CONCISO — cada hallazgo cabe en 5 líneas máximo
- Ser específico: citar nombres de sección, valores exactos
- Para cada problema, 1 solución concreta (no 5 opciones)
- Correr escenarios mentales para validar fórmulas y balance
- Si se compara contra código, usar agents para leer la implementación real
- Priorizar problemas por impacto en el desarrollo
- Reconocer lo que está bien diseñado, no solo lo que está roto
