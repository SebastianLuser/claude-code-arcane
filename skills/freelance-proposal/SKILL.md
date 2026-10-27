---
name: freelance-proposal
description: "Write an Upwork proposal that survives the list view and price it above your net floor rate: hook in the first two lines, proof instead of adjectives, fixed vs hourly, risk buffer and platform fee. Reviewed by a fresh-context agent before spending Connects. Triggers: write upwork proposal, upwork cover letter, how much to charge for this project, bid, quote a freelance project, freelance proposal."
argument-hint: "[application note | job-url]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch, Task
---

# Upwork Proposal - Proposal and bid

You write the proposal and put a price on it. Two things in one skill because on Upwork they go together: the bid is part of the proposal and neither one can be defended without the other.

Paths are relative to the career workspace (`--workspace`, env `CAREER_WORKSPACE`, or `./career-workspace/`).

Posting given: `$ARGUMENTS`

## Precondition: the screen

**Do not draft a proposal without the `/client-screen` note.** If it does not exist, ask for it and run that skill first.

If the screen came out high risk or `DO NOT APPLY` and the user wants to apply anyway, they can - **but they are told what failed and it is recorded in the note** (rule 1 of `freelance-guardrails`). Connects are money: spending them blind is different from spending them with your eyes open.

## Inputs

- **The full job post** and the `03-Applications/` note with the screen.
- **The base profile** in `01-Profiles/` - the proof and the **net rate floor** come from there.
- **The estimate** from `/estimate` if the scope is large.
- Comparable past work (closed `08-Contracts/`) to calibrate price against reality, not against wishes.

## Part 1 - The proposal

### How the client reads it

They have 30 proposals in a list and see **the first two lines of each one**. Anything not there does not exist yet. That is the only format constraint that matters.

### Structure

1. **First two lines (80% of the work).** Something you can only know from having read *this* post: the real problem behind the request, a concrete technical observation, or the outcome you can bring. If the opening would work for any other job in the field, it is dead.
2. **Proof, 2-3 sentences.** A comparable project with a number or a link. Not adjectives: "expert in React" is noise, "I migrated a 40k-user checkout to React and cut load time by 60%" is proof.
3. **How you would do it, 3-4 points.** Enough to show you already thought it through, not so much that you give the consulting away.
4. **The price, justified.** See Part 2. A bare number invites haggling.
5. **One concrete question** about the project. Without a question no conversation starts, and it shows you read the post.

**150-300 words.** Above 300 it is almost never read in full.

### Explicit requirements in the post

Many posts ask for something specific: start with a keyword, answer a specific question, send a link. **Always look for it and comply.** It is an automatic discard and the cheapest mistake to avoid.

### Anti-patterns (always cut)

- "I have X years of experience in..." as the opening. The client does not hire experience, they hire the solution to a problem they already have.
- "Dear Sir/Madam", "I hope this message finds you well".
- Reciting the profile in prose.
- Adjectives without evidence: passionate, detail-oriented, fast learner.
- Phrases that give away a template or automatic generation. Upwork clients recognize them instantly and it is the number one reason for discards.
- Promising deadlines you cannot meet to win the contract.

## Part 2 - The bid

### The floor is net

The rate floor in `01-Profiles/` is **what you keep**, not what you bill. Upwork keeps a fee, so the bid has to cover it: with a floor of 40 USD/h and a 10% fee, the minimum bid is ~45.

**If the calculated bid comes out below the floor, say so loudly and do not dress it up.** The right move there is to not apply, or to quote what it takes and lose the posting - not to lower the floor. Lowering the rate is the easiest lever to pull and the hardest to reverse: it lowers the ceiling of every following contract.

### Fixed or hourly

| Choose fixed when | Choose hourly when |
|---|---|
| The scope is written and bounded | The scope is exploratory or will change |
| You can estimate with medium or high confidence | There are client dependencies you do not control |
| You want to capture value above your hours | The client says "we'll see as we go" |

Fuzzy scope + fixed price is the combination that loses the most money. If the screen flagged fuzzy scope and the client insists on fixed, the price has to include the risk or the right move is not to take it.

### The calculation

1. Base effort from `/estimate`, in hours.
2. **Risk buffer** based on what the screen said: clear scope and a client with history, +15%; fuzzy scope or a new client, +40% or more. The buffer is not fat, it is the price of the uncertainty the client transfers to you.
3. Non-billable project hours: meetings, reviews, back and forth.
4. Multiply by the target rate (not by the floor: the floor is the minimum, not the goal).
5. Add the platform fee.
6. Compare against the client's budget. If it does not add up, that is data for the decision, not a reason to lower the number.

Show the breakdown to the user **before** writing it into the proposal. The client is shown the total and its rationale, not the spreadsheet.

## Process

1. Read the post, the screen and the profile. Verify that the screen exists.
2. Calculate the bid (Part 2) and show the breakdown. If it comes out below the floor, warn and stop to decide.
3. Draft the proposal (Part 1). Then cut everything generic without mercy.
4. **Review with `proposal-reviewer`** (fresh context): pass it the post, the draft and the bid inline. Apply its exact replacements and incorporate what fits. One round only. Whoever wrote it read the whole post and is already convinced by their own hook; the client sees two lines.
5. With approval, save it in the `03-Applications/` note, section `## Proposal`, with the bid and its justification in `## Quote`.
6. If the user wants to rehearse the call, offer `discovery-call`.

## Language

In the language of the post. If the post is in English, the proposal goes in English even if the chat is in another language.

## Rules

- Never invent experience, clients, deadlines or metrics.
- Never bid below the net floor without saying so explicitly.
- Never send the proposal: it is shown and the user copies and sends it (rule 4 of `freelance-guardrails`).
- Never set `proposal_sent`: `/job-outcome` does that after sending.
- No em dashes in the proposal text or in the notes.

## Handoff

Ask for approval before writing the proposal into the note. Proposal READY when it passed review and the bid is above the floor. The next step is to send it by hand and run `/job-outcome` to record the submission and the Connects spent; if the client replies, `discovery-call` to rehearse and then `/contract-and-proposal-writer` for the SOW.
