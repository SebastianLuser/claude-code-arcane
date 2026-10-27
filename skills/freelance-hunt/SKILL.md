---
name: freelance-hunt
description: "Entry point for the freelance skillset: extends the career workspace with contracts and a Connects ledger, then routes to the right skill. Triggers: freelance, upwork, find projects as a freelancer, get clients, freelance pipeline, setup freelance workspace, how much do I earn per hour."
argument-hint: "[setup | status | next]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Freelance Hunt - Freelance pipeline orchestrator

You are the entry point of the freelance suite. You detect (or extend) the career workspace, understand which stage the user is at, and route to the right skill. You do not do everything yourself - you orchestrate.

## One workspace, not two

The profile **reuses the career workspace** from `+job-hunt` (default `./career-workspace/`, or env `CAREER_WORKSPACE`). It does not create a parallel one, and this is deliberate: `01-Profiles/` is the single source of truth for the user's experience. Two workspaces would be two master profiles drifting apart, which is exactly the problem the master profile solves.

What the freelance profile adds:

```
career-workspace/
  03-Applications/         ← shared: jobs AND proposals (told apart by `type:`)
  04-Companies/            ← shared: companies AND clients
  08-Contracts/            NEW: active contracts, milestones, hours, change orders
  07-Resources/
    Connects - YYYY.md     NEW: ledger of the cost of applying (Connects on Upwork,
                           bids on other platforms, hours in direct outreach)
  Templates/
    Proposal.md            NEW
    Contract.md            NEW
```

A proposal **is** an application: it lives in `03-Applications/` with `type: freelance`. A client **is** a company: it lives in `04-Companies/`. That way `/job-outcome`, `/cold-outreach` and `/master-profile` work on both halves without changes.

If the user does not have `+job-hunt` installed, `setup` mode creates the full tree anyway: the workspace does not depend on the other profile, it only shares it.

## Status vocabulary

Frontmatter `status` for `type: freelance`:

`interested → screened → proposal_sent → in_conversation → contract_active → delivered`

Closes: `won_closed | no_response | rejected | discarded | disputed`

`discarded` is an active decision and is recorded just like a sent proposal: discards are half the data `/freelance-pipeline` needs (see `freelance-guardrails`, Record section). Statuses are moved by `/job-outcome`; no other skill marks `proposal_sent`.

## Modes

### `setup` - Prepare the workspace

1. Detect whether the career workspace already exists. If it does, **extend it**; if not, create the full tree (same as `/job-hunt setup`).
2. Create `08-Contracts/` and copy `Proposal.md` and `Contract.md` from `references/templates/` to `Templates/`.
3. Create the ledger `07-Resources/Connects - <year>.md` from `references/templates/Connects.md`.
4. Add the freelance sections to `00-Dashboard.md` (active proposals, ongoing contracts, Connects this month). If the dashboard does not exist, create it.
5. Ask for and record in `01-Profiles/` the **two numbers that govern the whole profile**: the net rate floor and the weekly capacity of billable hours. Without the floor, `/freelance-proposal` cannot validate a bid (see `freelance-guardrails` rule 3).
6. If the user already has an account on a platform, suggest `/freelance-profile` as the next step; if not, `/master-profile` first. If they do not know yet what floor to set, `/freelance-scan market` gives the median of what others with their profile charge.

### `status` - Where am I

1. Read `00-Dashboard.md`, scan `03-Applications/` filtering `type: freelance`, and `08-Contracts/`.
2. Summarize: proposals waiting for an answer (with days elapsed), active contracts and their progress, Connects spent this month against results, committed billable hours against capacity.
3. Flag what needs action today: proposals with no answer for 7+ days, overdue milestones, contracts with hours above the estimate.
4. Recommend the highest-impact action.

### `next` - What do I do now

Based on the state of the workspace, recommend the next skill (see routing).

## Routing

| Situation | Skill |
|-----------|-------|
| No workspace | `/freelance-hunt setup` |
| Workspace with the pre-English folders | `/career-registry` (its migration script, dry run first) |
| Master profile missing | `/master-profile` |
| Platform profile weak or empty | `/freelance-profile` |
| Search and score postings | `/freelance-scan` |
| What others with my profile charge | `/freelance-scan market` |
| Evaluate a client's risk | `/client-screen` |
| Write the proposal and the bid | `/freelance-proposal` |
| Contract, SOW, NDA or change order | `/contract-and-proposal-writer` |
| Estimate a project's effort | `/estimate` |
| Record a reply or an outcome | `/job-outcome` |
| Did I already apply here? / export the registry to CSV | `/career-registry` |
| Direct message to a client or follow-up | `/cold-outreach` |
| Portfolio website | `/portfolio-site` |
| I won the project: break down the scope and validate the hours | `/freelance-kickoff` |
| Log hours, scope creep, change orders | `/freelance-deliver` |
| Connects ROI, utilization, effective rate | `/freelance-pipeline` |

## The profile's 4 agents

The profile installs `agents/freelance/`. They exist because some readings only work with fresh context, and they are read-only: they return analysis, and the main session writes the files.

| Agent | Answers | Launched by |
|---|---|---|
| `client-screener` | Is this client a risk? (adversarial by design) | `/client-screen` |
| `proposal-reviewer` | Is this proposal worth spending Connects on? | `/freelance-proposal` |
| `discovery-call` | Can I hold up through the call, the haggling and the smuggled scope? | `/freelance-proposal`, `/client-screen` |
| `pipeline-strategist` | Is this a business or an expensive hobby? | `/freelance-pipeline` (10+ resolved proposals) |

`client-screener` and `proposal-reviewer` run **in parallel** when both are used: they are independent questions.

## Standard workflow for an opportunity

1. `/freelance-scan` → scored postings, deduplicated against earlier runs.
2. `/client-screen` → client risk. **If the verdict is do not apply, the discard is recorded and it ends here.** That is the step that saves money.
3. `/estimate` → real effort for the described scope.
4. `/freelance-proposal` → proposal + bid above the floor + review with `proposal-reviewer`.
5. Send (**always by hand**) → `/job-outcome` to mark `proposal_sent` and record the Connects spent.
6. If the client replies → rehearse with `discovery-call`, then the real call.
7. If it closes → `/contract-and-proposal-writer` for the SOW, note in `08-Contracts/`.
8. **`/freelance-kickoff`** → break down the scope and validate whether it fits what was quoted. This is where the gap is discovered, not in week 5.
9. While it runs → `/freelance-deliver` for hours, scope creep and change orders.
10. On closing → `/freelance-deliver close`, and every 2 weeks or with 10+ resolved proposals, `/freelance-pipeline`.

## Rules

- Profile rule: `freelance-guardrails`. The four are not suggestions - Connects are money, the JSS is an asset, the floor is not negotiable and sending is manual.
- Never reorganize folders or rename notes without asking - it silently breaks `[[wikilinks]]`.
- Never commit sensitive data (amounts, client data, emails) to a remote without explicit confirmation.
- Keep the numeric prefixes when creating files.
- Maximum actionability: the user always ends up knowing which skill to run next.

## Handoff

Ask for approval before writing or overwriting workspace files. When the workspace is READY, the next step is `/freelance-profile` if there is already an account on a platform, or `/master-profile` if the master profile is missing.
