---
name: kickoff
description: "Interactive session/task kickoff: choose work mode (normal, action plan, goal-driven). Guides plan and goal setup before implementation."
category: "workflow"
argument-hint: "[optional: task description]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion, EnterPlanMode, TaskCreate
---
# Kickoff — Session & Task Mode Selector

Punto de entrada interactivo para sesiones nuevas o tareas de implementación. Presenta opciones de modo de trabajo y guía la preparación antes de codear.

## Trigger automático

Esta skill DEBE ejecutarse automáticamente cuando:
- El usuario arranca una sesión nueva y pide implementar algo
- El usuario describe una tarea de implementación no trivial (nueva feature, refactor grande, migración)
- El usuario dice "quiero hacer X" donde X implica cambios de código significativos

NO ejecutar cuando:
- El usuario hace una pregunta simple ("¿qué hace esta función?")
- El usuario pide un fix puntual de 1-3 líneas
- El usuario explícitamente dice "sin plan" o "directo"
- Ya hay un plan activo en la conversación

## Paso 1: Presentar modos de trabajo

Usar AskUserQuestion con estas opciones:

**Pregunta:** "¿Cómo querés encarar esta tarea?"
**Header:** "Work mode"

| Opción | Descripción |
|--------|-------------|
| **Plan + Goal (Recomendado)** | Combo completo: un plan detallado de CÓMO implementar + un goal claro de HASTA DÓNDE llegar en esta sesión y cómo validarlo. Lo más potente para features y refactors. |
| **Action Plan** | Solo plan paso a paso. Sin goal de sesión — implementamos hasta que se termine o el usuario corte. |
| **Goal-driven** | Solo objetivo verificable con checkpoints. Sin plan formal — vamos resolviendo sobre la marcha. |
| **Directo** | Arrancamos a implementar ya. Para fixes rápidos o cuando ya sabés exactamente qué hacer. |

## Paso 2A: Plan + Goal (si eligió combo, recomendado)

Este es el flujo más completo. Tiene 2 fases: primero seteamos el goal de la sesión, después el plan de implementación.

### Fase 1 — Definir el goal de la sesión

1. Preguntar: "¿Cuál es el objetivo verificable de esta sesión?"
2. Reformular como statement verificable (qué tiene que ser cierto al terminar):
   - MAL: "Mejorar el login"
   - BIEN: "Al terminar esta sesión, OAuth Google funciona end-to-end en dev y tiene 2 tests pasando"
3. Definir criterio de validación: cómo sabemos que el goal se cumplió
4. Presentar al usuario para confirmar

```
## Session Goal
[Goal verificable]

## Validation
- [ ] Cómo verificamos que está hecho (comando, test, observación)
- [ ] Cómo verificamos que está hecho bien (criterio de calidad)
```

### Fase 2 — Armar el plan de implementación

1. Usar EnterPlanMode
2. Dentro del plan:
   - Explorar el codebase relevante
   - Identificar archivos a modificar
   - Diseñar el approach
   - Listar pasos concretos con criterio de "done" por paso
   - Identificar riesgos o decisiones pendientes
3. Presentar el plan al usuario para aprobación, vinculado al goal

```
## Goal (de Fase 1)
[Goal verificable]

## Implementation Plan
1. [ ] Paso concreto — criterio de done
2. [ ] Paso concreto — criterio de done
...

## Stop Conditions
- ✅ Goal cumplido y validado → frenar y reportar
- ⚠️ Bloqueo no resuelto → frenar y pedir decisión
- ⚠️ Scope creep detectado → frenar y reconfirmar

## Risks
- [Decisiones que podrían cambiar el approach]
```

### Fase 3 — Ejecutar

1. Crear TaskCreate por cada paso del plan
2. Implementar paso a paso, marcando completado cada uno
3. **Después de cada paso significativo**, verificar contra el goal:
   - "¿Estamos más cerca del goal?"
   - "¿Apareció algo que cambia el plan?"
4. **Al cumplir el goal**, FRENAR. No seguir agregando features.
5. Correr la validación definida en Fase 1
6. Reportar al usuario:
   - Qué se hizo
   - Validación: pasa / no pasa
   - Qué quedó pendiente fuera del goal (si algo)

## Paso 2B: Action Plan (si eligió solo plan)

1. Pedir al usuario que describa qué quiere lograr en 1-2 oraciones
2. Usar EnterPlanMode
3. Dentro del plan:
   - Explorar el codebase relevante
   - Identificar archivos a modificar
   - Diseñar el approach
   - Listar pasos concretos con criterio de "done"
   - Identificar riesgos o decisiones pendientes
4. Presentar el plan al usuario para aprobación
5. Una vez aprobado, crear TaskCreate por cada paso
6. Implementar paso a paso, marcando completado cada uno

**Template de plan:**
```
## Goal
[Qué queremos lograr]

## Context
[Por qué hace falta, qué problema resuelve]

## Steps
1. [ ] Paso concreto con criterio de done
2. [ ] Paso concreto con criterio de done
...

## Risks
- [Decisiones que podrían cambiar el approach]

## Verification
- [ ] Cómo sabemos que está bien hecho
```

## Paso 2C: Goal-driven (si eligió solo goal)

1. Preguntar al usuario con AskUserQuestion:
   - **"¿Cuál es el objetivo de esta sesión?"** (free text)
   
2. Reformular el goal como un statement verificable:
   - MAL: "Mejorar el login"
   - BIEN: "Al terminar esta sesión, el login soporta OAuth con Google y tiene tests"

3. Presentar el goal reformulado para confirmación

4. Definir checkpoints intermedios (2-4):
   ```
   ## Session Goal
   [Goal verificable]
   
   ## Checkpoints
   - [ ] Checkpoint 1: [milestone parcial]
   - [ ] Checkpoint 2: [milestone parcial]
   - [ ] Checkpoint 3: [goal alcanzado]
   ```

5. Crear TaskCreate por cada checkpoint

6. Trabajar hacia cada checkpoint, validando progreso

7. Al completar cada checkpoint, reportar status:
   - "Checkpoint 1 completado. Progreso: 33%. Siguiente: [checkpoint 2]"

## Paso 2D: Directo (si eligió directo)

Proceder con la implementación inmediatamente. Sin plan formal, sin goal tracking.
Solo decir: "Perfecto, arrancamos." y empezar a trabajar.

## Reglas

- **Nunca asumir el modo** — siempre preguntar excepto si el usuario ya lo indicó
- **Respetar "directo"** — si el usuario quiere ir sin plan, no insistir
- **Plan ≠ burocracia** — el plan debe ser conciso y útil, no un documento largo
- **Goals verificables** — un goal que no se puede verificar no sirve
- **Escape hatch** — en cualquier momento el usuario puede decir "saltemos el plan" y se procede directo
- **No bloquear fixes urgentes** — si el usuario reporta un bug en producción, no pedir plan
