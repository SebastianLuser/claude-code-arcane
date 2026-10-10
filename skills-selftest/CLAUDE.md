# Skills Selftest — Claude Instructions

This folder is the QA layer for the Claude Code Arcane skill/agent framework.
Self-contained and separate from any project the user is building.

**This is not about testing user code.** It's about verifying that the skills
(`/commit`, `/gate-check`, `/code-review`, etc.) and agents (creative-director,
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

## Categories and tiers

`catalog.yaml` is the only list of what exists: each entry carries its `category:` (skills) or tier (agents). Read it instead of keeping a copy here.

---

## Workflow for testing a skill

1. Read `catalog.yaml` → get `spec:` path and `category:` for the skill
2. Read the skill at `skills/[name]/SKILL.md`
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
