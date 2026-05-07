---
name: company-os
description: "Meta-framework for how a company runs. Operating system selection (EOS, Scaling Up, OKR-native, hybrid), accountability charts, scorecards, meeting pulse, issue resolution, and 90-day rocks."
category: "clevel-operations"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Company Operating System

The operating system is the collection of tools, rhythms, and agreements that determine how the company functions. Making it explicit makes it improvable.

## Why This Matters

Most operational dysfunction isn't a people problem — it's a system problem. When the same issues recur every week, meetings feel pointless, nobody knows who owns what, or quarterly goals slip — fix the system.

## The Six Core Components

Every effective operating system has these six. See `references/six-components.md` for detailed implementation guidance on each.

1. **Accountability Chart** — Who owns each outcome. One person per function, no shared ownership.
2. **Scorecard** — 5-15 weekly metrics with owners and targets. Only red metrics get discussion time.
3. **Meeting Pulse** — Daily standup → Weekly L10 → Monthly review → Quarterly planning → Annual planning.
4. **Issue Resolution (IDS)** — Identify, Discuss, Solve. Maximum 15 minutes per issue.
5. **Rocks (90-Day Priorities)** — 3-7 per person, binary (done/not done), reviewed weekly.
6. **Communication Cadence** — Who gets what information, when, and how.

## Operating System Selection

See `references/os-comparison.md` for full comparison. Quick guide:

| If you are... | Consider... |
|---------------|-------------|
| 10-250 person company, founder-led, operational chaos | EOS / Traction |
| Ambitious growth, need rigorous strategy cascade | Scaling Up |
| Tech company, engineering culture, hypothesis-driven | OKR-native |
| Decentralized, flat, high autonomy | Holacracy |

## Implementation Roadmap

**Quick start (first 30 days):**
1. Build the accountability chart (1 workshop, 2 hours)
2. Define 5-10 weekly scorecard metrics (1 hour)
3. Start the weekly L10 meeting (no prep — just start)

These three alone will improve coordination more than most companies achieve in a year.

## Common Failure Modes

- **Partial implementation:** Half an operating system is worse than none — it creates theater.
- **Meeting fatigue:** Replace meetings, don't add them.
- **Metric overload:** Start with 5. Add when the cadence is established.
- **Rock inflation:** Hard limit: 7 per person. When everything is a priority, nothing is.
- **Leader non-compliance:** If leaders don't take it seriously, nobody will.

## Key Questions

- "If I asked five team leads our top 3 priorities, would they give the same answers?"
- "Name a metric that tells us by Friday whether this week was good. Do we track it?"
- "Who owns customer churn? Can you name that person without hesitation?"

## Resources
- `references/os-comparison.md` — EOS vs Scaling Up vs OKRs vs Holacracy vs hybrid
- `references/implementation-guide.md` — 90-day implementation plan
- `references/six-components.md` — detailed implementation for accountability, scorecard, pulse, IDS, rocks, communication
