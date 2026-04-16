# Skills Selftest — Claude Instructions

This folder is the QA layer for the Claude Code Arcane skill/agent framework.
Self-contained and separate from any project the user is building.

**This is not about testing user code.** It's about verifying that the skills
(`/commit`, `/gate-check`, `/design-review`, etc.) and agents (creative-director,
backend-architect, etc.) themselves behave per their documented contract.

---

## Key files

| File | Purpose |
|------|---------|
| `catalog.yaml` | Master registry for all Arcane skills and agents. Contains category, spec path, last-test tracking. **Always read this first** when running any test command. |
| `quality-rubric.md` | Category-specific pass/fail metrics. Read the matching `###` section when running `/skill-test category`. |
| `skills/[category]/[name].md` | Behavioral spec for a skill — 5 test cases + protocol compliance assertions. |
| `agents/[tier]/[name].md` | Behavioral spec for an agent — 5 test cases + protocol compliance assertions. |
| `templates/skill-test-spec.md` | Template for writing new skill spec files. |
| `templates/agent-test-spec.md` | Template for writing new agent spec files. |
| `results/` | Written by `/skill-test spec` when results are saved. Gitignored. |

---

## Path conventions

- Skill specs: `skills-selftest/skills/[category]/[name].md`
- Agent specs: `skills-selftest/agents/[tier]/[name].md`
- Catalog: `skills-selftest/catalog.yaml`
- Rubric: `skills-selftest/quality-rubric.md`

The `spec:` field in `catalog.yaml` is the authoritative path. Always read it
rather than guessing.

---

## Skill categories

### Inherited from CCGS (gamedev + universal)

```
gate        → gate-check
review      → design-review, architecture-review, review-all-gdds
authoring   → design-system, quick-design, architecture-decision, art-bible,
              create-architecture, ux-design, ux-review
readiness   → story-readiness, story-done
pipeline    → create-epics, create-stories, dev-story, create-control-manifest,
              propagate-design-change, map-systems
analysis    → consistency-check, balance-check, content-audit, code-review,
              tech-debt, scope-check, estimate, perf-profile, asset-audit,
              security-audit, test-evidence-review, test-flakiness
team        → team-combat, team-narrative, team-audio, team-level, team-ui,
              team-qa, team-release, team-polish, team-live-ops
sprint      → sprint-plan, sprint-status, milestone-review, retrospective,
              changelog, patch-notes
utility     → start, adopt, hotfix, localize, setup-engine, onboard
```

### Arcane-specific categories

```
software    → scaffold-go, api-docs, db-diagram, deps-audit, deploy-check
devops      → (docker/k8s/terraform/ci-cd skill specs — to be authored)
integrations → clickup-*, jira-*, postman, figma-*, notion, coda, slack, discord
product     → (PM/UX/research skill specs — to be authored)
educabot    → (edtech skill specs — to be authored)
```

---

## Agent tiers

### Inherited from CCGS

```
directors   → creative-director, technical-director, producer, art-director
leads       → lead-programmer, narrative-director, audio-director, ux-designer,
              qa-lead, release-manager, localization-lead, game-designer
specialists → gameplay-programmer, engine-programmer, ui-programmer,
              tools-programmer, network-programmer, ai-programmer,
              level-designer, sound-designer, technical-artist
engine      → godot-*, unity-*, unreal-*
operations  → devops-engineer, security-engineer, performance-analyst,
              analytics-engineer, community-manager
qa          → qa-tester, accessibility-specialist, live-ops-designer
```

### Arcane-specific tiers

```
software    → chief-technology-officer, vp-engineering, backend-architect,
              frontend-architect, api-architect, database-architect,
              go/node/python/rust engineers, react/vue/angular engineers,
              flutter / react-native, sql / nosql / graphql / websocket
devops      → cloud-architect, platform-lead, sre-lead, docker, kubernetes,
              ci-cd, terraform, aws, gcp, monitoring, security-ops
product     → chief-product-officer, product-manager, ux-lead, ui-lead,
              design-system-lead, ux-researcher, ui-designer, ux-writer,
              interaction-designer, accessibility-expert, data-analyst,
              market-researcher
management  → program-director, project-manager, scrum-master, delivery-manager,
              agile-coach, business-analyst, technical-writer, stakeholder-manager
quality     → qa-director, security-architect, test-automation-engineer,
              performance-tester, manual-qa-tester, penetration-tester,
              compliance-specialist
integrations → integrations-architect, project/docs/design/comms/api tools
              specialists
educabot    → edtech-architect, curriculum-director, learning-experience-designer,
              content-developer, robotics-specialist, ai-tutor-designer,
              assessment-designer
```

---

## Workflow for testing a skill

1. Read `catalog.yaml` → get `spec:` path and `category:` for the skill
2. Read the skill at `.claude/skills/[name]/SKILL.md` (or `.claude/skills-gamedev/[name]/SKILL.md`)
3. Read the spec at the `spec:` path
4. Evaluate assertions case by case
5. Offer to write results to `results/` and update `catalog.yaml`

If `spec:` is `null`, the skill has no spec yet. Offer to:
- Generate one from the template (read SKILL.md, infer 5 test cases)
- Or fall back to `/skill-test static [name]` (structural checks only)

---

## Workflow for improving a skill

Use `/skill-improve [name]`. It handles the full loop:
test → diagnose → propose fix → rewrite (with user approval) → retest → keep or revert.

---

## Spec validity note

Specs describe **current behavior**, not ideal behavior. They were written by
reading the skills, so they may encode bugs. When a skill misbehaves in practice,
correct the skill first, then update the spec to match the fixed behavior.
Treat spec failures as "this needs investigation," not "the skill is definitively wrong."

---

## This folder is deletable

Nothing in `.claude/` imports from here. Deleting this folder has no effect on the
Arcane skills or agents themselves. `/skill-test` and `/skill-improve` will report
that `catalog.yaml` is missing and guide the user to initialize it.
