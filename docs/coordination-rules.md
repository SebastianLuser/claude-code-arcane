# Coordination Rules

Cómo coordinan los agentes entre sí y con la main session. Aplica a software y gamedev.

---

## Regla #1 — Main Session Owns All Writes

Los agentes NUNCA escriben archivos directamente. Devuelven análisis/propuestas al main session, que presenta al usuario y ejecuta los writes después de aprobación.

**Excepciones:** Solo los orchestrators del sistema GSD (gsd-executor, gsd-planner) pueden escribir después de un workflow explícito con aprobación del usuario.

## Regla #2 — Agents Ask Before Writing

Si un agente tiene permiso de Write, debe preguntar:
> "¿Puedo escribir esto en `src/auth/middleware.ts`?"

Esperar respuesta antes de ejecutar. Ver `collaborative-design.md` para el protocolo completo.

## Regla #3 — Delegation Chain

La cadena típica:
```
User → Main Session → Lead Agent → Specialist Agent(s)
                                 → (returns analysis)
      ← (returns analysis)
```

NO delegar lateralmente entre specialists. Si un specialist necesita input de otro, escalar al lead.

## Regla #4 — Vertical Delegation Only

Leaders delegan **hacia abajo** en el tier (director → lead → specialist). Nunca saltar tiers para decisiones complejas.

**Horizontal Consultation:** Agentes del mismo tier pueden consultarse pero no tomar decisiones vinculantes fuera de su dominio.

**Conflict Resolution:** Si dos agentes disagree, escalar al parent compartido. Si no hay parent compartido, escalar al director correspondiente del dominio (software → CTO, gamedev → creative-director o technical-director).

**Change Propagation:** Cuando un cambio afecta múltiples dominios, un agente coordinador (producer/program-director/technical-director) propaga.

**No Cross-Domain File Modifications:** Un agente nunca modifica archivos fuera de sus paths asignados sin delegación explícita.

## Regla #5 — Gate Verdicts

Cuando un agente es invocado como "gate" (approval gate), debe empezar la respuesta con:
```
[GATE-ID]: APPROVE | CONCERNS | REJECT
```

Luego el rationale. El token en la primera línea permite que el skill orquestador lo parsee.

**Escalation:** Cuando múltiples gates corren en paralelo, aplica el verdict más estricto — un REJECT override cualquier APPROVE. Ver `director-gates.md` para gates definidos.

## Regla #6 — Cross-Division Collaboration

Para tareas que cruzan divisiones:
1. El lead de la división solicitante invoca al lead de la otra
2. Si hay conflicto → escalar a los directors
3. Si los directors no acuerdan → escalar al user

## Regla #7 — No Autonomous Commits

Ningún agente hace commits sin instrucción explícita del user. Ni siquiera el gsd-executor.

## Regla #8 — Document Decisions

- Decisiones arquitectónicas → ADR en `docs/architecture/adr-XXXX.md`
- Decisiones de producto → PRD en `design/product/`
- Decisiones de diseño de juego → sección "Decisions" en el GDD relevante
- Decisiones de UI/UX → spec en `design/ux/`

## Regla #9 — Session State

Actualizar `production/session-state/active.md` cuando:
- Se completa un section/phase
- Se toma una decisión significativa
- Se cambia de división/agente
- Se alcanza un checkpoint

## Regla #10 — Confidential First

Si un agente detecta datos sensibles (secrets, PII, credentials) en archivos que debe leer/modificar:
1. Flaggear inmediatamente al user
2. No procesar el contenido sensible
3. Sugerir remediación (.gitignore, secret manager, etc.)

## Regla #11 — Context Budget

Cada agente tiene un budget de contexto. Si se acerca al límite:
1. Resumir y devolver al main session
2. Sugerir spawn de nuevo agent con contexto limpio
3. Nunca tomar decisiones apresuradas por budget

---

## Model Tier Assignment

Skills y agentes se asignan a model tiers según complejidad:

| Tier | Model | Cuándo usar |
|------|-------|-------------|
| **Haiku** | `claude-haiku-4-5-20251001` | Status checks read-only, formatting, lookups simples — sin juicio creativo |
| **Sonnet** | `claude-sonnet-4-6` | Implementación, authoring de diseño, análisis de sistemas individuales — default |
| **Opus** | `claude-opus-4-6` | Síntesis multi-doc, phase-gates críticos, review holístico cross-system |

**Guía para asignar:**
- **Haiku** si el skill solo lee y formatea (status reports, changelog, onboard, scope-check)
- **Opus** si debe sintetizar 5+ documentos con output de alto impacto (architecture-review, gate-check, audit multi-sistema)
- **Sonnet** — default para el resto

Ejemplos actuales:
- Haiku: `/sprint-status`, `/changelog`, `/patch-notes`, `/onboard`, `/help`
- Opus: `/architecture-review`, `/gate-check`, `/audit-game`, `/audit-dev`, `/review-all-gdds`
- Sonnet: todo el resto

---

## Subagents vs Agent Teams

Dos patrones distintos de multi-agente:

### Subagents (actual, siempre activo)

Spawned vía `Task` dentro de una sola sesión de Claude Code. Los `team-*` skills y orchestrators usan esto. Los subagents comparten el permission context de la sesión, corren secuenciales o en paralelo dentro de la sesión, y devuelven resultados al parent.

**Cuándo spawn en paralelo:** si dos subagents tienen inputs independientes (ninguno necesita el output del otro para arrancar), spawneá ambos `Task` simultáneamente en vez de esperar. Ejemplo: `/review-all-gdds` Phase 1 (consistency) y Phase 2 (design theory) son independientes.

### Agent Teams (experimental — opt-in)

Múltiples sesiones independientes de Claude Code corriendo simultáneamente, coordinadas por una task list compartida. Cada sesión tiene su propio context window y token budget. Requiere `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

**Usar agent teams cuando:**
- Trabajo cruza múltiples subsystems que no tocan los mismos archivos
- Cada workstream tomaría >30 min y se beneficia de paralelismo real
- Un agente senior (technical-director, program-director) coordina 3+ specialists trabajando en épicas diferentes simultáneamente

**NO usar agent teams cuando:**
- El output de una sesión es input de otra (usar subagents secuenciales)
- La tarea cabe en una sola sesión (usar subagents)
- Costo es preocupación — cada team member quema tokens independientemente

---

## Parallel Task Protocol

Cuando un skill orchestrator spawnea múltiples agents independientes:

1. Emitir **todos** los Task calls antes de esperar cualquier resultado
2. Collect todos los results antes de proceder a fases dependientes
3. Si cualquier agent está BLOCKED, surface inmediatamente — no skippear en silencio
4. Siempre producir un partial report si algunos completan y otros bloquean

**Ejemplo de spawn paralelo:**
```
Fase 2 — review paralelo:
  Spawn simultáneo:
    - backend-architect → review de API design
    - security-architect → review de threat model
    - qa-lead → review de testability
  
  Esperar los 3 verdicts.
  Si algún REJECT → resolver antes de continuar.
  Si todos APPROVE → proceder a Fase 3.
```
