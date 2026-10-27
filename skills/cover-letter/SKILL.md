---
name: cover-letter
description: "Write concise, confident cover letters and application messages tailored to the company and the person who will read them. Triggers: cover letter, letter of introduction, application message, motivation letter, why I'm a fit."
argument-hint: "[application-note | company + role]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch, Task
---

# Cover Letter - A top-tier application message

You write **concise, confident and custom** cover letters and application messages - ones that sound like a person who understood the role and the company, not a template. The goal: make the reader want to read the CV.

## Inputs

- **Role and company** + the job description.
- **Base / master profile** (`01-Profiles/`) for the achievements and the angle.
- **Research** from `04-Companies/` and on the contact in `05-Contacts/` (who you are writing to changes the tone).
- The **channel**: formal cover letter (ATS field), short LinkedIn/email message, or a "why you" paragraph in a form.

## Principles

- **One page at most; ideally 150-250 words** for messages, 250-350 for a formal letter.
- **The first line wins or loses.** No "I am writing to apply for…". Open with a specific hook: a relevant achievement, a point of connection with the company, or why this role moves you.
- **Show fit, not history.** 1-2 achievements that map directly to what they ask for, with a number.
- **Company-specific.** One sentence that shows you did the research (product, value, problem they solve). If you can paste it into another application, it does not work.
- **Confident, not arrogant; warm, not servile.** Neither "would be honored" nor "I'm the best candidate".
- **A simple CTA at the end.** Availability / interest in talking, without begging.

## Structure (formal letter)

1. **Hook** - specific hook (achievement or a real connection).
2. **Fit** - 1-2 achievements mapped to the JD's must-haves, with a metric.
3. **Company** - why *this* company/role (real research).
4. **Close** - brief CTA + thanks.

## Structure (short message / LinkedIn / email)

- Personal greeting (the contact's name if you have it).
- 1 sentence: who you are + the most relevant achievement.
- 1 sentence: why this company/role.
- 1 sentence: CTA (chat / here's my CV).

## Process

1. Read the JD + research. Identify the 2 must-haves where you shine the most.
2. Choose the format by channel.
3. Draft. Then **cut ruthlessly** everything generic.
4. Generate 2 alternative openings if the user wants to choose.
5. **Review (drafter-reviewer rule, mandatory if the letter goes to a specific application).** Launch the fresh-context `cv-reviewer` agent with the JD and the draft inline; apply Part A and incorporate whatever fits from Part B. A single round. The first line is what gains the most from a fresh read: whoever wrote it is already convinced by their own hook. It does not apply to reusable short messages in `07-Resources/`.
6. Save it in the application note (`03-Applications/`, cover letter section) or in `07-Resources/` if it is reusable.

## Language

Write it in the language the user asks for; when unsure, mirror the language of the JD. English is the usual default for international roles.

## Anti-patterns (always cut)

- "I am writing to express my interest in…" and its formulaic equivalents in other languages.
- Reciting the CV in prose.
- Empty adjectives without evidence (passionate, hardworking, team player).
- Generic paragraphs that work for any company.
- Apologizing or sounding desperate.

## Handoff

Ask for approval before saving the letter in the application note or in `07-Resources/`. When the cover letter is READY and has passed the review in step 5, the next step is `/cold-outreach` if there is a contact to write to directly.
