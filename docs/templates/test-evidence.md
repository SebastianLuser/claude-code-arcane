# Test Evidence: [Story / Ticket Title]

> **Story / Ticket**: `[path to story file or JIRA/ClickUp ID]`
> **Story Type**: [Unit | Integration | E2E | Manual | Security | Performance]
> **Date**: [date]
> **Tester**: [who performed the test]
> **Build / Commit**: [version or git hash]

---

## What Was Tested

[One paragraph describing the feature or behaviour that was validated. Include
the acceptance criteria numbers from the story that this evidence covers.]

**Acceptance criteria covered**: [AC-1, AC-2, AC-3]

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | [exact criterion text] | PASS / FAIL | [any observations] |
| AC-2 | [exact criterion text] | PASS / FAIL | |
| AC-3 | [exact criterion text] | PASS / FAIL | |

---

## Artifacts

List all captured evidence below. Store files in the same directory as this
document or in `production/qa/evidence/[story-slug]/`.

| # | Filename / Link | What It Shows | Acceptance Criterion |
|---|-----------------|--------------|----------------------|
| 1 | `[test-run.log]` | [brief description — test output, HTTP response, screenshot, etc.] | AC-1 |
| 2 | `[screenshot.png]` | | AC-2 |

Acceptable artifact types: test runner output (e.g., `go test`, `pytest`, `vitest`),
HTTP request/response logs (Postman/curl), screenshots, video recording timestamps,
query results, log excerpts.

---

## Test Conditions

- **Environment**: [e.g., "local dev", "staging", "preview deploy"]
- **Data state**: [e.g., "fresh DB, seeded with fixture X", "production snapshot from YYYY-MM-DD"]
- **Platform / browser / runtime**: [e.g., "Chrome 120 on Windows 11", "Node 20 on Linux"]
- **Any special setup required**: [e.g., "feature flag ENABLED via env var", "test user with role X"]

---

## Observations

[Anything noteworthy that didn't cause a FAIL but should be recorded. Examples:
slow response under load, warning log emitted but not breaking, behaviour that
technically passes but feels off. These become candidates for follow-up work.]

- [Observation 1]
- [Observation 2]

If nothing notable: *No significant observations.*

---

## Sign-Off

All required sign-offs must be completed before the story can be marked COMPLETE.
Required roles depend on story type (configure per project).

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer (implemented) | | | [ ] Approved |
| Reviewer (code review) | | | [ ] Approved |
| QA Lead | | | [ ] Approved |

**Any sign-off can be marked "Deferred — [reason]"** if the person is
unavailable. Deferred sign-offs must be resolved before the sprint review.

---

*Template: `.claude/docs/templates/test-evidence.md`*
*Used for: recording evidence that acceptance criteria were met*
*Location: `production/qa/evidence/[story-slug]-evidence.md`*
