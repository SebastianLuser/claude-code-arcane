---
name: gate-check
description: "Valida readiness para avanzar entre phases de desarrollo. Produce verdict PASS/CONCERNS/FAIL con blockers específicos y required artifacts. Funciona tanto para proyectos de software como gamedev. Usar cuando el user dice 'estamos listos para avanzar a X', 'podemos pasar a production', 'pass the gate'."
argument-hint: "[target-phase] [--stack software|gamedev] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Task, AskUserQuestion
model: opus
---

# Phase Gate Validation

Valida si el proyecto está listo para advanzar a la próxima phase. Checkea required artifacts, quality standards, y blockers.

**Distinto de `/project-stage-detect`**: ese es diagnostic ("dónde estamos?"). Este es prescriptive ("estamos listos para avanzar?" con verdict formal).

---

## 1. Detectar Stack (Software vs Gamedev)

El skill funciona para ambos stacks pero las phases difieren. Detectar en orden:

1. Si `--stack software|gamedev` se pasó → usar
2. Sino leer `production/stack.txt` si existe → usar su valor
3. Sino inferir del project structure:
   - Existe `design/gdd/` o `.godot/` o `ProjectSettings/asset` → gamedev
   - Existe `package.json` / `go.mod` / `requirements.txt` y no `design/gdd/` → software
4. Sino preguntar al user via `AskUserQuestion`:
   - "¿Este proyecto es software o gamedev?" → options: `software` / `gamedev`

Cuando el stack se detecta/confirma por primera vez, preguntar:
> "¿Puedo escribir 'software' (o 'gamedev') a `production/stack.txt` para no preguntar de nuevo?"

---

## 2. Production Phases por Stack

### Software (6 phases)
1. **Discovery** — Brainstorming, scope, tech choices
2. **Design** — Architecture, ADRs, threat model
3. **Pre-Production** — Epics, prototyping, test framework setup
4. **Production** — Feature development (Epic/Story tracking activo)
5. **Pre-Release** — Performance, security audit, a11y audit, QA sign-off
6. **Release** — Deploy prep, monitoring, runbooks

### Gamedev (7 phases)
1. **Concept** — Brainstorming, game concept
2. **Systems Design** — Mapping systems, writing GDDs
3. **Technical Setup** — Engine config, architecture decisions
4. **Pre-Production** — Prototyping, vertical slice validation
5. **Production** — Feature development
6. **Polish** — Playtesting, bug fixing
7. **Release** — Launch prep, certification

Cuando un gate pasa, escribir el nuevo stage a `production/stage.txt` (single line).

---

## 3. Parse Arguments y Resolver Review Mode

**Target phase**: `$ARGUMENTS[0]` — blank = auto-detect current stage + validar next transition.

**Review mode** (resolver una vez, apply a todos los gate spawns):
1. Si `--review [full|lean|solo]` pasado → usar
2. Sino leer `production/review-mode.txt` → usar
3. Sino default `lean`

**Comportamiento por mode**:
- `solo` → skip todos los director gates. Gate-check = artifact-existence checks only.
- `lean` → spawn PHASE-GATE directors (phase gates son el propósito de lean mode).
- `full` → spawn todos los gates incluyendo per-skill gates.

**Sin argumento de target phase**: auto-detect current stage, luego confirmar con `AskUserQuestion`:
- Prompt: "Detected stage: **[current]**. Running gate para transition [Current] → [Next]. ¿Correcto?"
- Options: `[A] Yes — run this gate` / `[B] No — pick different gate`

---

## 4. Phase Gate Definitions — SOFTWARE

### Gate: Discovery → Design

**Required Artifacts**:
- [ ] `docs/product/scope.md` o PRD con problem statement, success metrics, out-of-scope
- [ ] `docs/architecture/tech-choices.md` con decisión de stack (framework, DB, cache, queue)
- [ ] Non-functional requirements documentados (latency, throughput, scale)

**Quality Checks**:
- [ ] PM-SCOPE gate passed (verdict REALISTIC, o OPTIMISTIC accepted)
- [ ] Tech choices son production-grade (no bleeding edge sin justificación documentada)
- [ ] Target user / audience identificado

---

### Gate: Design → Pre-Production

**Required Artifacts**:
- [ ] `docs/architecture/architecture.md` existe con layered architecture definida
- [ ] Al menos 3 ADRs cubriendo Foundation-layer decisions (auth, data, API shape)
- [ ] OpenAPI/GraphQL schema spec si aplica (`docs/api/`)
- [ ] Database schema inicial (`db/migrations/` o ERD)
- [ ] Threat model para sistemas con PII/auth/financial (si aplica)

**Quality Checks**:
- [ ] CTO-ARCHITECTURE gate passed (verdict APPROVE o CONCERNS accepted)
- [ ] VPE-FEASIBILITY gate passed (verdict FEASIBLE)
- [ ] Cada ADR tiene problem statement, alternatives considered, consequences
- [ ] SEC-THREAT-MODEL si aplica (verdict APPROVE)

---

### Gate: Pre-Production → Production

**Required Artifacts**:
- [ ] Test framework inicializado (`tests/unit/`, `tests/integration/` con ejemplos)
- [ ] CI/CD pipeline funcional (`.github/workflows/` o equivalent)
- [ ] Epics definidos en `production/epics/`
- [ ] Stories Foundation-layer creadas con acceptance criteria
- [ ] Environment setup documentado (`docs/setup.md` o README sections)
- [ ] Secret management wired (env vars documentadas en `.env.example`)

**Quality Checks**:
- [ ] PM-EPIC gate passed (REALISTIC)
- [ ] QA-STORY-READY passed para stories iniciales (ADEQUATE)
- [ ] CI corre en cada PR
- [ ] Al menos 1 test pasa (framework verificado funcional)

---

### Gate: Production → Pre-Release

**Required Artifacts**:
- [ ] Todas las features del MVP implementadas
- [ ] Test coverage >70% dominio, >50% integration
- [ ] Error tracking wired (Sentry, Datadog, etc.)
- [ ] Logging structured con request IDs
- [ ] Deploy a staging exitoso con smoke tests pass

**Quality Checks**:
- [ ] VPE-CODE-REVIEW passed en stories críticas
- [ ] QA-TEST-COVERAGE gate passed (ADEQUATE)
- [ ] Tests passing en CI (full suite)
- [ ] No critical/blocker bugs en tracker

---

### Gate: Pre-Release → Release

**Required Artifacts**:
- [ ] Load test results meeting targets (`tests/performance/`)
- [ ] Security audit report con findings HIGH/CRITICAL remediadas
- [ ] Accessibility audit passed si UI público (WCAG AA)
- [ ] Runbook para incidents en `docs/runbooks/`
- [ ] Rollback plan documentado
- [ ] Monitoring dashboards configurados
- [ ] Changelog / release notes drafted

**Quality Checks**:
- [ ] SEC-AUDIT passed (APPROVE)
- [ ] SEC-DEPS passed (no HIGH/CRITICAL sin mitigation)
- [ ] QA-LOAD-TEST passed si endpoints críticos
- [ ] UX-A11Y passed si UI pública
- [ ] Full QA pass signed off por `qa-lead`
- [ ] All tests passing
- [ ] Build compila cleanly

---

## 5. Phase Gate Definitions — GAMEDEV

### Gate: Concept → Systems Design

**Required Artifacts**:
- [ ] `design/gdd/game-concept.md` existe con contenido
- [ ] Game pillars definidos (en concept doc o `design/gdd/game-pillars.md`)
- [ ] Visual Identity Anchor section (de brainstorm Phase 4 art-director output)

**Quality Checks**:
- [ ] CD-PILLARS gate passed (APPROVE)
- [ ] Core loop descripto y understood
- [ ] Target audience identificado
- [ ] Visual Identity Anchor contiene one-line visual rule + ≥2 supporting principles

---

### Gate: Systems Design → Technical Setup

**Required Artifacts**:
- [ ] Systems index en `design/gdd/systems-index.md` con MVP systems enumerados
- [ ] Todos los MVP-tier GDDs existen en `design/gdd/` con las 8 secciones required
- [ ] Cross-GDD review report existe (de `/review-all-gdds`)

**Quality Checks**:
- [ ] CD-SYSTEMS gate passed
- [ ] TD-SYSTEM-BOUNDARY gate passed
- [ ] Todos los MVP GDDs pasan `/design-review` individualmente
- [ ] `/review-all-gdds` verdict no es FAIL
- [ ] System dependencies mapeadas y bidirectionally consistent
- [ ] MVP priority tier definido

---

### Gate: Technical Setup → Pre-Production

**Required Artifacts**:
- [ ] Engine elegido (CLAUDE.md Technology Stack no es `[CHOOSE]`)
- [ ] `.claude/docs/technical-preferences.md` configurado
- [ ] Art bible en `design/art/art-bible.md` con al menos Sections 1-4
- [ ] Al menos 3 ADRs cubriendo Foundation-layer systems
- [ ] Engine reference docs en `docs/engine-reference/[engine]/`
- [ ] Test framework inicializado (`tests/unit/`, `tests/integration/`)
- [ ] CI/CD test workflow existe
- [ ] Master architecture document en `docs/architecture/architecture.md`
- [ ] `design/accessibility-requirements.md` con tier committed

**Quality Checks**:
- [ ] TD-ARCHITECTURE gate passed
- [ ] TD-ADR passed para cada ADR (APPROVE)
- [ ] LP-FEASIBILITY passed
- [ ] AD-ART-BIBLE passed (si art bible ya complete)
- [ ] Todos los ADRs tienen Engine Compatibility section con engine version
- [ ] Todos los ADRs tienen GDD Requirements Addressed section
- [ ] Ningún ADR referencia APIs deprecadas del engine
- [ ] HIGH RISK engine domains explicitly addressed

---

### Gate: Pre-Production → Production

**Required Artifacts**:
- [ ] Al menos 1 prototype en `prototypes/` con README
- [ ] Primer sprint plan en `production/sprints/`
- [ ] Art bible complete (9 sections) con AD-ART-BIBLE verdict recorded
- [ ] Todos los MVP-tier GDDs complete
- [ ] Control manifest en `docs/architecture/control-manifest.md`
- [ ] Epics definidos en `production/epics/` (Foundation + Core layers)
- [ ] Vertical Slice build existe y es playable
- [ ] Vertical Slice playtested con ≥3 sessions
- [ ] Vertical Slice playtest report en `production/playtests/`
- [ ] UX specs para key screens (main menu, HUD, pause)

**Quality Checks**:
- [ ] PR-EPIC passed (REALISTIC)
- [ ] QL-STORY-READY passed para stories iniciales
- [ ] **Core loop fun validado** — playtest data confirma central mechanic enjoyable
- [ ] **Vertical Slice COMPLETO** no solo scoped
- [ ] **Core fantasy delivered** — al menos 1 playtester describió experience matching Player Fantasy sin prompting

**Vertical Slice Validation** (FAIL automático si cualquier item es NO):
- [ ] Un human jugó core loop sin developer guidance
- [ ] Juego comunica qué hacer en los primeros 2 minutes
- [ ] No hay critical "fun blocker" bugs
- [ ] Core mechanic feels good to interact con (check subjetivo — ask user)

---

### Gate: Production → Polish

**Required Artifacts**:
- [ ] `src/` tiene código active organizado en subsystems
- [ ] Core mechanics del GDD implementadas
- [ ] Main gameplay path playable end-to-end
- [ ] Test files en `tests/unit/` y `tests/integration/`
- [ ] Smoke check con PASS verdict en `production/qa/`
- [ ] QA plan en `production/qa/` (`/qa-plan`)
- [ ] ≥3 playtest sessions documentadas en `production/playtests/`
- [ ] Playtest reports cubren: new player, mid-game systems, difficulty curve

**Quality Checks**:
- [ ] LP-CODE-REVIEW passed en stories críticas
- [ ] QL-TEST-COVERAGE passed
- [ ] Tests passing (run via Bash)
- [ ] No critical/blocker bugs
- [ ] Performance dentro de budget (check technical-preferences.md)
- [ ] CD-PLAYTEST passed (core fantasy landing)

---

### Gate: Polish → Release

**Required Artifacts**:
- [ ] Todas las features del milestone plan implementadas
- [ ] Content complete (levels, assets, dialogue)
- [ ] Localization strings externalized
- [ ] QA sign-off report (`/team-qa` — APPROVED)
- [ ] Smoke check PASS en release candidate
- [ ] Balance data reviewed (`/balance-check`)
- [ ] Release checklist completed
- [ ] Store metadata preparada (si aplica)
- [ ] Changelog / patch notes drafted

**Quality Checks**:
- [ ] Full QA pass signed off por `qa-lead`
- [ ] All tests passing
- [ ] Performance targets met en target platforms
- [ ] No critical/high/medium bugs conocidos
- [ ] Accessibility basics covered
- [ ] Localization verified
- [ ] Legal requirements met (EULA, privacy, age ratings)
- [ ] Build compila y packages cleanly

---

## 6. Ejecutar el Gate Check

Antes de correr artifact checks:
- Leer `docs/consistency-failures.md` si existe — extraer entries cuyo Domain match el target phase. Carry como context — recurring conflict patterns warrant increased scrutiny.

Para cada item del target gate:

### Artifact Checks
- Usar `Glob` y `Read` para verificar que files existen y tienen meaningful content
- No solo checkear existence — verificar que el file tiene real content (no just template header)

### Quality Checks
- Tests: correr suite via `Bash` si hay test runner configurado
- Design reviews: `Read` GDD o architecture doc y check sections
- Performance: `Read` technical-preferences.md, comparar con profiling data en `tests/performance/`
- Localization: `Grep` por hardcoded strings en `src/`

### Cross-Reference Checks
- Compare `design/gdd/` (gamedev) o `docs/architecture/` (software) contra `src/`
- Verificar que cada sistema referenciado tiene código correspondiente
- Sprint plans referencian real work items

---

## 7. Collaborative Assessment

Para items que no se pueden auto-verificar, **ask the user**:
- "No puedo auto-verificar que el core loop plays well. ¿Ha sido playtested?"
- "No playtest report found. ¿Informal testing done?"
- "Performance profiling data no available. ¿Querés correr `/perf-profile`?"

**Nunca asumir PASS para unverifiable items.** Marcar como MANUAL CHECK NEEDED.

---

## 8. Director Panel Assessment

Antes de generar final verdict, spawn directors en paralelo via Task usando parallel gate protocol de `.claude/docs/gates/README.md`.

### Software Stack
```
Spawn en paralelo:
1. cto                 → CTO-PHASE-GATE (gates/software-gates.md)
2. vpe                 → VPE-PHASE-GATE
3. pm                  → PM-PHASE-GATE
4. security-architect  → SEC-PHASE-GATE
```

Pasar a cada uno: target phase name, artifacts list, context fields del gate.

### Gamedev Stack
```
Spawn en paralelo:
1. creative-director   → CD-PHASE-GATE (gates/gamedev-gates.md)
2. technical-director  → TD-PHASE-GATE
3. producer            → PR-PHASE-GATE
4. art-director        → AD-PHASE-GATE
```

### Presentar Director Panel summary

```
## Director Panel Assessment

[Director Name]:  [READY / CONCERNS / NOT READY]
  [feedback]

... (per director)
```

**Apply a verdict**:
- Any director NOT READY → verdict minimum FAIL (user puede override con explicit ack)
- Any CONCERNS → verdict minimum CONCERNS
- All READY → eligible PASS (subject a artifact/quality checks de sección 6)

---

## 9. Output the Verdict

```
## Gate Check: [Current Phase] → [Target Phase]

**Stack**: [software / gamedev]
**Date**: [date]
**Review mode**: [full / lean / solo]
**Checked by**: gate-check skill

### Required Artifacts: [X/Y present]
- [x] path/to/artifact — exists, [details]
- [ ] path/missing — MISSING
- ...

### Quality Checks: [X/Y passing]
- [x] Check passed
- [ ] Check failed — [reason]
- [?] Check MANUAL CHECK NEEDED

### Director Panel
[director summary from section 8]

### Blockers
1. **[Blocker name]** — [action to resolve]
2. ...

### Recommendations
- [Priority actions to resolve blockers]
- [Optional improvements non-blocking]

### Verdict: [PASS / CONCERNS / FAIL]
- **PASS**: Todos los required artifacts present, todos los quality checks passing
- **CONCERNS**: Gaps menores pero addressable durante next phase
- **FAIL**: Critical blockers deben resolverse antes de advance
```

---

## 10. Chain-of-Verification

Después de draft del verdict, challenge antes de finalizar.

**Step 1 — Generate 5 challenge questions** para disprove el verdict:

Para **PASS** draft:
- "¿Qué quality checks verifiqué actually reading un file, vs inferring passed?"
- "¿Hay MANUAL CHECK NEEDED items que marqué PASS sin user confirmation?"
- "¿Confirmé que todos los listed artifacts tienen real content, no just empty headers?"
- "¿Algún blocker que dismissed como minor podría actually prevent phase success?"
- "¿Cuál single check soy least confident in, y por qué?"

Para **CONCERNS** draft:
- "¿Algún listed CONCERN podría elevarse a blocker given el project state?"
- "¿El concern es resolvable en next phase, o compounds over time?"
- "¿Softi algún FAIL condition into CONCERN para avoid harder verdict?"
- "¿Hay artifacts que no checkié que podrían reveal additional blockers?"

Para **FAIL** draft:
- "¿Separé accurately hard blockers de strong recommendations?"
- "¿Hay PASS items que fui too lenient con?"
- "¿Puedo provide minimal path to PASS — las specific 3 things que deben change?"

**Step 2 — Answer each question** independently. No referencing draft text — re-check specific files o ask user.

**Step 3 — Revisar si needed**:
- Si answer reveals missed blocker → upgrade verdict
- Si answer reveals over-stated blocker → downgrade solo si citing specific evidence

**Step 4 — Note verification** en final report:
`Chain-of-Verification: [N] questions checked — verdict [unchanged | revised X to Y]`

---

## 11. Update Stage on PASS

Cuando verdict es **PASS** y user confirma advance:

1. Escribir nuevo stage name a `production/stage.txt` (single line, no trailing newline)
2. Update status line para future sessions

**Siempre preguntar**: "Gate passed. ¿Puedo update `production/stage.txt` a '[Next Phase]'?"

---

## 12. Closing Next-Step Widget

Después del verdict y stage.txt update, close con structured next-step prompt usando `AskUserQuestion`.

Tailor options al gate que ran:

**Software Design → Pre-Production PASS**:
```
[A] Crear epics — /create-epics layer: foundation
[B] Setup test framework — /test-setup si aún no está
[C] Stop here for this session
```

**Gamedev Systems Design PASS**:
```
[A] Run /create-architecture — produce master architecture blueprint y ADR work plan
[B] Design more GDDs first — return when all MVP systems complete
[C] Stop here for this session
```

Para otros gates, offer 2 most logical next steps + "Stop here".

---

## 13. Follow-Up Actions

Based on verdict, suggest next steps:

### Universal
- **Missing ADRs** → `/architecture-decision`
- **No master architecture doc** → `/create-architecture`
- **Missing epics** → `/create-epics layer: foundation` → `/create-epics layer: core`
- **Missing stories** → `/create-stories [epic-slug]`
- **Stories not impl-ready** → `/story-readiness`
- **Tests failing** → delegate a `lead-programmer` / `go-engineer` / `qa-tester`
- **No CI setup** → `/test-setup`

### Software-specific
- **No threat model** → spawn `security-architect` para crear
- **No load tests** → `/performance-test`
- **No a11y audit** → spawn `ux-lead` / `accessibility-expert`
- **Pre-release checks** → `/deploy-check`, `/deps-audit`, `/security-audit`

### Gamedev-specific
- **No art bible** → `/art-bible`
- **No game concept** → `/brainstorm`
- **No systems index** → `/map-systems`
- **No design docs** → `/reverse-document` o delegate a `game-designer`
- **Small design change** → `/quick-design`
- **No playtest data** → `/playtest-report`
- **Ready for release** → `/launch-checklist`

---

## Collaborative Protocol

Este skill sigue el collaborative design principle:

1. **Scan first**: check all artifacts y quality gates
2. **Ask about unknowns**: no assume PASS para things no verificables
3. **Present findings**: show full checklist con status
4. **User decides**: verdict es recommendation — user makes final call
5. **Get approval**: "¿Puedo escribir este gate check report a production/gate-checks/?"

**Nunca** bloquear al user de avanzar — verdict es advisory. Document risks y let user decide.
