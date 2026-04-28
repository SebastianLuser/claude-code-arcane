# Skills Selftest — Arcane Framework QA

Quality assurance infrastructure for the **Claude Code Arcane** framework.
Tests the skills and agents themselves — not any code (software or game) built with them.

> **This folder is self-contained and optional.**
> Projects using Arcane don't need it. To remove it entirely:
> `rm -rf skills-selftest` — nothing in `.claude/` depends on it.

---

## What this tests (and what it doesn't)

| Tests this | Does NOT test this |
|------------|---------------------|
| Skills behave per their contract (`/gate-check` blocks when it should) | Your application code |
| Skills that promise read-only don't write files | Your game logic or balance |
| Agents emit required verdict keywords (APPROVE/CONCERNS/REJECT) | Your API endpoints |
| `team-*` skills spawn the right set of sub-agents | Your test suite passes |
| Agent frontmatter is valid (model tier, maxTurns, tools) | Your deployments work |

For code testing use Jest, pytest, Go test, etc. This framework tests
**the framework itself** — the 147 universal skills, 20 gamedev skills, and 73 agents
that ship with Arcane.

---

## Structure

```
skills-selftest/
├── README.md              ← you are here
├── CLAUDE.md              ← instructions Claude reads when using this framework
├── catalog.yaml           ← master registry: all skills + agents, coverage tracking
├── quality-rubric.md      ← category-specific pass/fail metrics
│
├── skills/                ← behavioral specs (one file per skill)
│   ├── gate/              ← gate-check, director-gates
│   ├── review/            ← design-review, architecture-review, review-all-gdds, code-review
│   ├── authoring/         ← design-system, art-bible, create-architecture, ux-design
│   ├── readiness/         ← story-readiness, story-done
│   ├── pipeline/          ← create-epics, create-stories, dev-story, map-systems
│   ├── analysis/          ← consistency-check, balance-check, tech-debt, audit-*
│   ├── team/              ← team-combat, team-narrative, team-audio, team-qa
│   ├── sprint/            ← sprint-plan, sprint-status, changelog, patch-notes
│   ├── utility/           ← start, adopt, hotfix, onboard, localize
│   │
│   ├── software/          ← [Arcane-only] backend/frontend/API skill specs
│   ├── devops/            ← [Arcane-only] docker, k8s, terraform, CI/CD specs
│   ├── integrations/      ← [Arcane-only] clickup, jira, postman, figma, notion specs
│   ├── product/           ← [Arcane-only] PM/UX/research specs
│   └── educabot/          ← [Arcane-only] curriculum, robotics, AI-tutor specs
│
├── agents/                ← behavioral specs per agent tier
│   ├── directors/         ← creative-director, technical-director, producer, CTO, CPO
│   ├── leads/             ← dept leads (game-designer, backend-architect, qa-lead)
│   ├── specialists/       ← general specialists
│   ├── engine/            ← engine-specific (unity/unreal)
│   ├── qa/                ← test automation, perf, pen testing
│   ├── operations/        ← devops, security, monitoring
│   │
│   ├── software/          ← [Arcane-only] Go/Node/Python/Rust/React/Vue engineers
│   ├── devops/            ← [Arcane-only] cloud/k8s/terraform specialists
│   ├── integrations/      ← [Arcane-only] tool specialists
│   ├── product/           ← [Arcane-only] PM, UX designers, researchers
│   ├── management/        ← [Arcane-only] scrum-master, delivery-manager
│   └── educabot/          ← [Arcane-only] edtech specialists
│
├── templates/
│   ├── skill-test-spec.md ← template for new skill specs
│   └── agent-test-spec.md ← template for new agent specs
│
└── results/               ← test run outputs (gitignored)
```

---

## Commands

All driven by skills already shipped in `.claude/skills/`:

| Command | What it does |
|---------|--------------|
| `/skill-test static [name]` | 7 structural checks (frontmatter, paths, allowed tools) |
| `/skill-test static all` | Run static checks across all registered skills |
| `/skill-test spec [name]` | Evaluate skill against its written behavioral spec |
| `/skill-test category [name]` | Evaluate against category rubric |
| `/skill-test category all` | Rubric check across every categorized skill |
| `/skill-test audit` | Coverage report: who has specs, last test dates, pass/fail |
| `/skill-improve [name]` | Loop: test → diagnose → propose fix → retest → keep/revert |

---

## Skill categories & rubrics

| Category | Sample skills | Key metrics |
|----------|---------------|-------------|
| `gate` | gate-check | Director panel modes, no auto-advance, verdict keyword |
| `review` | design-review, architecture-review, code-review | Read-only, correct verdicts |
| `authoring` | design-system, art-bible, create-architecture | Skeleton-first, May-I-write protocol |
| `readiness` | story-readiness, story-done | Blockers surfaced, gate in full mode |
| `pipeline` | create-epics, create-stories, dev-story | Upstream dep check, handoff clear |
| `analysis` | consistency-check, balance-check, audit-dev | Read-only, verdict keyword present |
| `team` | team-combat, team-narrative, team-qa | All required agents spawned |
| `sprint` | sprint-plan, sprint-status, changelog | Reads sprint data, status keywords |
| `utility` | start, adopt, hotfix | Passes static checks |
| **`software`** *(Arcane)* | backend skills, frontend skills, API skills | Contract-first, schema validation, security |
| **`devops`** *(Arcane)* | docker, k8s, terraform, ci/cd | Pinned versions, idempotent, reviewed |
| **`integrations`** *(Arcane)* | clickup, jira, postman, figma | Auth handling, rate limits, error surfacing |
| **`product`** *(Arcane)* | ux research, design system | Research-backed, user-centered |
| **`educabot`** *(Arcane)* | curriculum, robotics, AI-tutor | Pedagogy-aware, age-appropriate |

---

## Coverage status (starting point)

- **Inherited from CCGS (with specs):** 72 gamedev skills + 49 gamedev agents
- **Needs specs (Arcane expansion):** 147 universal skills + remainder of 73 agents
- **Strategy:** Grow coverage incrementally — write specs for skills as they're used/modified
  in real projects, not all at once on day 1

Run `/skill-test audit` to see current coverage gaps.

---

## Writing a new spec

1. Copy the matching template: `templates/skill-test-spec.md` or `templates/agent-test-spec.md`
2. Paste to `skills/[category]/[name].md` or `agents/[tier]/[name].md`
3. Fill in: overview, 5 test cases, protocol compliance assertions
4. Update the `spec:` field in `catalog.yaml` to point to the new file
5. Run `/skill-test spec [name]` to validate

---

## Renaming / migration history

- Originally `CCGS Skill Testing Framework/` in Claude-Code-Game-Studios
- Renamed to `skills-selftest/` when imported into Arcane for clarity
  (the old name was ambiguous — suggested it tested user code, not the framework)
- All internal path references migrated automatically on import

---

## Removing this framework

Nothing in `.claude/` imports from here. Safe to delete:

```bash
rm -rf skills-selftest/
```

The skills `/skill-test` and `/skill-improve` will still load but will report that
`catalog.yaml` is missing and suggest `/skill-test audit` to re-initialize.
