# Freelance Guardrails (marketplaces and direct clients)

Job hunting is free: you apply to 40 positions and only lose time. Freelancing is not. Every proposal costs something, every bad contract hits your reputation, and every unpaid "could you add this real quick?" comes out of your pocket.

These four rules exist because the three resources being spent (money, reputation, unbilled time) do not come back.

**The cost of applying has a different name on each platform** and the rules apply all the same: Connects on Upwork, bids on Freelancer.com, and in direct outreach it is the hours you put into writing the proposal. Wherever it says Connects below, read "what applying costs you".

Paths are relative to the career workspace (`./career-workspace/` or env `CAREER_WORKSPACE`).

## 1. Applying costs money: nothing is spent without a screen

Never draft a proposal for a posting whose client has not passed `/client-screen`, or for one that fell below the score threshold.

If the user wants to apply anyway to one that failed the screen, they can - **but they are told what failed and it is recorded in the note**. An unverified payment nobody mentioned is a wasted application, and worse: it is the proposal that does get an answer and ends in a dispute.

## 2. Reputation is protected by saying no

Winning a contract is not always good. Almost every platform computes a score over closed contracts (on Upwork it is the Job Success Score) where one unhappy client weighs more than two happy ones, and with direct clients the equivalent is the references you will not be able to ask for. A contract with fuzzy scope, an unrealistic budget or a client with no history is a **reputation risk**, not an opportunity.

When the screen flags high risk, the default recommendation is not to apply. Saying "no" is a pipeline action, not the absence of one.

## 3. Nothing is quoted below the floor

Every bid goes through the floor declared in `01-Profiles/` (minimum acceptable rate). The floor is **net**, after the platform fee: if it keeps 10%, a floor of 40 USD/h requires bidding 45. With a direct client the fee is zero, but the floor is still net of taxes and of non-billable hours.

If the user has not set a floor yet, `/freelance-scan market` gives the median of what others with their profile charge. It is a starting point, not the floor: the floor is set by their cost of living, not by the market.

New scope, new price. No proposal or contract grows without being quoted: if the extra work does not fit into a change order with a number, it does not go in.

## 4. The user always does the sending

No skill in this profile sends a proposal, accepts a contract or spends the application budget. It is drafted, reviewed, shown, and the user copies and sends it.

This is not caution on our part: **the Upwork API has no mutation to apply or to spend Connects**, precisely to stop auto-bidding bots, and the other platforms forbid automated sending in their terms. No skill should pretend otherwise, and one that tried would be violating the ToS on top of this rule.

The corollary for **sources**: no skill in the profile can depend on credentials each user has to obtain on their own. Anyone installs this profile, and a source with a hand-approved API key works for one person and is broken for everyone else. Automatic sources are public and keyless (see `skills/freelance-scan/references/platforms.md`); everything else is pasted by hand.

## This file does not hold up the structure

A rule without a right-hand column is an intention.

| Rule | What enforces it |
|---|---|
| Screen before spending on an application | `/freelance-proposal` requires the screen note; without it, it asks and does not draft |
| Say no over reputation risk | `/client-screen` issues an explicit verdict; the `client-screener` agent is adversarial by design |
| Rate floor | `/freelance-proposal` reads the floor from the profile and fails loudly if the bid falls below it; `/freelance-scan market` gives the market reference |
| New scope, new price | `/freelance-pipeline` detects scope drift in active contracts and asks for a change order |
| Manual sending | No script in the profile writes to a platform: `freelance_search.py` only reads, and there is no other |

## Record

Every decision not to apply is recorded just like an application: a note in `03-Applications/` with `status: discarded` and the reason in `## Notes`. Discards are half the data `/freelance-pipeline` needs to tell you whether your selection criteria work.
