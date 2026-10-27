---
name: freelance-profile
description: "Build the Upwork profile that decides whether clients ever open your proposal: title, the first 250 visible characters of the overview, specialized profiles, portfolio items and rate. Triggers: upwork profile, optimize freelance profile, upwork title, upwork overview, specialized profile, what rate should I set on upwork."
argument-hint: "[audit | title | overview | portfolio | rate]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch
---

# Upwork Profile - The platform profile

You build the Upwork profile from the master profile. It is not a CV: the CV is read by someone who already decided to consider you, the Upwork profile is read by someone scanning a list of 40 freelancers or reviewing proposals.

Paths are relative to the career workspace (`--workspace`, env `CAREER_WORKSPACE`, or `./career-workspace/`).

Mode: `$ARGUMENTS`

## Inputs

- **The master profile** in `01-Profiles/` - the source of truth. If it does not exist, run `/master-profile` first.
- **The current Upwork profile**, if it already exists: public URL → WebFetch, or pasted.
- **Closed contracts** in `08-Contracts/` for portfolio items with real results.

## Modes

### `audit` - Review the current profile

Go through the five elements below and report what is missing or weak, prioritized by impact. Always start with the title and the first 250 characters of the overview: they are the only things visible without clicking.

### `title` - The title

The first and sometimes the only thing that gets read. Rules:

- **Specific niche, not a generic role.** "Full Stack Developer" competes with 200 thousand people. "Unity Developer - Gameplay & Multiplayer for Mobile" competes with few and shows up in the searches that matter.
- Include the technology or the outcome the client is looking for in their words, not yours.
- No "Ninja", "Rockstar", "Guru".
- No availability statements ("Available now") - they take up space and go stale.

### `overview` - The first 250 characters

The overview gets cut off in the preview. Everything that matters goes in the first block.

Structure:

1. **First line**: who you help and with what outcome. Not "I am a developer with 5 years of experience" - that describes your résumé, not the client's problem.
2. **Second block**: the strongest proof, with a number.
3. **After the cut**: stack, how you work, the kinds of projects you take, and what you do **not** take. Saying what you do not do filters out bad clients and raises the response rate of the good ones.
4. **Close**: a simple CTA.

Write in the first person and in the language of your target market. If you target US clients, in English.

### `portfolio` - The items

- Each item is **a problem, what you did and the result with a number**. Not a nice screenshot with no context.
- Prioritize the ones that resemble the work you want to get, not the ones you liked most.
- Remove the ones that do not represent the niche in the title: a scattered portfolio says "I do anything", which is the opposite of what you want.
- Never upload a client's work without permission, nor material under NDA. If it cannot be shown, describe the problem and the result without identifying the client.

### `rate` - The published rate

- It is derived from the **net floor** in `01-Profiles/` plus the platform fee, not from what others charge.
- The published rate is a filter, not a commitment: it filters the traffic that arrives, and you can quote differently per project in each proposal.
- Setting a very low rate to "get started" attracts clients looking for a low price, who cause the most problems and rate worst. Raising it later is harder than starting right.
- If the user is starting with no history, the right lever is narrowing the niche, not lowering the price.

## Specialized profiles

Upwork allows specialized profiles in addition to the general one. They are useful when the user has two niches with different vocabulary (e.g. "Unity gameplay" and "backend .NET"): each one is presented to its own search without diluting the other.

If there is a single niche, do not create specialized profiles: adding empty surface lowers the signal.

## What the profile does not control

The **Job Success Score** and the badge cannot be edited: they come from how contracts ended. That is why `freelance-guardrails` says declining is a pipeline action - JSS protection happens by choosing jobs, not by writing the profile. If the user is starting out, they have no JSS, and then the portfolio and the niche carry all the weight.

## Process

1. Read the master profile and the current Upwork profile if it exists.
2. Run the requested mode (or `audit` if none was given).
3. Propose the texts as drafts in the chat, with **2 title variants** to choose from.
4. With approval, save the result in `01-Profiles/Upwork.md` (derived from the master, not a replacement). The user copies and pastes it into the platform - this skill never touches the account.
5. Record the date of the last adjustment, so profile changes can be correlated with changes in the response rate from `/freelance-pipeline`.

## Rules

- Never invent experience, clients or numbers.
- Never publish work under NDA or a client's work without permission.
- The rate is never derived from the competition; it is derived from the floor.
- No em dashes in the generated texts.

## Handoff

Ask for approval before writing `01-Profiles/Upwork.md`. Profile READY when the title, overview and at least two portfolio items are complete. The next step is `/freelance-scan` to build the first queue of postings, or `/portfolio-site` if the user wants their own portfolio outside the platform.
