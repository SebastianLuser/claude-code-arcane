---
name: board-meeting
description: "Multi-agent board meeting protocol for strategic decisions. Runs a structured 6-phase deliberation: context loading, independent C-suite contributions, critic analysis, synthesis, founder review, and decision extraction."
category: "clevel-operations"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Board Meeting Protocol

Structured multi-agent deliberation that prevents groupthink, captures minority views, and produces clean, actionable decisions.

## Invoke
`/cs:board [topic]` — e.g. `/cs:board Should we expand to Spain in Q3?`

## The 6-Phase Protocol

### PHASE 1: Context Gathering
Load `memory/company-context.md` and `memory/board-meetings/decisions.md` (Layer 2 ONLY). Reset session state. Present agenda + activated roles → wait for founder confirmation.

**Chief of Staff selects relevant roles** based on topic (not all 9 every time).

### PHASE 2: Independent Contributions (ISOLATED)
**No cross-pollination. Each agent runs before seeing others' outputs.** Max 5 key points per role, self-verified with confidence scores.

### PHASE 3: Critic Analysis
Executive Mentor receives ALL Phase 2 outputs simultaneously. Role: adversarial reviewer. Checks for suspicious consensus, shared unvalidated assumptions, missing perspectives.

### PHASE 4: Synthesis
Chief of Staff delivers using Board Meeting Output format: Decision Required, Perspectives, Agreements, Disagreements, Critic's View, Recommended Decision + Action Items.

### PHASE 5: Human in the Loop
**Full stop. Wait for the founder.** Options: Approve / Modify / Reject / Ask follow-up. User corrections OVERRIDE agent proposals.

### PHASE 6: Decision Extraction
Write Layer 1 raw transcript. Append approved decisions to Layer 2. Mark rejected proposals `[DO_NOT_RESURFACE]`.

## Memory Structure
```
memory/board-meetings/
├── decisions.md          # Layer 2 — founder-approved only
├── YYYY-MM-DD-raw.md     # Layer 1 — full transcripts
└── archive/YYYY/         # Raw transcripts after 90 days
```

## Failure Mode Quick Reference
| Failure | Fix |
|---------|-----|
| Groupthink (all agree) | Re-run Phase 2 isolated; force "strongest argument against" |
| Analysis paralysis | Cap at 5 points; force recommendation even with Low confidence |
| Role bleed | Critic flags; exclude from synthesis |
| Layer contamination | Phase 1 loads decisions.md only — hard rule |

## Resources
- `templates/meeting-agenda.md` — agenda format
- `templates/meeting-minutes.md` — final output format
- `references/meeting-facilitation.md` — conflict handling, timing, failure modes
