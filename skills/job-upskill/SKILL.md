---
name: job-upskill
description: "Aggregate skill gaps across all scored job applications, weigh them by lost match points, and build a prioritized study plan with real resources. Triggers: analyze my gaps, study plan, what do I need to learn, upskill, which skills to invest in, gaps from my applications, skills heatmap."
argument-hint: "[url | application note]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Bash, WebFetch, WebSearch, Task
---

# /job-upskill - Gap analysis and study plan

Detects which skills are costing you match points on real postings and builds a prioritized study plan. Adapted from the /upskill in MadsLorentzen/ai-job-search: instead of a CSV, the evidence comes from the frontmatter and the sections of the notes in the career workspace's `03-Applications/` (paths relative to the workspace: `--workspace`, env `CAREER_WORKSPACE`, or `./career-workspace/`).

Argument: `$ARGUMENTS` (empty = aggregate mode; URL or note = targeted mode)

## Before the plan: is the gap real or a presentation gap?

This skill assumes the answer is to study. Sometimes it is not: if the experience is in the master profile but does not reach the CV, the study plan sends the user to spend months learning what they already know.

In **aggregate mode with 10+ resolved applications**, first launch the `career-strategist` agent (fresh context, read-only). It diagnoses the full funnel and separates real gaps from presentation gaps. If the leak point is not the technical stage, say so before the heatmap: the study plan is not the lever and it is better to go to `/cv-tailor` or `/interview-prep`.

With fewer than 10 resolved, skip it: there is not enough volume for a funnel and the agent itself will reject it. Go straight to aggregate mode.

## Aggregate mode (no argument)

1. **Collect evidence.** Grep `match_score:` in `03-Applications/*.md` (exclude `_index`; also accept the legacy `score:` field from old notes). From each note read: `match_score`, `status`, `profile`, and the gaps mentioned in the "Match with my profile" / "Real gaps" sections and the gaps acknowledged in `## Notes`.

2. **Canonicalize.** Unify synonyms before aggregating ("AWS" = "Amazon Web Services"; "K8s" = "Kubernetes"; "GCP" = "Google Cloud"). One canonical term per gap.

3. **Weigh.** `weight(gap) = Σ (100 - match_score)/100` over the notes that mention it (frequency is implicit in the sum). x1.5 boost for each note with `status: rejected` that mentions it (a real market signal). Postings with a low score expose more gaps and weigh more.

4. **Classify** each gap: `[tooling]` (frameworks, infra, CI/CD), `[domain]` (industry, architecture), `[soft]` (communication, leadership, languages), `[credential]` (degrees, certifications).

5. **Heatmap.** Sort by weight and cut into Critical / High / Medium / Low by quartiles (document the thresholds used in the report). Show the heatmap in the chat before continuing.

6. **Study plan** only for Critical and High (add Medium if there are fewer than 5 gaps):
   - WebSearch per gap **including the current year** in the query (e.g. "best NestJS course 2026").
   - 2-3 real resources per gap, prioritizing free/official/hands-on. **Never invent resources: only cite what was found in real results.**
   - Estimated hours to useful proficiency (realistic ranges, e.g. "~20h") considering the profile's existing foundation (do not start from zero if the fundamentals are already there).
   - Sequence by ROI (weight/hours) and dependencies (prerequisites first, quick wins early).

7. **Report** in `07-Resources/Upskill - YYYY-MM-DD.md`, after the user's approval on the heatmap:
   - Frontmatter: `type: upskill`, `date`, `applications_analyzed` (number), `profiles` (list).
   - Heatmap with weight and classification per gap.
   - Evidence: for each Critical/High gap, wikilinks to the application notes that mention it.
   - Sequenced study plan with resources, hours and dependencies.
   - If a previous report exists in `07-Resources/`, a "Since the last report" section: closed gaps vs new ones.

8. **It does not edit** application notes, profiles or the dashboard. It only creates the report.

## Targeted mode (`/job-upskill <url|note>`)

1. Get the JD: existing note → read its "Match with my profile"; URL → `detail` from the matching script (`.claude/skills/job-scrape/scripts/getonbrd_search.py` or `linkedin_search.py`; if job-scrape is not installed, WebFetch).
2. Compare against the matching profile in `01-Profiles/`: gaps from that posting only, classified.
3. Mini-plan: 1-2 resources per gap (WebSearch, current year), estimated hours.
4. **Answer in the chat.** Save as `07-Resources/Upskill - YYYY-MM-DD - <Company>.md` only if the user asks (do not fill Resources with single-posting reports).

## Rules

- Never fabricate resources or statistics; everything comes from real WebSearch or from the notes.
- Report in the user's language, without em dashes, with wikilinks to the source notes.
- `[credential]` gaps (e.g. a university degree) are reported but do not enter the study plan unless explicitly requested (they are decisions of another scale, not weekly study items).

## Handoff

Report COMPLETE in `07-Resources/`. Resume the pipeline with `/job-apply` on the open postings, or `/job-scrape` for a new run targeting the gaps that are already closing. If `career-strategist` placed the leak outside the technical stage, the next step is that one (`/cv-tailor`, `/interview-prep` or `/job-search`), not the study plan.
