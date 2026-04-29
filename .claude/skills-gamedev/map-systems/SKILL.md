---
name: map-systems
description: "Decompose game concept into systems, map dependencies, prioritize design order, generate systems index."
category: "gamedev"
argument-hint: "[next | system-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# map-systems — Systems Decomposition

Descompone un concepto de juego en sistemas, mapea dependencias y prioriza el orden de diseño.

## Modos

- `/map-systems` — Workflow completo (enumerar → dependencias → priorizar → escribir index)
- `/map-systems next` — Seleccionar siguiente sistema no diseñado del index
- `/map-systems [name]` — Diseñar sistema específico

---

## Phase 1: Contexto

**Requerido:** game concept (buscar en `design/gdd/`, `Documents/`, raíz). Si no existe → pedir al usuario.

**Opcional:** game pillars, systems index existente (resumir, no recrear), GDDs ya escritos.

Si el index ya existe: presentar estado actual, preguntar qué hacer (actualizar, diseñar siguiente, revisar prioridades).

---

## Phase 2: Enumerar sistemas

### Explícitos

Extraer de: Core Mechanics, Core Loop, Technical Considerations, MVP Definition.

### Implícitos — inference patterns

> → Read references/implicit-systems.md for [tabla de heurísticas: sistema mencionado → sistemas implícitos]

Presentar cada sistema con: nombre, categoría, 1-line description, explícito vs implícito.

**Validar con usuario antes de continuar.**

---

## Phase 3: Dependencias → Phase 4: Priorizar

> → Read references/dependency-layers-priorities.md for [heurísticas de dependencia, layers, risk detection, priority tiers y design order]

**Validar con usuario antes de continuar** (tanto dependencias como prioridades).

---

## Phase 5: Escribir systems index

Crear tabla con: nombre, categoría, layer, priority tier, dependencias, status, design order.

Antes de escribir, presentar resumen:
- Total por categoría y tier
- Primeros 3 en design order
- Sistemas high-risk (bottlenecks)

Pedir aprobación explícita antes de escribir archivo.

---

## Phase 6: Diseñar sistemas

Seleccionar sistema (por nombre, o `next` = mayor prioridad sin diseñar) → handoff a `/design-system [name]`.

Después de cada GDD completado: ofrecer continuar con siguiente o parar.

---

## Protocolo

- **Nunca** auto-generar lista completa sin review del usuario
- **Nunca** empezar a diseñar sin confirmación
- **Siempre** validar enumeración, dependencias y prioridades
- **Pedir permiso** antes de escribir archivos
- Si context window alcanza ~70%: guardar progreso, sugerir nueva sesión con `/map-systems next`
