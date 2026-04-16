# Director Gates — Shared Infrastructure

Define los mecanismos comunes para gates (approval checkpoints) en Arcane.
Los gates específicos viven en:

- `.claude/docs/gates/software-gates.md` — gates para desarrollo de software (CTO, VPE, PM, SEC, QA)
- `.claude/docs/gates/gamedev-gates.md` — gates para desarrollo de juegos (CD, TD, PR, AD, LP, QL, ND)

Los skills referencian gates por ID en vez de embeber el prompt completo. Así cuando actualizamos un prompt, no hay drift entre skills.

---

## Cómo usar este sistema

En cualquier skill, reemplazá un prompt inline de director por una referencia:

```
Spawn `cto` via Task usando el gate **CTO-ARCHITECTURE** de
`.claude/docs/gates/software-gates.md`.
```

Pasar el contexto listado bajo el campo **Context to pass** del gate, y manejar el verdict según las reglas de **Verdict Handling** de abajo.

---

## Review Modes

La intensidad de review controla si los gates corren. Se puede setear global (persiste cross-session) u override por invocación.

### Config global

`production/review-mode.txt` — una palabra: `full`, `lean`, o `solo`.
Setear una vez durante `/start`. Editar el archivo directo para cambiar.

### Override por invocación

Cualquier skill con gates acepta `--review [full|lean|solo]` como argumento. Override solo para ese run.

Ejemplos:
```
/gate-check concept                       → usa modo global
/gate-check concept --review full         → fuerza full para este run
/create-architecture --review solo        → skippea todos los gates
```

### Modos

| Modo | Qué corre | Para quién |
|------|-----------|-----------|
| `full` | Todos los gates — cada step es reviewed | Teams, usuarios learning, o cuando querés feedback exhaustivo |
| `lean` | Solo PHASE-GATEs (via `/gate-check`) — gates per-skill skippeados | **Default** — solo-devs y small teams; directors review en milestones |
| `solo` | Ningún gate | Prototypes, game jams, máximo speed |

### Check pattern (aplicar antes de cada spawn)

```
Antes de spawn de gate [GATE-ID]:
1. Si el skill fue invocado con --review [mode], usá ese
2. Sino leé production/review-mode.txt
3. Sino default a lean

Aplicar el modo resolvido:
- solo → skip todos los gates. Nota: "[GATE-ID] skipped — Solo mode"
- lean → skip a menos que sea PHASE-GATE. Nota: "[GATE-ID] skipped — Lean mode"
- full → spawn normal
```

---

## Invocation Pattern (copiar en cualquier skill)

**MANDATORY:** Resolver review mode antes de cada spawn. Nunca spawn sin check.

```
# Apply mode check, then:
Spawn `[agent-name]` via Task:
- Gate: [GATE-ID] (see .claude/docs/gates/[software|gamedev]-gates.md)
- Context: [campos listados bajo el gate]
- Await el verdict antes de proceder.
```

### Spawn paralelo (multiple directors en mismo checkpoint)

```
# Apply mode check para cada gate primero, luego spawn de los que sobreviven:
Spawn de los [N] agents simultáneamente via Task — emitir todos los Task calls
antes de esperar cualquier result. Collect todos los verdicts antes de proceder.
```

---

## Standard Verdict Format

Todos los gates devuelven uno de tres verdicts. Skills deben manejar los tres:

| Verdict | Meaning | Default action |
|---------|---------|----------------|
| **APPROVE / READY** | Sin issues. Proceder. | Continuar workflow |
| **CONCERNS [list]** | Issues presentes pero no blocking. | Surface al user via `AskUserQuestion` — opciones: `Revise flagged items` / `Accept and proceed` / `Discuss further` |
| **REJECT / NOT READY [blockers]** | Issues blocking. No proceder. | Surface blockers al user. No escribir archivos ni advance stage hasta resolver. |

### Escalation rule

Cuando múltiples directors spawnean en paralelo, aplicar el verdict más estricto — un NOT READY overrides cualquier READY.

### Primera línea mandatory

Todo agente invocado como gate debe empezar su respuesta con:
```
[GATE-ID]: APPROVE | CONCERNS | REJECT
```

Luego el rationale. El token en la primera línea permite al skill orquestador parsearlo automáticamente.

---

## Recording Gate Outcomes

Después de que un gate resuelve, registrar el verdict en el header de status del documento relevante:

```markdown
> **[Director] Review ([GATE-ID])**: APPROVED [date] / CONCERNS (accepted) [date] / REVISED [date]
```

Para phase gates, registrar en:
- Software: `docs/architecture/architecture.md` o `production/session-state/active.md`
- Gamedev: `docs/architecture/architecture.md` o `production/session-state/active.md`

---

## Parallel Gate Protocol

Cuando un workflow requiere múltiples directors en el mismo checkpoint (muy común en `/gate-check`), spawnar todos los agents simultáneamente:

```
Spawn en paralelo (emitir todos los Task calls antes de esperar any result):

SOFTWARE:
1. cto                → gate CTO-PHASE-GATE
2. vpe                → gate VPE-PHASE-GATE
3. pm                 → gate PM-PHASE-GATE
4. security-architect → gate SEC-PHASE-GATE
5. qa-lead            → gate QA-PHASE-GATE

GAMEDEV:
1. creative-director  → gate CD-PHASE-GATE
2. technical-director → gate TD-PHASE-GATE
3. producer           → gate PR-PHASE-GATE
4. art-director       → gate AD-PHASE-GATE

Collect todos los verdicts, aplicar escalation rules:
- Any NOT READY / REJECT → overall minimum FAIL
- Any CONCERNS → overall minimum CONCERNS
- All READY / APPROVE → eligible for PASS (subject a artifact checks)
```

---

## Agregar Nuevos Gates

Cuando se necesita un gate nuevo para un skill o workflow:

1. Asignar un gate ID: `[DIRECTOR-PREFIX]-[DESCRIPTIVE-SLUG]`
   - Software prefixes: `CTO-`, `VPE-`, `PM-`, `SEC-`, `QA-`, `DESIGN-` (UX lead)
   - Gamedev prefixes: `CD-`, `TD-`, `PR-`, `AD-`, `LP-`, `QL-`, `ND-`
   - Nuevos prefixes para nuevos agents (p.ej. `DATA-` para data-lead)
2. Agregar el gate en la sección del director apropiado con los 5 campos:
   Trigger, Context to pass, Prompt, Verdicts, y special handling notes
3. Referenciar el gate en skills solo por ID — nunca copiar el prompt completo
