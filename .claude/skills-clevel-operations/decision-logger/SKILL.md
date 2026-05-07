---
name: decision-logger
description: "Two-layer memory architecture for board meeting decisions. Manages raw transcripts (Layer 1) and approved decisions (Layer 2). Invoked automatically after board-meeting Phase 5 founder approval."
category: "clevel-operations"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Decision Logger

Two-layer memory system. Layer 1 stores everything. Layer 2 stores only what the founder approved. Future meetings read Layer 2 only — preventing hallucinated consensus from past debates bleeding into new deliberations.

May I write to `memory/board-meetings/decisions.md` and `memory/board-meetings/YYYY-MM-DD-raw.md` after founder approval?

## Commands

| Command | Effect |
|---------|--------|
| `/cs:decisions` | Last 10 approved decisions |
| `/cs:decisions --all` | Full history |
| `/cs:decisions --owner CMO` | Filter by owner |
| `/cs:decisions --topic pricing` | Search by keyword |
| `/cs:review` | Action items due within 7 days |
| `/cs:review --overdue` | Items past deadline |

## Two-Layer Architecture

### Layer 1 — Raw Transcripts
**Location:** `memory/board-meetings/YYYY-MM-DD-raw.md` — Full agent contributions, debates, rejected arguments. **NEVER auto-loaded.** Archive after 90 days.

### Layer 2 — Approved Decisions
**Location:** `memory/board-meetings/decisions.md` — ONLY founder-approved decisions. **Loaded automatically in Phase 1 of every board meeting.** Append-only.

## Decision Entry Format and Conflict Detection

See `references/entry-format.md` for the full entry template, conflict detection rules, and DO_NOT_RESURFACE enforcement.

## Logging Workflow (Post Phase 5)

1. Founder approves synthesis
2. Write Layer 1 raw transcript
3. Check conflicts against `decisions.md`
4. Surface conflicts → wait for founder resolution
5. Append approved entries to Layer 2
6. Confirm: decisions logged, actions tracked, flags added

## File Structure

```
memory/board-meetings/
├── decisions.md       # Layer 2: append-only, founder-approved
├── YYYY-MM-DD-raw.md  # Layer 1: full transcript per meeting
└── archive/YYYY/      # Raw files after 90 days
```

## Resources
- `references/entry-format.md` — decision entry template, conflict detection, DO_NOT_RESURFACE
- `templates/decision-entry.md` — single entry template with field rules
