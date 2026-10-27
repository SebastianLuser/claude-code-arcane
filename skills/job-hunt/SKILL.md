---
name: job-hunt
description: "Entry point for the job-search skillset. Scaffolds and manages a portable career workspace (profiles, CVs, applications, companies, contacts, interviews), migrates workspaces created before the English contract, and routes to the right skill. Triggers: job hunt, job search, look for a job, organize applications, setup career workspace, migrate career workspace."
argument-hint: "[setup | status | next | migrate]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Job Hunt - Career Workspace Orchestrator

You are the entry point of the job-search suite. Your job is to detect (or create) the **career workspace**, understand which stage the user is at, and route to the right skill. You do not do everything yourself - you orchestrate.

## Language

Talk to the user in their language. The **outputs** (CV, LinkedIn, cover letters) go in the target role's language: **English** for international/global remote roles, the local language when the posting or company asks for it. Ask if it is ambiguous.

## The career workspace

The whole system lives in a portable folder (default: `career-workspace/` at the project root; configurable). Structure:

```
career-workspace/
  00-Dashboard.md          index + active applications + next steps
  01-Profiles/             master profile + per-role profiles
  02-CVs/                  base CV per profile + custom CV per application
    exports/               generated ATS PDFs
  03-Applications/         one note per application
  04-Companies/            company research
  05-Contacts/             recruiters, referrals, hiring managers
  06-Interviews/           prep and feedback per round
  07-Resources/            reusable cover letters, links
  portfolio/               source-of-truth data for the portfolio website
  Templates/               templates with frontmatter
  tools/                   cv_export.py + verify_pdf.py (installed by /cv-ats-export)
                           and job_scraper/seen_jobs.json (/job-scrape's dedup memory)
```

It is **portable and Obsidian-agnostic**: it uses `[[wikilinks]]` (they work in Obsidian if the user uses it, and read fine as plain text), YAML frontmatter, and numeric prefixes to order folders. It does not require Obsidian installed.

Application statuses (frontmatter `status`): `interested → applied → interviewing → offer`, closing as `hired | rejected | no_response | declined | discarded`. `/job-outcome` moves them; no other skill marks `applied`.

## Modes

### `setup` - Create the workspace
1. Ask where to create the workspace (default `./career-workspace/`) and the target role(s).
2. Create the full folder tree.
3. Copy the 7 templates from `references/templates/` to the workspace's `Templates/`.
4. Create `00-Dashboard.md` from `references/templates/Dashboard.md`.
5. Suggest the next step: `/master-profile` to build the master profile.

### `status` - Where am I
1. Read `00-Dashboard.md` and scan `03-Applications/`.
2. Summarize: active applications by priority, upcoming interviews, postings closing soon, gaps (applications without a CV/cover letter).
3. Recommend the highest-impact action.

### `next` - What do I do now
Based on the workspace state, recommend the next skill (see routing).

### `migrate` - Migrate an existing workspace

Workspaces created before the English data contract use Spanish folder names, fixed note names, template names and frontmatter keys and values. The skills now read only the English contract, so an old workspace looks empty until it is migrated. Signs: the numbered folders (`01-` to `08-`) have non-English names, or `/career-registry` reports "pre-English layout". The script and the full old-to-new list (`legacy_contract.es.json`) ship with `/career-registry`, which both the job-hunt and the freelance profiles install:

```bash
python .claude/skills/career-registry/scripts/migrate_workspace.py                # dry run: prints the plan, changes nothing
python .claude/skills/career-registry/scripts/migrate_workspace.py --apply        # backs up, then migrates
python .claude/skills/career-registry/scripts/migrate_workspace.py --workspace ~/career --apply
```

The workspace resolves like `/career-registry`: `--workspace`, env `CAREER_WORKSPACE`, or `./career-workspace`.

1. Run the dry run and show the user the plan: folders and fixed notes to rename (to `01-Profiles/`, `Master Profile.md`, `Templates/Application.md`...), frontmatter keys and values to rewrite per note, body lines to rewrite per note (`body`, one `line N: old -> new` each), and the `seen_jobs.json` rewrite (schema version 1 → 2).
2. Point out `unknown_values`: frontmatter values, and cells of a ledger enum column (`table column <name>`), that the script does not recognize (a custom status, a free-text work mode). It leaves them as they are; the user decides whether to fix them by hand.
3. Point out `body_links_to_old_names`: wikilinks inside note bodies that name a renamed note or folder (the old master profile name, a path in an old folder). The script does not rewrite links; fix them by hand, or with Obsidian's rename if the user prefers.
4. With the user's approval, run `--apply`. It first copies the whole workspace to `<workspace>.backup-YYYYMMDD-HHMMSS/` next to it, never deletes anything, and running it twice changes nothing. The backup holds the same personal data as the workspace: keep it out of any git remote.

In note bodies (the same notes whose frontmatter it rewrites, `00-Dashboard.md` and `Templates/` included) the script rewrites only the structure the old templates fixed, so the skills find their sections again: a whole line that is an old template heading (`## Timeline / follow-up`, a title such as `# Profile - <name>` by its prefix), an old bold label at the start of a line (`**High priority:**`, `- **Company:** <value>`, the value kept), a table header row that matches an old one cell for cell (the contract milestones, hours and change orders, the Connects ledger and purchases), and the enum cells of that table's rows (`Status`, `Billable`, `Result`, `Source`). Everything else stays as the user wrote it: prose, plain list items, `%% %%` comments, blockquotes, code fences, links. Template placeholder prose (comments, hints, plain list labels such as `- Base profile:`) therefore stays in the old language; to get the English templates whole, copy them again from `references/templates/` into `Templates/` (ask before overwriting a template the user edited).

## Routing

| Situation | Skill |
|-----------|-------|
| No workspace | `/job-hunt setup` |
| Workspace with the pre-English folders | `/job-hunt migrate` |
| Missing master profile | `/master-profile` |
| Find/score postings, search plan | `/job-search` |
| Search run with CLIs and dedup across runs | `/job-scrape` |
| Full application (note + CV + cover + review + PDF) | `/job-apply` |
| Log an application's result/progress | `/job-outcome` |
| Did I already apply here? / export the registry to CSV | `/career-registry` |
| Aggregated skill gaps + study plan | `/job-upskill` |
| Tailor a CV to a posting | `/cv-tailor` |
| Export a CV to an ATS PDF | `/cv-ats-export` |
| Write a cover letter / application message | `/cover-letter` |
| Cold message to a recruiter/hiring manager | `/cold-outreach` |
| Optimize the LinkedIn profile | `/linkedin-optimize` |
| Content or weekly plan for LinkedIn | `/personal-brand` |
| Write a LinkedIn post | `/linkedin-post` |
| Comment on other people's posts / engagement round | `/linkedin-comment` |
| Reply to comments on your own post | `/linkedin-reply` |
| Sort DMs and invitations (recruiters, spam) | `/linkedin-inbox` |
| Make a text not sound like AI (en/es) | `/content-humanizer` |
| Create/update the portfolio website | `/portfolio-site` |
| Prepare an interview | `/interview-prep` |
| Diagnose why the search stalls | `career-strategist` agent (via `/job-upskill`) |

## The profile's 4 agents

The profile installs `agents/career/`. The agents exist for one reason only: **some reads only work with fresh context**. You cannot review a CV you just wrote, or interview someone whose prepared answers you read. They are read-only: they return analysis, and the main session writes the files.

| Agent | Answers | Launched by |
|---|---|---|
| `cv-reviewer` | Does it pass the ATS and the recruiter? | `/job-apply`, `/cv-tailor`, `/cover-letter` |
| `hiring-manager` | Does it convince the person who hires? (evidence of impact, not keywords) | `/job-apply`, `/cv-tailor` (optional) |
| `mock-interviewer` | Does it hold up in the real interview? | `/interview-prep` |
| `career-strategist` | Why do I always get stopped at the same stage? | `/job-upskill` (10+ resolved applications) |

`cv-reviewer` and `hiring-manager` are launched **in parallel** when both run: they are independent lenses, and chaining them only adds latency.

If the user installed the profile without the agents directory, the `drafter-reviewer` rule documents the fallback with `general-purpose`.

## Standard workflow for a new opportunity

1. `/job-scrape` → search run with dedup (or `/job-search` for a single posting/search): note in `03-Applications/` + `04-Companies/`.
2. Identify the target contact → note in `05-Contacts/`.
3. `/job-apply` → the application's full pipeline: custom CV + cover + review (drafter-reviewer rule) + verified ATS PDF. (By hand: `/cv-tailor` → `/cv-ats-export` → `/cover-letter`.)
4. `/cold-outreach` → if there is a contact to write to directly.
5. Send the application (**always by hand**) → `/job-outcome <company>` to mark `applied`; log every step forward there.
6. When there is an interview → `/interview-prep`.
7. With rejections piling up → `/job-upskill` for a study plan based on real gaps.

## Rules

- Never reorganize folders or rename notes without asking - it silently breaks `[[wikilinks]]`. `migrate` is the exception the user asks for: dry run first, approval, backup.
- Never commit sensitive data (CV with phone/address, salaries, recruiter emails) to a remote without explicit confirmation.
- If a category needs a template that does not exist, propose it before inventing it.
- Keep the numeric prefixes when creating files inside the ordered folders.
- Maximum actionability: the user always ends up knowing which skill to run next.

## Handoff

Ask the user for approval before writing or overwriting workspace files. When the workspace is READY, the next step is `/master-profile` to build the master profile.
