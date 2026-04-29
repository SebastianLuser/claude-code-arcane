---
name: game-docs
description: "Game design docs: GDD completo (core loop, balance, glosario) y PAS para decisiones de diseño."
category: "gamedev"
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

16 secciones: Resumen, Concepto, Pilares, Arte, Game Feel, Glosario, Core Loop, Sistema Core, Niveles, Enemigos, Items, Economía, UI/UX, Audio, Scope, Decisiones Abiertas. Adaptar al género.

> → Read references/gdd-structure.md for full section table with content guidelines

---

## 2. PAS (Problema-Análisis-Solución)

Formato para decisiones de diseño puntuales: Problema → Análisis → Opciones → Decisión. Usar para mecánicas problemáticas, balance, features, playtest feedback. NO para GDD completo, specs técnicas o bugs.

> → Read references/pas-format.md for full PAS template, usage criteria, and examples

---

## Reglas de escritura (ambos formatos)

Bullets > párrafos. Números concretos > descripciones vagas. No divagar, no repetir entre secciones. [TBD] para decisiones pendientes.

> → Read references/writing-rules.md for full 9-rule list with examples

---

## Rules

- Siempre en español
- El GDD es documento vivo — versionar y fechar
- Incluir scope MVP vs full game
- Si falta info → [TBD] + listar en Decisiones Abiertas
- Los pilares son obligatorios — todo se evalúa contra ellos
