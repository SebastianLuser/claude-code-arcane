---
name: gh-projects
description: "Manage GitHub Projects v2 via gh CLI + GraphQL: boards, items, fields, views, automations."
category: "integrations"
argument-hint: "[list|create|add|update] [project/item]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# GitHub Projects Manager

Interacts with GitHub Projects v2 (GitHub's new project management system, not the classic ones).

## Setup

Requires an authenticated `gh CLI`:
```bash
gh auth status
gh auth refresh -s project  # scope for projects
```

## gh CLI commands

### List projects
```bash
gh project list --owner <user-or-org>
gh project list --owner myorg --format json
```

### View a project
```bash
gh project view <number> --owner <owner>
gh project item-list <number> --owner <owner>
```

### Add an item (existing issue or PR)
```bash
gh project item-add <number> --owner <owner> --url https://github.com/org/repo/issues/123
```

### Create a draft item (no issue)
```bash
gh project item-create <number> --owner <owner> --title "Draft idea"
```

### Edit fields
```bash
gh project item-edit --id <item_id> --project-id <project_id> \
  --field-id <field_id> --single-select-option-id <option_id>
```

## GraphQL for Complex Operations

For operations the `gh project` CLI does not support (complex filters, bulk updates, iterations, draft items), use GraphQL via `gh api graphql`.

> Full queries with variables (GetProject, GetProjectItems, UpdateStatus, AddItem, CreateDraft, DeleteItem) and how to get IDs: read `references/graphql-queries.md`.

## Use Cases

### Roadmap board
Typical structure:
- Fields: Status (Todo/In Progress/Done), Priority, Quarter, Epic
- Views: By Quarter, By Epic, By Status

### Bug triage board
- Fields: Severity, Reproducible, Owner, First Seen
- Views: By Severity, Needs Triage

### Sprint board
- Fields: Sprint, Story Points, Assignee, Status
- Views: Current Sprint, Next Sprint

## Commands

### Create an epic with tasks
```
/gh-projects epic <project> "epic title"
```

1. Create a draft item "Epic: X" in the project
2. Create child issues in the linked repo
3. Link each issue to the epic via a task list
4. Add each issue to the project with Status=Todo

### Sync issues → project
```
/gh-projects sync <repo> <project>
```
- List open issues in the repo
- Add the missing ones to the project
- Set Status=Todo by default

### Board snapshot
```
/gh-projects snapshot <project>
```
Current board report in markdown.

## Rules

- **Projects v2 ≠ Projects classic.** This skill does NOT support classic (deprecated).
- **Global IDs**: Projects v2 uses opaque node IDs (`PVT_...`), not plain numbers.
- **Rate limit**: the GitHub API allows 5000 req/h — generous but not infinite.
- **Webhooks available** for real-time automation (out of scope for this skill).
