---
name: standup-report
description: "Auto-generate daily standup report combining ClickUp/Jira activity, Git commits and Slack updates."
category: "agile"
argument-hint: "[date: today|yesterday|YYYY-MM-DD]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Daily Standup Report Generator

## Data Sources

| Source | Data |
|--------|------|
| ClickUp/Jira/Linear | Tasks with a status change in the last 24h |
| Git | Commits per author (`git log --since="1 day ago" --author`), open/merged PRs (`gh pr list`) |
| Slack (optional) | Messages in relevant channels, blockers mentioned |

## Output Format

### Per-person
Sections: **Yesterday** (tickets finished, advanced, code reviews), **Today** (suggested from In Progress tickets + priorities), **Blockers** (waiting on reviews, specs, etc.)

### Team standup
Header with stats (tickets completed, commits, PRs). Individual sections. Active blockers. Focus of the day. Upcoming milestones.

## Command

`/standup-report [--team X] [--post-to slack]`

Flow: detect team/project → pull data in parallel (git, ClickUp, Jira, GitHub PRs) → group by person → format → optionally post.

## Integrations

| Destination | Command |
|---------|---------|
| Slack | `--post-to slack:#daily-standup` (Block Kit, collapsible sections) |
| Notion/Coda | `--save-to notion:<page_id>` |
| Google Sheets | `--save-to gsheet:<sheet_id>` (historical velocity tracking) |

## Configuration

`.claude/config/standup.yml`: team name, members (name, github, jira_email, clickup_id), sources (clickup_space, jira_project, github_repo), post_to (slack channel), schedule (cron).

## Rules

- Respect timezones in distributed teams
- Do NOT include sensitive content (PII, passwords, secrets)
- Logical grouping: merge commits from the same ticket
- "Today" suggestions based on In Progress tickets + priorities
- About 5 bullets per section, ordered by impact, with the rest collapsed. A blocker is never collapsed just to respect the count
