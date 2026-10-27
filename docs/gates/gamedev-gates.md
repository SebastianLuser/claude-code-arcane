# Gamedev Director Gates

Approval gates for game development (engines, gameplay, art, production). See `.claude/docs/gates/README.md` for the shared infrastructure (Review Modes, Verdict Format, Parallel Protocol).

---

## Roles and Model Tiers

| Prefix | Role | Agent | Model | Domain |
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

Agent: `creative-director` | Model: Opus | Domain: Vision, pillars, player experience

### CD-PILLARS — Pillar Stress Test

**Trigger**: After the game pillars and anti-pillars are defined (brainstorm Phase 4, or when pillars are revised).

**Context to pass**:
- Full pillar set with names, definitions, design tests
- Anti-pillars list
- Core fantasy statement
- Unique hook ("Like X, AND ALSO Y")

**Prompt**:
> "Review these game pillars. Are they falsifiable — could a real design decision fail this pillar? Do they create meaningful tension between each other? Do they differentiate this game from its closest comparables? Would they help resolve a design disagreement in practice, or are they too vague to be useful? Return APPROVE (strong), CONCERNS [list] (needs sharpening), or REJECT (weak — the pillars carry no weight)."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CD-GDD-ALIGN — GDD Pillar Alignment Check

**Trigger**: After a system GDD is authored (`/design-system`, `/quick-design`, or any workflow that produces a GDD).

**Context to pass**:
- GDD file path
- Game pillars (from `design/gdd/game-concept.md` or `design/gdd/game-pillars.md`)
- MDA aesthetics target
- System's Player Fantasy section

**Prompt**:
> "Review this system GDD for pillar alignment. Does every section serve the stated pillars? Are there mechanics or rules that contradict or weaken a pillar? Does the Player Fantasy section match the game's core fantasy? Return APPROVE, CONCERNS [specific sections with issues], or REJECT [pillar violations that must be redesigned before this system is implementable]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CD-SYSTEMS — Systems Decomposition Vision Check

**Trigger**: After the systems index is written with `/map-systems` — validates the complete system set before GDD authoring.

**Context to pass**:
- Systems index path (`design/gdd/systems-index.md`)
- Game pillars and core fantasy
- Priority tier assignments (MVP / Vertical Slice / Alpha / Full Vision)
- Identified high-risk or bottleneck systems

**Prompt**:
> "Review this systems decomposition against the design pillars. Does the full set of MVP-tier systems collectively deliver the core fantasy? Are there systems whose mechanics serve no stated pillar — scope creep? Are there pillar-critical player experiences with no system assigned? Are there missing systems the core loop requires? Return APPROVE, CONCERNS [gaps or misalignments with pillar implications], or REJECT [fundamental gaps — the decomposition misses critical design intent]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CD-NARRATIVE — Narrative Consistency Check

**Trigger**: After narrative GDDs, lore documents, dialogue specs, or world-building.

**Context to pass**:
- Document file path(s)
- Game pillars
- Narrative direction brief or tone guide
- Existing lore the new document references

**Prompt**:
> "Review this narrative content for consistency with the established pillars and world rules. Does the tone match the established voice? Are there contradictions with existing lore or world-building? Does the content serve the player experience pillar? Return APPROVE, CONCERNS [specific inconsistencies], or REJECT [contradictions that break world coherence]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CD-PLAYTEST — Player Experience Validation

**Trigger**: After playtest reports (`/playtest-report`), or any session that produces player feedback.

**Context to pass**:
- Playtest report file path
- Game pillars and core fantasy statement
- The specific hypothesis being tested

**Prompt**:
> "Review this playtest report against the design pillars and core fantasy. Is the player experience matching the intended fantasy? Are there systematic issues that represent pillar drift — mechanics that feel fine in isolation but undermine the intended experience? Return APPROVE (core fantasy landing), CONCERNS [gaps between intended and actual experience], or REJECT [core fantasy not present — redesign before more playtesting]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### CD-PHASE-GATE — Creative Readiness at Phase Transition

**Trigger**: Always in `/gate-check` — in parallel with TD-PHASE-GATE, PR-PHASE-GATE, AD-PHASE-GATE.

**Context to pass**:
- Target phase name
- List of artifacts present
- Game pillars and core fantasy

**Prompt**:
> "Review the current state of the project for [target phase] gate readiness from a creative direction perspective. Are the pillars faithfully represented in every design artifact? Does the current state preserve the core fantasy? Are there design decisions across GDDs or architecture that compromise the intended player experience? Return READY, CONCERNS [list], or NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — Technical Director Gates

Agent: `technical-director` | Model: Opus | Domain: Architecture, engine risk, performance

### TD-SYSTEM-BOUNDARY — System Boundary Architecture Review

**Trigger**: After `/map-systems` Phase 3 (dependency mapping) is agreed, before GDD authoring.

**Context to pass**:
- Systems index path
- Layer assignments (Foundation / Core / Feature / Presentation / Polish)
- Full dependency graph
- Bottleneck systems flagged
- Circular dependencies and their resolutions

**Prompt**:
> "Review this systems decomposition from an architectural perspective before GDD authoring. Are the system boundaries clean — does each system own a distinct concern with minimal overlap? Are there God Object risks? Does the dependency ordering create implementation-sequencing problems? Are there implicit shared-state problems that will cause tight coupling? Is any Foundation-layer system dependent on the Feature layer (inverted dependency)? Return APPROVE, CONCERNS [specific boundary issues to address in GDDs], or REJECT [fundamental boundary problems — the system structure will cause architectural issues]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### TD-FEASIBILITY — Technical Feasibility Assessment

**Trigger**: After identifying the biggest technical risks (brainstorm Phase 6, `/quick-design`, or an early concept with unknowns).

**Context to pass**:
- Concept's core loop description
- Platform target
- Engine choice (or "undecided")
- Identified technical risks list

**Prompt**:
> "Review these technical risks for a [genre] game targeting [platform] using [engine or 'undecided']. Flag: (1) HIGH risk items that would invalidate the concept, (2) engine-specific risks that should influence the engine choice, (3) risks commonly underestimated by solo devs. Return VIABLE (risks manageable), CONCERNS [list with mitigation suggestions], or HIGH RISK [blockers that require a concept or scope revision]."

**Verdicts**: VIABLE / CONCERNS / HIGH RISK

---

### TD-ARCHITECTURE — Architecture Sign-Off

**Trigger**: After the master architecture document, and after major revisions.

**Context to pass**:
- Architecture document path (`docs/architecture/architecture.md`)
- Technical requirements baseline
- ADR list with statuses
- Engine knowledge gap inventory

**Prompt**:
> "Review this master architecture document for technical soundness. Check: (1) Is every technical requirement in the baseline covered by an architectural decision? (2) Are all HIGH risk engine domains explicitly addressed or flagged as open questions? (3) Are the API boundaries clean, minimal, implementable? (4) Are Foundation layer ADR gaps resolved before implementation starts? Return APPROVE, CONCERNS [list], or REJECT [blockers that must be resolved before coding]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### TD-ADR — Architecture Decision Review

**Trigger**: After an individual ADR is authored (`/architecture-decision`), before marking it Accepted.

**Context to pass**:
- ADR file path
- Engine version and knowledge gap risk level
- Related ADRs

**Prompt**:
> "Review this Architecture Decision Record. Does it have a clear problem statement and rationale? Were the rejected alternatives genuinely considered? Does the Consequences section acknowledge trade-offs honestly? Is the engine version stamped? Are post-cutoff API risks flagged? Does it link to the GDD requirements it covers? Return APPROVE, CONCERNS [specific gaps], or REJECT [decision underspecified or makes unsound technical assumptions]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### TD-ENGINE-RISK — Engine Version Risk Review

**Trigger**: When architecture decisions touch post-cutoff engine APIs, or before finalizing an engine-specific implementation approach.

**Context to pass**:
- The specific API or feature used
- Engine version and LLM knowledge cutoff (from `docs/engine-reference/[engine]/VERSION.md`)
- Relevant excerpt from the breaking-changes or deprecated-apis docs

**Prompt**:
> "Review this engine API usage against the version reference. Is this API present in [engine version]? Have its signature, behavior, or namespace changed since the LLM knowledge cutoff? Are there known deprecations or post-cutoff alternatives? Return APPROVE (safe to use as described), CONCERNS [verify before implementing], or REJECT [the API has changed — provide the corrected approach]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### TD-PHASE-GATE — Technical Readiness at Phase Transition

**Trigger**: Always in `/gate-check` — in parallel with CD-PHASE-GATE, PR-PHASE-GATE, AD-PHASE-GATE.

**Context to pass**:
- Target phase name
- Architecture document path
- Engine reference path
- ADR list

**Prompt**:
> "Review the current state of the project for [target phase] gate readiness from a technical direction perspective. Is the architecture sound for this phase? Are all high-risk engine domains addressed? Are performance budgets realistic and documented? Are Foundation-layer decisions complete enough to start implementation? Return READY, CONCERNS [list], or NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — Producer Gates

Agent: `producer` | Model: Opus | Domain: Scope, timeline, dependencies, production risk

### PR-SCOPE — Scope and Timeline Validation

**Trigger**: After scope tiers are defined (brainstorm Phase 6, `/quick-design`, or any workflow that produces an MVP + timeline).

**Context to pass**:
- Full vision scope description
- MVP definition
- Timeline estimate
- Team size (solo / small team)
- Scope tiers

**Prompt**:
> "Review this scope estimate. Is the MVP achievable in the stated timeline for the stated team size? Are the scope tiers correctly ordered by risk — does each tier deliver a shippable product if work stops there? What is the most likely cut point under time pressure, and is it a graceful fallback or a broken product? Return REALISTIC, OPTIMISTIC [specific adjustments], or UNREALISTIC [blockers — the timeline or MVP must be revised]."

**Verdicts**: REALISTIC / OPTIMISTIC / UNREALISTIC

---

### PR-SPRINT — Sprint Feasibility Review

**Trigger**: Before finalizing a sprint plan (`/sprint-plan`), and after a mid-sprint scope change.

**Context to pass**:
- Proposed sprint story list
- Team capacity
- Current backlog debt
- Milestone constraints

**Prompt**:
> "Review this sprint plan for feasibility. Is the story load realistic for the available capacity? Are the stories correctly ordered by dependency? Are there hidden dependencies between stories that could block the sprint midway? Are any stories underestimated given their technical complexity? Return REALISTIC, CONCERNS [specific risks], or UNREALISTIC [the sprint must be descoped]."

**Verdicts**: REALISTIC / CONCERNS / UNREALISTIC

---

### PR-MILESTONE — Milestone Risk Assessment

**Trigger**: At milestone review, mid-sprint retros, or a scope change that affects the milestone.

**Context to pass**:
- Milestone definition and target date
- Current completion %
- Blocked stories count
- Sprint velocity data

**Prompt**:
> "Review this milestone status. Based on the current velocity and blocked count, will the milestone hit its target date? What are the top 3 production risks between now and the milestone? Which scope items should be cut to protect the milestone date vs which items are non-negotiable? Return ON TRACK, AT RISK [specific mitigations], or OFF TRACK [the date slips or scope is cut — provide both options]."

**Verdicts**: ON TRACK / AT RISK / OFF TRACK

---

### PR-EPIC — Epic Structure Feasibility Review

**Trigger**: After epics are defined (`/create-epics`), before the story breakdown.

**Context to pass**:
- Epic definition paths
- Epic index (`production/epics/index.md`)
- Milestone timeline
- Team capacity
- Layer being epic'd

**Prompt**:
> "Review this epic structure for production feasibility before the story breakdown. Do the epic boundaries scope appropriately — is each epic realistically completable before a milestone deadline? Are the epics correctly ordered by system dependency? Are any epics underscoped (too small, merge) or overscoped (too large, split into 2-3)? Are Foundation-layer epics scoped so Core-layer epics can start at the beginning of the next sprint? Return REALISTIC, CONCERNS [structural adjustments before stories], or UNREALISTIC [epics must be split/merged/reordered]."

**Verdicts**: REALISTIC / CONCERNS / UNREALISTIC

---

### PR-PHASE-GATE — Production Readiness at Phase Transition

**Trigger**: Always in `/gate-check` — in parallel with the CD, TD, AD PHASE-GATEs.

**Context to pass**:
- Target phase name
- Sprint and milestone artifacts
- Team size and capacity
- Blocked story count

**Prompt**:
> "Review the current state of the project for [target phase] gate readiness from a production perspective. Is the scope realistic for the timeline and team size? Are dependencies correctly ordered? Are there milestone or sprint risks that could derail the phase in the first 2 sprints? Return READY, CONCERNS [list], or NOT READY [blockers]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 1 — Art Director Gates

Agent: `art-director` | Model: Sonnet | Domain: Visual identity, art bible, visual production

### AD-CONCEPT-VISUAL — Visual Identity Anchor

**Trigger**: After the game pillars are locked (brainstorm Phase 4), in parallel with CD-PILLARS.

**Context to pass**:
- Game concept (elevator pitch, core fantasy, unique hook)
- Pillar set with definitions and design tests
- Target platform
- Reference games or visual touchstones mentioned

**Prompt**:
> "Based on these game pillars and core concept, propose 2-3 distinct visual identity directions. For each direction: (1) a one-line visual rule that could guide every visual decision (e.g. 'everything must move', 'beauty is in the decay'), (2) mood and atmosphere targets, (3) shape language (sharp/rounded/organic/geometric emphasis), (4) color philosophy (palette direction, what colors mean in this world). Be specific — avoid generic descriptions. One direction should directly serve the primary design pillar. Name each direction. Recommend which one best serves the stated pillars and why."

**Verdicts**: CONCEPTS (multiple valid options — the user selects) / STRONG (one direction clearly dominant) / CONCERNS (the pillars do not provide enough direction to differentiate a visual identity)

---

### AD-ART-BIBLE — Art Bible Sign-Off

**Trigger**: After the art bible is drafted (`/art-bible`), before asset production starts.

**Context to pass**:
- Art bible path (`design/art/art-bible.md`)
- Game pillars and core fantasy
- Platform and performance constraints (from `.claude/docs/technical-preferences.md`)
- Visual identity anchor chosen during brainstorm

**Prompt**:
> "Review this art bible for completeness and internal consistency. Does the color system match the mood targets? Does the shape language follow from the visual identity statement? Are the asset standards achievable within the platform constraints? Does the character design direction give artists enough to work with without over-specifying? Are there contradictions between sections? Could an outsourcing team produce assets from this document without additional briefing? Return APPROVE (production-ready), CONCERNS [specific sections needing clarification], or REJECT [fundamental inconsistencies that must be resolved before asset production]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### AD-VISUAL — Visual Consistency Review

**Trigger**: After art direction decisions, when new asset types are introduced, or when a tech art decision affects the visual style.

**Context to pass**:
- Art bible path
- Specific asset type, style decision, or visual direction
- Reference images or style descriptions
- Platform and performance constraints

**Prompt**:
> "Review this visual direction decision for consistency with the established art style and production constraints. Does it match the art bible? Is it achievable within the platform's performance budget? Are there asset pipeline implications that create technical risk? Return APPROVE, CONCERNS [specific adjustments], or REJECT [style violation or production risk]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### AD-PHASE-GATE — Visual Readiness at Phase Transition

**Trigger**: Always in `/gate-check` — in parallel with the CD, TD, PR PHASE-GATEs.

**Context to pass**:
- Target phase name
- List of art/visual artifacts present
- Visual identity anchor (if it exists)
- Art bible path (if it exists)

**Prompt**:
> "Review the current state of the project for [target phase] gate readiness from a visual direction perspective. Is the visual identity established and documented at the level this phase requires? Are the right visual artifacts in place? Could visual teams start their work without visual direction gaps that cause costly rework? Are visual decisions being deferred past their latest responsible moment? Return READY, CONCERNS [specific visual direction gaps], or NOT READY [visual blockers — specify which artifact is missing and why it matters at this stage]."

**Verdicts**: READY / CONCERNS / NOT READY

---

## Tier 2 — Lead Gates

Tier 2 leads use Sonnet by default.

### LP-FEASIBILITY — Lead Programmer Implementation Feasibility

**Trigger**: After the master architecture document, or when a new architectural pattern is proposed.

**Context to pass**:
- Architecture document path
- Technical requirements baseline summary
- ADR list with statuses

**Prompt**:
> "Review this architecture for implementation feasibility. Flag: (a) decisions that are hard or impossible to implement with the stated engine and language, (b) missing interface definitions that programmers would have to invent, (c) patterns that create avoidable technical debt or that contradict standard [engine] idioms. Return FEASIBLE, CONCERNS [list], or INFEASIBLE [blockers that make this architecture unimplementable as written]."

**Verdicts**: FEASIBLE / CONCERNS / INFEASIBLE

---

### LP-CODE-REVIEW — Lead Programmer Code Review

**Trigger**: After a dev story is implemented (`/story-done`), or as part of `/quality-review`.

**Context to pass**:
- Implementation file paths
- Story file path (for the acceptance criteria)
- Relevant GDD section
- The ADR that governs this system

**Prompt**:
> "Review this implementation against the story acceptance criteria and the governing ADR. Does the code match the architecture boundary definitions? Are there violations of coding standards or forbidden patterns? Is the public API testable and documented? Are there correctness issues against the GDD rules? Return APPROVE, CONCERNS [specific issues], or REJECT [must be revised before merge]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

### QL-STORY-READY — QA Lead Story Readiness Check

**Trigger**: Before a story is accepted into a sprint — invoked by `/create-stories`, `/story-readiness`, `/sprint-plan`.

**Context to pass**:
- Story file path
- Story type (Logic / Integration / Visual/Feel / UI / Config/Data)
- Acceptance criteria list
- The GDD requirement (TR-ID) the story covers

**Prompt**:
> "Review this story's acceptance criteria for testability before it enters the sprint. Are all criteria specific enough that a developer would know unambiguously when they are done? Logic-type: is each criterion verifiable with an automated test? Integration: is each criterion observable in a controlled test environment? Flag criteria that are too vague or that require a full game build to test (mark them DEFERRED, not BLOCKED). Return ADEQUATE, GAPS [specific criteria needing refinement], or INADEQUATE [criteria too vague — the story must be revised before the sprint]."

**Verdicts**: ADEQUATE / GAPS / INADEQUATE

---

### QL-TEST-COVERAGE — QA Lead Test Coverage Review

**Trigger**: After implementation stories are complete, before marking an epic done, or in `/gate-check` Production → Polish.

**Context to pass**:
- List of implemented stories with types
- Test file paths in `tests/`
- GDD acceptance criteria for the system

**Prompt**:
> "Review the test coverage for these implementation stories. Are all Logic stories covered by passing unit tests? Are Integration stories covered by integration tests or documented playtests? Is each GDD acceptance criterion mapped to at least one test? Are there untested edge cases from the GDD Edge Cases section? Return ADEQUATE, GAPS [specific missing tests], or INADEQUATE [critical logic untested — do not advance]."

**Verdicts**: ADEQUATE / GAPS / INADEQUATE

---

### ND-CONSISTENCY — Narrative Director Consistency Check

**Trigger**: After writer deliverables (dialogue, lore, item descriptions), or when a design decision has narrative implications.

**Context to pass**:
- Document or content file path(s)
- Narrative bible or tone guide path
- Relevant world-building rules
- Character or faction profiles affected

**Prompt**:
> "Review this narrative content for internal consistency and adherence to established world rules. Are character voices consistent with their established profiles? Does the lore contradict any established facts? Is the tone consistent with the game's narrative direction? Return APPROVE, CONCERNS [specific inconsistencies to fix], or REJECT [contradictions that break the narrative foundation]."

**Verdicts**: APPROVE / CONCERNS / REJECT

---

## Parallel Gate Protocol — Gamedev

When a workflow requires multiple directors at the same checkpoint (very common in `/gate-check`), spawn them simultaneously:

```
Spawn in parallel:
1. creative-director  → CD-PHASE-GATE
2. technical-director → TD-PHASE-GATE
3. producer           → PR-PHASE-GATE
4. art-director       → AD-PHASE-GATE

Collect every verdict, apply the escalation rules:
- Any NOT READY / REJECT → overall FAIL
- Any CONCERNS → overall CONCERNS
- All READY / APPROVE → eligible PASS (subject to artifact checks)
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
