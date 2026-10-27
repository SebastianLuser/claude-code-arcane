---
name: cv-tailor
description: "Tailor a CV to a specific job description: extract ATS keywords, decide what to emphasize vs downplay, and rewrite achievement bullets in the offer's vocabulary, starting from a role profile. Triggers: adapt my CV, custom CV, tailor resume, CV for this posting, optimize CV for ATS, match CV to job description."
argument-hint: "[job-url | path-to-jd | application-note]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch, Task
---

# CV Tailor - Adapt the CV to the posting

You take a job description and the user's base profile, and produce a **custom CV** that matches both the automated filters (ATS) and the hiring manager's human reading. You do not rewrite the truth - you reorganize it and translate it into the posting's vocabulary.

## Inputs

- **The job description** (URL → use WebFetch, or pasted text, or a note in `03-Applications/`).
- **The base profile**: `01-Profiles/<Role>.md` (derived from the master via `/master-profile derive`). If it does not exist, suggest creating it.
- **Research on the contact/company** if it exists in `04-Companies/` and `05-Contacts/`.

## Process

### 1. Analyze the posting
- Extract **literal keywords** from the JD: technologies, methodologies, responsibilities, soft skills, seniority. Literal matters - the ATS does string matching (e.g. if they ask for "React.js" do not assume "React" matches the same).
- Detect **must-have vs nice-to-have**.
- Detect **culture / angle signals** (startup vs enterprise, code-forward, ownership, etc.).
- See `references/ats-keywords.md` for how to extract and map keywords.

### 2. Map against the profile
- For each must-have: which experience/project in the profile covers it? Mark honest gaps.
- Decide **what to highlight** (what aligns most, at the top and with more space) and **what to turn down** (what is irrelevant for this role).

### 3. Rewrite
- Reorder experience and projects toward the role.
- Rewrite achievement bullets using the posting's vocabulary, keeping number→context→result.
- Inject keywords naturally (in real bullets, not as detectable "keyword stuffing").
- Adjust the headline/summary to the exact role.

### 4. Score before/after
- Compute an approximate **match rate**: % of the JD's keywords/requirements present in the CV, **before** vs **after** the tailoring.
- Report the delta ("match 48% → 81%") and which keywords were covered.
- **Keyword stuffing flag:** mark any insertion that would sound forced or unnatural to a human reviewer - the goal is to pass the ATS *and* read well for a person.

### 5. Produce the custom CV
- Create/update the note at `02-CVs/CV - <Company> - <Role>.md` using the `Custom CV` template (`Templates/Custom CV.md`).
- Fill in the frontmatter (`base_profile`, `application`, `company`, `pdf_file`).
- Document the decisions (keywords, what was highlighted/turned down) in the template's sections - it helps for the interview and for iterating.
- The CV body itself must be ready for `/cv-ats-export` (clean markdown: `# name`, `## sections`, bullets, `---`).

### 6. Review before exporting (drafter-reviewer rule, mandatory)

With the `.md` approved and **before** sending it to `/cv-ats-export`, follow `.claude/rules/drafter-reviewer.md`: launch the fresh-context `cv-reviewer` agent with the JD and the draft inline. Apply Part A (exact replacements) and incorporate whatever fits from Part B. A single round.

If the role is senior or the application matters, also launch `hiring-manager` in parallel - it answers whether the CV convinces whoever hires, which is a different question.

The drafter does not self-review: do not skip this step because the CV "already looks good". If the user decides to export without a review, warn them that the rule is being skipped and continue.

## CV format (ATS-friendly)

- **One column.** No tables, no text boxes, no columns - ATSs read them badly.
- Standard sections with clear headers: Summary, Experience, Skills, Projects, Education.
- Consistent dates (MM/YYYY).
- No charts or images for critical content.
- Action verbs + metrics.

## Language

Write the CV in the language the user chooses for that application (`rules/user-language.md`). English is the usual choice for international/global remote roles; when the posting is in another language, ask.

## Rules

- Never make up experience, dates or metrics. Tailoring = reorganizing and translating, not lying.
- Date ranges with an ASCII hyphen (`2019-2024`, `Mar 2023 - Present`), never `–` or `—`: an ATS that splits the range on `-` loses the date. `/cv-ats-export` checks it.
- No keyword stuffing: every keyword must live in a true bullet.
- One custom CV per application - do not overwrite the base profile or the master.
- After generating the `.md`, remind the user to run `/cv-ats-export` for the PDF.
- Do not export to PDF without going through the review in step 6.

## Handoff

Ask for approval before writing the custom CV. When the `.md` is READY, run the review in step 6 (`cv-reviewer`); only with the feedback applied is the next step `/cv-ats-export` to generate the ATS PDF and `/cover-letter` for the message.
