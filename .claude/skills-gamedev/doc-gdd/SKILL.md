---
name: doc-gdd
description: "Generate a full GDD (Project_T format): glossary, core loop, systems, balance, economy. Professional 16-section structure."
category: "gamedev"
argument-hint: "[game-name or empty]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
---
# GDD Generator — Estilo Project_T

## Input (preguntar al usuario)

1. Nombre del juego (o tentativo)
2. Género (roguelite, RPG, puzzle, platformer, etc.)
3. Plataforma (PC, mobile, consola, web)
4. Elevator pitch (1-2 oraciones: qué es, qué lo hace único)
5. Mecánica core (qué hace el jugador 80% del tiempo)
6. Referentes (juegos similares/inspiraciones)
7. Tamaño equipo y contexto (tesis, indie, jam, estudio)

## Estructura del GDD (16 secciones)

1. **Resumen** — tabla: género, plataforma, engine, perspectiva, jugadores, sesión promedio, target audience
2. **Concepto** — elevator pitch 2-3 oraciones: "Es como [Ref] pero con [diferenciador]"
3. **Pilares de Diseño** — 3 pilares con explicación 1 línea. Test: feature no soporta ningún pilar → no entra
4. **Dirección de Arte** — estilo visual, paleta colores (tabla hex/uso), referencias/moodboard
5. **Game Feel y Feedback** — 3 principios de feedback visual/audio con aplicación
6. **Glosario** — tabla término/significado/no-usar. Usar SIEMPRE en código, docs, UI
7. **Core Loop** — diagrama (Preparar→Explorar→Combatir→Recompensar→repeat) + capas tabla (micro/medio/macro con duración y qué pasa)
8. **Sistema Core** — estructura turno/round, mecánicas jugador, tablas de valores
9. **Exploración/Niveles** — generación (procedural/handcrafted/hybrid), tipos tabla (frecuencia/contenido), curva dificultad
10. **Enemigos/Obstáculos** — tipos tabla (HP/daño/comportamiento/aparece en), AI/comportamiento
11. **Items/Power-ups** — categorías tabla (efecto/ejemplo), balance de economía de items
12. **Economía y Progresión** — recursos tabla (obtiene/gasta), curva progresión, meta-progresión
13. **UI/UX** — pantallas tabla (propósito/elementos), HUD gameplay
14. **Audio** — música tabla (situación/estilo/referencia), SFX tabla (acción/sonido)
15. **Scope y Prioridades** — MVP checklist + NO incluye (post-MVP) + roadmap tabla (Prototype→VS→Alpha→Beta→Release)
16. **Decisiones Abiertas** — tabla #/decisión/opciones/status [TBD]

Apéndices: fórmulas de balance, tablas stats completas, flujos de estado.

## Reglas de Escritura

- Cada oración aporta info nueva — no divagar
- Bullet points > párrafos
- Números concretos > descripciones vagas ("100 HP, 2 AP" > "vida moderada")
- No preguntas retóricas ni recomendaciones generales
- No repetir info entre secciones
- Decisiones abiertas → formato PAS (ver `/doc-pas`)
- Max 2-3 oraciones por descripción de sistema — si necesita más, falta tabla
- Siempre en español
- Glosario usado consistentemente en todo el documento
- Tablas de balance con números (aunque estimados)
- Pendientes marcados [TBD] y listados en Decisiones Abiertas
- Adaptar secciones al género (puzzle no necesita "enemigos")
- GDD es documento vivo — versionar y fechar
