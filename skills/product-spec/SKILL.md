---
name: product-spec
description: "Generate a full PRD (context, problem, solution, metrics, risks) and create the matching Jira epic + stories."
category: "agile"
argument-hint: "[feature-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task, AskUserQuestion
---
# product-spec — PRD Generator

Generates a complete PRD and distributes it: Notion/Coda (doc) + Jira (epic + user stories).

## When to use / NOT

| Use | Do NOT use |
|------|---------|
| New feature, discovery → delivery | Bugs (`/fix-issue` or Jira directly) |
| Cross-team initiative | Technical tasks (`/doc-rfc`) |
| Major refactor that affects UX | Game designs (`/doc-gdd`) |
| A/B experiment with a hypothesis | |

## Discovery (questions first)

Feature name, product (Alizia/Tuni/Vigía/Tich), PM owner, stakeholders (eng/design/QA leads), target release (sprint/month/quarter), confidential? If answers are missing → `[TBD]`.

## PRD Structure

12 standard sections:

1. **TL;DR** — 1 paragraph (3-5 lines): what, for whom, why now
2. **Context** — current state (data, quotes, support issues), importance (link to OKR/North Star), why now
3. **Problem** — 1 memorable sentence + affected users (persona, segment) + evidence (interviews, metrics, support tickets)
4. **Goals and Metrics** — main goal + success metrics table (metric/baseline/target/guardrail) + explicit non-goals
5. **Proposal** — high-level + user flow (happy path with mockups) + MVP scope (must-haves) + fast follows (v1.1+) + variants considered with pros/cons
6. **Functional requirements** — user stories in the format "As X I want Y so that Z" with Given/When/Then ACs + edge cases + error/empty states
7. **Non-functional requirements** — performance (p95), accessibility (WCAG 2.1 AA), privacy (COPPA/FERPA), browsers/devices, i18n (ES/EN/PT)
8. **Rollout** — phases (dogfooding → closed beta → open beta → GA) + feature flag (name, owner, kill switch) + comms plan (release notes, email, blog, in-app)
9. **Risks and dependencies** — risk table (probability/impact/mitigation) + dependencies checklist
10. **Open questions** — TBD checklist
11. **Appendices** — links to research, Figma, technical RFC, analytics dashboard
12. **Changelog** — date/author/change table

## Workflow

1. **Discovery** — gather the answers, `[TBD]` for whatever is missing
2. **Generate the PRD** — complete Markdown, do not skip sections (N/A + reason if one does not apply)
3. **Publish** — ask whether Notion or Coda, and the target workspace
4. **Jira** — create the epic (`[PRD] Feature Name`, labels: prd, product, quarter) + user stories as child stories with the ACs as a checklist
5. **Review meeting** — propose one within 48h with the stakeholders (30min walk-through + 15min Q&A + 15min next steps)
6. **Summary** — links to the doc, epic, user stories, proposed meeting + next steps checklist

## Tips / Signs of a bad PRD

**Tips:** TL;DR readable in 30s, metrics > opinions, explicit non-goals, one problem per PRD, links not copies, big changes → new doc.

**Bad signs:** no baseline metric, scope creep / unclear MVP vs fast follows, empty open questions, no edge cases/error states, no rollout plan.

## Checklist

- [ ] All 12 PRD sections are present (use N/A + reason if not applicable, never omit)
- [ ] Discovery answers are incorporated and `[TBD]` items are tracked in Open Questions
- [ ] Jira epic created with `[PRD]` prefix, correct labels (prd, product, quarter)
- [ ] User stories are linked as children of the Jira epic with ACs as checklists
- [ ] Success metrics table includes baseline, target, and guardrail for each metric
- [ ] Review meeting proposed within 48h with all listed stakeholders
