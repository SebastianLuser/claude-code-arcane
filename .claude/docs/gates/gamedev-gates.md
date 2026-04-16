# Gamedev Director Gates

Gates de approval para desarrollo de juegos (engines, gameplay, art, production). Ver `.claude/docs/gates/README.md` para infraestructura compartida (Review Modes, Verdict Format, Parallel Protocol).

---

## Roles y Model Tiers

| Prefix | Rol | Agent | Model | Dominio |
|--------|-----|-------|-------|---------|
| **CD-** | Creative Director | `creative-director` | Opus | Vision, pillars, player experience |
| **TD-** | Technical Director | `technical-director` | Opus | Architecture, engine risk, performance |
| **PR-** | Producer | `producer` | Opus | Scope, timeline, production risk |
| **AD-** | Art Director | `art-director` | Sonnet | Visual identity, art bible, visual prod |
| **LP-** | Lead Programmer | `lead-programmer` | Sonnet | Implementation feasibility, code review |
| **QL-** | QA Lead | `qa-lead` | Sonnet | Testability, test coverage |
| **ND-** | Narrative Director | `narrative-director` | Sonnet | Lore, dialogue, world consistency |

---

## Tier 1 — Creative Director Gates

Agent: `creative-director` | Model: Opus | Dominio: Vision, pillars, player experience

### CD-PILLARS — Pillar Stress Test

**Trigger**: Después de que los game pillars y anti-pillars están definidos (brainstorm Phase 4, o cuando se revisan pillars).

**Context to pass**:
- Pillar set completo con names, definitions, design tests
- Anti-pillars list
- Core fantasy statement
- Unique hook ("Like X, AND ALSO Y")

**Prompt**:
> "Review estos game pillars. ¿Son falsifiables — podría una design decision real fallar este pillar? ¿Crean tension significativa entre ellos? ¿Diferencian este juego de sus closest comparables? ¿Ayudarían a resolver un design disagreement en la práctica, o son too vague para ser útiles? Return APPROVE (strong), CONCERNS [list] (needs sharpening), o REJECT (weak — pillars no cargan peso)."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CD-GDD-ALIGN — GDD Pillar Alignment Check

**Trigger**: Después de que un system GDD se authored (`/design-system`, `/quick-design`, o workflow que produce GDD).

**Context to pass**:
- GDD file path
- Game pillars (de `design/gdd/game-concept.md` o `design/gdd/game-pillars.md`)
- MDA aesthetics target
- System's Player Fantasy section

**Prompt**:
> "Review este system GDD para pillar alignment. ¿Cada sección serve los stated pillars? ¿Hay mechanics o rules que contradicen o debilitan un pillar? ¿La Player Fantasy section match el core fantasy del juego? Return APPROVE, CONCERNS [specific sections con issues], o REJECT [pillar violations que deben redesignarse antes de que este sistema sea implementable]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CD-SYSTEMS — Systems Decomposition Vision Check

**Trigger**: Después de que el systems index se escribe con `/map-systems` — valida el complete system set antes de GDD authoring.

**Context to pass**:
- Systems index path (`design/gdd/systems-index.md`)
- Game pillars y core fantasy
- Priority tier assignments (MVP / Vertical Slice / Alpha / Full Vision)
- High-risk o bottleneck systems identificados

**Prompt**:
> "Review esta systems decomposition contra los design pillars. ¿El full set de MVP-tier systems collectively delivera el core fantasy? ¿Hay systems cuyos mechanics no sirven ningún stated pillar — scope creep? ¿Hay pillar-critical player experiences sin sistema asignado? ¿Hay systems faltantes que el core loop requires? Return APPROVE, CONCERNS [gaps o misalignments con implicaciones de pillar], o REJECT [fundamental gaps — decomposition misses critical design intent]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CD-NARRATIVE — Narrative Consistency Check

**Trigger**: Después de narrative GDDs, lore documents, dialogue specs, o world-building.

**Context to pass**:
- Document file path(s)
- Game pillars
- Narrative direction brief o tone guide
- Existing lore que el documento nuevo referencia

**Prompt**:
> "Review este narrative content para consistency con los pillars y world rules establecidos. ¿El tono match la voice establecida? ¿Hay contradicciones con lore existente o world-building? ¿El content serve el player experience pillar? Return APPROVE, CONCERNS [specific inconsistencies], o REJECT [contradictions que rompen world coherence]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CD-PLAYTEST — Player Experience Validation

**Trigger**: Después de playtest reports (`/playtest-report`), o session que produce player feedback.

**Context to pass**:
- Playtest report file path
- Game pillars y core fantasy statement
- Hypothesis específica siendo testeada

**Prompt**:
> "Review este playtest report contra los design pillars y core fantasy. ¿La player experience está matching la intended fantasy? ¿Hay systematic issues que representan pillar drift — mechanics que feel fine in isolation pero undermine la intended experience? Return APPROVE (core fantasy landing), CONCERNS [gaps between intended y actual experience], o REJECT [core fantasy no presente — redesign antes de más playtesting]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CD-PHASE-GATE — Creative Readiness at Phase Transition

**Trigger**: Siempre en `/gate-check` — paralelo con TD-PHASE-GATE, PR-PHASE-GATE, AD-PHASE-GATE.

**Context to pass**:
- Target phase name
- List de artifacts present
- Game pillars y core fantasy

**Prompt**:
> "Review el estado actual del proyecto para [target phase] gate readiness desde perspectiva creative direction. ¿Los pillars están faithfully representados en todos los design artifacts? ¿El state actual preserva el core fantasy? ¿Hay design decisions cross GDDs o architecture que comprometen la intended player experience? Return READY, CONCERNS [list], o NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — Technical Director Gates

Agent: `technical-director` | Model: Opus | Dominio: Architecture, engine risk, performance

### TD-SYSTEM-BOUNDARY — System Boundary Architecture Review

**Trigger**: Después de que `/map-systems` Phase 3 (dependency mapping) está agreed, antes de GDD authoring.

**Context to pass**:
- Systems index path
- Layer assignments (Foundation / Core / Feature / Presentation / Polish)
- Full dependency graph
- Bottleneck systems flagged
- Circular dependencies y sus resolutions

**Prompt**:
> "Review esta systems decomposition desde perspectiva arquitectónica antes de GDD authoring. ¿Los system boundaries son clean — cada sistema owns un distinct concern con minimal overlap? ¿Hay God Object risks? ¿El dependency ordering crea problemas de implementation-sequencing? ¿Hay implicit shared-state problems que van a causar tight coupling? ¿Algún Foundation-layer system dependiente de Feature-layer (inverted dependency)? Return APPROVE, CONCERNS [specific boundary issues a address en GDDs], o REJECT [fundamental boundary problems — system structure va a causar architectural issues]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### TD-FEASIBILITY — Technical Feasibility Assessment

**Trigger**: Después de identificar biggest technical risks (brainstorm Phase 6, `/quick-design`, o early concept con unknowns).

**Context to pass**:
- Concept's core loop description
- Platform target
- Engine choice (o "undecided")
- Identified technical risks list

**Prompt**:
> "Review estos technical risks para un juego [genre] targeting [platform] usando [engine o 'undecided']. Flag: (1) HIGH risk items que invalidarían el concept, (2) risks engine-specific que deberían influenciar engine choice, (3) risks commonly underestimated por solo devs. Return VIABLE (risks manageable), CONCERNS [list con mitigation suggestions], o HIGH RISK [blockers que requieren concept o scope revision]."

**Verdicts**: VIABLE / CONCERNS / HIGH RISK

---

### TD-ARCHITECTURE — Architecture Sign-Off

**Trigger**: Después del master architecture document (`/create-architecture` final phase), y después de major revisions.

**Context to pass**:
- Architecture document path (`docs/architecture/architecture.md`)
- Technical requirements baseline
- ADR list con statuses
- Engine knowledge gap inventory

**Prompt**:
> "Review este master architecture document para soundness técnico. Check: (1) ¿Cada technical requirement del baseline está cubierto por una architectural decision? (2) ¿Todos los HIGH risk engine domains están explicitly addressed o flagged como open questions? (3) ¿Las API boundaries son clean, minimal, implementables? (4) ¿Foundation layer ADR gaps resueltos antes de que empiece implementation? Return APPROVE, CONCERNS [list], o REJECT [blockers que deben resolverse antes de coding]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### TD-ADR — Architecture Decision Review

**Trigger**: Después de que un ADR individual está authored (`/architecture-decision`), antes de marcarlo Accepted.

**Context to pass**:
- ADR file path
- Engine version y knowledge gap risk level
- Related ADRs

**Prompt**:
> "Review este Architecture Decision Record. ¿Tiene problem statement y rationale claros? ¿Las rejected alternatives fueron genuinely considered? ¿Consequences section acknowledges trade-offs honestly? ¿Engine version está stamped? ¿Post-cutoff API risks flagged? ¿Linkea a los GDD requirements que cubre? Return APPROVE, CONCERNS [specific gaps], o REJECT [decision underspecified o hace unsound technical assumptions]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### TD-ENGINE-RISK — Engine Version Risk Review

**Trigger**: Cuando se hacen architecture decisions que tocan post-cutoff engine APIs, o antes de finalizar engine-specific implementation approach.

**Context to pass**:
- API o feature específica usada
- Engine version y LLM knowledge cutoff (de `docs/engine-reference/[engine]/VERSION.md`)
- Relevant excerpt de breaking-changes o deprecated-apis docs

**Prompt**:
> "Review este engine API usage contra el version reference. ¿Está este API presente en [engine version]? ¿Signature, behavior, o namespace han cambiado desde el LLM knowledge cutoff? ¿Hay deprecations conocidas o post-cutoff alternatives? Return APPROVE (safe to use as described), CONCERNS [verify antes de implementing], o REJECT [API ha cambiado — provide corrected approach]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### TD-PHASE-GATE — Technical Readiness at Phase Transition

**Trigger**: Siempre en `/gate-check` — paralelo con CD-PHASE-GATE, PR-PHASE-GATE, AD-PHASE-GATE.

**Context to pass**:
- Target phase name
- Architecture document path
- Engine reference path
- ADR list

**Prompt**:
> "Review el estado actual del proyecto para [target phase] gate readiness desde perspectiva technical direction. ¿La arquitectura es sound para esta phase? ¿Todos los high-risk engine domains están addressed? ¿Performance budgets son realistas y documented? ¿Foundation-layer decisions complete enough para empezar implementation? Return READY, CONCERNS [list], o NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — Producer Gates

Agent: `producer` | Model: Opus | Dominio: Scope, timeline, dependencies, production risk

### PR-SCOPE — Scope and Timeline Validation

**Trigger**: Después de que scope tiers están definidos (brainstorm Phase 6, `/quick-design`, o workflow que produce MVP + timeline).

**Context to pass**:
- Full vision scope description
- MVP definition
- Timeline estimate
- Team size (solo / small team)
- Scope tiers

**Prompt**:
> "Review este scope estimate. ¿El MVP es achievable en el stated timeline para el stated team size? ¿Scope tiers ordenados correctamente por risk — cada tier delivera un shippable product si work stops there? ¿Cuál es el most likely cut point bajo time pressure, y es un graceful fallback o un broken product? Return REALISTIC, OPTIMISTIC [specific adjustments], o UNREALISTIC [blockers — timeline o MVP debe revisarse]."

**Verdicts**: REALISTIC / OPTIMISTIC / UNREALISTIC

---

### PR-SPRINT — Sprint Feasibility Review

**Trigger**: Antes de finalizar un sprint plan (`/sprint-plan`), y después de mid-sprint scope change.

**Context to pass**:
- Proposed sprint story list
- Team capacity
- Current backlog debt
- Milestone constraints

**Prompt**:
> "Review este sprint plan para feasibility. ¿Story load realista para la capacity disponible? ¿Stories ordenadas correctamente por dependency? ¿Hidden dependencies entre stories que podrían bloquear sprint mid-way? ¿Stories underestimadas given su technical complexity? Return REALISTIC, CONCERNS [specific risks], o UNREALISTIC [sprint debe descopearse]."

**Verdicts**: REALISTIC / CONCERNS / UNREALISTIC

---

### PR-MILESTONE — Milestone Risk Assessment

**Trigger**: En milestone review, mid-sprint retros, o scope change que afecta milestone.

**Context to pass**:
- Milestone definition y target date
- Current completion %
- Blocked stories count
- Sprint velocity data

**Prompt**:
> "Review este milestone status. Based en velocity actual y blocked count, ¿el milestone hit su target date? ¿Top 3 production risks entre ahora y milestone? ¿Scope items que deberían cortarse para proteger milestone date vs items non-negotiable? Return ON TRACK, AT RISK [specific mitigations], o OFF TRACK [date slipea o scope cuts — provide both options]."

**Verdicts**: ON TRACK / AT RISK / OFF TRACK

---

### PR-EPIC — Epic Structure Feasibility Review

**Trigger**: Después de epics definidos (`/create-epics`), antes de story breakdown.

**Context to pass**:
- Epic definition paths
- Epic index (`production/epics/index.md`)
- Milestone timeline
- Team capacity
- Layer being epic'd

**Prompt**:
> "Review esta epic structure para production feasibility antes de story breakdown. ¿Epic boundaries scope apropiadamente — cada epic realísticamente completable antes de un milestone deadline? ¿Epics ordenadas correctamente por system dependency? ¿Epics underscoped (muy chicas, merge) o overscoped (muy grandes, split en 2-3)? ¿Foundation-layer epics scoped para permitir Core-layer epics empezar al inicio del siguiente sprint? Return REALISTIC, CONCERNS [structural adjustments antes de stories], o UNREALISTIC [epics deben split/merge/reorder]."

**Verdicts**: REALISTIC / CONCERNS / UNREALISTIC

---

### PR-PHASE-GATE — Production Readiness at Phase Transition

**Trigger**: Siempre en `/gate-check` — paralelo con CD, TD, AD PHASE-GATEs.

**Context to pass**:
- Target phase name
- Sprint y milestone artifacts
- Team size y capacity
- Blocked story count

**Prompt**:
> "Review el estado actual del proyecto para [target phase] gate readiness desde perspectiva de producción. ¿Scope es realista para timeline y team size? ¿Dependencies ordenadas correctamente? ¿Milestone o sprint risks que podrían derailar la phase en los primeros 2 sprints? Return READY, CONCERNS [list], o NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — Art Director Gates

Agent: `art-director` | Model: Sonnet | Dominio: Visual identity, art bible, visual production

### AD-CONCEPT-VISUAL — Visual Identity Anchor

**Trigger**: Después de que game pillars están locked (brainstorm Phase 4), paralelo con CD-PILLARS.

**Context to pass**:
- Game concept (elevator pitch, core fantasy, unique hook)
- Pillar set con definitions y design tests
- Target platform
- Reference games o visual touchstones mencionados

**Prompt**:
> "Based on estos game pillars y core concept, propone 2-3 distinct visual identity directions. Para cada direction: (1) one-line visual rule que podría guiar todas las visual decisions (ej 'todo debe moverse', 'beauty está en el decay'), (2) mood y atmosphere targets, (3) shape language (sharp/rounded/organic/geometric emphasis), (4) color philosophy (palette direction, qué significan colors en este world). Ser específico — avoid generic descriptions. Una direction debería directly serve el primary design pillar. Name cada direction. Recomendá cuál best serve los stated pillars y why."

**Verdicts**: CONCEPTS (multiple valid options — user selects) / STRONG (una direction clearly dominant) / CONCERNS (pillars no provide enough direction para diferenciar visual identity)

---

### AD-ART-BIBLE — Art Bible Sign-Off

**Trigger**: Después del art bible drafted (`/art-bible`), antes de que empiece asset production.

**Context to pass**:
- Art bible path (`design/art/art-bible.md`)
- Game pillars y core fantasy
- Platform y performance constraints (de `.claude/docs/technical-preferences.md`)
- Visual identity anchor chosen durante brainstorm

**Prompt**:
> "Review este art bible para completeness e internal consistency. ¿El color system match los mood targets? ¿Shape language follows del visual identity statement? ¿Asset standards achievables dentro de platform constraints? ¿Character design direction da artists enough to work con sin over-specifying? ¿Hay contradictions entre sections? ¿Un outsourcing team podría producir assets de este documento sin additional briefing? Return APPROVE (production-ready), CONCERNS [specific sections needing clarification], o REJECT [fundamental inconsistencies que deben resolverse antes de asset production]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### AD-VISUAL — Visual Consistency Review

**Trigger**: Después de art direction decisions, cuando se introducen nuevos asset types, o cuando una tech art decision afecta visual style.

**Context to pass**:
- Art bible path
- Specific asset type, style decision, o visual direction
- Reference images o style descriptions
- Platform y performance constraints

**Prompt**:
> "Review esta visual direction decision para consistency con el established art style y production constraints. ¿Match el art bible? ¿Achievable dentro del platform's performance budget? ¿Hay asset pipeline implications que crean technical risk? Return APPROVE, CONCERNS [specific adjustments], o REJECT [style violation o production risk]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### AD-PHASE-GATE — Visual Readiness at Phase Transition

**Trigger**: Siempre en `/gate-check` — paralelo con CD, TD, PR PHASE-GATEs.

**Context to pass**:
- Target phase name
- List de art/visual artifacts present
- Visual identity anchor (si existe)
- Art bible path (si existe)

**Prompt**:
> "Review el estado actual del proyecto para [target phase] gate readiness desde perspectiva de visual direction. ¿Visual identity establecido y documented al level que esta phase requires? ¿Los right visual artifacts están en place? ¿Visual teams podrían empezar su work sin visual direction gaps que causen costly rework? ¿Visual decisions being deferred past su latest responsible moment? Return READY, CONCERNS [specific visual direction gaps], o NOT READY [visual blockers — specify qué artifact falta y por qué matters en este stage]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 2 — Lead Gates

Tier 2 leads usan Sonnet por default.

### LP-FEASIBILITY — Lead Programmer Implementation Feasibility

**Trigger**: Después del master architecture document (`/create-architecture` Phase 7b), o cuando un architectural pattern nuevo se propone.

**Context to pass**:
- Architecture document path
- Technical requirements baseline summary
- ADR list con statuses

**Prompt**:
> "Review esta architecture para implementation feasibility. Flag: (a) decisions difíciles o imposibles de implementar con el stated engine y language, (b) missing interface definitions que programmers tendrían que inventar, (c) patterns que crean avoidable technical debt o que contradicen standard [engine] idioms. Return FEASIBLE, CONCERNS [list], o INFEASIBLE [blockers que hacen esta architecture unimplementable as written]."

**Verdicts**: FEASIBLE / CONCERNS / INFEASIBLE

---

### LP-CODE-REVIEW — Lead Programmer Code Review

**Trigger**: Después de que una dev story se implementa (`/dev-story`, `/story-done`), o como parte de `/code-review`.

**Context to pass**:
- Implementation file paths
- Story file path (para acceptance criteria)
- Relevant GDD section
- ADR que governa este system

**Prompt**:
> "Review esta implementation contra story acceptance criteria y governing ADR. ¿El code match las architecture boundary definitions? ¿Hay violations de coding standards o forbidden patterns? ¿Public API testeable y documentada? ¿Correctness issues contra las GDD rules? Return APPROVE, CONCERNS [specific issues], o REJECT [debe revisarse antes de merge]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### QL-STORY-READY — QA Lead Story Readiness Check

**Trigger**: Antes de que una story se acepta en un sprint — invocado por `/create-stories`, `/story-readiness`, `/sprint-plan`.

**Context to pass**:
- Story file path
- Story type (Logic / Integration / Visual/Feel / UI / Config/Data)
- Acceptance criteria list
- GDD requirement (TR-ID) que la story cubre

**Prompt**:
> "Review los acceptance criteria de esta story para testability antes de que entre al sprint. ¿Todos los criteria específicos enough que un developer sabría unambiguously cuando están done? Logic-type: ¿cada criterion verificable con automated test? Integration: ¿cada criterion observable en controlled test environment? Flag criteria too vague o que requieren full game build para test (mark DEFERRED, no BLOCKED). Return ADEQUATE, GAPS [specific criteria needing refinement], o INADEQUATE [criteria too vague — story debe revisarse antes de sprint]."

**Verdicts**: ADEQUATE / GAPS / INADEQUATE

---

### QL-TEST-COVERAGE — QA Lead Test Coverage Review

**Trigger**: Después de implementation stories complete, antes de marcar un epic done, o en `/gate-check` Production → Polish.

**Context to pass**:
- List de implemented stories con types
- Test file paths en `tests/`
- GDD acceptance criteria para el system

**Prompt**:
> "Review el test coverage para estas implementation stories. ¿Todas las Logic stories cubiertas por passing unit tests? ¿Integration stories cubiertas por integration tests o documented playtests? ¿GDD acceptance criteria cada uno mapeado a al menos un test? ¿Untested edge cases de la GDD Edge Cases section? Return ADEQUATE, GAPS [specific missing tests], o INADEQUATE [critical logic untested — no advance]."

**Verdicts**: ADEQUATE / GAPS / INADEQUATE

---

### ND-CONSISTENCY — Narrative Director Consistency Check

**Trigger**: Después de writer deliverables (dialogue, lore, item descriptions), o cuando un design decision tiene narrative implications.

**Context to pass**:
- Document o content file path(s)
- Narrative bible o tone guide path
- Relevant world-building rules
- Character o faction profiles affected

**Prompt**:
> "Review este narrative content para internal consistency y adherence a established world rules. ¿Character voices consistent con sus established profiles? ¿La lore contradicts cualquier established facts? ¿El tono consistent con el narrative direction del juego? Return APPROVE, CONCERNS [specific inconsistencies to fix], o REJECT [contradictions que rompen la narrative foundation]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

## Parallel Gate Protocol — Gamedev

Cuando un workflow requiere múltiples directors al mismo checkpoint (muy común en `/gate-check`), spawn simultáneo:

```
Spawn en paralelo:
1. creative-director  → CD-PHASE-GATE
2. technical-director → TD-PHASE-GATE
3. producer           → PR-PHASE-GATE
4. art-director       → AD-PHASE-GATE

Collect todos los verdicts, aplicar escalation rules:
- Any NOT READY / REJECT → overall FAIL
- Any CONCERNS → overall CONCERNS
- All READY / APPROVE → eligible PASS (subject a artifact checks)
```

---

## Gate Coverage by Stage — Gamedev

| Stage | Required Gates | Optional Gates |
|-------|---------------|----------------|
| **Concept** | CD-PILLARS, AD-CONCEPT-VISUAL | TD-FEASIBILITY, PR-SCOPE |
| **Systems Design** | TD-SYSTEM-BOUNDARY, CD-SYSTEMS, PR-SCOPE, CD-GDD-ALIGN (per GDD) | ND-CONSISTENCY, AD-VISUAL |
| **Technical Setup** | TD-ARCHITECTURE, TD-ADR (per ADR), LP-FEASIBILITY, AD-ART-BIBLE | TD-ENGINE-RISK |
| **Pre-Production** | PR-EPIC, QL-STORY-READY (per story), PR-SPRINT, all four PHASE-GATEs (via gate-check) | CD-PLAYTEST |
| **Production** | LP-CODE-REVIEW (per story), QL-STORY-READY, PR-SPRINT (per sprint) | PR-MILESTONE, QL-TEST-COVERAGE, AD-VISUAL |
| **Polish** | QL-TEST-COVERAGE, CD-PLAYTEST, PR-MILESTONE | AD-VISUAL |
| **Release** | All four PHASE-GATEs (via gate-check) | QL-TEST-COVERAGE |
