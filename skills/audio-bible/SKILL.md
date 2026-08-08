---
name: audio-bible
description: "Audio Bible authoring: sonic palette, emotional targets per game state, frequency allocation, mix hierarchy, audio standards. Usar para: direccion de audio, paleta sonora, identidad sonora del juego."
category: "audio"
argument-hint: "[full|core|standards]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# audio-bible — Sonic Identity Specification

Define la identidad sonora del juego. Toda produccion de audio se gatea contra este documento — es el equivalente auditivo de `/art-bible`.

## Cuándo usar

- Después de tener game concept aprobado, antes de producir un solo sonido
- Cuando necesitás estandarizar el criterio sonoro entre sound designers y compositores
- Antes de escribir specs de SFX (`/audio-spec`) o diseñar el sistema de música (`/adaptive-music`)

## Input

1. Leer game concept (elevator pitch, pilares, core fantasy) y art bible si existe
2. Preguntar al usuario: scope (full bible / core secciones 1-4 / solo standards), plataformas target, y referencias sonoras (juegos, films, discos)
3. Si ya existe audio bible: detectar secciones completas vs vacías, trabajar solo las incompletas

---

## Secciones del Audio Bible

### Core (secciones 1-4) — definen el lenguaje sonoro

| # | Sección | Qué define | Criterio de calidad |
|---|---------|-----------|-------------------|
| 1 | **Sonic Identity Statement** | Regla sonora de 1 línea + 2-3 principios de soporte | Resuelve cualquier ambigüedad sonora. Cada principio ancla en un pilar del juego |
| 2 | **Emotional Targets por Game State** | Qué debe sentir el jugador en exploración, combate, tensión, victoria, menú | Cada estado auditivamente distinto sin mirar la pantalla |
| 3 | **Sonic Palette** | Fuentes y texturas: acústico vs sintético, orgánico vs procesado, época/lugar, vocabulario tímbrico | Un sonido nuevo se puede aceptar o rechazar leyendo esto |
| 4 | **Frequency Allocation** | Qué categoría es dueña de qué banda — evita masking antes de que exista el mix | Diálogo, música, SFX y ambiente no compiten por la misma banda |

### Production (secciones 5-8) — reglas concretas

| # | Sección | Qué define |
|---|---------|-----------|
| 5 | **Mix Hierarchy** | Prioridad entre categorías, qué duckea a qué, qué nunca se pisa |
| 6 | **Music Direction** | Instrumentación, escalas/modos, tempo range, rol del silencio, estrategia adaptativa |
| 7 | **SFX Direction** | Filosofía de impacto, realismo vs estilización, tratamiento del feedback de UI, uso de variación |
| 8 | **Audio Standards** | Sample rate, bit depth, formatos, naming, targets de loudness, budgets de memoria y voces por plataforma |

### Reference (sección 9)

| # | Sección | Qué define |
|---|---------|-----------|
| 9 | **References & Prohibitions** | 3-5 referencias con qué tomar y qué evitar de cada una. Prohibiciones sonoras explícitas |

---

## Frequency allocation — el punto que más se saltea

La mayoría de los mixes de juego se rompen porque nadie asignó bandas antes de producir. Definir dueño primario por banda evita rehacer assets:

| Banda | Dueño primario | Nota |
|---|---|---|
| Sub (20-60 Hz) | Impactos, explosiones | Reservado, no lo llenes de música |
| Low (60-250 Hz) | Música (bajo, kick), body de impactos | Zona de masking más frecuente |
| Low-mid (250-500 Hz) | Ambiente, body de props | Acumula barro si no se controla |
| Mid (500 Hz-2 kHz) | **Diálogo** — intocable | El resto cede acá |
| High-mid (2-6 kHz) | Feedback de UI, transientes, definición | Fatiga rápido; usar con precisión |
| High (6-20 kHz) | Aire, detalle, brillo | Primero en irse en compresión lossy |

Cuando un asset nuevo pelea una banda que no le corresponde, la solución es de diseño (cambiar la fuente), no de EQ.

---

## Proceso

Para cada sección:
1. **Draftar** basándose en game concept, pilares y referencias
2. **Presentar** al usuario para review
3. **Escribir** a archivo inmediatamente después de aprobación — preguntar "¿Escribo esta sección a `<path>`?" antes de usar Write

No batchear — escribir cada sección aprobada antes de pasar a la siguiente.

### Conflictos

Si hay tensión entre dirección de audio y constraints técnicos (ej: música en stems para adaptatividad, pero el budget de memoria no da), surfacear el conflicto explícitamente con ambas posiciones. No resolver silenciosamente.

Si la dirección sonora conflictúa con accesibilidad (ej: información crítica solo por audio), surfacear y dejar que el usuario decida.

---

## Principios

- El audio bible es un **documento de restricción**: narrows solution space en favor de coherencia sonora
- Cada sección debe conectar con los pilares del juego
- Específico > genérico: "dark and tense" no alcanza — decir la emoción exacta, la fuente tímbrica, el rango de frecuencia, un elemento sonoro que carga el mood
- Para cada referencia: qué tomar Y qué evitar
- El silencio es una decisión de diseño, no la ausencia de una — documentarlo
- Los standards deben ser producibles: un contractor externo debería poder entregar assets válidos sin briefing adicional

---

## Anti-patterns

> → Read references/anti-patterns.md for common mistakes to avoid

## Verdict

Al cerrar el documento, emitir un verdict por sección:

- **READY** — la sección resuelve ambigüedades y es accionable para producción
- **CONCERNS** — está escrita pero es genérica o no ancla en pilares; listar qué falta
- **BLOCKED** — falta input upstream (game concept, plataformas, budget) que no se puede inventar

Si alguna sección Core (1-4) queda en BLOCKED, el bible no habilita producción todavía.

## Next steps

- `/audio-spec` para bajar la dirección a spec sheets de SFX y event lists
- `/adaptive-music` para diseñar el sistema de música contra los emotional targets de la sección 2
- `/audio-mix` para implementar la mix hierarchy de la sección 5
- `/audio-audit` para verificar assets producidos contra los standards de la sección 8
