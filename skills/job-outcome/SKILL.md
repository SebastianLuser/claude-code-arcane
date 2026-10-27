---
name: job-outcome
description: "Record the outcome or progress of a job application (interview, offer, hired, rejected, no reply) updating the application note and the dashboard. Triggers: I heard back from, record outcome, I got rejected, I have an interview with, I got an offer, they never replied, update application status."
argument-hint: "[company]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# /job-outcome - Record the outcome of an application

Record what happened with an application: progress (interview scheduled/done, offer received) or resolutions (hired, rejected, no response, offer declined, discarded). Adapted from the `/outcome` in MadsLorentzen/ai-job-search to the career workspace note schema (paths relative to the workspace: `--workspace`, env `CAREER_WORKSPACE`, or `./career-workspace/`).

Company/posting given: `$ARGUMENTS`

## Steps

1. **Locate the note.** Search `03-Applications/` for the note whose name or `company` frontmatter matches (case-insensitive) `$ARGUMENTS`. If no argument was passed or it is ambiguous, list the applications with an open status (`interested`, `applied`, `interviewing`, `offer`) and ask which one.

2. **Collect what happened.** Ask the user and classify:
   - **Progress:** interview scheduled / interview done / offer received → statuses `interviewing` or `offer`.
   - **Resolution:** `hired` · `rejected` · `no_response` · `declined` (the user turned down the offer) · `discarded` (the user lost interest / the posting closed).
   Record the date, the verbatim feedback received and lessons learned. **Record data, do not interpret it:** quote the feedback as it arrived, without softening or analyzing it here.

3. **Update the application note**, with the user's approval on what was collected (idempotent - append, never duplicate or overwrite):
   - Frontmatter: `status` to the new value and `updated` to today. Compatibility: if the old note uses `score:` instead of `match_score:`, do not rename the field, only touch `status`.
   - `## Timeline / follow-up`: add a line `- YYYY-MM-DD - <what happened>`.
   - If there was an interview: an entry in `## Interviews` (date, stage, interviewer if known, and a link to the `06-Interviews/` note if it exists).
   - Feedback and lessons go in `## Notes`.

4. **Update the dashboard** (`00-Dashboard.md`): find the posting's row and update the **Status** column with the new status (use the emoji legend below, the same as the Dashboard template) and the note column if it adds something (e.g. "Rejected 2026-07-13").

5. **Suggest the next step** depending on the case:
   - `interviewing` → offer `/interview-prep`.
   - `rejected` with feedback → write the lesson down in the note; if 3+ resolutions pile up, offer `/job-upskill` and review the search criteria against the real results.
   - `no_response` after 10-14 days → offer a follow-up with `/cold-outreach`.
   - `hired` → 🎉 and update the rest of the open applications (withdraw from processes?).
   - **Freelance** - `in_conversation` → offer to rehearse with the `discovery-call` agent; `contract_active` → create the note in `08-Contracts/`; accumulated `no_response` or `rejected` (10+ resolved proposals) → offer `/freelance-pipeline`, which is where you see whether the problem is the proposal or the targeting.

6. **Confirm** to the user what was recorded (note, fields touched, dashboard row).

## `status` vocabulary (frontmatter)

It depends on the note's `type:`. Read it first: they are two different pipelines and mixing them up breaks the dashboard and the reports.

**`type: application` (employment, `+job-hunt` profile):**

`interested → applied → interviewing → offer` and closes in: `hired | rejected | no_response | declined | discarded`

**`type: freelance` (proposals, `+freelance` profile):**

`interested → screened → proposal_sent → in_conversation → contract_active → delivered` and closes in: `won_closed | no_response | rejected | discarded | disputed`

Freelance has two extra records that do not exist in employment, and without them `/freelance-pipeline` cannot compute anything:

- When setting `proposal_sent`, ask and record **how many Connects it cost** (frontmatter `connects_spent`) and add the row to the ledger in `07-Resources/Connects - <year>.md`.
- If the posting closed without the client hiring anyone, the result in the ledger is `never_hired`, not `no_response`. They are different things: the first is Connects lost to bad screening, the second is your proposal that did not convince.

Dashboard emojis: ⬜ interested/screened · ✅ applied/proposal_sent · 📅 interviewing/offer/in_conversation · 🔨 contract_active/delivered · ❌ rejected/no_response/declined · 🚫 discarded/closed · ⚠️ disputed

## Rules

- Do not bulk-edit existing notes: only the application note in question and its dashboard row.
- Do not invent data: if information is missing (date, feedback), ask or leave the field as it is.
- No em dashes in any added text.

## Handoff

Record COMPLETE when the note and the dashboard are consistent. Depending on the outcome, the next step is `/interview-prep` (interview scheduled), `/cold-outreach` (follow-up) or `/job-upskill` (accumulated rejections).
