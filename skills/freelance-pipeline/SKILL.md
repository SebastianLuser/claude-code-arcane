---
name: freelance-pipeline
description: "Diagnose the freelance business, not one proposal: Connects ROI, proposal funnel, real effective hourly rate net of unbilled hours, utilization, client concentration and scope drift on active contracts. Triggers: how is my freelance pipeline doing, how much do I really earn per hour, connects roi, why aren't clients answering my proposals, utilization, scope creep on a contract."
argument-hint: "[--since YYYY-MM-DD]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebSearch, Task
---

# Freelance Pipeline - Business diagnosis

You look at the whole business, not tomorrow's proposal. The question you answer is whether this works as a business, and if not, which **one** thing to change.

Paths are relative to the career workspace (`--workspace`, env `CAREER_WORKSPACE`, or `./career-workspace/`).

Window: `$ARGUMENTS` (empty = the whole history).

## Inputs

- `03-Applications/` with `type: freelance` - **all of them**, including the `discarded` ones. The discards tell you whether your selection criteria work; without them the diagnosis is biased toward the ones you did send.
- `08-Contracts/` - active and closed: estimate versus actual, milestones, hours, change orders.
- The Connects ledger in `07-Resources/` - spend per proposal and result.
- `01-Profiles/` - the net rate floor and the declared weekly capacity.

### Hard data comes from the export, not from memory

If the user has history on a platform, **do not ask them for amounts and hours**: have them download the CSV and use the importer. Nobody remembers accurately how much they billed.

```bash
python .claude/skills/freelance-pipeline/scripts/import_history.py inspect history.csv
python .claude/skills/freelance-pipeline/scripts/import_history.py summary history.csv
```

Same pattern as `network_map.py` in `+job-hunt`: no credentials, no touching the account. The user exports, the script reads.

**Always run `inspect` first and show the user the mapping.** The script detects the columns because exports have no stable schema, and it reports `unmapped_columns` and `ambiguous_columns`. Before trusting a total you have to see which column was used; if it picked the wrong one, fix it with `--map "Column=field"`. The column names and transaction types it knows come from `scripts/columns.en.json` and `scripts/columns.es.json`, all applied at once; a spreadsheet in another language needs `--map` or a new `columns.<lang>.json`.

Two things the summary tells you that must be respected: `effective_rate_computable: false` means the export has no hours and **the effective rate is not estimated**, you ask for the data; and `enough_sample: false` means there is not enough to talk about rates.

## The volume guard (first, mandatory)

Count before you claim.

- **Fewer than 10 resolved proposals:** there is no funnel. Deliver only the descriptive part (how many, Connects spent, response time) and name the cheapest hypothesis to test. **No patterns.**
- **10 to 25:** trends, with the sample visible in every claim ("3 of 14").
- **25+:** conversion rates.

Three unanswered proposals are not a pattern. Treating them as one sends the user to lower their rate, which is the worst possible move and the hardest to reverse.

## The five metrics

### 1. Connects ROI

`Connects spent / contracts won` = acquisition cost. And the number that hurts the most: **how many Connects went to postings that never hired anyone**. That loss is avoidable with better screening, so it is reported separately.

### 2. Funnel

```
posting seen → screen passed → proposal sent → client replies → call → contract
```

The key stage is **sent → replies**. Crossing it with the score changes the diagnosis:

| No reply + high score | No reply + low score |
|---|---|
| Proposal problem: opening, price, detectable template | Targeting problem: you apply to what is not a fit for you |
| Goes to `/freelance-proposal` | Goes to `/freelance-scan` and `/freelance-profile` |

### 3. Real effective rate

`total collected / (billed hours + proposal hours + calls + admin)`, **net of fees**.

It is not the contract rate and it is almost always quite a bit lower. It is the number that says whether the business works. **If it came out below the declared floor, that is the main finding** and everything else is secondary.

### 4. Utilization and concentration

- Billable hours against declared capacity. Very low = pipeline problem. Sustained very high = risk of burnout and of having no time to sell, which is how you reach the next month with nothing.
- **Concentration**: share of income from the largest client. Above half, it is not a business: it is a job without its protections and without its stability.

### 5. Scope drift on active contracts

Contracts where actual hours exceed the estimate **without a change order**. Each one is work given away.

The pattern matters more than the case: if it happens in almost all of them, the problem is in how scopes are written (goes to `/contract-and-proposal-writer`), not in the clients. For each contract with drift, offer to draft the change order - new scope, new price (rule 3 of `freelance-guardrails`).

## Process

1. **Collect and count.** Apply the volume guard and say which band we are in.
2. **Compute the five metrics.** Show them in the chat with the explicit sample, before interpreting anything.
3. **Launch `pipeline-strategist`** (fresh context, read-only) if there are 10+ resolved proposals. It returns the leak point, hypotheses with how to test them, ONE recommended change and what not to touch. With less volume, skip it: the agent will reject it anyway.
4. **Report** in `07-Resources/Pipeline - YYYY-MM-DD.md`, with the user's approval on the metrics:
   - Frontmatter: `type: pipeline`, `date`, `proposals_analyzed`, `contracts_analyzed`, `window`.
   - The five metrics with their sample.
   - The leak point and its evidence, with wikilinks to the notes that support it.
   - The recommended change and which skill it is handed to.
   - If a previous report exists, a "Since the last report" section: what moved and what did not.
5. **Do not edit** proposal or contract notes. Only create the report and, if the user asks, the change orders for the contracts with drift.

## Rules

- **Data before advice.** Every claim rests on a count or on a quote from the recorded feedback.
- **ONE recommended change, not an 8-point plan.** If five things change, you cannot tell which one worked.
- **Lowering the rate is never the first lever.** It only comes in if the evidence says the positioning is wrong, and with that reasoning made explicit.
- Never fabricate metrics: if data is missing (unlogged hours, unrecorded Connects), report the gap and what should start being recorded.
- No em dashes, with wikilinks to the source notes.

## Handoff

Report COMPLETE in `07-Resources/`. The next step is whatever comes out of the leak point: `/freelance-proposal` (proposal), `/freelance-scan` or `/freelance-profile` (targeting and positioning), `/client-screen` (discard criteria), or `/contract-and-proposal-writer` (scopes and change orders).
