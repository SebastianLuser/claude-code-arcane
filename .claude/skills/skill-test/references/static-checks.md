# Static Checks — 6 Structural Validations

Checks 1-3 are also enforced in CI by `src/__tests__/skill-static.test.ts`, so in this repo a skill that fails them never merges. Apply them here anyway: the skill may be running in a project with its own skills, where no test covers them.

| Check | What | Verdict |
|-------|------|---------|
| 1 — Frontmatter | `name` (matching the directory), `description`, `argument-hint`, `user-invocable`, `allowed-tools` present; an empty `argument-hint` still counts as present | FAIL if any absent |
| 2 — Sections | A skill longer than 40 lines has at least two `##` sections. Shorter skills are exempt | FAIL if longer than 40 lines with fewer than two |
| 3 — Verdict | Only for skills that judge something: those with `verdict:` in `skills-selftest/catalog.yaml`. Every value listed there appears in the skill (SKILL.md or `references/`), in the skill's own vocabulary. Skills that build, write or advise do not need a verdict | FAIL if a listed value is missing |
| 4 — Next-Step Handoff | Final section mentions another skill, "next step", or follow-up | WARN if absent |
| 5 — Fork Complexity | If `context: fork`, must have >=5 phase headings | WARN if <5 |
| 6 — Argument Hint | Documented modes should match the hint | WARN if mismatch |

A new skill that judges something gets a `verdict:` list in the catalog when it is added; that is what makes check 3 apply to it.

There is no check for ask-before-write language. Whether Claude may write without asking is set by the permission mode of each session, not by the skill, so a skill with `Write` or `Edit` is not non-compliant for leaving the decision there.

**Output:** per-skill table of check results + verdict (COMPLIANT / WARNINGS / NON-COMPLIANT). For `static all`: summary table + aggregate counts.
