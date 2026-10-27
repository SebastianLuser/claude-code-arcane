---
name: sprint-report
description: "Unified sprint report combining Jira tickets/statuses with GitHub PRs, commits and branches."
category: "agile"
argument-hint: "[sprint-id or current]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Sprint Report Generator

Generates a unified report combining Jira + GitHub for the current sprint.

## Input

Optional argument: `$ARGUMENTS`
- Project name: "TUNI", "TICH", "ALZ", "VIA"
- If not specified → ask

## Process

### 1. Load credentials

```bash
source ~/.config/jira/credentials
JIRA_AUTH="$JIRA_EMAIL:$JIRA_API_TOKEN"
API="$JIRA_BASE_URL/rest/api/3"
```

### 2. Get the Jira data

```bash
# Issues in the active sprint
curl -s -X POST -u "$JIRA_AUTH" -H "Content-Type: application/json" \
  "$API/search/jql" \
  -d '{
    "jql": "project = {KEY} AND sprint in openSprints() ORDER BY status ASC",
    "fields": ["summary","status","assignee","priority","issuetype","labels","parent"],
    "maxResults": 100
  }'
```

Group by status. The Jira status names are the literal values of the Educabot workflow, which is in Spanish (see the `jira-tickets` skill); match them verbatim:
- To do (`To Do`, category new)
- In progress (`In Progress`, category in-progress)
- To deploy / QA / In review (`To Deploy`, `Quality Control`, `In Review`)
- Done (`Done`, category done)
- Blocked (`Blocked`)
- Cancelled (`Canceled`)

### 3. Get the GitHub data

```bash
# PRs merged in the last week (or sprint)
gh pr list --state merged --limit 50 --json number,title,author,mergedAt,additions,deletions

# Open PRs
gh pr list --state open --json number,title,author,createdAt,reviewDecision

# Commits on main in the last week
git log main --since="1 week ago" --pretty=format:"%h|%s|%an|%ad" --date=short
```

### 4. Cross-reference the data

- Map PRs to Jira tickets by the key in the title (e.g., "TUNI-123: ...")
- Detect tickets without an associated PR (possibly work not yet pushed)
- Detect PRs without an associated ticket (untracked work)

### 5. Generate the report

```markdown
# Sprint Report — [Project] — [Sprint Name] — [Date]

## Summary
| Metric | Value |
|---------|-------|
| Total tickets | X |
| Completed | Y (Z%) |
| In progress | N |
| Blocked | M |
| PRs merged | P |
| Lines +/- | +A / -B |

## Velocity
[Visual progress bar: ████████░░ 80%]

## By status

### Done
| Ticket | Title | Assignee | PR |
|--------|--------|----------|-----|

### In progress
| Ticket | Title | Assignee | Status | PR |
|--------|--------|----------|--------|-----|

### Blocked
| Ticket | Title | Assignee | Reason |
|--------|--------|----------|--------|

### Not started
| Ticket | Title | Assignee | Priority |
|--------|--------|----------|-----------|

## Open PRs (pending review)
| PR | Title | Author | Days open |
|----|--------|-------|-------------|

## Alerts
- Tickets without an associated PR
- PRs without an associated ticket
- Tickets in `In Progress` for more than 3 days with no activity
- Unassigned tickets

## By person
| Dev | Completed | In progress | PRs |
|-----|-------------|-------------|-----|
```

## Rules
- Use the project and sprint IDs from the jira-tickets skill
- If there is no Git repo in the current directory → show only the Jira data
- Write the report in the user's language
- Do not cache data — always query live
