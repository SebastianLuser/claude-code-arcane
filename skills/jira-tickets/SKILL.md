---
name: jira-tickets
description: |
  ALWAYS READ BEFORE managing Jira. Projects: Alizia (ALZ), Tich (TICH), TUNI, Vigía (VIA). Works via curl + REST API v3 (NOT MCP). Cached IDs for projects, statuses, transitions, issue types and users.
category: "integrations"
argument-hint: "[create|search|update|transition] <args>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Jira Tickets CLI — Educabot

Via **curl + REST API v3** on `aula-educabot.atlassian.net`. Auth: `source ~/.config/jira/credentials` → `JIRA_AUTH="$JIRA_EMAIL:$JIRA_API_TOKEN"`. Links: `https://aula-educabot.atlassian.net/browse/{KEY}`.

## Current user

Juan Mateos Galante — `712020:98d3a4a5-6a5a-4aeb-9562-99b23026769c`

> → Read references/team-data.md for users (account_ids), projects (IDs), issue types, and custom fields

> → Read references/states-epics-sprints.md for transition IDs, TUNI epics, and sprint IDs

## API Operations

| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| Create | POST | `/issue` | fields in JSON |
| Search (JQL) | POST | `/search/jql` | **NOT** `/search` (removed) |
| Get | GET | `/issue/{KEY}?fields=...` | |
| Edit | PUT | `/issue/{KEY}` | 204=success |
| Transition | POST | `/issue/{KEY}/transitions` | `{"transition":{"id":"21"}}` |
| Comment | POST | `/issue/{KEY}/comment` | ADF body |
| Sprints | GET | `$AGILE_API/board/33/sprint?state=active,future` | |
| Move to sprint | POST | `$AGILE_API/sprint/{ID}/issue` | `{"issues":["KEY"]}` |
| Bulk create | POST | `/issue/bulk` | Array issueUpdates |

**API v3 description:** MUST be ADF (`{"type":"doc","version":1,"content":[...]}`). Nodes: paragraph, bulletList, heading (attrs.level), codeBlock, text with marks (strong, link).

## Workflows

1. **Create:** detect the project → resolve the assignee → ADF fields → POST → report the link
2. **Search:** JQL → POST `/search/jql` → parse → Key/Summary/Status/Assignee table
3. **Report:** open-sprint JQL → group by status → % progress
4. **Update:** transition/PUT/comment → confirm
5. **Bulk:** parse the list → confirm → `/issue/bulk` or loop → report
6. **Context:** full GET → present summary/description/status/comments

## Troubleshooting

- **Check:** `curl -s -u "$JIRA_AUTH" "$API/myself" | jq '.displayName'`
- **401:** Expired token → regenerate at id.atlassian.com
- **400 ADF:** Check the doc/version/content structure
- **Errors:** `| jq '.errors, .errorMessages'`
