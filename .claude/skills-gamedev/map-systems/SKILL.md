---
name: map-systems
description: "Descomponer concepto de juego en sistemas, mapear dependencias, priorizar orden de diseño, crear systems index. Usar para: systems decomposition, map systems, dependencias, priorización, systems index, game systems."
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

Cada sistema mencionado implica sistemas ocultos. Heurísticas:

| Mencionado | Implica |
|-----------|---------|
| Inventory | Item DB, equipment slots, capacity, inventory UI, serialización save/load |
| Combat | Damage calc, health, hit detection, status effects, enemy AI, combat UI, death/respawn |
| Open world | Streaming/chunking, LOD, fast travel, minimap, world state persistence |
| Multiplayer | Networking, lobby/matchmaking, state sync, anti-cheat, network UI |
| Crafting | Recipe DB, gathering, crafting UI, success/failure, recipe discovery |
| Dialogue | Dialogue trees, dialogue UI, choice tracking, NPC state, localization hooks |
| Progression | XP, level-up, skill tree, unlock tracking, progression UI, save data |

Presentar cada sistema con: nombre, categoría, 1-line description, explícito vs implícito.

**Validar con usuario antes de continuar.**

---

## Phase 3: Dependencias

### Heurísticas

- **Input/output**: A produce datos que B necesita
- **Structural**: A provee framework donde B se conecta
- **UI**: cada sistema gameplay tiene UI que depende de él

### Layers (dependency order)

1. **Foundation** — cero dependencias (diseñar primero)
2. **Core** — depende solo de Foundation
3. **Feature** — depende de Core
4. **Presentation** — UI y feedback
5. **Polish** — meta-sistemas, tutoriales, analytics, accesibilidad

### Detectar riesgos

- **Circulares** → proponer resolución (interfaz, contrato, diseño simultáneo)
- **Bottlenecks** → muchos dependen de ellos = alto riesgo
- **Leaf nodes** → sin dependientes = bajo riesgo, diseñar tarde

**Validar con usuario antes de continuar.**

---

## Phase 4: Priorizar

### Asignación por tier

| Tier | Criterio |
|------|----------|
| **MVP** | Requerido para core loop + dependencias Foundation |
| **Vertical Slice** | Necesario para experiencia completa en un área |
| **Alpha** | Gameplay systems restantes |
| **Full Vision** | Polish, meta, nice-to-have |

### Design order

Combinar dependency layer + priority tier: MVP Foundation → MVP Core → MVP Feature → VS Foundation → ...

Columna "Why": mezclar necesidad técnica con experiencia de jugador. No solo "X depende de Y" — conectar con pilares y player experience.

**Validar con usuario antes de escribir.**

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
