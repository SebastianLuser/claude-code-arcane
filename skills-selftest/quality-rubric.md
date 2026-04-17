# Skill Quality Rubric

Used by `/skill-test category [name|all]` to evaluate skills beyond structural compliance.
Each category defines 4–5 binary PASS/FAIL metrics specific to the skill's job.

A metric is PASS when the skill's written instructions clearly satisfy the criterion.
A metric is FAIL when the instructions are absent, ambiguous, or contradictory.
A metric is WARN when the instructions partially address the criterion.

---

## Skill Categories

### `gate`

**Skills**: gate-check

Gate skills control phase transitions. They must enforce correctness without
auto-advancing stage and must respect the three review modes.

| Metric | PASS criteria |
|---|---|
| **G1 — Review mode read** | Skill reads `production/session-state/review-mode.txt` (or equivalent) before deciding which directors to spawn |
| **G2 — Full mode: all 4 directors spawn** | In `full` mode, all 4 Tier-1 directors (CD, TD, PR, AD) PHASE-GATE prompts are invoked in parallel |
| **G3 — Lean mode: PHASE-GATE only** | In `lean` mode, only `*-PHASE-GATE` gates run; inline gates (CD-PILLARS, TD-ARCHITECTURE, etc.) are skipped |
| **G4 — Solo mode: no directors** | In `solo` mode, no director gates spawn; each is noted as "skipped — Solo mode" |
| **G5 — No auto-advance** | Skill never writes `production/stage.txt` without explicit user confirmation via "May I write" |

---

### `review`

**Skills**: design-review, architecture-review, review-all-gdds

Review skills read documents and produce structured verdicts. They are primarily
read-only and must not trigger director gates during the analysis phase.

| Metric | PASS criteria |
|---|---|
| **R1 — Read-only enforcement** | Skill does not modify the reviewed document without explicit user approval; any write operations (review logs, index updates) are gated behind "May I write" |
| **R2 — 8-section check** | Skill evaluates all 8 required GDD sections (or equivalent architectural sections) explicitly |
| **R3 — Correct verdict vocabulary** | Verdict is exactly one of: APPROVED / NEEDS REVISION / MAJOR REVISION NEEDED (design) or PASS / CONCERNS / FAIL (architecture) |
| **R4 — No director gates during analysis** | Skill does not spawn director gates during its analysis phases; post-analysis director review (as in architecture-review) is acceptable when the skill's scope and stakes warrant it |
| **R5 — Structured findings** | Output contains a per-section status table or checklist before the final verdict |

> **Exceptions:**
> - `design-review`: Has `Write, Edit` in allowed-tools to support an optional "Revise now" path (all writes gated behind user approval) and to write review logs. R1 is satisfied because the reviewed document is never silently modified.
> - `architecture-review`: Spawns TD-ARCHITECTURE and LP-FEASIBILITY gates after its analysis is complete. This is intentional — architecture review is high-stakes and benefits from director sign-off. R4 is satisfied because the gates run post-analysis, not during it.

---

### `authoring`

**Skills**: design-system, quick-design, architecture-decision, ux-design, ux-review, art-bible, create-architecture

Authoring skills create or update design documents collaboratively. Full GDD/UX
authoring skills use a section-by-section cycle; lightweight authoring skills use
a single-draft pattern appropriate to their smaller scope.

| Metric | PASS criteria |
|---|---|
| **A1 — Section-by-section cycle** | Full authoring skills (design-system, ux-design, art-bible) author one section at a time, presenting content for approval before proceeding to the next. Lightweight skills (quick-design, architecture-decision, create-architecture) may draft the complete document then ask for approval — single-draft is acceptable for documents under ~4 hours of implementation scope. |
| **A2 — May-I-write per section** | Full authoring skills ask "May I write this to [filepath]?" before each section write. Lightweight skills ask once for the complete document. |
| **A3 — Retrofit mode** | Skill detects if the target file already exists and offers to update specific sections rather than overwriting the whole document. Lightweight skills (quick-design) that always create new files are exempt. |
| **A4 — Director gate at correct tier** | If a director gate is defined for this skill (e.g., CD-GDD-ALIGN, TD-ADR), it runs at the correct mode threshold (full/lean) — NOT in solo |
| **A5 — Skeleton-first** | Full authoring skills create a file skeleton with all section headers before filling content, to preserve progress on session interruption. Lightweight skills are exempt. |

> **Full authoring skills** (must pass all 5 metrics): `design-system`, `ux-design`, `art-bible`
> **Lightweight authoring skills** (A1, A2, A5 use single-draft pattern; A3 exempt for new-file-only skills): `quick-design`, `architecture-decision`, `create-architecture`
> **Review-mode skill** (evaluated against review metrics): `ux-review`

---

### `readiness`

**Skills**: story-readiness, story-done

Readiness skills validate stories before or after implementation. They must produce
multi-dimensional verdicts and integrate correctly with director gate mode.

| Metric | PASS criteria |
|---|---|
| **RD1 — Multi-dimensional check** | Skill checks ≥3 independent dimensions (e.g., Design, Architecture, Scope, DoD) and reports each separately |
| **RD2 — Three verdict levels** | Verdict hierarchy is clearly defined: READY/COMPLETE > NEEDS WORK/COMPLETE WITH NOTES > BLOCKED |
| **RD3 — BLOCKED requires external action** | BLOCKED verdict is reserved for issues that cannot be fixed by the story author alone (e.g., Proposed ADR, unresolvable dependency) |
| **RD4 — Director gate at correct mode** | QL-STORY-READY or LP-CODE-REVIEW gate spawns in `full` mode, skips in `lean`/`solo` with a noted skip message |
| **RD5 — Next-story handoff** | After completion, skill surfaces the next READY story from the active sprint |

---

### `pipeline`

**Skills**: create-epics, create-stories, dev-story, create-control-manifest, propagate-design-change, map-systems

Pipeline skills produce artifacts that other skills consume. They must write files
with correct schema, respect layer/priority ordering, and gate before writing.

| Metric | PASS criteria |
|---|---|
| **P1 — Correct output schema** | Each produced file follows the project template (EPIC.md, story frontmatter, etc.); skill references the template path |
| **P2 — Layer/priority ordering** | Skills that produce epics or stories respect layer ordering (core → extended → meta) and priority fields |
| **P3 — May-I-write before each artifact** | Skill asks "May I write [artifact]?" before creating each output file, not batch-approving all files at once |
| **P4 — Director gate at correct tier** | In-scope gates (PR-EPIC, QL-STORY-READY, LP-CODE-REVIEW, etc.) run in `full`, skip in `lean`/`solo` with noted skip |
| **P5 — Reads before writes** | Skill reads the relevant GDD/ADR/manifest before producing artifacts to ensure alignment |

---

### `analysis`

**Skills**: consistency-check, balance-check, content-audit, code-review, tech-debt,
scope-check, estimate, perf-profile, asset-audit, security-audit, test-evidence-review, test-flakiness

Analysis skills scan the project and surface findings. They are read-only during
analysis and must ask before recommending any file writes.

| Metric | PASS criteria |
|---|---|
| **AN1 — Read-only scan** | Analysis phase uses only Read/Glob/Grep tools; no Write or Edit during the scan itself |
| **AN2 — Structured findings table** | Output includes a findings table or checklist (not prose only) with severity/priority per finding |
| **AN3 — No auto-write** | Any suggested file writes (e.g., tech-debt register, fix patches) are gated behind "May I write" |
| **AN4 — No director gates during analysis** | Analysis skills do not spawn director gates; they produce findings for human review |

---

### `team`

**Skills**: team-combat, team-narrative, team-audio, team-level, team-ui, team-qa,
team-release, team-polish, team-live-ops

Team skills orchestrate multiple specialist agents for a department. They must
spawn the right agents, run independent ones in parallel, and surface blocks immediately.

| Metric | PASS criteria |
|---|---|
| **T1 — Named agent list** | Skill explicitly names which agents it spawns and in what order |
| **T2 — Parallel where independent** | Agents whose inputs don't depend on each other are spawned in parallel (single message, multiple Task calls) |
| **T3 — BLOCKED surfacing** | If any spawned agent returns BLOCKED or fails, skill surfaces it immediately and halts dependent work — never silently skips |
| **T4 — Collect all verdicts before proceeding** | Dependent phases wait for all parallel agents to complete before proceeding |
| **T5 — Usage error on no argument** | If required argument (e.g., feature name) is missing, skill outputs usage hint and stops without spawning agents |

---

### `sprint`

**Skills**: sprint-plan, sprint-status, milestone-review, retrospective, changelog, patch-notes

Sprint skills read production state and produce reports or planning artifacts.
They have a PR-SPRINT or PR-MILESTONE gate at specific mode thresholds.

| Metric | PASS criteria |
|---|---|
| **SP1 — Reads sprint/milestone state** | Skill reads `production/sprints/` or `production/milestones/` before producing output |
| **SP2 — Correct sprint gate** | PR-SPRINT (for planning) or PR-MILESTONE (for milestone review) gate runs in `full` mode, skips in `lean`/`solo` |
| **SP3 — Structured output** | Output uses a consistent structure (velocity table, risk list, action items) rather than free prose |
| **SP4 — No auto-commit** | Skill never writes sprint files or milestone records without "May I write" |

---

### `utility`

**Skills**: start, help, brainstorm, onboard, adopt, hotfix, prototype, localize,
launch-checklist, release-checklist, smoke-check, soak-test, test-setup, test-helpers,
regression-suite, qa-plan, bug-triage, bug-report, playtest-report, asset-spec,
reverse-document, project-stage-detect, setup-engine, skill-test, skill-improve,
day-one-patch, and any other skills not in categories above

Utility skills pass the 7 standard static checks. If they happen to spawn director
gates, the gate mode logic must also be correct.

| Metric | PASS criteria |
|---|---|
| **U1 — Passes all 7 static checks** | `/skill-test static [name]` returns COMPLIANT with 0 FAILs |
| **U2 — Gate mode correct (if applicable)** | If the skill spawns any director gate, it reads review-mode and applies full/lean/solo logic correctly |

---

## Agent Categories

Used to validate agent spec files in `tests/agents/`.

### `director`

**Agents**: creative-director, technical-director, art-director, producer

| Metric | PASS criteria |
|---|---|
| **D1 — Correct verdict vocabulary** | Returns APPROVE / CONCERNS / REJECT (or domain equivalent: REALISTIC/CONCERNS/UNREALISTIC for producer) |
| **D2 — Domain boundary respected** | Does not make binding decisions outside its declared domain |
| **D3 — Conflict escalation** | When two departments conflict, escalates to correct parent (creative-director or technical-director) rather than unilaterally deciding |
| **D4 — Opus model tier** | Agent is assigned Opus model per coordination-rules.md |

### `lead`

**Agents**: lead-programmer, qa-lead, narrative-director, audio-director, game-designer,
systems-designer, level-designer

| Metric | PASS criteria |
|---|---|
| **L1 — Domain verdict** | Returns a domain-specific verdict (e.g., FEASIBLE/INFEASIBLE for lead-programmer, PASS/FAIL for qa-lead) |
| **L2 — Escalates to shared parent** | Out-of-domain conflicts escalate to creative-director (design) or technical-director (tech) |
| **L3 — Sonnet model tier** | Agent is assigned Sonnet model (default) per coordination-rules.md |

### `specialist`

**Agents**: gameplay-programmer, ai-programmer, technical-artist, sound-designer,
engine-programmer, tools-programmer, network-programmer, security-engineer,
accessibility-specialist, ux-designer, ui-programmer, performance-analyst, prototyper,
qa-tester, writer, world-builder

| Metric | PASS criteria |
|---|---|
| **S1 — Stays in domain** | Explicitly scopes itself to its declared domain; defers out-of-domain requests |
| **S2 — No binding cross-domain decisions** | Does not unilaterally decide matters owned by another specialist |
| **S3 — Defers correctly** | Out-of-domain requests are redirected to the correct agent, not refused silently |

### `engine`

**Agents**: unity-specialist, unity-ui-specialist,
unity-shader-specialist, unity-dots-specialist, unity-addressables-specialist,
unreal-specialist, ue-blueprint-specialist, ue-gas-specialist, ue-umg-specialist,
ue-replication-specialist

| Metric | PASS criteria |
|---|---|
| **E1 — Version-aware** | References engine version from `docs/engine-reference/` before suggesting API calls; flags post-cutoff risk |
| **E2 — File routing** | Routes file types to the correct sub-specialist (e.g., shader files → unity-shader-specialist, not unity-specialist) |
| **E3 — Engine-specific patterns** | Enforces engine-specific idioms (e.g., C# attribute exports, Blueprint function libraries, ScriptableObjects) |

### `qa`

**Agents**: qa-tester, qa-lead, security-engineer, accessibility-specialist

| Metric | PASS criteria |
|---|---|
| **Q1 — Produces artifacts not code** | Primary output is test cases, bug reports, or coverage gaps — not implementation code |
| **Q2 — Evidence format** | Test cases follow the project's test evidence format (unit/integration/visual/UI per coding-standards.md) |
| **Q3 — No scope creep** | Does not propose new features; flags gaps for humans to decide |

### `operations`

**Agents**: devops-engineer, release-manager, live-ops-designer, community-manager,
analytics-engineer, economy-designer, localization-lead

| Metric | PASS criteria |
|---|---|
| **O1 — Domain ownership clear** | Agent description clearly states what it owns (pipeline, releases, economy, etc.) |
| **O2 — Defers implementation** | Does not write game logic or engine code; delegates to appropriate specialist |
| **O3 — Toolset matches role** | `allowed-tools` in frontmatter matches the operational (not coding) nature of the role |

---

## Arcane-Specific Categories

These categories were added when CCGS was imported into Arcane to cover the 147
universal/software skills and the non-gamedev agents. They extend (do not replace)
the CCGS rubrics above.

### `software`

**Skills**: scaffold-go, api-docs, db-diagram, deps-audit, deploy-check, env-sync,
doc-rfc, scaffold-node, scaffold-python (and future software-oriented authoring skills)

Software skills author code, configs, or docs for backend/frontend/mobile/API projects.
They must respect contract-first and boundary-validation principles from `.claude/rules/`.

| Metric | PASS criteria |
|---|---|
| **SW1 — Stack detection** | Skill detects or asks for the target stack (Go/Node/Python/Rust, React/Vue, etc.) before generating code |
| **SW2 — Rules alignment** | Generated code respects the relevant path-scoped rule in `.claude/rules/` (backend-code, frontend-code, api-code, migration-code, infra-code, ai-code) |
| **SW3 — Secrets-safe** | Generated code/configs never inline secrets; references env vars or secret managers |
| **SW4 — Test scaffolding** | Emits or suggests test scaffolding alongside any non-trivial code (AAA pattern per test-standards.md) |
| **SW5 — Contract-first for APIs** | If the output is an API, an OpenAPI/GraphQL/.proto contract is produced or referenced before implementation |

---

### `devops`

**Skills**: (docker/k8s/terraform/ci-cd authoring skills — to be authored)

DevOps skills author IaC, container images, K8s manifests, CI/CD pipelines. They must
respect `.claude/rules/infra-code.md` — no click-ops, pinned versions, least privilege.

| Metric | PASS criteria |
|---|---|
| **DO1 — Idempotent output** | Generated manifests/IaC are re-runnable without side effects (`IF NOT EXISTS`, Terraform-safe) |
| **DO2 — Least privilege** | IAM / RBAC output scopes to minimum required; no wildcard `*:*` |
| **DO3 — Pinned versions** | Container images pinned by digest, CI actions pinned by SHA, packages pinned by version |
| **DO4 — Health + observability** | Service deploys include liveness/readiness probes + metrics/logs scaffolding |
| **DO5 — Secret-safe** | No inline secrets; references secret managers or sealed-secrets |

---

### `integrations`

**Skills**: clickup-*, jira-*, postman, figma-to-code, notion, coda, slack, discord,
miro, google-docs, and similar SaaS-integration commands

Integration skills drive external SaaS APIs. They must handle auth, rate limits,
and surface API errors with actionable context.

| Metric | PASS criteria |
|---|---|
| **I1 — Auth handled safely** | Credentials read from env vars / secret managers; never logged; never committed |
| **I2 — Rate-limit aware** | Respects documented API limits; backs off on 429 with `Retry-After` |
| **I3 — Error surfaces context** | API errors return `code + message + actionable next step`, not raw stack traces |
| **I4 — Idempotency on writes** | State-changing calls use idempotency keys or natural idempotency (PUT/DELETE by id) where the API supports it |
| **I5 — Read-before-write** | Skill confirms target object (issue/task/doc) before mutating; does not create duplicates silently |

---

### `product`

**Skills**: (PM / UX / research skill specs — to be authored)

Product skills support discovery, UX research, design-system work. Primarily authoring
and analysis, not direct implementation.

| Metric | PASS criteria |
|---|---|
| **P1 — Research-backed** | Claims reference user research, analytics, or documented assumptions — not author opinion |
| **P2 — User-centered output** | Deliverable frames problems from user perspective (jobs-to-be-done, scenarios), not feature list |
| **P3 — Measurable outcomes** | Success criteria are testable (acceptance criteria, metrics, hypotheses) |
| **P4 — A11y-aware** | When UI is authored, accessibility requirements (WCAG) are surfaced |

---

### `educabot`

**Skills**: (edtech / curriculum / robotics / AI-tutor skill specs — to be authored)

Educabot skills produce curriculum, activities, robotics assignments, or pedagogical
content. Must respect age-appropriateness and learning-science grounding.

| Metric | PASS criteria |
|---|---|
| **ED1 — Age-appropriate** | Skill detects or asks for target age/grade and scales complexity accordingly |
| **ED2 — Learning objective explicit** | Every activity/lesson has a stated learning objective (not just "students do X") |
| **ED3 — Assessment aligned** | Assessment artifacts map back to the stated learning objective |
| **ED4 — Scaffolding present** | Complex concepts include prior-knowledge checks and incremental difficulty |

---

## Arcane-Specific Agent Tiers

### `software` (agents)

**Agents**: chief-technology-officer, vp-engineering, backend-architect, frontend-architect,
api-architect, database-architect, mobile-lead, go-engineer, node-engineer, python-engineer,
rust-engineer, react-engineer, vue-engineer, angular-engineer, flutter-engineer,
react-native-engineer, sql-specialist, nosql-specialist, graphql-specialist,
websocket-specialist

| Metric | PASS criteria |
|---|---|
| **SWA1 — Stack scoped** | Agent owns a specific tech stack or layer; doesn't overreach (e.g., go-engineer doesn't write React) |
| **SWA2 — Rules-aware** | Agent references `.claude/rules/` relevant to its layer before producing code |
| **SWA3 — Tier-appropriate output** | Directors → strategy + architecture, Leads → design + standards, Specialists → implementation |
| **SWA4 — Security-aware** | Produces input validation, auth checks, secrets handling without being asked |

---

### `devops` (agents)

**Agents**: cloud-architect, platform-lead, sre-lead, docker-specialist, kubernetes-specialist,
ci-cd-specialist, terraform-specialist, aws-specialist, gcp-specialist, monitoring-specialist,
security-ops-specialist

| Metric | PASS criteria |
|---|---|
| **DOA1 — IaC-first** | Agent proposes codified infra (Terraform/Pulumi) before ad-hoc console steps |
| **DOA2 — Cloud-scoped** | Cloud-specific agents (aws/gcp) stick to their provider; platform-lead coordinates cross-cloud |
| **DOA3 — Observability baked in** | Any service/deployment proposal includes metrics + logs + alerts wiring |

---

### `product` / `management` (agents)

**Agents**: chief-product-officer, product-manager, ux-lead, ui-lead, design-system-lead,
ux-researcher, ui-designer, ux-writer, interaction-designer, accessibility-expert,
data-analyst, market-researcher, program-director, project-manager, scrum-master,
delivery-manager, agile-coach, business-analyst, technical-writer, stakeholder-manager

| Metric | PASS criteria |
|---|---|
| **PMA1 — Non-coding outputs** | Produces briefs, specs, research, plans — not application code |
| **PMA2 — Stakeholder-aware** | Artifacts name intended reader (engineering / design / leadership / external) |
| **PMA3 — Decision-oriented** | Output drives a decision (approve, deprioritize, escalate), not just summary |

---

### `quality` (agents)

**Agents**: qa-director, security-architect, test-automation-engineer, performance-tester,
manual-qa-tester, penetration-tester, compliance-specialist

| Metric | PASS criteria |
|---|---|
| **QL1 — Evidence format** | Produces artifacts aligned with `test-standards.md` (unit/integration/e2e/perf) |
| **QL2 — Finds gaps, not writes code** | Surfaces coverage gaps and risks; delegates fixes to dev specialists |
| **QL3 — Risk-ranked** | Findings are prioritized (critical/high/medium/low) with rationale |

---

### `integrations` (agents)

**Agents**: integrations-architect, project-tools-specialist, docs-tools-specialist,
design-tools-specialist, comms-tools-specialist, api-tools-specialist

| Metric | PASS criteria |
|---|---|
| **IA1 — Tool-scoped** | Each specialist stays within its tool domain (project tools vs design tools vs comms) |
| **IA2 — Auth/rate-limit aware** | Proposes auth strategy + rate-limit handling up-front |
| **IA3 — Cross-tool workflows** | When a workflow spans 2+ tools, integrations-architect (lead) coordinates — specialists don't decide unilaterally |

---

### `educabot` (agents)

**Agents**: edtech-architect, curriculum-director, learning-experience-designer,
content-developer, robotics-specialist, ai-tutor-designer, assessment-designer

| Metric | PASS criteria |
|---|---|
| **ED-A1 — Pedagogy-grounded** | References learning frameworks (Bloom's, UDL, constructivism) when proposing activities |
| **ED-A2 — Age-appropriate** | Outputs explicitly tagged with target age/grade |
| **ED-A3 — Assessment-aligned** | Every learning objective has a corresponding assessment strategy |
