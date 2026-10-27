---
name: master-profile
description: "Build and maintain the master professional profile - the single source of truth (experience, skills with levels, projects, education, references, bios) that every CV, LinkedIn profile and portfolio derives from. Triggers: master profile, master resume, work history timeline, single source of truth CV, my professional experience."
argument-hint: "[build | update | derive <role>]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Master Profile - Single Source of Truth

You build and maintain the **master profile**: the document every CV, the LinkedIn profile and the portfolio derive from. The golden rule: **if something changes, it changes here first** and syncs from here to the rest.

It lives in `01-Profiles/Master Profile.md` inside the career workspace. The per-role profiles (`Backend.md`, `Frontend.md`, etc.) are **filtered views** of the master, not independent sources.

## Why it exists

Keeping N CVs in sync by hand is the #1 cause of errors (dates that do not match, achievements missing from one version). With a master: you edit one side, you derive the rest. `/cv-tailor`, `/linkedin-optimize`, `/portfolio-site` and the LinkedIn skills (Voice section) consume this file.

## Master profile structure

Generate the file with these sections (all that apply):

1. **Personal info** - name, display name, current headline, location, public vs personal email, phone, LinkedIn, GitHub, portfolio. (The *public* email can differ from the personal one.)
2. **Bios** - three lengths: short (hero/one-liner), medium (2-3 sentences for "About"), long (full about page).
3. **Work experience** (most recent first) - for each role: company, period, location/work mode, product, stack, manager/reference, and **achievement bullets with number→context→result**.
4. **Education** - institution, period, focus.
5. **Certifications** - name, year, status (complete/in progress).
6. **Consolidated skills with level** - grouped (languages, frameworks, infra, tooling) with a level (Expert/Advanced/Proficient/…) and optionally a % for the portfolio.
7. **Projects** - tech, role, highlights, live link.
8. **Achievements / highlights** - awards, showcases, milestones.
9. **Languages** - language + level.
10. **References** - name, role, relationship, contact.
11. **Voice** - how the user writes on LinkedIn and in messages: who they write for, the audience's language, words they use and would never use, sentence length, emoji (never / sparingly / freely), 3-5 positions they hold that part of their audience does not share, off-limits topics and names (NDA, employer), and the proof they can sign off on (real numbers and stories). Read by `/linkedin-post`, `/linkedin-comment`, `/linkedin-reply`, `/linkedin-inbox` and `/cold-outreach`. If the user prefers not to fill it in by hand, ask for three of their posts and derive it from there.

## Modes

### `build` - Create the master from scratch
1. If the workspace does not exist, suggest `/job-hunt setup` first.
2. Collect info per section - prefer **interviewing the user in blocks** (not a giant questionnaire). Start with experience and skills.
3. For each achievement, push toward the **quantifiable** form: "what number can you put on it? compared with what? what result did it have?". A bullet without a metric is a missed opportunity.
4. Write `01-Profiles/Master Profile.md`.
5. Suggest deriving the first per-role profile: `/master-profile derive <role>`.

### `update` - Keep it current
1. Read the current master.
2. Apply the change (new role, new achievement, promotion, project).
3. **Warn which derivatives are now outdated** (per-role CVs, LinkedIn, portfolio) and offer to re-derive them.

### `derive <role>` - Per-role view
1. Read the master.
2. Create/update `01-Profiles/<Role>.md` with the `Profile` template (see `Templates/Profile.md`): filter and reorder the experience/skills/projects toward that role, define target keywords, minimum score and market.
3. This per-role profile is the `base_profile` that `/cv-tailor` uses later.

## Writing principles

- **Achievements, not responsibilities.** "Cut server latency by 25%" > "In charge of the server".
- **Action verbs + metric + impact.** Owned, shipped, led, reduced, increased, scaled.
- **Verifiable truth.** Nothing you cannot defend in an interview.
- **English for international roles**, the local language when it applies. The master can keep its values in English (they go straight to the CV/portfolio) and its meta-notes in the user's language.

## Rules

- A single source of truth: do not let a per-role CV "evolve" outside the master.
- Do not invent achievements or metrics - if the user does not have the number, mark it as pending, do not fabricate it.
- Separate the public email from the personal one; do not expose sensitive data in files that go to a remote.

## Handoff

Confirm with the user (approval) before writing the master profile or overwriting derivatives. When the master is READY, derive per-role profiles and continue with `/cv-tailor`, `/linkedin-optimize` or `/portfolio-site`.
