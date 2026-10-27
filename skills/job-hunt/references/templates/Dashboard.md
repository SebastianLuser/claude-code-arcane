---
type: dashboard
---

# Dashboard - Job search

> Workspace index. Once there is data (applications, interviews), these sections can become dynamic queries with Bases/Dataview if you use Obsidian.

## Active applications
**High priority:**
- 

**Medium priority:**
- 

**Closed / discarded:**
- 

## Status legend
⬜ interested · ✅ applied · 📅 interviewing/offer · ❌ rejected/no_response/declined · 🚫 discarded/closed

## Upcoming interviews
- 

## To follow up this week
- 

## Profiles
- 

## Quick access by folder
- `01-Profiles/` - base professional profiles + master profile
- `02-CVs/` - CV versions (including custom CVs per application)
- `03-Applications/` - one note per application
- `04-Companies/` - company research
- `05-Contacts/` - recruiters, referrals, hiring managers
- `06-Interviews/` - prep and feedback per round
- `07-Resources/` - reusable cover letters, useful links
- `portfolio/` - source of truth for the portfolio website
- `Templates/` - templates with frontmatter
- `tools/` - cv_export.py, verify_pdf.py and job_scraper/seen_jobs.json

## Standard workflow for a new opportunity
1. `/job-scrape` - search run with dedup (or `/job-search` for a single posting) → note in `03-Applications/` + `04-Companies/`.
2. Identify the target contact → note in `05-Contacts/`.
3. `/job-apply` - full pipeline: custom CV + cover + review + verified ATS PDF.
4. Send (always by hand) → `/job-outcome <company>` to mark `applied` and log progress.
5. `/interview-prep` - when there is an interview.
6. `/job-upskill` - once rejections pile up, a study plan based on real gaps.
