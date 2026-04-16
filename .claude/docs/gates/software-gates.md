# Software Director Gates

Gates de approval para desarrollo de software (backend, frontend, APIs, infra). Ver `.claude/docs/gates/README.md` para infraestructura compartida (Review Modes, Verdict Format, Parallel Protocol).

---

## Roles y Model Tiers

| Prefix | Rol | Agent | Model | Dominio |
|--------|-----|-------|-------|---------|
| **CTO-** | Chief Technology Officer | `cto` | Opus | Arquitectura, tech strategy, trade-offs sistémicos |
| **VPE-** | VP of Engineering | `vpe` | Opus | Calidad de código, velocity, engineering excellence |
| **PM-** | Product/Project Manager | `pm` | Sonnet | Scope, timeline, dependencies, roadmap |
| **SEC-** | Security Architect | `security-architect` | Opus | Threat modeling, compliance, AppSec |
| **QA-** | QA Lead | `qa-lead` | Sonnet | Testability, coverage, test strategy |
| **UX-** | UX Lead | `ux-lead` | Sonnet | UX consistency, accessibility, design system |

---

## Tier 1 — CTO Gates

Agent: `cto` | Model: Opus | Dominio: Arquitectura, tech strategy

### CTO-ARCHITECTURE — Architecture Sign-Off

**Trigger**: Después del documento maestro de architecture (`/create-architecture` final phase), o después de revisiones mayores.

**Context to pass**:
- Architecture document path (`docs/architecture/architecture.md`)
- Technical requirements baseline (TR-IDs)
- ADR list con statuses
- Stack elegido (framework, DB, cache, queue)
- Non-functional requirements (latency, throughput, scale targets)

**Prompt**:
> "Review este architecture document para soundness técnico. Check: (1) ¿Cada technical requirement del baseline está cubierto por una decisión arquitectónica? (2) ¿Los service boundaries son clean, minimal, implementables? (3) ¿Hay cupling escondido entre módulos que va a crear pain? (4) ¿Las decisiones de datastore match los access patterns? (5) ¿Foundation-layer ADRs están resueltos antes de empezar implementación? Return APPROVE, CONCERNS [list], o REJECT [blockers que deben resolverse antes de que empiece coding]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CTO-ADR — Architecture Decision Review

**Trigger**: Después de que un ADR individual se authored (`/architecture-decision`), antes de marcarlo Accepted.

**Context to pass**:
- ADR file path
- Stack version y knowledge gap risk si aplica
- Related ADRs

**Prompt**:
> "Review este Architecture Decision Record. ¿Tiene problem statement y rationale claros? ¿Las alternativas rechazadas fueron consideradas genuinamente? ¿La sección Consequences acknowledgea los trade-offs honestamente? ¿Linkea a los technical requirements que cubre? ¿Hay reversibility path si la decisión sale mal? Return APPROVE, CONCERNS [specific gaps], o REJECT [la decisión está underspecified o hace unsound assumptions]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CTO-TECH-CHOICE — Technology Selection Review

**Trigger**: Antes de adoptar una nueva major technology (framework, DB, cache, queue, language). Para libraries pequeñas usar `VPE-CODE-REVIEW` en el PR donde se introduce.

**Context to pass**:
- Technology candidate(s) con comparison
- Problem being solved (qué alternativa a lo actual)
- Maturity evidence (release history, community, corporate backing)
- Migration cost estimate si aplica

**Prompt**:
> "Review esta decisión de tech selection. ¿El problema genuinamente necesita una nueva tool, o puede resolverse con lo existente? ¿La candidate tiene production-grade maturity (no bleeding edge sin justificación)? ¿Los trade-offs vs alternatives son entendidos? ¿El cost de adoption (learning curve, migration, ops burden) vale los benefits? Return APPROVE, CONCERNS [revisar X antes de adoptar], o REJECT [usar alternative Y o stick con lo actual]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CTO-PHASE-GATE — Technical Readiness at Phase Transition

**Trigger**: Siempre en `/gate-check` — spawn en paralelo con VPE-PHASE-GATE, PM-PHASE-GATE, SEC-PHASE-GATE.

**Context to pass**:
- Target phase name
- Architecture document path
- ADR list con statuses
- Current tech debt inventory

**Prompt**:
> "Review el estado actual del proyecto para [target phase] gate readiness desde perspectiva de CTO. ¿La arquitectura es sound para esta phase? ¿Los high-risk technical domains están addressed? ¿Los performance budgets son realistas y documentados? ¿Foundation-layer decisions están complete para empezar implementation? ¿Hay tech debt que va a bloquear progreso en esta phase? Return READY, CONCERNS [list], o NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — VPE Gates

Agent: `vpe` | Model: Opus | Dominio: Calidad de código, eng excellence

### VPE-CODE-REVIEW — Senior Code Review

**Trigger**: Antes de merge de cambios significativos (nueva feature, refactor, migration path). Para patches triviales usar peer review normal.

**Context to pass**:
- File paths modificados
- Story / ticket con acceptance criteria
- ADR governante si aplica
- Tests agregados / modificados

**Prompt**:
> "Review esta implementación contra acceptance criteria y ADR relevante. Check: (1) ¿El code match las boundary definitions de la arquitectura? (2) ¿Hay violations de coding standards o forbidden patterns? (3) ¿La API pública es testeable y está documentada? (4) ¿Hay issues de correctness, races, o edge cases? (5) ¿Los tests cubren lógica importante (no solo happy path)? (6) ¿El error handling es adecuado para boundaries? Return APPROVE, CONCERNS [specific issues], o REJECT [debe revisarse antes de merge]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### VPE-FEASIBILITY — Implementation Feasibility Review

**Trigger**: Después del architecture document, o cuando un patrón arquitectónico nuevo se propone. Valida que se pueda implementar en la práctica.

**Context to pass**:
- Architecture document path
- Technical requirements baseline summary
- ADR list
- Team capability assessment (stack expertise)

**Prompt**:
> "Review esta architecture para feasibility de implementación. Flag: (a) decisiones difíciles o imposibles de implementar con el stack elegido, (b) interface definitions faltantes que developers tendrían que inventar, (c) patrones que crean tech debt avoidable o que contradicen idioms del framework. ¿El team tiene expertise actual para ejecutar esto, o hay gap? Return FEASIBLE, CONCERNS [list], o INFEASIBLE [blockers que hacen esta architecture unimplementable como está]."

**Verdicts**: FEASIBLE / CONCERNS / INFEASIBLE

---

### VPE-REFACTOR — Refactor Strategy Review

**Trigger**: Antes de ejecutar un refactor significativo (>2 días de effort o afecta >5 archivos críticos).

**Context to pass**:
- Refactor scope document
- Root cause que motiva el refactor
- Incremental migration path propuesto
- Rollback strategy

**Prompt**:
> "Review esta refactor strategy. ¿El root cause amerita el costo del refactor, o es polish de código sin ROI claro? ¿La migration es incremental (cada PR mergeable aislado) o big-bang? ¿Hay rollback path si algo se rompe? ¿El blast radius está entendido? ¿El refactor va a crear code freeze que bloquee feature work? Return APPROVE, CONCERNS [adjust strategy], o REJECT [riesgo vs benefit no justifica — defer o rescope]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### VPE-PHASE-GATE — Engineering Readiness at Phase Transition

**Trigger**: Siempre en `/gate-check` — paralelo con CTO-PHASE-GATE, PM-PHASE-GATE, SEC-PHASE-GATE.

**Context to pass**:
- Target phase name
- Code quality metrics (coverage, linter, tech debt)
- Test suite status (pass rate, coverage)
- Open PRs / stuck reviews count

**Prompt**:
> "Review el estado actual del proyecto para [target phase] gate readiness desde perspectiva de engineering excellence. ¿La test suite está healthy (high pass rate, deterministic)? ¿Los quality gates en CI funcionan? ¿Hay patterns anti-quality acumulándose que van a explotar en esta phase? ¿Team velocity es sostenible? Return READY, CONCERNS [list], o NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — PM Gates

Agent: `pm` | Model: Sonnet | Dominio: Scope, timeline, dependencies

### PM-SCOPE — Scope and Timeline Validation

**Trigger**: Después de que los scope tiers están definidos (brainstorm, quick-design, o workflow que produce MVP + timeline).

**Context to pass**:
- Full vision scope description
- MVP definition
- Timeline estimate
- Team size (solo / small team / etc.)
- Scope tiers (qué se ship si time runs out)

**Prompt**:
> "Review este scope estimate. ¿El MVP es achievable en el timeline para el team size? ¿Los scope tiers están ordenados correctamente por riesgo — cada tier delivera un producto shippable si work stops there? ¿Cuál es el most likely cut point bajo pressure de timeline, y es un graceful fallback o un producto roto? Return REALISTIC (scope matches capacity), OPTIMISTIC [specific adjustments], o UNREALISTIC [blockers — timeline o MVP debe revisarse]."

**Verdicts**: REALISTIC / OPTIMISTIC / UNREALISTIC

---

### PM-SPRINT — Sprint Feasibility Review

**Trigger**: Antes de finalizar un sprint plan (`/sprint-plan`), y después de cualquier mid-sprint scope change.

**Context to pass**:
- Proposed sprint story list (titles, estimates, dependencies)
- Team capacity (hours available)
- Current backlog debt
- Milestone constraints

**Prompt**:
> "Review este sprint plan para feasibility. ¿La story load es realista para la capacity disponible? ¿Las stories están ordenadas correctamente por dependency? ¿Hay hidden dependencies entre stories que podrían bloquear el sprint a mitad de camino? ¿Hay stories underestimadas given su complejidad técnica? Return REALISTIC (achievable), CONCERNS [specific risks], o UNREALISTIC [sprint debe descopearse — identificar qué stories deferir]."

**Verdicts**: REALISTIC / CONCERNS / UNREALISTIC

---

### PM-MILESTONE — Milestone Risk Assessment

**Trigger**: En milestone review (`/milestone-review`), mid-sprint retrospectives, o cuando un scope change afecta el milestone.

**Context to pass**:
- Milestone definition y target date
- Current completion percentage
- Blocked stories count
- Sprint velocity data

**Prompt**:
> "Review este milestone status. Basado en velocity actual y blocked story count, ¿este milestone hitea su target date? ¿Cuáles son los top 3 risks de producción entre ahora y el milestone? ¿Hay scope items que deberían cortarse para proteger la fecha del milestone vs items non-negotiable? Return ON TRACK, AT RISK [specific mitigations], o OFF TRACK [date debe slipear o scope debe cortarse — presentar ambas opciones]."

**Verdicts**: ON TRACK / AT RISK / OFF TRACK

---

### PM-EPIC — Epic Structure Feasibility Review

**Trigger**: Después de que los epics están definidos (`/create-epics`), antes de story breakdown.

**Context to pass**:
- Epic definition file paths
- Epic index path (`production/epics/index.md`)
- Milestone timeline y target dates
- Team capacity
- Layer being epic'd (Foundation / Core / Feature / Polish)

**Prompt**:
> "Review esta epic structure para feasibility de producción antes de story breakdown. ¿Los epic boundaries están scope apropiadamente — cada epic puede realísticamente completarse antes de un milestone deadline? ¿Epics están ordenados correctamente por system dependency? ¿Hay epics underscoped (muy chicos, deberían merge) o overscoped (muy grandes, split en 2-3)? ¿Foundation-layer epics scope permite a Core-layer epics empezar al inicio del siguiente sprint? Return REALISTIC (producible), CONCERNS [structural adjustments antes de stories], o UNREALISTIC [epics deben split/merge/reorder]."

**Verdicts**: REALISTIC / CONCERNS / UNREALISTIC

---

### PM-PHASE-GATE — Production Readiness at Phase Transition

**Trigger**: Siempre en `/gate-check` — paralelo con CTO-PHASE-GATE, VPE-PHASE-GATE, SEC-PHASE-GATE.

**Context to pass**:
- Target phase name
- Sprint y milestone artifacts present
- Team size y capacity
- Current blocked story count

**Prompt**:
> "Review el estado actual del proyecto para [target phase] gate readiness desde perspectiva de production. ¿El scope es realista para el timeline y team size? ¿Las dependencies están ordenadas correctamente? ¿Hay milestone o sprint risks que podrían derailar la phase en los primeros 2 sprints? Return READY, CONCERNS [list], o NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — Security Gates

Agent: `security-architect` | Model: Opus | Dominio: Threat modeling, compliance, AppSec

### SEC-THREAT-MODEL — Threat Model Review

**Trigger**: Después de que un threat model se authored para un sistema, o después de arquitectura que introduce nueva trust boundary.

**Context to pass**:
- Threat model document path
- System architecture context
- Data classification (PII, financial, health)
- Compliance requirements (GDPR, SOC2, HIPAA, PCI)

**Prompt**:
> "Review este threat model. ¿Identifica todas las trust boundaries del sistema? ¿Los threats están categorizados (STRIDE, DREAD, o similar)? ¿Cada threat tiene mitigación propuesta proporcional al riesgo? ¿Los assumptions están listados y son razonables? ¿Hay compliance requirements que no se consideran? Return APPROVE, CONCERNS [missing threats o mitigations], o REJECT [threat model incompleto — critical risks no addressed]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### SEC-AUDIT — Security Audit of Implementation

**Trigger**: Antes de producción para sistemas que tocan auth, autz, payments, PII, o data sensible.

**Context to pass**:
- Implementation file paths
- Threat model relevante
- Dependencies usadas (con versions)
- Audit scope (qué incluye, qué no)

**Prompt**:
> "Review esta implementación para security. Check contra OWASP Top 10: injection, broken auth, sensitive data, XXE/XSS, broken access control, security misconfig, vulnerable deps, logging/monitoring. Verificar: (1) ¿input validation en boundaries? (2) ¿prepared statements / query builders para queries? (3) ¿secrets no están en code/logs? (4) ¿autorización se checkea por endpoint, no solo auth? (5) ¿TLS enforced donde hay data sensible? Return APPROVE, CONCERNS [specific issues con severity], o REJECT [critical vulns que bloquean release]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### SEC-DEPS — Dependency Security Review

**Trigger**: Antes de adoptar nuevas dependencies, o al correr `/deps-audit`.

**Context to pass**:
- Dependencies list con versions
- Lockfile status
- Audit output (npm audit, snyk, pip-audit)
- Critical/high findings counts

**Prompt**:
> "Review esta dependency audit. ¿Hay CVEs HIGH o CRITICAL sin mitigación? ¿Las dependencies están pinned con lockfile? ¿Hay dependencies abandonadas (sin updates >12 meses) en critical path? ¿Las dev dependencies están separadas de production? Return APPROVE (deps están healthy), CONCERNS [specific vulns a resolver en próximo sprint], o REJECT [critical vulns bloquean deploy hasta que se patcheen]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### SEC-PHASE-GATE — Security Readiness at Phase Transition

**Trigger**: Siempre en `/gate-check` — paralelo con CTO/VPE/PM-PHASE-GATE. Crítico en Pre-Production y Release.

**Context to pass**:
- Target phase name
- Threat models existentes
- Recent audit findings
- Compliance status

**Prompt**:
> "Review el estado actual del proyecto para [target phase] gate readiness desde perspectiva de security. ¿Los high-risk systems tienen threat model? ¿Las audit findings HIGH/CRITICAL están resueltas? ¿Los secrets están managed correctamente (no en code, rotation setup)? ¿Compliance requirements están trackeados? Return READY, CONCERNS [list], o NOT READY [security blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 2 — QA Lead Gates

Agent: `qa-lead` | Model: Sonnet | Dominio: Testability, coverage, test strategy

### QA-STORY-READY — Story Readiness Check

**Trigger**: Antes de que una story se acepta en un sprint — invocado por `/create-stories`, `/story-readiness`, `/sprint-plan`.

**Context to pass**:
- Story file path
- Story type (Logic / Integration / UI / Performance / Security)
- Acceptance criteria list (verbatim)
- Technical requirement (TR-ID) que la story cubre

**Prompt**:
> "Review los acceptance criteria de esta story para testability antes de que entre al sprint. ¿Todos los criteria son específicos enough que un developer sabría unambiguously cuando están done? Para Logic-type: ¿cada criterion es verifiable con un automated test? Para Integration: ¿cada criterion es observable en test environment controlado? Para UI: ¿hay E2E test path o walkthrough documentado? Flaggear criteria too vague o que requieren full system build para testear. Return ADEQUATE, GAPS [specific criteria needing refinement], o INADEQUATE [story debe revisarse antes de sprint]."

**Verdicts**: ADEQUATE / GAPS / INADEQUATE

---

### QA-TEST-COVERAGE — Test Coverage Review

**Trigger**: Después de stories completas, antes de marcar epic done, o en `/gate-check` Production → Polish.

**Context to pass**:
- List de implemented stories con types
- Test file paths en `tests/`
- Coverage report output
- Acceptance criteria per story

**Prompt**:
> "Review el test coverage para estas implementation stories. ¿Todas las Logic stories están cubiertas por passing unit tests? ¿Integration stories con integration tests? ¿UI stories con E2E tests o walkthroughs documentados? ¿Los acceptance criteria están mapeados a al menos 1 test cada uno? ¿Hay edge cases untested de la spec? ¿Coverage meta (>80% dominio, >60% integration) se hit? Return ADEQUATE, GAPS [specific missing tests], o INADEQUATE [critical logic untested — no advance]."

**Verdicts**: ADEQUATE / GAPS / INADEQUATE

---

### QA-LOAD-TEST — Performance/Load Test Review

**Trigger**: Antes de release para endpoints críticos, o antes de adopter una arquitectura nueva con claims de performance.

**Context to pass**:
- Load test script path
- Performance targets (p95/p99 latency, throughput)
- Actual results
- Environment spec (no prod, pero comparable)

**Prompt**:
> "Review estos load test results. ¿El test simula patterns realistas de producción (ramp-up, concurrent users, request distribution)? ¿Los targets están hit bajo sustained load, no solo peak? ¿Hay degradation modes (cómo falla el sistema bajo overload)? ¿Memory y connection pool usage son bounded? Return APPROVE (performance ready), CONCERNS [specific bottlenecks a optimizar], o REJECT [performance no meets targets — no deploy]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

## Tier 2 — UX Lead Gates

Agent: `ux-lead` | Model: Sonnet | Dominio: UX consistency, accessibility, design system

### UX-DESIGN-REVIEW — UX Design Review

**Trigger**: Después de mockups / prototypes / design specs, antes de implementation.

**Context to pass**:
- Design spec / mockup paths (Figma link si aplica)
- User flow affected
- Design system reference
- Accessibility requirements (WCAG level)

**Prompt**:
> "Review este UX design. ¿El flow es consistent con el design system? ¿Hay fricción innecesaria en tasks críticos? ¿La accessibility meets WCAG AA (keyboard nav, screen reader, contrast)? ¿Los error states y edge cases están diseñados (loading, empty, error, success)? ¿Responsive / mobile behavior está especificado? Return APPROVE, CONCERNS [specific UX issues], o REJECT [fundamental UX problems — redesign antes de implementation]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### UX-A11Y — Accessibility Audit

**Trigger**: Antes de release para cualquier UI que sirve usuarios públicos.

**Context to pass**:
- UI component / screen paths
- WCAG level target (AA baseline, AAA donde aplique)
- Automated audit output (axe, Lighthouse)
- Manual testing notes

**Prompt**:
> "Review este accessibility audit. ¿Meets WCAG AA? Check: (1) contraste mínimo 4.5:1 para texto, (2) keyboard nav funcional en todos los flows, (3) ARIA solo donde HTML semántico no alcanza, (4) imágenes con alt, (5) forms con labels asociados, (6) focus visible, (7) skip links, (8) no motion-only communication. ¿Hay findings CRITICAL del audit? Return APPROVE, CONCERNS [fix before next release], o REJECT [critical a11y blockers — no ship hasta remediar]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

## Parallel Gate Protocol — Software

Cuando un workflow de software requiere múltiples directors al mismo checkpoint (común en `/gate-check`), spawn simultáneo:

```
Spawn en paralelo:
1. cto                → CTO-PHASE-GATE
2. vpe                → VPE-PHASE-GATE
3. pm                 → PM-PHASE-GATE
4. security-architect → SEC-PHASE-GATE
5. qa-lead            → QA-PHASE-GATE (si coverage/quality en scope)

Collect todos los verdicts, aplicar escalation rules:
- Any NOT READY / REJECT → overall FAIL
- Any CONCERNS → overall CONCERNS
- All READY / APPROVE → eligible PASS (subject a artifact checks)
```

---

## Gate Coverage by Stage — Software

| Stage | Required Gates | Optional Gates |
|-------|---------------|----------------|
| **Discovery** | PM-SCOPE, CTO-TECH-CHOICE | SEC-THREAT-MODEL, UX-DESIGN-REVIEW |
| **Design** | CTO-ARCHITECTURE, CTO-ADR (per ADR), VPE-FEASIBILITY | SEC-THREAT-MODEL, UX-DESIGN-REVIEW |
| **Pre-Production** | PM-EPIC, QA-STORY-READY (per story), PM-SPRINT, PHASE-GATEs (via gate-check) | UX-A11Y si UI |
| **Production** | VPE-CODE-REVIEW (per significant story), QA-STORY-READY, PM-SPRINT | PM-MILESTONE, QA-TEST-COVERAGE, SEC-AUDIT |
| **Pre-Release** | SEC-AUDIT, SEC-DEPS, QA-TEST-COVERAGE, QA-LOAD-TEST, UX-A11Y | VPE-REFACTOR si refactor en curso |
| **Release** | PHASE-GATEs (via gate-check) | Todos los Tier 1 gates |
