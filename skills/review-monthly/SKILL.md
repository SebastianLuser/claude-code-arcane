---
name: review-monthly
description: "Monthly vault retrospective: reads the month's weeklies, detects patterns no single week shows, records achievements with evidence and leaves seeds for the next month. Triggers: monthly review, close the month, month retrospective, month's patterns."
argument-hint: "[current | YYYY-MM]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Review Monthly - Close the month

The highest level of the cycle. The daily records, the weekly detects themes, the monthly detects what no single week shows: what really moved forward, what keeps repeating without moving, and what deserves attention next month.

Month to process: `$ARGUMENTS` (default: the current month)

The `vault-conventions` rule applies.

**Paths by role:** destinations are named by role, and each one's real path comes from the `## Paths` section of the vault's `CLAUDE.md`. The defaults in parentheses only apply if the vault does not declare otherwise.

## Phase 1 - Read the month

1. **Locate the vault** and read its `CLAUDE.md`.
2. **Read the month's weeklies (`weekly` role).** The weeklies are the source: do not reread the dailies or the dumps, that work is already done and rereading it burns context without adding anything. If weeklies are missing, list them and offer `/review-weekly` for those weeks before continuing.
3. **Run `/vault-audit`** to get the vault's health metrics for the month (orphans, stale notes, seeds that did not grow, `contested` notes, old open tasks). The monthly is the natural point in the cycle to look at them.
4. **Reading budget:** the month's weeklies plus the audit report. Ceiling of 15 reads. If weeklies are missing, list them and stop: a monthly built on raw dailies costs ten times more and comes out worse.

## Phase 2 - Extract

1. **Patterns:** what repeats across several weeks. Different from a weekly theme: a pattern is a theme that survived the month.
2. **Achievements:** what actually got closed, each one with a link to the note that backs it. Without linkable evidence it is not an achievement, it is an impression.
3. **What did not move:** open projects with no activity during the month, threads still open since the first week. Name them.
4. **Seeds:** what showed up this month and deserves follow-up, with the link to where it showed up.
5. **Vault health:** the three or four audit metrics that changed relative to the previous month, if there is a previous monthly to compare against.
6. **Unresolved contradictions:** the notes the audit reports as `contested`, each with the `> [!warning] Unresolved contradiction` block that carries the two positions and their source (same format `/review-weekly` uses). Do not resolve them: show them, with how long they have been open. A vault that tells you when it contradicts itself is a feature, not a defect. If the user resolves one on the spot, the resolution is a new atomic note that links to both, and only then is `contested` removed from them.

## Phase 3 - Write

With approval on what was extracted, create `<monthly>/YYYY-MM.md` (default `Reflect/Monthly/`) from `<templates>/Monthly.md`, with links to the month's weeklies. If it already exists, update it without duplicating sections.

Links go up: the monthly links to the weeklies and to the notes that back the achievements. No weekly is edited from here.

The `## Reflection` section is left empty for the user.

Review COMPLETE when the monthly exists with patterns, achievements with evidence and the vault's health status.

## Rules

- An achievement without a link is not written.
- What did not move forward is reported in the same detail as what did.
- No coaching: you do not propose goals or improvement plans unless the user asks for them.
- Idempotent: running it twice on the same month duplicates nothing.
- No long dashes.

## Handoff

With the monthly ready, if the audit reported problems the next step is `/vault-tidy` to apply the fixes with approval. If the month left seeds that are already well-formed ideas, `/zettel`. Otherwise, back to the daily cycle with `/brain-dump`.
