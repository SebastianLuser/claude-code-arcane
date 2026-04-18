---
name: doc-rfc
description: "Genera documentación técnica RFC: épicas, historias de usuario (HU) y tareas (T) siguiendo el formato de Alizia-BE. Estructura jerárquica con decisiones, specs y acceptance criteria. Usar cuando se mencione: RFC, documentación técnica, épica, historia de usuario, spec, desglose técnico."
argument-hint: "[rfc-title or feature-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
---
# RFC Documentation Generator — Estilo Alizia-BE

Genera documentación técnica estructurada siguiendo el formato RFC de Alizia-BE: Épicas → Historias de Usuario → Tareas.

## Input

Preguntar al usuario:
1. **Qué documentar** (nueva feature, sistema, refactor, migración)
2. **Nombre del proyecto** (para la carpeta `docs/rfc-{proyecto}/`)
3. **Nivel de detalle** — `epic` (solo épica), `stories` (épica + HUs), `full` (épica + HUs + tareas)
4. **Contexto técnico** (stack, dependencias, restricciones)

## Estructura de carpetas

```
docs/rfc-{proyecto}/
├── decisiones/                    # Decision logs
│   └── comparativa-{tema}.md      # Comparativas técnicas
├── epicas/
│   └── {NN}-{nombre-slug}/
│       ├── {NN}-{nombre-slug}.md  # Épica overview
│       └── HU-{N}.{M}-{nombre}/
│           ├── HU-{N}.{M}-{nombre}.md  # Historia de usuario
│           └── tareas/
│               ├── T-{N}.{M}.1-{nombre}.md
│               ├── T-{N}.{M}.2-{nombre}.md
│               └── ...
└── operaciones/
    └── {tema}.md                  # Guides operativos
```

## Templates

### Épica

```markdown
# Épica {N}: {Título}

> {One-liner: qué problema resuelve}

**Estado:** ⏳ Pendiente / 🔄 En progreso / ✅ Completada
**Fase de implementación:** Fase {N}
**Proyecto:** {KEY}

## Problema
{Contexto + pain point que motiva esta épica. Qué pasa hoy y por qué es un problema.}

## Objetivos
- {Objetivo 1 — medible si es posible}
- {Objetivo 2}
- {Objetivo 3}

## Alcance MVP

**Incluye:**
- {Feature/capacidad 1}
- {Feature/capacidad 2}

**No incluye (futuro):**
- {Feature excluida 1}
- {Feature excluida 2}

## Stack tecnológico

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| {componente} | {tech} | {por qué esta opción} |

## Arquitectura

{Diagrama o descripción de la arquitectura propuesta}

```
[Diagrama ASCII o referencia a diagrama]
```

## Historias de usuario

| # | Historia | Descripción | Fase | Tareas |
|---|---------|-------------|------|--------|
| HU-{N}.1 | {Título} | {Como [rol], necesito [feature], para [beneficio]} | {N} | {count} |
| HU-{N}.2 | {Título} | {Como [rol], necesito...} | {N} | {count} |

## Decisiones técnicas

1. **{Decisión 1}:** {Opción elegida} — {Razón}
2. **{Decisión 2}:** {Opción elegida} — {Razón}

## Principios de diseño

- {Principio 1 — guía para decisiones futuras}
- {Principio 2}

## Épicas relacionadas

- [{Nombre épica}]({link relativo})

## Test cases asociados

- {N}.1: {Descripción del test de aceptación}
- {N}.2: {Descripción}
```

### Historia de Usuario

```markdown
# HU-{N}.{M}: {Título}

> Como {rol}, necesito {feature}, para {beneficio}

**Épica:** [{Nombre épica}](../{NN}-{slug}/{NN}-{slug}.md)
**Fase:** {N} — {Nombre de fase}
**Prioridad:** Alta / Media / Baja
**Estimación:** — (a definir en planning)

## Criterios de aceptación

- [ ] {Criterio 1 — verificable, específico}
- [ ] {Criterio 2}
- [ ] {Criterio 3}

## Diseño técnico

### Endpoints (si aplica)

| Método | Ruta | Descripción |
|--------|------|-------------|
| {GET/POST} | /api/v1/{resource} | {qué hace} |

### Modelos de datos (si aplica)

```go
type {Entity} struct {
    ID   int64  `json:"id"`
    Name string `json:"name"`
}
```

### Flujo

```
{Diagrama del flujo de la feature}
```

## Tareas

| # | Tarea | Archivo(s) | Estado |
|---|-------|-----------|--------|
| T-{N}.{M}.1 | {Título} | {archivos afectados} | ⏳ |
| T-{N}.{M}.2 | {Título} | {archivos} | ⏳ |

## Dependencias

- {Dependencia 1 — qué se necesita antes de empezar}
- {Dependencia 2}

## Test cases

- {N}.{M}.1: {Descripción del test case}
- {N}.{M}.2: {Descripción}

## Notas

- {Nota relevante para el implementador}
```

### Tarea

```markdown
# T-{N}.{M}.{P}: {Título}

> {Qué hay que hacer en 1 oración}

**HU:** [HU-{N}.{M}](../HU-{N}.{M}-{slug}/HU-{N}.{M}-{slug}.md)
**Aceptación:** {Cuándo está lista esta tarea — 1 oración}
**Archivo(s):** {Paths de los archivos a crear/modificar}

## Pasos

1. {Paso 1 — accionable y concreto}
2. {Paso 2}
3. {Paso 3}

## Código de referencia

```{lang}
// Ejemplo de lo que hay que implementar
```

## Tests

- [ ] {Test unitario 1}
- [ ] {Test de integración 1}

## Notas

- {Consideración técnica}
- {Edge case a tener en cuenta}
```

### Decisión técnica

```markdown
# Decisión: {Título}

**Fecha:** {fecha}
**Estado:** ✅ Decidido / 🔄 En discusión / ⏳ Pendiente
**Contexto:** {Por qué hay que tomar esta decisión}

## Opciones

### Opción A: {Nombre}

| Aspecto | Detalle |
|---------|---------|
| Pros | {ventajas} |
| Contras | {desventajas} |
| Costo | {esfuerzo/complejidad} |
| Ejemplo | {tech/tool/library} |

### Opción B: {Nombre}

| Aspecto | Detalle |
|---------|---------|
| Pros | {ventajas} |
| Contras | {desventajas} |
| Costo | {esfuerzo/complejidad} |
| Ejemplo | {tech/tool/library} |

## Decisión

**Elegimos: Opción {X}**

**Razón:** {Justificación principal}

## Consecuencias

- {Qué implica esta decisión para el futuro}
- {Qué opciones cierra}
```

## Numeración

- Épicas: `00`, `01`, `02`, ... (2 dígitos, orden cronológico)
- Historias: `HU-{épica}.{secuencial}` → `HU-0.1`, `HU-0.2`, `HU-1.1`
- Tareas: `T-{épica}.{HU}.{secuencial}` → `T-0.1.1`, `T-0.1.2`, `T-1.2.3`

## Rules
- Siempre en español
- Cada criterio de aceptación debe ser verificable (si/no, no ambiguo)
- Las tareas deben ser lo suficientemente pequeñas para 1 PR
- Incluir paths de archivos cuando sea posible
- Incluir código de referencia en tareas cuando ayude
- Los tests de aceptación van en la HU, los tests unitarios en la tarea
- Decisiones técnicas siempre con al menos 2 opciones comparadas
- Links relativos entre documentos (no absolutos)
- Si el proyecto ya tiene épicas → numerar la nueva secuencialmente
