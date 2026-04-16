---
name: doc-gdd
description: "Genera un Game Design Document (GDD) completo siguiendo el formato de Project_T. Estructura profesional con glosario, core loop, sistemas, balance, economía. Usar cuando se mencione: GDD, game design document, documento de diseño, diseño de juego."
---

# GDD Generator — Estilo Project_T

Genera un Game Design Document completo y profesional, basado en el formato del Roguelite Dice Dungeon.

## Input

Preguntar al usuario:
1. **Nombre del juego** (o nombre tentativo)
2. **Género** (roguelite, RPG, puzzle, platformer, etc.)
3. **Plataforma** (PC, mobile, consola, web)
4. **Elevator pitch** (1-2 oraciones: qué es y qué lo hace único)
5. **Mecánica core** (qué hace el jugador el 80% del tiempo)
6. **Referentes** (juegos similares o inspiraciones)
7. **Tamaño del equipo y contexto** (tesis, indie, jam, estudio)

## Estructura del GDD

```markdown
# [Nombre del Juego] — Game Design Document
**Versión:** 0.1
**Fecha:** [fecha]
**Equipo:** [nombres]

---

## 1. Resumen del Juego

| Campo | Detalle |
|-------|---------|
| Género | [género] |
| Plataforma | [plataforma] |
| Engine | [Unity/Godot/Unreal] |
| Perspectiva | [isométrica/top-down/side-scroll] |
| Jugadores | [1/multijugador] |
| Sesión promedio | [X minutos] |
| Target audience | [descripción] |

## 2. Concepto (Elevator Pitch)

[2-3 oraciones que capturan la esencia del juego. Debe poder explicarse en 30 segundos.]

> "Es como [Referente A] pero con [diferenciador]. El jugador [acción core] para [objetivo]."

## 3. Pilares de Diseño

Los pilares definen la identidad del juego. Toda decisión de diseño debe alinearse con estos pilares.

1. **[Pilar 1]** — [explicación de 1 línea]
2. **[Pilar 2]** — [explicación]
3. **[Pilar 3]** — [explicación]

> **Test de pilar:** Si una feature no soporta al menos 1 pilar → no entra.

## 4. Dirección de Arte

### Estilo visual
[Descripción del estilo: pixel art, low-poly, cartoon, realista, etc.]

### Paleta de colores
| Elemento | Hex | Uso |
|----------|-----|-----|

### Referencias visuales
[Links a imágenes de referencia o moodboard]

## 5. Game Feel y Feedback Visual

1. **[Principio 1]** — [cómo se aplica]
2. **[Principio 2]** — [cómo se aplica]
3. **[Principio 3]** — [cómo se aplica]

## 6. Glosario

Terminología oficial del juego. Usar SIEMPRE estos términos en código, docs y UI.

| Término | Significado | NO usar |
|---------|-------------|---------|
| [Término 1] | [definición] | [alternativas prohibidas] |
| [Término 2] | [definición] | [alternativas prohibidas] |

## 7. Core Loop

```
[Diagrama del loop principal]
Ejemplo:
  Preparar → Explorar → Combatir → Recompensar → Preparar (repeat)
```

### Capas del loop

| Capa | Duración | Qué pasa |
|------|----------|----------|
| Micro (momento a momento) | segundos | [acción] |
| Medio (encuentro/nivel) | minutos | [progresión] |
| Macro (run/sesión) | X minutos | [meta-progresión] |

## 8. Sistema de [Mecánica Core]

### 8.1 Estructura del turno/round/acción

[Diagrama de flujo del sistema principal]

### 8.2 Mecánicas del jugador

[Detallar qué puede hacer el jugador, cuándo, y cómo]

### 8.3 Tablas de valores

| [Elemento] | [Stat 1] | [Stat 2] | [Stat 3] |
|------------|----------|----------|----------|

## 9. Sistema de Exploración / Niveles / Mundo

### 9.1 Generación
[Procedural? Hand-crafted? Híbrido?]

### 9.2 Tipos de [sala/nivel/zona]

| Tipo | Frecuencia | Contenido |
|------|-----------|-----------|

### 9.3 Progresión de dificultad

[Cómo escala la dificultad a lo largo del juego]

## 10. Enemigos / Obstáculos

### Tipos

| Nombre | HP | Daño | Comportamiento | Aparece en |
|--------|-----|------|---------------|------------|

### AI / Comportamiento

[Cómo se comportan los enemigos]

## 11. Items / Power-ups / Equipamiento

### Categorías

| Categoría | Efecto | Ejemplo |
|-----------|--------|---------|

### Balance de items

[Cómo se balancea la economía de items]

## 12. Economía y Progresión

### Recursos

| Recurso | Cómo se obtiene | Cómo se gasta |
|---------|----------------|---------------|

### Curva de progresión

[Cómo el jugador se vuelve más fuerte a lo largo del juego]

### Meta-progresión (si aplica)

[Qué persiste entre runs/sesiones]

## 13. UI/UX

### Pantallas

| Pantalla | Propósito | Elementos clave |
|----------|-----------|-----------------|

### HUD en gameplay

[Qué información se muestra durante el gameplay]

## 14. Audio

### Música
| Situación | Estilo | Referencia |
|-----------|--------|-----------|

### SFX clave
| Acción | Sonido |
|--------|--------|

## 15. Scope y Prioridades

### Vertical Slice / MVP

**Incluye:**
- [ ] [Feature 1]
- [ ] [Feature 2]
- [ ] [Feature 3]

**NO incluye (post-MVP):**
- [Feature futura 1]
- [Feature futura 2]

### Roadmap

| Fase | Contenido | Estimación |
|------|-----------|-----------|
| Prototype | [lo mínimo para testear la mecánica core] | |
| Vertical Slice | [1 nivel jugable completo] | |
| Alpha | [todos los sistemas base] | |
| Beta | [contenido completo, pulido] | |
| Release | [bug-free, balanced] | |

## 16. Decisiones de Diseño Abiertas

| # | Decisión | Opciones | Status |
|---|----------|----------|--------|
| 1 | [Pregunta] | A: ... / B: ... | [TBD] |

## Apéndices

### A. Fórmulas de balance
[Todas las fórmulas matemáticas del juego]

### B. Tablas de stats completas
[Datos numéricos detallados]

### C. Flujos de estado
[Diagramas de máquinas de estado]
```

## Reglas de escritura (CRÍTICAS)

1. **NO divagar.** Cada oración aporta info nueva. Si se dice en 1, no usar 3.
2. **Bullet points > párrafos.** Siempre.
3. **Números concretos > descripciones vagas.** "100 HP, 2 AP" > "vida moderada, pocas acciones".
4. **NO hacer preguntas retóricas ni "recomendaciones generales".**
5. **NO repetir información** entre secciones.
6. **Para decisiones de diseño abiertas** → usar formato PAS (ver `/doc-pas`): Problema → Análisis → Opciones → Decisión.
7. **Máximo 2-3 oraciones por descripción de sistema.** Si necesita más, es que falta una tabla.

## Rules
- Siempre en español
- Usar el glosario del juego consistentemente en todo el documento
- Incluir tablas de balance con números concretos (aunque sean estimados)
- Marcar decisiones pendientes con [TBD]
- Los pilares de diseño son obligatorios — todo se evalúa contra ellos
- Incluir scope de MVP vs full game
- Adaptar secciones al género (un puzzle no necesita "enemigos")
- Si falta info, poner [TBD] y listar en "Decisiones Abiertas"
- El GDD es un documento vivo — versionar y fechar
