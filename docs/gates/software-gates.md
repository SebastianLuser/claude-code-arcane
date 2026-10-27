# Software Director Gates

Approval gates for software development (backend, frontend, APIs, infra). See `.claude/docs/gates/README.md` for the shared infrastructure (Review Modes, Verdict Format, Parallel Protocol).

---

## Roles and Model Tiers

| Prefix | Role | Agent | Model | Domain |
|--------|-----|-------|-------|---------|
| **CTO-** | Chief Technology Officer | `cto` | Opus | Architecture, tech strategy, systemic trade-offs |
| **VPE-** | VP of Engineering | `vpe` | Opus | Code quality, velocity, engineering excellence |
| **PM-** | Product/Project Manager | `pm` | Sonnet | Scope, timeline, dependencies, roadmap |
| **SEC-** | Security Architect | `security-architect` | Opus | Threat modeling, compliance, AppSec |
| **QA-** | QA Lead | `qa-lead` | Sonnet | Testability, coverage, test strategy |
| **UX-** | UX Lead | `ux-lead` | Sonnet | UX consistency, accessibility, design system |

---

## Tier 1 — CTO Gates

Agent: `cto` | Model: Opus | Domain: Architecture, tech strategy

### CTO-ARCHITECTURE — Architecture Sign-Off

**Trigger**: After the master architecture document, or after major revisions.

**Context to pass**:
- Architecture document path (`docs/architecture/architecture.md`)
- Technical requirements baseline (TR-IDs)
- ADR list with statuses
- Chosen stack (framework, DB, cache, queue)
- Non-functional requirements (latency, throughput, scale targets)

**Prompt**:
> "Review this architecture document for technical soundness. Check: (1) Is every technical requirement in the baseline covered by an architecture decision? (2) Are the service boundaries clean, minimal and implementable? (3) Is there hidden coupling between modules that will cause pain? (4) Do the datastore decisions match the access patterns? (5) Are the foundation-layer ADRs resolved before implementation starts? Return APPROVE, CONCERNS [list], or REJECT [blockers that must be resolved before coding starts]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CTO-ADR — Architecture Decision Review

**Trigger**: After an individual ADR is authored (`/architecture-decision`), before marking it Accepted.

**Context to pass**:
- ADR file path
- Stack version and knowledge gap risk if applicable
- Related ADRs

**Prompt**:
> "Review this Architecture Decision Record. Does it have a clear problem statement and rationale? Were the rejected alternatives genuinely considered? Does the Consequences section acknowledge the trade-offs honestly? Does it link to the technical requirements it covers? Is there a reversibility path if the decision goes wrong? Return APPROVE, CONCERNS [specific gaps], or REJECT [the decision is underspecified or makes unsound assumptions]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CTO-TECH-CHOICE — Technology Selection Review

**Trigger**: Before adopting a new major technology (framework, DB, cache, queue, language). For small libraries, use `VPE-CODE-REVIEW` on the PR that introduces them.

**Context to pass**:
- Technology candidate(s) with a comparison
- Problem being solved (what it replaces in the current setup)
- Maturity evidence (release history, community, corporate backing)
- Migration cost estimate if applicable

**Prompt**:
> "Review this tech selection decision. Does the problem genuinely need a new tool, or can it be solved with what exists? Does the candidate have production-grade maturity (not bleeding edge without justification)? Are the trade-offs vs. alternatives understood? Is the cost of adoption (learning curve, migration, ops burden) worth the benefits? Return APPROVE, CONCERNS [review X before adopting], or REJECT [use alternative Y or stick with the current one]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CTO-PHASE-GATE — Technical Readiness at Phase Transition

**Trigger**: Always in `/gate-check` — spawned in parallel with VPE-PHASE-GATE, PM-PHASE-GATE, SEC-PHASE-GATE.

**Context to pass**:
- Target phase name
- Architecture document path
- ADR list with statuses
- Current tech debt inventory

**Prompt**:
> "Review the project's current state for [target phase] gate readiness from a CTO perspective. Is the architecture sound for this phase? Are the high-risk technical domains addressed? Are the performance budgets realistic and documented? Are the foundation-layer decisions complete enough to start implementation? Is there tech debt that will block progress in this phase? Return READY, CONCERNS [list], or NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — VPE Gates

Agent: `vpe` | Model: Opus | Domain: Code quality, eng excellence

### VPE-CODE-REVIEW — Senior Code Review

**Trigger**: Before merging significant changes (new feature, refactor, migration path). For trivial patches, use normal peer review.

**Context to pass**:
- Modified file paths
- Story / ticket with acceptance criteria
- Governing ADR if applicable
- Tests added / modified

**Prompt**:
> "Review this implementation against the acceptance criteria and the relevant ADR. Check: (1) Does the code match the architecture's boundary definitions? (2) Are there violations of coding standards or forbidden patterns? (3) Is the public API testable and documented? (4) Are there correctness issues, races or edge cases? (5) Do the tests cover the important logic (not just the happy path)? (6) Is the error handling adequate at the boundaries? Return APPROVE, CONCERNS [specific issues], or REJECT [must be revised before merge]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### VPE-FEASIBILITY — Implementation Feasibility Review

**Trigger**: After the architecture document, or when a new architectural pattern is proposed. Validates that it can be implemented in practice.

**Context to pass**:
- Architecture document path
- Technical requirements baseline summary
- ADR list
- Team capability assessment (stack expertise)

**Prompt**:
> "Review this architecture for implementation feasibility. Flag: (a) decisions that are hard or impossible to implement with the chosen stack, (b) missing interface definitions that developers would have to invent, (c) patterns that create avoidable tech debt or contradict the framework's idioms. Does the team have the expertise today to execute this, or is there a gap? Return FEASIBLE, CONCERNS [list], or INFEASIBLE [blockers that make this architecture unimplementable as it stands]."

**Verdicts**: FEASIBLE / CONCERNS / INFEASIBLE

---

### VPE-REFACTOR — Refactor Strategy Review

**Trigger**: Before running a significant refactor (>2 days of effort or affects >5 critical files).

**Context to pass**:
- Refactor scope document
- Root cause motivating the refactor
- Proposed incremental migration path
- Rollback strategy

**Prompt**:
> "Review this refactor strategy. Does the root cause justify the cost of the refactor, or is it code polish with no clear ROI? Is the migration incremental (each PR mergeable on its own) or big-bang? Is there a rollback path if something breaks? Is the blast radius understood? Will the refactor create a code freeze that blocks feature work? Return APPROVE, CONCERNS [adjust strategy], or REJECT [risk vs. benefit does not justify it — defer or rescope]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### VPE-PHASE-GATE — Engineering Readiness at Phase Transition

**Trigger**: Always in `/gate-check` — in parallel with CTO-PHASE-GATE, PM-PHASE-GATE, SEC-PHASE-GATE.

**Context to pass**:
- Target phase name
- Code quality metrics (coverage, linter, tech debt)
- Test suite status (pass rate, coverage)
- Open PRs / stuck reviews count

**Prompt**:
> "Review the project's current state for [target phase] gate readiness from an engineering excellence perspective. Is the test suite healthy (high pass rate, deterministic)? Do the CI quality gates work? Are anti-quality patterns piling up that will blow up in this phase? Is team velocity sustainable? Return READY, CONCERNS [list], or NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — PM Gates

Agent: `pm` | Model: Sonnet | Domain: Scope, timeline, dependencies

### PM-SCOPE — Scope and Timeline Validation

**Trigger**: After the scope tiers are defined (brainstorm, quick-design, or a workflow that produces an MVP + timeline).

**Context to pass**:
- Full vision scope description
- MVP definition
- Timeline estimate
- Team size (solo / small team / etc.)
- Scope tiers (what ships if time runs out)

**Prompt**:
> "Review this scope estimate. Is the MVP achievable in the timeline for the team size? Are the scope tiers ordered correctly by risk — does each tier deliver a shippable product if work stops there? What is the most likely cut point under timeline pressure, and is it a graceful fallback or a broken product? Return REALISTIC (scope matches capacity), OPTIMISTIC [specific adjustments], or UNREALISTIC [blockers — the timeline or MVP must be revised]."

**Verdicts**: REALISTIC / OPTIMISTIC / UNREALISTIC

---

### PM-SPRINT — Sprint Feasibility Review

**Trigger**: Before finalizing a sprint plan (`/sprint-plan`), and after any mid-sprint scope change.

**Context to pass**:
- Proposed sprint story list (titles, estimates, dependencies)
- Team capacity (hours available)
- Current backlog debt
- Milestone constraints

**Prompt**:
> "Review this sprint plan for feasibility. Is the story load realistic for the available capacity? Are the stories ordered correctly by dependency? Are there hidden dependencies between stories that could block the sprint halfway through? Are there stories underestimated given their technical complexity? Return REALISTIC (achievable), CONCERNS [specific risks], or UNREALISTIC [the sprint must be descoped — identify which stories to defer]."

**Verdicts**: REALISTIC / CONCERNS / UNREALISTIC

---

### PM-MILESTONE — Milestone Risk Assessment

**Trigger**: At milestone review (`/milestone-review`), mid-sprint retrospectives, or when a scope change affects the milestone.

**Context to pass**:
- Milestone definition and target date
- Current completion percentage
- Blocked stories count
- Sprint velocity data

**Prompt**:
> "Review this milestone status. Based on current velocity and the blocked story count, will this milestone hit its target date? What are the top 3 production risks between now and the milestone? Are there scope items that should be cut to protect the milestone date vs. non-negotiable items? Return ON TRACK, AT RISK [specific mitigations], or OFF TRACK [the date must slip or scope must be cut — present both options]."

**Verdicts**: ON TRACK / AT RISK / OFF TRACK

---

### PM-EPIC — Epic Structure Feasibility Review

**Trigger**: After the epics are defined (`/create-epics`), before story breakdown.

**Context to pass**:
- Epic definition file paths
- Epic index path (`production/epics/index.md`)
- Milestone timeline and target dates
- Team capacity
- Layer being epic'd (Foundation / Core / Feature / Polish)

**Prompt**:
> "Review this epic structure for production feasibility before story breakdown. Are the epic boundaries scoped appropriately — can each epic realistically be completed before a milestone deadline? Are the epics ordered correctly by system dependency? Are there underscoped epics (too small, should merge) or overscoped ones (too large, split into 2-3)? Does the foundation-layer epic scope let the Core-layer epics start at the beginning of the next sprint? Return REALISTIC (producible), CONCERNS [structural adjustments before stories], or UNREALISTIC [epics must be split/merged/reordered]."

**Verdicts**: REALISTIC / CONCERNS / UNREALISTIC

---

### PM-PHASE-GATE — Production Readiness at Phase Transition

**Trigger**: Always in `/gate-check` — in parallel with CTO-PHASE-GATE, VPE-PHASE-GATE, SEC-PHASE-GATE.

**Context to pass**:
- Target phase name
- Sprint and milestone artifacts present
- Team size and capacity
- Current blocked story count

**Prompt**:
> "Review the project's current state for [target phase] gate readiness from a production perspective. Is the scope realistic for the timeline and team size? Are the dependencies ordered correctly? Are there milestone or sprint risks that could derail the phase in the first 2 sprints? Return READY, CONCERNS [list], or NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — Security Gates

Agent: `security-architect` | Model: Opus | Domain: Threat modeling, compliance, AppSec

### SEC-THREAT-MODEL — Threat Model Review

**Trigger**: After a threat model is authored for a system, or after an architecture that introduces a new trust boundary.

**Context to pass**:
- Threat model document path
- System architecture context
- Data classification (PII, financial, health)
- Compliance requirements (GDPR, SOC2, HIPAA, PCI)

**Prompt**:
> "Review this threat model. Does it identify all of the system's trust boundaries? Are the threats categorized (STRIDE, DREAD, or similar)? Does each threat have a proposed mitigation proportional to the risk? Are the assumptions listed and reasonable? Are there compliance requirements not being considered? Return APPROVE, CONCERNS [missing threats or mitigations], or REJECT [incomplete threat model — critical risks not addressed]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### SEC-AUDIT — Security Audit of Implementation

**Trigger**: Before production for systems that touch auth, authz, payments, PII, or sensitive data.

**Context to pass**:
- Implementation file paths
- Relevant threat model
- Dependencies used (with versions)
- Audit scope (what it includes, what it does not)

**Prompt**:
> "Review this implementation for security. Check against the OWASP Top 10: injection, broken auth, sensitive data, XXE/XSS, broken access control, security misconfig, vulnerable deps, logging/monitoring. Verify: (1) input validation at the boundaries? (2) prepared statements / query builders for queries? (3) secrets kept out of code/logs? (4) authorization checked per endpoint, not just authentication? (5) TLS enforced where there is sensitive data? Return APPROVE, CONCERNS [specific issues with severity], or REJECT [critical vulns that block release]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### SEC-DEPS — Dependency Security Review

**Trigger**: Before adopting new dependencies, or when running `/deps-audit`.

**Context to pass**:
- Dependencies list with versions
- Lockfile status
- Audit output (npm audit, snyk, pip-audit)
- Critical/high findings counts

**Prompt**:
> "Review this dependency audit. Are there HIGH or CRITICAL CVEs without mitigation? Are the dependencies pinned with a lockfile? Are there abandoned dependencies (no updates in >12 months) on the critical path? Are the dev dependencies separated from production? Return APPROVE (deps are healthy), CONCERNS [specific vulns to resolve next sprint], or REJECT [critical vulns block deploy until patched]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### SEC-PHASE-GATE — Security Readiness at Phase Transition

**Trigger**: Always in `/gate-check` — in parallel with CTO/VPE/PM-PHASE-GATE. Critical in Pre-Production and Release.

**Context to pass**:
- Target phase name
- Existing threat models
- Recent audit findings
- Compliance status

**Prompt**:
> "Review the project's current state for [target phase] gate readiness from a security perspective. Do the high-risk systems have a threat model? Are the HIGH/CRITICAL audit findings resolved? Are secrets managed correctly (not in code, rotation set up)? Are compliance requirements tracked? Return READY, CONCERNS [list], or NOT READY [security blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 2 — QA Lead Gates

Agent: `qa-lead` | Model: Sonnet | Domain: Testability, coverage, test strategy

### QA-STORY-READY — Story Readiness Check

**Trigger**: Before a story is accepted into a sprint — invoked by `/create-stories`, `/story-readiness`, `/sprint-plan`.

**Context to pass**:
- Story file path
- Story type (Logic / Integration / UI / Performance / Security)
- Acceptance criteria list (verbatim)
- Technical requirement (TR-ID) the story covers

**Prompt**:
> "Review this story's acceptance criteria for testability before it enters the sprint. Are all the criteria specific enough that a developer would know unambiguously when they are done? For Logic-type: is each criterion verifiable with an automated test? For Integration: is each criterion observable in a controlled test environment? For UI: is there an E2E test path or a documented walkthrough? Flag criteria that are too vague or that require a full system build to test. Return ADEQUATE, GAPS [specific criteria needing refinement], or INADEQUATE [the story must be revised before the sprint]."

**Verdicts**: ADEQUATE / GAPS / INADEQUATE

---

### QA-TEST-COVERAGE — Test Coverage Review

**Trigger**: After stories are complete, before marking an epic done, or in `/gate-check` Production → Polish.

**Context to pass**:
- List of implemented stories with types
- Test file paths in `tests/`
- Coverage report output
- Acceptance criteria per story

**Prompt**:
> "Review the test coverage for these implementation stories. Are all Logic stories covered by passing unit tests? Integration stories by integration tests? UI stories by E2E tests or documented walkthroughs? Is each acceptance criterion mapped to at least 1 test? Are there untested edge cases from the spec? Is the coverage target (>80% domain, >60% integration) hit? Return ADEQUATE, GAPS [specific missing tests], or INADEQUATE [critical logic untested — do not advance]."

**Verdicts**: ADEQUATE / GAPS / INADEQUATE

---

### QA-LOAD-TEST — Performance/Load Test Review

**Trigger**: Before release for critical endpoints, or before adopting a new architecture with performance claims.

**Context to pass**:
- Load test script path
- Performance targets (p95/p99 latency, throughput)
- Actual results
- Environment spec (not prod, but comparable)

**Prompt**:
> "Review these load test results. Does the test simulate realistic production patterns (ramp-up, concurrent users, request distribution)? Are the targets hit under sustained load, not just peak? Are there degradation modes (how does the system fail under overload)? Are memory and connection pool usage bounded? Return APPROVE (performance ready), CONCERNS [specific bottlenecks to optimize], or REJECT [performance does not meet targets — no deploy]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

## Tier 2 — UX Lead Gates

Agent: `ux-lead` | Model: Sonnet | Domain: UX consistency, accessibility, design system

### UX-DESIGN-REVIEW — UX Design Review

**Trigger**: After mockups / prototypes / design specs, before implementation.

**Context to pass**:
- Design spec / mockup paths (Figma link if applicable)
- User flow affected
- Design system reference
- Accessibility requirements (WCAG level)

**Prompt**:
> "Review this UX design. Is the flow consistent with the design system? Is there unnecessary friction in critical tasks? Does the accessibility meet WCAG AA (keyboard nav, screen reader, contrast)? Are the error states and edge cases designed (loading, empty, error, success)? Is responsive / mobile behavior specified? Return APPROVE, CONCERNS [specific UX issues], or REJECT [fundamental UX problems — redesign before implementation]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### UX-A11Y — Accessibility Audit

**Trigger**: Before release for any UI that serves public users.

**Context to pass**:
- UI component / screen paths
- WCAG level target (AA baseline, AAA where applicable)
- Automated audit output (axe, Lighthouse)
- Manual testing notes

**Prompt**:
> "Review this accessibility audit. Does it meet WCAG AA? Check: (1) minimum 4.5:1 contrast for text, (2) working keyboard nav in every flow, (3) ARIA only where semantic HTML falls short, (4) images with alt text, (5) forms with associated labels, (6) visible focus, (7) skip links, (8) no motion-only communication. Are there CRITICAL findings in the audit? Return APPROVE, CONCERNS [fix before next release], or REJECT [critical a11y blockers — do not ship until remediated]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

## Parallel Gate Protocol — Software

When a software workflow requires multiple directors at the same checkpoint (common in `/gate-check`), spawn them at once:

```
Spawn in parallel:
1. cto                → CTO-PHASE-GATE
2. vpe                → VPE-PHASE-GATE
3. pm                 → PM-PHASE-GATE
4. security-architect → SEC-PHASE-GATE
5. qa-lead            → QA-PHASE-GATE (if coverage/quality is in scope)

Collect all verdicts, apply the escalation rules:
- Any NOT READY / REJECT → overall FAIL
- Any CONCERNS → overall CONCERNS
- All READY / APPROVE → eligible PASS (subject to artifact checks)
```

---

## Gate Coverage by Stage — Software

| Stage | Required Gates | Optional Gates |
|-------|---------------|----------------|
| **Discovery** | PM-SCOPE, CTO-TECH-CHOICE | SEC-THREAT-MODEL, UX-DESIGN-REVIEW |
| **Design** | CTO-ARCHITECTURE, CTO-ADR (per ADR), VPE-FEASIBILITY | SEC-THREAT-MODEL, UX-DESIGN-REVIEW |
| **Pre-Production** | PM-EPIC, QA-STORY-READY (per story), PM-SPRINT, PHASE-GATEs (via gate-check) | UX-A11Y if UI |
| **Production** | VPE-CODE-REVIEW (per significant story), QA-STORY-READY, PM-SPRINT | PM-MILESTONE, QA-TEST-COVERAGE, SEC-AUDIT |
| **Pre-Release** | SEC-AUDIT, SEC-DEPS, QA-TEST-COVERAGE, QA-LOAD-TEST, UX-A11Y | VPE-REFACTOR if a refactor is under way |
| **Release** | PHASE-GATEs (via gate-check) | All Tier 1 gates |
