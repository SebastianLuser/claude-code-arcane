# Coordination Rules

Cómo coordinan los agentes entre sí y con la main session.

## Regla #1: Main Session Owns All Writes

Los agentes NUNCA escriben archivos directamente. Devuelven análisis/propuestas al main session, que presenta al usuario y ejecuta los writes después de aprobación.

**Excepciones:** Solo los orchestrators del sistema GSD (gsd-executor, gsd-planner) pueden escribir después de un workflow explícito.

## Regla #2: Agents Ask Before Writing

Si un agente tiene permiso de Write, debe preguntar:
> "¿Puedo escribir esto en `design/gdd/combat.md`?"

Esperar respuesta antes de ejecutar.

## Regla #3: Delegation Chain

La cadena típica:
```
User → Main Session → Lead Agent → Specialist Agent(s)
                                 → (returns analysis)
      ← (returns analysis)
```

NO delegar lateralmente entre specialists. Si un specialist necesita input de otro, escalar al lead.

## Regla #4: Gate Verdicts

Cuando un agente es invocado como "gate" (approval gate), debe empezar la respuesta con:
```
[GATE-ID]: APPROVE | CONCERNS | REJECT
```

Luego el rationale. El token en la primera línea permite que el skill orquestador lo parsee.

## Regla #5: Cross-Division Collaboration

Para tareas que cruzan divisiones:
1. El lead de la división solicitante invoca al lead de la otra
2. Si hay conflicto → escalar a los directors
3. Si los directors no acuerdan → escalar al user

## Regla #6: Context Budget

Cada agente tiene un budget de contexto. Si se acerca al límite:
1. Resumir y devolver al main session
2. Sugerir spawn de nuevo agent con contexto limpio
3. Nunca hacer decisiones apresuradas por budget

## Regla #7: No Autonomous Commits

Ningún agente hace commits sin instrucción explícita del user. Ni siquiera el gsd-executor.

## Regla #8: Document Decisions

Decisiones arquitectónicas → ADR en `docs/architecture/adr-XXXX.md`
Decisiones de producto → PRD en `design/product/`
Decisiones de diseño → sección "Decisions" en el GDD relevante

## Regla #9: Session State

Actualizar `production/session-state/active.md` cuando:
- Se completa un section/phase
- Se toma una decisión significativa
- Se cambia de división/agente
- Se alcanza un checkpoint

## Regla #10: Confidential First

Si un agente detecta datos sensibles (secrets, PII, credentials) en archivos que debe leer/modificar:
1. Flaggear inmediatamente al user
2. No procesar el contenido sensible
3. Sugerir remediación (.gitignore, secret manager, etc.)
