---
name: linkedin-optimize
description: "Optimize a LinkedIn profile to attract recruiters and rank in search - headline, About, experience with KPIs, keywords, value proposition and a 30-second pitch. No LinkedIn Premium needed. Triggers: optimize LinkedIn, improve LinkedIn profile, LinkedIn headline, LinkedIn about, LinkedIn for recruiters, LinkedIn SEO, professional pitch."
argument-hint: "[section | full] (paste your current profile)"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# LinkedIn Optimize - A profile that attracts opportunities

You optimize a LinkedIn profile so that (1) it ranks in recruiter searches and (2) it convinces the human who opens it. You work against the **master profile** (`01-Profiles/`) and whatever the user pastes from their current profile.

> **Important:** Claude does not access LinkedIn or edit the profile directly. The user pastes/uploads the current content; you generate the optimized text for them to copy/paste.

## How to bring your profile to Claude

The most complete way: on LinkedIn → **Resources / More → Save to PDF** (exports the whole profile) and upload that PDF to Claude. Alternative: copy/paste headline + About + experience. With the PDF, you can ask for an **audit against real JDs**:

> "Audit my LinkedIn profile (attached) against JDs for senior [role] at [target companies]. Find gaps in the headline, About and Experience: missing keywords, wrong identity framing, buried credentials. Then rewrite the headline and About to position me as a **builder**, optimized for recruiter search."

**Identity framing:** position yourself as someone who *builds/delivers* (builder), not as a list of tasks. The headline and the About must shout outcomes and identity, not responsibilities.

## The 7 optimization areas

Cover these seven (the user can ask for one with `[section]` or all with `full`):

### 1. Headline
- Use the full length the editor allows (it shows the counter; today it is around 220 characters). Not just the job title: **role + value + keywords**.
- Avoid opening with "Helping X do Y" (or its equivalent in the profile's language): half of all profiles start that way. Give three options.
- Pattern: `{Role} | {specialty/stack} | {value or who you help}`.
- Headline keywords weigh heavily in search ranking.

### 2. About
- The first 2 lines are the only thing visible without "see more": for most readers they are the whole About. Make them say what you solve and for whom. No "passionate about", no third-person bio, no opening with your name.
- Structure: hook → what you do and for whom → 2-3 achievements with numbers → stack/keywords → soft CTA.
- First person, human tone, scannable (short paragraphs or bullets). Aim for under ~1,400 characters even if more fits.

### 3. Experience with KPIs
- Each role with bullets of **quantifiable achievements**, not responsibilities.
- Same principle as the CV: action verb + metric + impact.
- Include keywords from your industry/role in the bullets.

### 4. Strategic keywords (LinkedIn SEO)
- Identify the keywords recruiters for your role search for.
- Spread them across the headline, About, experience, and the Skills section.
- **Skills** (up to 100) feed matching with searches and endorsements. The first ones visible have to be the three you want to be hired for; the rest is noise.

### 5. Unique value proposition
- What sets you apart: combination of skills, domain, results. One clear sentence that sums up "why you".

### 6. 30-second pitch
- The spoken version of your value proposition: who you are, what you do/solve, what you are looking for. For messages, networking and "tell me about yourself".

### 7. ATS / searchability review
- Professional photo, banner, custom URL, "Open to work" configured (public or recruiters-only), location and target role set.
- Complete profile = more reach (LinkedIn rewards completeness).
- No unexplained gaps; titles consistent with how the role is searched for.

## 100-point score

In `full` mode, score the profile **before** rewriting and show the table. Be honest: most profiles land at 30-40 on the first pass, and a generous score helps nobody.

| Item | Pts | Full marks |
|---|---|---|
| Headline | 12 | Says who you help or what you solve, brings proof, is not just the job title, uses the available length |
| About, first 2 lines | 10 | Name the reader's problem; no "passionate about", no third person |
| About, body | 10 | To one reader: their problem, what you do, a number as proof, what to do next |
| Current role | 10 | One line of scope + 2-3 result bullets with numbers (not tasks) |
| Activity | 10 | Posted or commented in the last 7 days; an empty feed looks like an abandoned profile |
| Featured | 8 | Three items: the best post, a proof (project, demo), the way to contact you |
| Experience depth | 8 | Last two roles detailed; anything older than 10 years, one line |
| Recommendations | 8 | At least three from the last two years, naming a concrete result |
| Banner | 6 | A positioning line and a way to contact you; not the default |
| Photo | 6 | The face fills a good part of the frame, eyes visible, from the last two years |
| Skills | 6 | The first ones visible are the three you want to be hired for |
| Contact | 6 | Custom URL, an email or link that works, the same handle as on GitHub/portfolio |

Rewrite in order of **points lost**, not all at once: the user has to paste each part. At the end re-score and show the real delta: if it reaches 88, say 88 and what is missing (recommendations, banner, activity history: nothing a rewrite can create).

## Process

1. Read the master profile + what the user pastes from their current LinkedIn.
2. Define the **target role(s)** and their keywords (reuse `cv-tailor/references/ats-keywords.md` for the method).
3. In `full`: 100-point score.
4. Generate the optimized content per section (the one(s) requested), passed through `/content-humanizer` (`.claude/skills/content-humanizer/scripts/humanize.py` + `detect.py` from the same folder) before showing it.
5. Deliver it ready to copy/paste + a review checklist (area 7) + the re-score.
6. Optional: save the output in `01-Profiles/LinkedIn.md` to version it.

## Language

LinkedIn in **English** if you target international roles (wider reach), in your local market's language if your market is local. The About can be bilingual.

## Rules

- Do not invent achievements or metrics - everything must be defensible.
- Natural keywords, no stuffing.
- Remember that LinkedIn cannot be accessed/edited: the output is for copy/paste.
- Rubric and rewrite order adapted from Jake Schincariol's linkedin-agent-skill (MIT).

## Handoff

Ask for approval before writing `01-Profiles/LinkedIn.md`. When the content is READY to copy/paste, a good next step is `/portfolio-site` to align the web portfolio.
