---
name: game-docs
description: "Documentación de game design: GDD completo (estructura, secciones, glosario, core loop, balance) y formato PAS (Problema-Análisis-Solución) para decisiones de diseño. Usar para: GDD, game design document, documento de diseño, PAS, decisión de diseño, analizar mecánica, propuesta de cambio."
argument-hint: "[gdd [game-name] | pas [problem-title]]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# game-docs — GDD + Design Decisions

Dos formatos de documentación de game design: GDD completo y PAS para decisiones puntuales.

---

## 1. GDD (Game Design Document)

### Input

Preguntar al usuario:
1. **Nombre del juego**
2. **Género** (roguelite, RPG, puzzle, platformer, etc.)
3. **Plataforma** (PC, mobile, consola, web)
4. **Elevator pitch** (1-2 oraciones: qué es y qué lo hace único)
5. **Mecánica core** (qué hace el jugador el 80% del tiempo)
6. **Referentes** (juegos similares o inspiraciones)
7. **Contexto** (tesis, indie, jam, estudio, tamaño equipo)

### Estructura del GDD

| # | Sección | Contenido clave |
|---|---------|----------------|
| 1 | Resumen | Tabla: género, plataforma, engine, perspectiva, sesión promedio, target audience |
| 2 | Concepto | Elevator pitch en 2-3 oraciones. "Es como [A] pero con [B]" |
| 3 | Pilares de diseño | 3 pilares. Test: si feature no soporta ≥1 pilar → no entra |
| 4 | Dirección de arte | Estilo visual, paleta, referencias (o delegar a `/art-bible`) |
| 5 | Game feel | Principios de feedback visual/táctil |
| 6 | Glosario | Tabla: término, significado, alternativas prohibidas |
| 7 | Core loop | Diagrama + tabla de capas (micro/medio/macro) con duración |
| 8 | Sistema core | Flujo principal, mecánicas del jugador, tablas de valores |
| 9 | Niveles/mundo | Generación (procedural/handcrafted/híbrido), tipos, progresión de dificultad |
| 10 | Enemigos | Tabla: nombre, HP, daño, comportamiento, aparición. AI/patterns |
| 11 | Items/equip | Categorías con efecto, balance de items |
| 12 | Economía | Recursos (obtención/gasto), curva de progresión, meta-progresión |
| 13 | UI/UX | Pantallas principales, HUD en gameplay |
| 14 | Audio | Música por situación, SFX clave |
| 15 | Scope | MVP checklist, roadmap por fase (Prototype→VS→Alpha→Beta→Release) |
| 16 | Decisiones abiertas | Tabla: pregunta, opciones, status ([TBD] o decidido) |

Apéndices opcionales: fórmulas de balance, tablas de stats, diagramas de estado.

Adaptar secciones al género — un puzzle no necesita "enemigos".

---

## 2. PAS (Problema-Análisis-Solución)

Para decisiones de diseño, cambios de balance, evaluación de mecánicas, feedback de playtest.

### Formato

```markdown
# [Título conciso]

## Problema
**Qué pasa:**
- [Hecho concreto — qué no funciona o falta]

**Impacto en el jugador:**
- [Experiencia negativa concreta]

## Análisis
**Por qué pasa:**
- [Causa raíz]

**Variables que influyen:**
- [Variable]: [valor actual] → [efecto]

## Opciones
### A: [Nombre]
[1 oración] — Pro: [ventaja] / Contra: [desventaja] / Esfuerzo: [bajo|medio|alto]

### B: [Nombre]
[1 oración] — Pro / Contra / Esfuerzo

## Decisión
**Elegimos: Opción [X]**
**Justificación:** [1-2 oraciones]
**Cambios concretos:** [valores exactos]
**Status:** Decidido / Pendiente / [TBD]
```

### Cuándo usar PAS

- Mecánicas problemáticas
- Propuestas de cambio de balance
- Decisiones de diseño (nueva feature, cambio de sistema)
- Evaluación de feedback de playtest

### Cuándo NO

- GDD completo → usar sección 1
- Spec técnica → RFC/ADR
- Bug report → issue tracker

---

## Reglas de escritura (ambos formatos)

1. **NO divagar** — cada oración aporta info nueva
2. **Bullet points > párrafos** — siempre
3. **Números concretos > descripciones vagas** — "100 HP, 2 AP" no "vida moderada"
4. **NO preguntas retóricas ni recomendaciones genéricas**
5. **NO repetir información** entre secciones
6. **Máximo 2-3 oraciones** por descripción de sistema. Si necesita más → tabla
7. **Decisiones pendientes** → marcar [TBD] y listar en sección 16
8. **Glosario** → usar términos definidos consistentemente en todo el doc
9. **PAS: máximo 6 bullets** en Problema, **2-4 opciones**, **2 oraciones** de justificación

### Ejemplo bien vs mal

**Mal:** "El sistema de combate presenta algunos desafíos interesantes que vale la pena analizar. Cuando el jugador se enfrenta a enemigos..."

**Bien:** "El jugador falla 60%+ de ataques en Floor 1 con dados d6 base. El threshold de Goblin (4) es demasiado alto para el loadout inicial (4xd6)."

---

## Rules

- Siempre en español
- El GDD es documento vivo — versionar y fechar
- Incluir scope MVP vs full game
- Si falta info → [TBD] + listar en Decisiones Abiertas
- Los pilares son obligatorios — todo se evalúa contra ellos
