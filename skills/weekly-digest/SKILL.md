---
name: weekly-digest
description: "Generate a weekly stakeholder digest combining ClickUp/Jira, Git/GitHub, deploys and Slack activity."
category: "agile"
argument-hint: "[week: current|last|YYYY-WW]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Weekly Digest Generator

Weekly executive report combining activity from multiple tools.

## Sections

1. **Executive summary** — 3-5 high-level sentences
2. **Shipped this week** — features/fixes in prod (merged PRs "production", completed tickets "shipped", release tags)
3. **In progress** — In Progress tickets, open PRs, progress vs sprint goal
4. **Blockers & risks** — tickets blocked >3d, PRs without review >2d, failed deploys, incidents
5. **Metrics** — velocity (pts), PRs merged, bugs closed/opened, DAU/key product metrics (week-over-week comparison)
6. **Upcoming** — next 7d: milestones, releases, events
7. **Team updates** — new members, absences, shout-outs

## Data Sources (in parallel)

- **ClickUp:** searchTasks updated last 7 days
- **Jira:** JQL `updated >= -7d`
- **Git/GitHub:** `git log --since="1 week ago"`, `gh pr list --state merged`, `gh pr list --state open`, `gh issue list`, `gh release list`
- **Deploys:** GitHub Actions runs last week (success/failed/duration)
- **Analytics (optional):** DAU/WAU, signups, conversions

## Distribution

| Channel | Method |
|-------|--------|
| Slack | `--post-to slack:#channel` (Block Kit, collapsible sections) |
| Email | `--post-to email:addr` (HTML with a metrics table) |
| Notion/Coda | `--post-to notion:<db_id>` (new page in the reports db) |
| Sheet | `--save-to gsheet:<id>` (append a metrics row, longitudinal tracking) |

## Config

`.claude/config/weekly-digest.yml`: default_day, default_hour, projects (name, jira_project/clickup_space, github_repo, slack channel), metrics_source (posthog/mixpanel/ga4), recipients.

## Rules

- Executive = terse, max 1 printed page
- Color coding (🟢🟡🔴) for scannability
- Links everywhere — no long text
- Week-over-week comparisons for context
- Factual tone, no marketing
- Consistent timezone
