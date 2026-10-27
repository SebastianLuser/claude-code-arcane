# Drafter-Reviewer Rule (CVs and cover letters)

Adapted from the `/apply` workflow in MadsLorentzen/ai-job-search. Every custom CV or cover letter for an application goes through a fresh-context reviewer BEFORE being exported to PDF. The drafter does not self-review.

Paths are relative to the career workspace (`./career-workspace/` or env `CAREER_WORKSPACE`).

## When it applies

- When the draft of a custom CV (cv-tailor flow) or of a cover letter / application message (cover-letter flow) meant for a specific application is finished.
- It does NOT apply to minor edits of an already reviewed CV (typos, changing a date) or to the base CVs in `02-CVs/` outside an application.

Who runs it: `/job-apply` (step 7, mandatory), and `/cv-tailor` and `/cover-letter` when run on their own. All three declare `Task` in `allowed-tools` precisely so they can comply - a skill without `Task` cannot apply this rule, and there the rule would be only an intention.

## The reviewer step

Launch ONE fresh-context **`cv-reviewer`** agent via the Agent tool. The agent already carries the persona, the read limit and the output contract; the prompt only has to provide what the agent cannot know:

1. The full text of the job description.
2. The CV and/or cover letter draft, verbatim.
3. Which profile was used, so it knows which `01-Profiles/` file it may read.

It goes inline in the prompt so it does not depend on reading files from the conversation.

If the `cv-reviewer` agent is not installed (`+job-hunt` profile without its agents directory), use a `general-purpose` agent and give it the four constraints in the prompt: reading limited to `01-Profiles/<profile used>.md`, forbidden to read templates and the rest of the workspace, brief web research on the company, and the output contract below.

The reviewer returns two parts:

- **Part A - mechanical replacements:** JSON list of objects `{ "old_string": "<exact text from the draft>", "new_string": "<replacement>", "reason": "<one line>" }`. The `old_string` must be a verbatim quote so Edit can apply it without ambiguity.
- **Part B - narrative suggestions**, grouped by category:
  - ATS keywords from the JD that are missing or appear only as a synonym
  - Company angles not used (from the research)
  - Bullets that can be rewritten as a measurable achievement
  - Tone / style (register, length, filler words)

## Second lens (optional): `hiring-manager`

`cv-reviewer` answers "does it pass the filter?". A CV can pass with an 85% match and still die on the hiring person's desk, for a different reason: **there is no evidence that the person has already done the job**.

When the second agent is worth it: an application that matters, a senior role, or a streak of post-CV rejections. It is launched **in parallel** with `cv-reviewer` (not chained: they are independent lenses and chaining them only adds latency). It returns a verdict, the missing evidence and the 3 questions it would ask, which are also material for `/interview-prep`.

It is not mandatory. For a routine application, `cv-reviewer` alone is enough.

## Rules for applying the feedback

- **A single round.** The drafter applies Part A, incorporates whatever fits from Part B, and moves on. No iterative back and forth.
- **Never stuff keywords:** if a JD keyword is a real gap for the candidate, it is NOT added to the CV; it is acknowledged honestly in the cover letter if worth it.
- No long dashes in the final result: if the reviewer suggests text with an em dash or en dash, it is normalized to `-` when applied.
- Only after applying the feedback is it exported: `python .claude/skills/cv-ats-export/scripts/cv_export.py "<CV>"` (or the copy installed in `<workspace>/tools/`; it includes automatic ATS verification of the text layer).

## Record

In the application note (`03-Applications/`), leave in `## Notes` a summary of 3-5 tailoring decisions (what was emphasized, which company angle was used, which gap was acknowledged). It helps calibrate future applications and prepare for the interview.
