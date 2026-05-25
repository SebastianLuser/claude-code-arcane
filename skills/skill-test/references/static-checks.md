# Static Checks — 7 Structural Validations

| Check | What | Verdict |
|-------|------|---------|
| 1 — Frontmatter | `name`, `description`, `argument-hint`, `user-invocable`, `allowed-tools` present | FAIL if any absent |
| 2 — Phases | >=2 numbered phase headings (`## Phase N`, `## N.`, or >=2 `##` headings) | FAIL if <2 |
| 3 — Verdict Keywords | Contains >=1 of: PASS, FAIL, CONCERNS, APPROVED, BLOCKED, COMPLETE, READY, COMPLIANT, NON-COMPLIANT | FAIL if none |
| 4 — Collaborative Protocol | "May I write" / "before writing" / "approval" near file-write instructions | WARN if absent; FAIL if `allowed-tools` includes Write/Edit but no ask-before-write |
| 5 — Next-Step Handoff | Final section mentions another skill, "next step", or follow-up | WARN if absent |
| 6 — Fork Complexity | If `context: fork`, must have >=5 phase headings | WARN if <5 |
| 7 — Argument Hint | Non-empty; documented modes should match hint | WARN if empty or mismatch |

**Output:** per-skill table of check results + verdict (COMPLIANT / WARNINGS / NON-COMPLIANT). For `static all`: summary table + aggregate counts.
