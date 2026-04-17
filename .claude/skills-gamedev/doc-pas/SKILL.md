---
name: doc-pas
description: "Genera documentación de game design en formato PAS (Problema-Análisis-Solución). Conciso, sin divagar. Usar cuando se mencione: PAS, documento de diseño, decisión de diseño, problema de game design, analizar mecánica, propuesta de cambio."
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

```markdown
# [Título conciso del problema/feature]

## Problema

**Qué pasa:**
- [Hecho concreto 1 — qué no funciona o qué falta]
- [Hecho concreto 2]

**Impacto en el jugador:**
- [User story o experiencia negativa concreta]
- [Qué sistema se ve afectado y cómo]

---

## Análisis

**Por qué pasa:**
- [Causa raíz 1]
- [Causa raíz 2]

**Variables que influyen:**
- [Variable 1]: [valor actual] → [efecto]
- [Variable 2]: [valor actual] → [efecto]

---

## Opciones

### A: [Nombre de la opción]
[1 oración: qué es]
- **Pro:** [ventaja concreta]
- **Contra:** [desventaja concreta]
- **Esfuerzo:** [bajo/medio/alto]

### B: [Nombre de la opción]
[1 oración: qué es]
- **Pro:** [ventaja]
- **Contra:** [desventaja]
- **Esfuerzo:** [bajo/medio/alto]

### C: [Nombre de la opción] (si aplica)
[1 oración]
- **Pro:** [ventaja]
- **Contra:** [desventaja]
- **Esfuerzo:** [bajo/medio/alto]

---

## Decisión

**Elegimos: Opción [X]**

**Justificación:** [1-2 oraciones máximo. Por qué esta y no las otras.]

**Cambios concretos:**
- [Cambio 1 con valores exactos]
- [Cambio 2 con valores exactos]

**Status:** Decidido / Pendiente de validar / [TBD]
```

## Ejemplos de bien vs mal

### MAL (verboso, divaga):
> "El sistema de combate actual presenta algunos desafíos interesantes que vale la pena analizar. Cuando el jugador se enfrenta a enemigos en las primeras salas del dungeon, la experiencia puede resultar un poco frustrante debido a que los dados no siempre cooperan con la estrategia que el jugador tiene en mente. Esto se debe a múltiples factores que interactúan entre sí de maneras complejas..."

### BIEN (PAS, conciso):
> **Qué pasa:**
> - El jugador falla 60%+ de los ataques en Floor 1 con dados d6 base
> - El threshold de Goblin (4) es demasiado alto para el loadout inicial (4×d6)
>
> **Impacto:** El jugador siente que no tiene control. Abandona runs en los primeros 3 combates.

## Cuándo usar este formato

- Análisis de mecánicas problemáticas
- Propuestas de cambios de balance
- Decisiones de diseño (nueva feature, cambio de sistema)
- Evaluación de feedback de playtest
- Comparativas entre opciones de diseño

## Cuándo NO usar este formato

- GDD completo (usar `/doc-gdd`)
- Spec técnica de implementación (usar `/doc-rfc`)
- Bug report (usar issues de GitHub/Jira)

## Rules
- Siempre en español
- CONCISO. Si la sección "Problema" tiene más de 6 bullet points, está mal.
- Las opciones deben ser mínimo 2, máximo 4. Más = no se destilaron bien.
- La decisión debe caber en 2 oraciones de justificación.
- Si no hay decisión todavía, marcar [TBD] y dejar las opciones claras.
- Si el usuario pide "analizar" o "evaluar" algo → usar este formato automáticamente.
- Incluir números concretos siempre que sea posible.
