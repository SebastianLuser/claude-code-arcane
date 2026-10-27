# Agent Hierarchy

## 3-Tier Model

Every division follows a real studio hierarchy with 3 levels of authority:

### Tier 1 — Directors (Model: Opus)
**Authority:** Strategic decisions, cross-discipline conflict resolution, vision guardianship
**Max turns:** 30
**When to invoke:** Decisions that affect the product's identity, conflicts between leads, escalations

### Tier 2 — Leads (Model: Sonnet)
**Authority:** Domain owners, area standards, coordination of specialists
**Max turns:** 20
**When to invoke:** System design, area reviews, local architecture decisions

### Tier 3 — Specialists (Model: Sonnet/Haiku)
**Authority:** Specialized technical execution in their niche
**Max turns:** 15
**When to invoke:** Specific technical tasks that need deep expertise

---

## Full Roster (115 Agents)

> Generated from `agents/`: every name below is a file. The tier comes from `maxTurns`
> (30 director, 20 lead, 15 specialist). `src/__tests__/agents-integrity.test.ts` checks
> that every agent named in another agent exists, so a name without a file breaks the build.

### Division 1 — Game Development Studio (32)

**Directors (3):** `creative-director`, `producer`, `technical-director`

**Leads (26):** `ai-programmer`, `analytics-engineer`, `art-director`, `economy-designer`, `game-designer`, `gameplay-programmer`, `lead-programmer`, `level-designer`, `live-ops-designer`, `narrative-director`, `network-programmer`, `performance-analyst`, `qa-lead`, `release-manager`, `systems-designer`, `technical-artist`, `ue-blueprint-specialist`, `ue-gas-specialist`, `ue-replication-specialist`, `ue-umg-specialist`, `unity-shader-specialist`, `unity-specialist`, `unreal-specialist`, `ux-designer`, `world-builder`, `writer`

**Specialists (3):** `accessibility-specialist`, `qa-tester-gamedev`, `sound-designer`

### Division 2 — Software Engineering (19)

**Directors (2):** `chief-technology-officer`, `vp-engineering`

**Leads (4):** `backend-architect`, `database-architect`, `frontend-architect`, `mobile-lead`

**Specialists (13):** `android-engineer`, `dotnet-engineer`, `e2e-tester`, `flutter-engineer`, `go-engineer`, `ios-engineer`, `nestjs-engineer`, `nextjs-engineer`, `nextjs-reviewer`, `node-engineer`, `react-engineer`, `react-native-engineer`, `sql-specialist`

### Division 3 — DevOps & Infrastructure (4)

**Leads (3):** `cloud-architect`, `platform-lead`, `sre-lead`

**Specialists (1):** `devops-engineer`

### Division 4 — Product & Design (5)

**Directors (1):** `chief-product-officer`

**Leads (4):** `design-system-lead`, `product-manager`, `ui-lead`, `ux-lead`

### Division 5 — Project Management Office (4)

**Directors (1):** `program-director`

**Leads (2):** `delivery-manager`, `project-manager`

**Specialists (1):** `scrum-master`

### Division 6 — Quality & Security (3)

**Leads (3):** `qa-director`, `qa-engineer`, `security-architect`

### Division 7 — Tools & Integrations (6)

**Directors (1):** `integrations-architect`

**Leads (3):** `design-tools-specialist`, `docs-tools-specialist`, `project-tools-specialist`

**Specialists (2):** `api-tools-specialist`, `comms-tools-specialist`

### Division 8 — AI & Data Science (4)

**Directors (1):** `ai-architect`

**Leads (3):** `data-engineer`, `data-scientist`, `ml-engineer`

### Division 9 — C-Suite Advisory (6)

**Directors (6):** `ceo-advisor`, `cfo-advisor`, `chief-of-staff`, `cmo-advisor`, `coo-advisor`, `cto-advisor`

### Division 10 — Business & Finance (3)

**Directors (1):** `business-ops-lead`

**Leads (2):** `financial-analyst`, `sales-engineer`

### Division 11 — Marketing (5)

**Directors (1):** `marketing-director`

**Leads (4):** `content-lead`, `growth-lead`, `marketing-analyst`, `seo-lead`

### Division 12 — Regulatory & Compliance (3)

**Directors (1):** `regulatory-director`

**Leads (2):** `compliance-officer`, `quality-manager`

### Division 13 — Career & Job Hunt (4)

**Directors (1):** `mock-interviewer`

**Leads (1):** `career-strategist`

**Specialists (2):** `cv-reviewer`, `hiring-manager`



### Division 14 — Freelance (4)

**Directors (1):** `discovery-call`

**Leads (1):** `pipeline-strategist`

**Specialists (2):** `client-screener`, `proposal-reviewer`



### Division 15 — Audio (6)

**Leads (3):** `audio-programmer`, `composer`, `technical-sound-designer`

**Specialists (3):** `audio-director`, `audio-qa`, `voice-director`

### Division 16 — E-Commerce (1)

**Directors (1):** `ecommerce-architect`

### Division 17 — Visual Novel (6)

**Leads (6):** `vn-comfyui-artist`, `vn-narrative-director`, `vn-producer`, `vn-renpy-developer`, `vn-scene-director`, `vn-ui-designer`

---

## Delegation Rules

1. **Main session → Lead → Specialists** (typical)
2. **Specialists → Lead → Director** (for escalations)
3. **Lead of one division → Lead of another division** (for cross-area collaboration)
4. **Director → Director** (for strategic conflicts)

## Consultants and executors

Every agent is one of two things, never both. The distinction is not one of style:
**a subagent cannot ask questions.** `AskUserQuestion` is not in its tool
pool and its only output is the final report to the parent. An agent with
`Write`/`Edit` and the instruction to ask for approval before writing reads,
drafts its questions, has nobody to ask them to, returns text and never touches a
file. That was the bug: 46 of 109 agents were in that situation.

### Consultants (15) - read-only by design

`career/` (4), `freelance/` (4), `clevel/` (6) and `engineering/nextjs-reviewer`.

They exist to give an independent reading: whoever wrote the CV cannot
review it, and whoever drafted the proposal is convinced by their own text.
They declare `tools` without `Write`/`Edit` and `disallowedTools: Bash, Write, Edit`.
Read-only by design, not out of caution.

### Executors (100) - they write

Everyone else. They declare `permissionMode: acceptEdits`, the official field
that lets the subagent write without an interactive gate.

Their protocol is not "ask and wait" but **state the assumption and keep going**:
faced with an ambiguity they pick the option most consistent with the existing code,
note it in the report on a line that starts with `ASSUMPTION:` so the
caller can grep it and contradict it, and move on. The discipline of reading the
design before writing stays; what was removed is the impossible wait.

### Who applies the changes

The executor writes its own files. The main session is still the one that
decides *whom* to invoke and the one that integrates the results, but it is no longer the
only path to disk.
