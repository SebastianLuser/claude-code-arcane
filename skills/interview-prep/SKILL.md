---
name: interview-prep
description: "Prepare for a job interview: company research, likely question bank by role, STAR answers built from your real experience, smart questions to ask, and red flags to watch for. Triggers: prepare for an interview, interview prep, interview questions, STAR answers, what to ask in an interview, mock interview, interview red flags."
argument-hint: "[application-note | company + role + round]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch, Task
---

# Interview Prep - Interview preparation

You prepare the user for a specific interview: company research, a likely question bank by role and round, **STAR** answers built from their real experience, smart questions to ask, and red flags to detect. The output lands in a note in `06-Interviews/`.

## Inputs

- **Application / company / role** (`03-Applications/`, `04-Companies/`) and the **round** (recruiter screen, technical, system design, hiring manager, culture, final).
- **Master profile** (`01-Profiles/`) - the stories for the STAR answers come from there.
- **Interviewers** if known (background research helps).

## What you produce

### 1. Company research
- What they do, product, business model, stage, size.
- Culture and values (from their site, blog, reviews).
- Recent news / funding / launches.
- Known tech stack.
- How to connect your profile to their context.

### 2. Question bank by round
- **Recruiter screen:** motivation, salary expectations, availability, "tell me about yourself".
- **Technical:** based on the JD's stack - fundamentals, problems, debugging, code review.
- **System design** (if applicable): patterns, trade-offs, scale.
- **Hiring manager / behavioral:** leadership, conflict, failure, impact.
- **Culture:** values, ways of working, why this company.
- Mark the **3-5 most likely** for this specific role.

### 3. STAR answers
- Build answers with the **STAR** method (Situation, Task, Action, Result) using real achievements from the master profile.
- Each answer: concrete, with a metric, 60-90 seconds spoken.
- See `references/star-framework.md`.

### 4. Questions to ask
- 5-7 smart questions that show research and filter whether the company is right for you (team, expectations for the first 90 days, how they measure success, tech debt, process).

### 5. Red flags to detect
- Signs of a bad company/team during the interview (chaotic process, evasion about culture/turnover, unrealistic expectations, unclear role, hostility).
- What to ask to bring them to light.

## Salary / negotiation (if the round touches it)

- Do not give a number first if you can avoid it; ask for the range.
- Anchor on market research + your value (achievements).
- Have a range (minimum acceptable / target / ambitious) ready.

## Process

1. Read application + company + profile. WebFetch the company's site/notes.
2. Create a note in `06-Interviews/` with the `Interview` template.
3. Fill in research, the question bank (marking the top ones), STAR for the 3-5 key stories, questions to ask, red flags.
4. Offer a **mock** with the `mock-interviewer` agent (see below).
5. Post-interview: help record feedback and define the next step / follow-up (with `/cold-outreach`).

## The mock runs in an agent, not in this session

The mock is run by the `mock-interviewer` agent, not by you. The reason is hard: you just wrote the user's STAR answers, so you would ask exactly what they prepared, it would go perfectly, and the user would walk into the real interview with false confidence.

When you launch it, pass it **inline**: the JD, the round, and the CV that was sent. Do **not** pass it the master profile or the `06-Interviews/` note with the prepared answers - that invalidates the drill, and the agent is instructed to reject them.

When it returns the feedback, your job is to record it: add to the `06-Interviews/` note which answers need to be redone and why. That is the value that remains for the next round.

## Language

In the language of the interview. Prepare answers in English if the role is international, even if the prep is discussed in another language.

## Handoff

Ask for approval before writing the note in `06-Interviews/`. When the prep is READY, offer the mock with `mock-interviewer` and record its feedback; post-interview, continue with `/cold-outreach` for the follow-up.
