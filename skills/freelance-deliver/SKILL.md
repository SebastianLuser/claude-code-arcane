---
name: freelance-deliver
description: "Track an active contract while it runs: log hours against the estimate, catch scope creep the day it happens instead of at invoice time, and draft the change order before doing the extra work. Triggers: log hours, the client asked me for something else, this was not in the scope, scope creep, how is the contract going, change order, close the contract."
argument-hint: "[log | check | change | close]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---

# Freelance Deliver - Deliver without giving hours away

The loop while the project runs. Three things: log hours, catch when the scope moved, and charge for it before doing it.

Paths are relative to the career workspace (`--workspace`, env `CAREER_WORKSPACE`, or `./career-workspace/`).

Mode: `$ARGUMENTS`

## Why timing matters

Scope creep is not caught at invoice time: **it is caught the day it happens**, and it almost always comes in disguised as a favor. "Could you add this real quick?" is the phrase that costs the most money in freelance, and it works because in the moment it seems small and saying no seems out of proportion.

A month later it is 18 hours nobody is going to pay for, and by then it is too late: asking for money for delivered work sounds like a complaint; asking for it beforehand sounds professional.

## Modes

### `log` - log hours

Add rows to `## Hours logged` in the contract note: date, hours, work done, and **whether it is billable or not**.

That last column is the one almost nobody keeps and the one that makes all the difference: meetings, the back and forth over access and the review rounds are real hours of your week. If they are not logged, your effective rate looks better than it is and you will keep quoting badly.

After logging, run `check` if the running total got close to the estimate.

### `check` - how it is going

1. Add up the logged hours and compare them against the note's `estimated_hours`.
2. Milestone status: delivered, overdue, pending client approval.
3. Traffic light, and what matters is what to do with each color:

| Share of the estimate used | What it means |
|---|---|
| Under 70% with the scope moving forward | On track |
| 70-100% with scope still pending | **Tell the client now**, not once you go over |
| Over 100% | Stop and see whether it was a bad estimate (absorb it and learn) or new scope (charge for it) |

That distinction is the only one that matters: **I underestimated** versus **they asked for more**. The first is your cost; the second is a change order. Mixing them up makes you pay for the client's mistakes or charge them for yours.

4. Catch completed tasks that are not in the agreed scope. If there are any, offer `change`.

### `change` - the change order

When the client asks for something outside the agreed scope:

1. **Name it as new scope** on the spot and without drama: it is not a complaint, it is how it works. "I can do that, it's outside the scope of this contract, I'll send you the number."
2. Estimate with `/estimate` and quote with the same criteria as the original proposal: on top of the net floor, with a buffer.
3. Draft the change order with `/contract-and-proposal-writer`.
4. Record it in `## Change orders` in the note with status `proposed`.
5. **Do not do the work until it is approved.** It is rule 3 of `freelance-guardrails`: new scope, new price.

If the user decides to give it away (because it is small, or for the relationship with the client), **that is fine - but it is recorded anyway** with amount 0 and the reason. What is not recorded cannot be measured, and `/freelance-pipeline` needs to know how much work is given away to tell you whether it is a pattern.

### `close` - close the contract

1. Fill in `## Closing`: delivered, paid, rating received, and **what I would do differently** (that line is the one that helps quote the next one).
2. `status: closed`, and `/job-outcome` to move the proposal note.
3. Compare estimate against actual and write it down. It is the most valuable data point of the whole contract: without it, the next estimate is guesswork again.
4. Offer `/freelance-pipeline` if there is already volume, and `/cold-outreach` to ask for the reference while the work is fresh.

## Quick status check

To see at once every contract with hours above the estimate, without opening them one by one:

```bash
python .claude/skills/career-registry/scripts/career_registry.py audit
```

It returns `contracts_over_estimated_hours` with the excess in hours and as a percentage. It is this skill's natural entry point when the user asks "how am I doing?".

## Rules

- **Never do work outside the scope without quoting it first.** If the user decides to give it away, it is recorded with amount 0 and the reason.
- **Always tell underestimation apart from new scope.** They are two different things and get paid differently.
- Log the **non-billable** hours too: they are the ones that explain why your real rate is lower than the nominal one.
- Do not edit the agreed scope to match what was done. The scope is the one that was signed; the rest is a change order.
- Never mark a milestone as paid without the user confirming it.
- No long dashes in text added to notes.

## Handoff

Ask for approval before writing to the contract note. Delivery COMPLETE when the hours are logged and the scope is aligned or there is a proposed change order. Depending on the case, the next step is `/contract-and-proposal-writer` (draft the change order), `/job-outcome` (move the status on closing) or `/freelance-pipeline` (with 10+ resolved proposals, the business diagnosis).
