---
name: art-bible
description: "Art Bible: identidad visual, mood, shape language, color system, character/environment direction, UI visual, asset standards, referencias. Define la identidad visual que gate toda la producción de assets. Usar para: art bible, dirección de arte, visual identity, paleta, style guide, asset standards."
argument-hint: "[full|core|standards]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# art-bible — Visual Identity Specification

Define la identidad visual del juego. Toda producción de assets se gatean contra este documento.

## Cuándo usar

- Después de tener game concept aprobado, antes de producción de assets
- Cuando necesitás estandarizar el estilo visual entre artistas
- Antes de generar asset specs (`/asset-spec`)

## Input

1. Leer game concept (elevator pitch, pilares, core fantasy)
2. Preguntar al usuario: scope (full bible / core sections 1-4 / solo asset standards) y referencias visuales (juegos, films, arte)
3. Si ya existe art bible: detectar secciones completas vs vacías, trabajar solo las incompletas

---

## Secciones del Art Bible

### Core (secciones 1-4) — definen el lenguaje visual

| # | Sección | Qué define | Criterio de calidad |
|---|---------|-----------|-------------------|
| 1 | **Visual Identity Statement** | Regla visual de 1 línea + 2-3 principios de soporte | Resuelve cualquier ambigüedad visual. Cada principio ancla en un pilar |
| 2 | **Mood & Atmosphere** | Emotional target por game state (exploración, combate, menú...) | Lighting, temperatura de color, contraste, energía. Cada estado visualmente distinto |
| 3 | **Shape Language** | Vocabulario geométrico (siluetas, environment geometry, UI shapes) | Readable a thumbnail size. Hero shapes vs supporting shapes |
| 4 | **Color System** | Paleta primaria (5-7 colores con roles), colores semánticos, UI palette | Cada color tiene significado explícito. Colorblind safety con backup cues |

### Production (secciones 5-8) — reglas concretas para producción

| # | Sección | Qué define |
|---|---------|-----------|
| 5 | **Character Design** | Archetypes, distinguishing features por tipo, expression style, LOD philosophy |
| 6 | **Environment Design** | Estilo arquitectónico, texture philosophy, prop density, environmental storytelling |
| 7 | **UI/HUD Direction** | Diegetic vs screen-space, typography, iconography style, animation feel |
| 8 | **Asset Standards** | Formatos, naming, texture res tiers, polycount budgets, export settings |

### Reference (sección 9)

| # | Sección | Qué define |
|---|---------|-----------|
| 9 | **References & Prohibitions** | 3-5 referencias con qué tomar y qué evitar de cada una. Style prohibitions explícitas |

---

## Proceso

Para cada sección:
1. **Draftar** basándose en game concept, pilares y referencias
2. **Presentar** al usuario para review
3. **Escribir** a archivo inmediatamente después de aprobación

No batchear — escribir cada sección aprobada antes de pasar a la siguiente.

### Conflictos

Si hay tensión entre dirección artística y constraints técnicos (ej: art quiere texturas 4K pero performance budget requiere 2K), surfacear el conflicto explícitamente con ambas posiciones. No resolver silenciosamente.

Si UI direction conflicta con readability/accessibility, surfacear y dejar que el usuario decida.

---

## Principios

- El art bible es un **documento de restricción**: narrows solution space en favor de coherencia visual
- Cada sección debe conectar con los pilares del juego
- Específico > genérico: "dark and foreboding" no alcanza — decir la emoción exacta, lighting, contraste, un elemento visual que carga el mood
- Para cada referencia: qué tomar Y qué evitar (prevenir el "trying to copy X")
- Asset standards deben ser producibles — un equipo externo debería poder seguirlas sin briefing adicional

---

## Anti-patterns

- Art bible sin connection a pilares del juego — restricciones arbitrarias
- Color system sin semántica — hex codes sin explicar qué significa cada color
- Asset standards vagos ("high quality textures") en lugar de números (512px tier 2)
- Referencias sin especificar qué tomar de cada una — "like Hades" no dice nada
- Ignorar colorblind safety
- Secciones core no completadas antes de empezar production sections

---

## Checklist

```markdown
### Core
- [ ] Visual Identity Statement (1-line rule + principles)
- [ ] Mood targets por game state (emoción, lighting, contraste)
- [ ] Shape language (siluetas, geometry, UI shapes)
- [ ] Color system (paleta + semántica + colorblind backup)

### Production
- [ ] Character design direction
- [ ] Environment design language
- [ ] UI/HUD visual direction
- [ ] Asset standards con números concretos

### Reference
- [ ] 3-5 referencias con qué tomar y qué evitar
- [ ] Style prohibitions explícitas
```
