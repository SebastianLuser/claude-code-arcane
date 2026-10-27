---
name: job-search
description: "Find, score and prioritize job openings against your profile, then build a structured 7-day search plan with daily goals. Creates application and company notes in the workspace. Triggers: find a job, find postings, score postings, job search plan, prioritize applications, where to apply."
argument-hint: "[search <query> | score <job-url> | plan]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch, WebSearch
---

# Job Search - Search, scoring and plan

You find postings, **score** them against the user's profile, prioritize, and build a **7-day search plan** with daily goals. You feed the workspace with application and company notes so the rest of the flow (`/cv-tailor`, `/cover-letter`, etc.) can consume them.

## Inputs

- **Target profile(s)** (`01-Profiles/`): role, seniority, stack, work mode, market, **minimum score** (default 75), minimum salary, keywords and keywords to exclude.
- Posting sources the user uses (job boards, WeWorkRemotely, LinkedIn, Workable, etc.).

## Modes

### `search <query>` - Find postings

> If the `job-scrape` skill is installed, prefer `/job-scrape` for recurring runs: it uses local CLIs (LinkedIn + GetOnBoard) with dedup between runs. This mode is for one-off searches or sources the CLIs do not cover.

1. **Sourcing.** Get fresh postings that match the profile (role + stack + work mode + market). Two paths:
   - **Apify MCP (optional).** If an Apify MCP is connected, you can use a LinkedIn Jobs scraping actor to bring structured postings. Example request: *"Scrape LinkedIn jobs for [role] posted in the last 7 days at companies with 50-5000 employees; filter by match with my background in [domain]; return a ranked table with company, role, location, salary, posting date and a 1-10 fit score based on my resume; mark the top 10 to apply to today."* Find the actor with ToolSearch (`apify`) if the MCP is present. **⚠️ MANDATORY: before invoking Apify, show the warning below and ask for explicit confirmation.**
   - **WebSearch/WebFetch (recommended default).** The path without Apify: search job boards (many with a public feed/API: WeWorkRemotely, RemoteOK, etc.) and fetch the JDs. It is the safe and free default.

> ### ⚠️ Apify warning - ALWAYS show it before using this part
>
> Before running any Apify actor (especially LinkedIn scraping), present these points to the user and wait for explicit confirmation. Do not invoke Apify "silently".
>
> 1. **It is not free.** Apify charges per use (compute units / per result); a large scrape consumes credit. The free tier is limited.
> 2. **Scraping LinkedIn violates its Terms of Service.** LinkedIn actively detects and blocks scraping and can **restrict or ban the account**. The legality of scraping public data is a gray area (hiQ vs LinkedIn); the ToS/account risk is real and it belongs to the user, not to Apify. Prefer actors on **public job boards** over LinkedIn directly; if LinkedIn is scraped anyway, do it knowingly and not with a critical account.
> 3. **The Apify API token is sensitive.** It authorizes running actors (and spending the plan) on the user's behalf. Keep it safe; do not expose or commit it. (Apify does not collect conversations/tokens and treats actors as untrusted: it gives them a proxy and does not hand them the credentials - a malicious actor can use the enabled tools but cannot exfiltrate the token.)
> 4. **Variable quality/stability.** LinkedIn scrapers break often; results can come back incomplete or outdated.
>
> If the user does not confirm, use the WebSearch/WebFetch path.
2. For each candidate posting: extract role, company, stack, work mode, location, salary range, link, closing date.
3. Score (see rubric) and filter by the profile's threshold.
4. Create a note in `03-Applications/` (template `Application`, status `interested`, with `match_score`) + a note in `04-Companies/` (template `Company`) for each one above the threshold.
5. Update `00-Dashboard.md` with the active ones by priority, marking the **top 10 for today**.

### `score <job-url>` - Score a single posting
1. WebFetch the JD.
2. Apply the rubric against the profile → score 0-100 + breakdown + recommendation (apply / borderline / skip).
3. If it passes, create the notes as above.

### `plan` - 7-day search plan
Generate an actionable plan with daily goals. Example skeleton (adjust to the user's situation):

- **Day 1 - Foundation.** Master profile + per-role profiles up to date; LinkedIn optimized (`/linkedin-optimize`).
- **Day 2 - Sourcing.** Find and score 15-20 postings; keep the ones ≥ threshold.
- **Day 3 - Research.** Companies + target contacts for the top ones.
- **Day 4 - Applications batch 1.** Custom CV + cover letter for the 5 highest-priority ones (`/cv-tailor`, `/cv-ats-export`, `/cover-letter`).
- **Day 5 - Outreach.** Messages to recruiters/hiring managers for the top ones (`/cold-outreach`).
- **Day 6 - Applications batch 2** + follow-ups for batch 1.
- **Day 7 - Review.** Metrics (applied / replies / interviews), adjust profile/CV based on signals, plan next week.

## Scoring rubric

See `references/scoring-rubric.md`. In short, a weighted 0-100 score over:
- Stack/skills match (high weight)
- Right seniority (penalize over/under-qualified)
- Work mode and market/eligibility (remote, time zone, visa)
- Salary vs minimum
- Culture/stage by preference
- Posting quality signals (clarity, recency, # applicants)

Default threshold ≥75 (configurable in the profile frontmatter, field `min_match_score`).

## Tracking

- Application statuses: `interested` → `applied` → `interviewing` → `offer`, and closes: `hired` / `rejected` / `no_response` / `declined` / `discarded` (recorded by `/job-outcome`).
- Keep `00-Dashboard.md` as the single view: active ones by priority, upcoming interviews, what closes soon, what to follow up this week.

## Rules

- Do not apply to everything: the threshold exists to concentrate effort where there is a real match.
- Flag gaps honestly when scoring (do not inflate the match).
- Respect eligibility (visa/time zone) - a high score with an eligibility blocker is useless.
- Do not store sensitive recruiter data in remotes without confirmation.

## Handoff

Confirm (approval) before creating application/company notes or touching the Dashboard. When the prioritized postings are READY, the next step is `/cv-tailor` on the high-priority ones.
