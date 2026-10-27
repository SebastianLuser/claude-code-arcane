---
name: freelance-kickoff
description: "Turn a won contract into an executable plan: break the scope into deliverables, write the acceptance criteria, and validate honestly whether what you promised fits the hours you quoted - before week five. Then hand off to the technical skills. Triggers: I won the project, start the contract, kickoff, break down the scope, acceptance criteria, will the hours I quoted be enough, plan the freelance project."
argument-hint: "[contract note | client]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, WebFetch, Task
---

# Freelance Kickoff - From contract to plan

You won the project. Now the proposal has to become something executable, and above all you have to **find out now and not in week 5** whether what you promised fits the hours you quoted.

Paths are relative to the career workspace (`--workspace`, env `CAREER_WORKSPACE`, or `./career-workspace/`).

Contract or client: `$ARGUMENTS`

## Why this step exists

The rest of the profile helps you land the work. This is the first one that helps you **do it**, and it exists because the riskiest moment in freelance is not applying: it is the gap between what the proposal says and what the work really demands.

That gap is always discovered. The only variable is when: here, while it can still be renegotiated, or in week 5, when it is already your problem.

## Inputs

- **The contract note** (`08-Contracts/`) and the proposal it came from (`03-Applications/`).
- **The SOW or signed contract** if there is one, and if not, warn: no written scope means no scope.
- The `/client-screen` note: whatever was flagged there as fuzzy scope is exactly what has to be pinned down now.
- The profile in `01-Profiles/` for the rate floor and the weekly capacity.

## Process

### 1. Break the scope down into deliverables

Each deliverable: what it is, what it includes, **what it does not include**, and what it depends on. Dependencies matter because the ones on the client's side (access, content, decisions, approvals) are the number one cause of projects that drag on without it being your fault - and without you getting paid for it.

What the proposal said in one line turns into three or four items here. If it cannot be broken down, the scope is not defined, and that is the finding.

### 2. Write the acceptance criteria

For each deliverable: **how we know it is done**, in verifiable terms.

Without this, "done" is defined by the client whenever they like, and it is always a bit further away. It is the cheapest mechanism there is against scope creep, and almost nobody writes it.

If the user does not know what to put, the question that unblocks them is: *"what would have to happen for the client to approve it without asking for changes?"*

### 3. Estimate for real

Use `/estimate` per deliverable. Also add what never makes it into the estimate and always happens: meetings, review rounds, back and forth over access, environment setup.

### 4. The honest validation (the step that justifies the skill)

Compare the estimated total against the **hours implied by what was quoted** (agreed amount divided by your target rate).

| Result | What to do |
|---|---|
| Fits with margin | Go ahead. Record the margin so it does not get given away later |
| Fits just barely | Go ahead, warning that any surprise comes out of your pocket |
| **Does not fit** | **Stop and say so with the number** |

When it does not fit, there are three real options, and they have to be put on the table before writing a line of code: **cut the scope** to what fits, **renegotiate** the amount or the deadline using the breakdown as evidence, or **absorb the difference** as a conscious, recorded decision.

What is not an option is starting and seeing what happens. We already know how that ends.

Never dress up the estimate so it works out. If the breakdown says 90 hours and you quoted 40, the number is 90.

### 5. Execution plan

Sequence by dependencies, not by what you feel like doing. Mark the critical path and what is blocked by the client. Define milestones that line up with the payments if the contract has them: delivering three things before the first payment is financing the client.

### 6. Write and route

With approval, fill in the `08-Contracts/` note: agreed scope, excluded scope, acceptance criteria, milestones and the estimate per deliverable.

Then **route to the technical work**, which already exists in the repo:

| If the project is | Continue with |
|---|---|
| Stories and tickets | `/create-stories`, `/create-epics` |
| Backend, frontend, mobile | The matching technical profile (`+backend-typescript`, `+frontend-react-vite`, ...) |
| Something unspecified on the client's side | `/product-discovery` before coding |
| Documenting what already exists | `/reverse-document` |

## Rules

- **No written scope, no start.** If there is no SOW or proposal with a scope, this skill produces the proposed scope and asks for it to be confirmed with the client before executing.
- **Never adjust the estimate to fit what was quoted.** The number is the number; the decision is the user's.
- **Everything not in the agreed scope goes into "excluded scope"**, explicitly. What is not written down gets argued about later, and argued about for free.
- Do not make up acceptance criteria the client did not accept: if they are proposed, they are marked as proposed until the client confirms them.
- No long dashes in text added to notes.

## Handoff

Ask for approval before writing to the contract note. Kickoff COMPLETE when there are deliverables, acceptance criteria, an estimate and the verdict on whether it fits what was quoted. The next step is the matching technical skill to execute, and `/freelance-deliver` to track hours and scope while the project runs.
