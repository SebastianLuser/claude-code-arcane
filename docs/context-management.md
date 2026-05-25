# Context Management

Contexto es el recurso más crítico de una sesión de Claude Code. Administralo activamente.

---

## Problema

Claude Code tiene una ventana de contexto limitada. Sesiones largas llegan al límite, forzando compaction que pierde nuances. Sin estrategia, perdés decisiones importantes al compactarse la conversación.

---

## Estrategia Principal: File-Backed State

**El archivo es la memoria, no la conversación.** Las conversaciones son efímeras y van a ser compactadas o perdidas. Los archivos en disco persisten cross-compactions y cross-sesión.

### Session State File

Mantené `production/session-state/active.md` como checkpoint vivo. Update después de cada milestone significativo:

- Sección de diseño / ADR aprobada y escrita
- Decisión arquitectónica tomada
- Milestone de implementación alcanzado
- Resultados de tests obtenidos

El state file debe contener: tarea actual, checklist de progreso, decisiones clave tomadas, archivos en trabajo, preguntas abiertas.

### Status Line Block (opcional, para proyectos activos)

Para proyectos en fase de ejecución, incluir en `active.md` un bloque estructurado que el status line script puede parsear:

```markdown
<!-- STATUS -->
Epic: Auth refactor
Feature: JWT rotation
Task: Implementar refresh endpoint
<!-- /STATUS -->
```

- Los tres campos (Epic, Feature, Task) son opcionales — incluí solo lo aplicable
- Update cuando cambiás de foco
- El status line lo muestra como breadcrumb: `Auth refactor > JWT rotation > Refresh endpoint`
- Remove o vaciá cuando no hay work focus activo

Después de cualquier disrupción (compaction, crash, `/clear`), leé el state file primero.

---

## Incremental Writing

Los skills largos (como `/design-system`, `/doc-rfc`, `/create-architecture`) escriben al disco incrementalmente después de cada sección aprobada. Si la sesión se corta, el progreso está guardado.

**Flujo para documentos multi-sección** (ADRs, PRDs, GDDs, RFCs, specs largos):

1. Creá el archivo inmediatamente con skeleton (todos los section headers, cuerpos vacíos)
2. Discutí y drafteá una sección a la vez en la conversación
3. Escribí cada sección al archivo apenas aprobada
4. Update del state file después de cada sección
5. Después de escribir una sección, la conversación sobre esa sección puede compactarse safely — las decisiones están en el archivo

Esto mantiene el context window con ~3-5k tokens (solo la sección actual) en vez de 30-50k (historia completa del doc).

---

## Proactive Compaction

- **Compactá proactivamente** a ~60-70% de uso, no reactivamente al límite
- **Usá `/clear`** entre tareas no relacionadas, o después de 2+ intentos de corrección fallidos
- **Puntos naturales de compaction:** después de escribir una sección al archivo, después de un commit, después de completar una tarea, antes de empezar un tema nuevo
- **Focused compaction:** `/compact Focus on [tarea actual] — secciones 1-3 ya escritas al archivo, working on sección 4`

### Compaction Hooks

- `pre-compact.sh`: Guarda summary del estado antes de compaction
- `post-compact.sh`: Carga summary después de compaction

---

## Context Budgets por Tipo de Tarea

| Tipo | Budget estimado | Estrategia |
|------|-----------------|-----------|
| **Light** (read/review) | ~3k tokens startup | Direct reads, preguntas específicas |
| **Medium** (implementar feature) | ~8k tokens | Lectura targeted, subagents para research |
| **Heavy** (refactor multi-sistema) | ~15k tokens | Delegación agresiva, file-backed state obligatorio |

---

## Subagent Delegation

Para tareas con muchos archivos que leer:
- Spawn subagent con `Task` tool (typically `subagent_type: Explore`)
- Le das la pregunta específica
- El subagent gasta su propio contexto
- Devuelve resumen al main session

**Cuándo usar subagents:**
- Investigando cross multiple files
- Explorando código no familiar
- Research que consumiría >5k tokens de file reads

**Cuándo usar direct reads:**
- Sabés exactamente qué 1-2 archivos chequear
- Lectura targeted con Grep/Read

Los subagents no heredan historia de conversación — dales contexto completo en el prompt.

---

## Instrucciones de Compaction

Cuando el contexto se compacta, preservá en el summary:

- Referencia a `production/session-state/active.md` (leer para recover state)
- Lista de archivos modificados en la sesión y su propósito
- Decisiones arquitectónicas hechas y su rationale
- Tasks activas del sprint y estado actual
- Invocaciones de agents y outcomes (success/failure/blocked)
- Resultados de tests (pass/fail counts, failures específicos)
- Blockers sin resolver o preguntas esperando input del user
- Tarea actual y en qué paso estamos
- Qué secciones del documento actual están escritas vs en progreso

**Después de compaction:** Leer `active.md` y cualquier archivo en trabajo activo para recover contexto completo. Los archivos tienen las decisiones; la historia de conversación es secundaria.

---

## Recovery Después de Crash

Si una sesión muere ("prompt too long") o empezás una nueva para continuar:

1. El hook `session-start.sh` detecta y preview `active.md` automáticamente
2. Leer el state file completo para contexto
3. Leer el/los archivos parcialmente completos listados en el state
4. Continuar desde la próxima sección o task incompleta

---

## Context Budget Awareness

Cuando el status line muestra >= 70%:
- Skills largos pausan y sugieren nueva sesión
- Se escribe progreso a disco
- Se recomienda correr `/resume-work` en nueva sesión

---

## Best Practices

- **Leé solo lo necesario.** No abras archivos "por si acaso".
- **Usá Grep antes que Read.** Buscá el símbolo específico, no leas todo.
- **Delegá exploraciones amplias a subagents.** Preservá tu contexto.
- **Resumí conversaciones largas.** Cada ~20 turnos, resumí decisiones.
- **Confiá en session-state.** No recuerdes todo en contexto — persistí al disco.
- **Compactá antes de pegar al límite.** El compaction reactivo pierde más información.

---

## Ejemplos Aplicados

### Backend: implementar feature multi-archivo

```
Tarea: "Implementá auth JWT completo"

1. Crear production/session-state/active.md con:
   - Feature: JWT auth
   - Files to create: src/auth/{tokens.ts, middleware.ts, login.ts}
   - Tests: tests/auth.test.ts
   - Estado: en diseño

2. Diseñar arquitectura con user → approval
3. Escribir tokens.ts → update active.md (Estado: tokens.ts done)
4. Compact si >60% context
5. Escribir middleware.ts → update active.md
6. Seguir...

Si crashea en paso 5:
- Leer active.md → sabe que tokens.ts está done, middleware.ts pending
- Leer src/auth/tokens.ts para contexto
- Continuar desde middleware.ts
```

### Gamedev: authoring de GDD de 8 secciones

```
Tarea: "Diseñá el sistema de crafteo"

1. Crear design/gdd/crafting.md con skeleton de 8 secciones vacías
2. Crear active.md: Section 1 (Overview) in progress
3. Draft Overview → review → approve → Write a la sección
4. Update active.md: Section 1 done, Section 2 (Player Fantasy) in progress
5. Compact. La conversación de Overview ya no es necesaria.
6. Continuar con Section 2...

Si crashea en Section 5:
- Leer active.md → sabe que secciones 1-4 están done
- Leer crafting.md → ver qué está escrito
- Continuar desde Section 5
```
