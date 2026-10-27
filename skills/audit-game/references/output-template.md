# Output Template & Finding Format

## Report template

```markdown
# GDD Audit — [date]
**Date:** [today]
**Status:** [HEALTHY / NEEDS ATTENTION / CRITICAL]
**Scope:** [what was audited against what]

## EXECUTIVE SUMMARY
[2-3 sentences: overall health, biggest problem, recommended next step]

## 1. CONTRADICTIONS
[Table, sorted by severity]

## 2. GAPS / MISSING CONTENT
[Grouped by Blocking / Important / Nice to Have]

## 3. COHERENCE AND LOGIC
[Edge case, terminology and logic issues]

## 4. BALANCE RED FLAGS
[Balance problems with example scenarios]

## 5. PENDING DECISIONS
[Prioritized list with options and recommendations]

## 6. WHAT WORKS WELL
[What works well — do not only criticize, acknowledge good design]

## 7. NEXT STEPS
[Concrete action items, sorted by priority]
```

## Finding format

Each finding in the report must follow the condensed PAS format (see `/doc-pas`):

```markdown
### [Finding title] — [CRITICAL/HIGH/MEDIUM]

**Problem:** [1-2 sentences: what is wrong and what impact it has]
**Analysis:** [1-2 sentences: why it happens]
**Solution:** [1-2 sentences: what to do, with concrete values]
```

Do NOT write long paragraphs explaining the problem. Do NOT ramble with generic recommendations. Bullet points and concrete numbers.
