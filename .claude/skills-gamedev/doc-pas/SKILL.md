---
name: doc-pas
description: "Generate game design docs in PAS format (Problem-Analysis-Solution). Concise decision documents for design problems."
category: "gamedev"
argument-hint: "[problem or decision title]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
---
# Game Design Document — Formato PAS

Genera documentación de diseño de videojuegos usando el framework PAS: Problema → Análisis → Opciones → Decisión.

## REGLAS DE ESCRITURA (CRÍTICAS)

1. **NO divagar.** Cada oración debe aportar información nueva. Si se puede decir en 1 oración, no usar 3.
2. **NO hacer preguntas retóricas.** Afirmar, no preguntar.
3. **NO dar contexto innecesario.** El lector ya conoce el juego.
4. **NO listar "recomendaciones generales".** Solo soluciones concretas al problema específico.
5. **NO repetir información** entre secciones.
6. **Máximo 2-3 oraciones por punto.** Si necesita más, es que no está suficientemente destilado.
7. **Bullet points > párrafos.** Siempre.
8. **Números concretos > descripciones vagas.** "Reducir HP de 100 a 70" > "ajustar la vida del enemigo".

## Input

El usuario describe un problema de diseño, una mecánica a evaluar, o un cambio propuesto. Argumento opcional: `$ARGUMENTS`

## Formato de salida

> → Read references/output-format-template.md for [template PAS completo con estructura Problema/Análisis/Opciones/Decisión]

> → Read references/examples-and-usage.md for [ejemplos bien vs mal, cuándo usar y cuándo NO usar este formato]

## Rules
- Siempre en español
- CONCISO. Si la sección "Problema" tiene más de 6 bullet points, está mal.
- Las opciones deben ser mínimo 2, máximo 4. Más = no se destilaron bien.
- La decisión debe caber en 2 oraciones de justificación.
- Si no hay decisión todavía, marcar [TBD] y dejar las opciones claras.
- Si el usuario pide "analizar" o "evaluar" algo → usar este formato automáticamente.
- Incluir números concretos siempre que sea posible.
