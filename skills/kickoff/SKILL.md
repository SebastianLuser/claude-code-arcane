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
| **Action Plan (Recomendado)** | Definimos un plan paso a paso antes de implementar. Ideal para features, refactors, y tareas de más de 30 min. |
| **Goal-driven** | Seteamos un objetivo claro para la sesión y trabajamos hacia él con checkpoints. Para sesiones largas o exploratorias. |
| **Directo** | Arrancamos a implementar ya. Para fixes rápidos, tareas claras, o cuando ya sabés exactamente qué hacer. |

## Paso 2A: Action Plan (si eligió plan)

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

## Paso 2B: Goal-driven (si eligió goal)

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

## Paso 2C: Directo (si eligió directo)

Proceder con la implementación inmediatamente. Sin plan formal, sin goal tracking.
Solo decir: "Perfecto, arrancamos." y empezar a trabajar.

## Reglas

- **Nunca asumir el modo** — siempre preguntar excepto si el usuario ya lo indicó
- **Respetar "directo"** — si el usuario quiere ir sin plan, no insistir
- **Plan ≠ burocracia** — el plan debe ser conciso y útil, no un documento largo
- **Goals verificables** — un goal que no se puede verificar no sirve
- **Escape hatch** — en cualquier momento el usuario puede decir "saltemos el plan" y se procede directo
- **No bloquear fixes urgentes** — si el usuario reporta un bug en producción, no pedir plan
