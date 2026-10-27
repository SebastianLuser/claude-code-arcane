---
name: personal-brand
description: "Build a job-search personal brand on LinkedIn: generate a sequenced backlog of post ideas across credibility pillars (3-4 posts a week) that builds authority before outreach, plus a weekly plan of what to post, when, and who to engage with. Triggers: personal brand, LinkedIn content, LinkedIn post ideas, content calendar, LinkedIn authority, plan for the week, what to post, build an audience for the job search."
argument-hint: "[plan | week | ideas <N> | draft <idea>]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Personal Brand - LinkedIn authority for the job search

You build a LinkedIn personal brand aimed at getting a job: a **sequenced** backlog of post ideas (3-4 per week) and a weekly plan that builds authority and credibility *before* going out to do outreach, so that when you write to a recruiter they already have context on who you are.

You work against the **master profile** (`01-Profiles/`) and the target role/companies. Output: a content plan in `01-Profiles/Personal Brand.md` (or `07-Resources/`).

## The 4 pillars

1. **Builder credibility** - what you built/delivered, with results. It shows that you do, not just that you know.
2. **Lessons from current role** - concrete lessons from the current/recent job (technical and process).
3. **POVs on your domain** - opinions/trends in your domain. It positions you as someone who thinks, not just executes.
4. **Behind-the-scenes of the job search** - the search journey (in the right measure): it builds closeness and sometimes attracts direct opportunities.

See `references/post-pillars.md` for angles, hooks and formats per pillar.

## Modes

### `plan` - Backlog of 90 sequenced ideas
1. Confirm the target role, companies and the topics where the user has real authority (from the master profile).
2. Generate **90 ideas** spread across the 4 pillars. Each idea = **hook + angle + format** (text, carousel, list, story, hot-take).
3. **Sequence**: the first ~4 weeks prioritize pillars 1-3 (build authority); only afterwards add more of pillar 4 and push the outreach. Authority comes before the ask.
4. Deliver as a table/calendar (day → idea → pillar → format).

### `ideas <N>` - Batch of N ideas
Generate N fresh ideas for a specific pillar or topic, same hook+angle+format format.

### `week` - The week
Once a week, on the same day. Read `01-Profiles/LinkedIn Log.md` to avoid repeating a topic from the last two weeks, and ask **what happened this week** (something you built, a number, a mistake, a discussion): the posts come from there, not from the backlog in the abstract.

- **What to post:** 3-4 posts, never two of the same type in a row. Mix: one **proof** (something that happened, with a number), one **opinion** (a position that may cost you followers), one **teaching** (something the reader can do today: `/linkedin-post explain`, or `/linkedin-carousel` if it has steps), and every two weeks a **story** (a scene with a cost). Per slot: topic, this week's concrete angle and the hook number from `/linkedin-post` (`.claude/skills/linkedin-post/references/hooks.json`). "AI" is not an angle.
- **When:** when the audience is at their desk, in *their* time zone. For a business audience, Tuesday to Thursday morning is the reasonable default. Say it clearly: the day and time matter much less than the first line; if the user optimizes timing before having hooks that work, they are polishing the wrong thing.
- **Who to engage with (10):** 5 for **reach** (people with the audience you want, on whose posts you can contribute; comment early), 3 **peers** (same level and field: the ones who return the favor), 2 **decision-makers** (recruiters or hiring managers at target companies, from `04-Companies/` and `05-Contacts/`): weeks of useful comments before any DM, and never ask in a comment. ~20 minutes a day, before posting.

Output: the week day by day (post or "engagement only") + the list of 10, written in `01-Profiles/Personal Brand.md`. Nothing is scheduled or published: the user executes the plan. "Write Tuesday's" → `/linkedin-post`.

### `draft <idea>` - Write a post
Delegate to `/linkedin-post`: three hooks, a draft in the master profile's voice, humanized and scored before showing it.

## Principles

- **Hook first.** The first line decides whether they read it (it shows truncated in the feed). Specific, with tension or a number.
- **Show, don't proclaim.** "I cut the deploy from 40min to 4" > "I'm good at CI/CD".
- **One idea per post.** Focus.
- **Consistency > volume.** The plan assumes a sustainable pace: 3-4 posts per week sustained pay off more than seven weak ones (the fifth of the week is usually the one that drags the average down); the other days, engagement. The 90-idea backlog lasts several months.
- **Authority before the ask.** Do not start by asking for a job; first add value.
- **Truth.** No inflated achievements - the audience and recruiters notice.
- The `week` mode is adapted from Jake Schincariol's linkedin-agent-skill (MIT).

## Language

Depends on your target audience: English for international reach, your local language if your market is local. You can alternate.

## Handoff

Ask for approval before writing the plan into the workspace. When the backlog is READY, combine it with `/linkedin-optimize` (profile in tune with the content) and, after ~30 days of authority, with `/cold-outreach` for the outreach.
