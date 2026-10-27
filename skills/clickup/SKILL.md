---
name: clickup
description: "ClickUp integration: create/update/search tasks, docs, time entries and spaces via MCP tools."
category: "integrations"
argument-hint: "[task|doc|time] <action> <args>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# ClickUp Manager

Skill that uses ClickUp's native MCP for full management of tasks, docs and time.

## Available MCP Tools

- `mcp__clickup__searchSpaces` — list accessible spaces
- `mcp__clickup__searchTasks` — search with filters
- `mcp__clickup__getTaskById` — full details
- `mcp__clickup__createTask` — create
- `mcp__clickup__updateTask` — update (status, fields, assignees)
- `mcp__clickup__addComment` — comment
- `mcp__clickup__createDocumentOrPage` — create a doc
- `mcp__clickup__readDocument` — read a doc
- `mcp__clickup__updateDocumentPage` — update a doc
- `mcp__clickup__createTimeEntry`, `getTimeEntries` — time tracking
- `mcp__clickup__getListInfo`, `updateListInfo` — manage lists

## Known Spaces (Educabot)

| Space | ID |
|-------|-----|
| Project_T | 90138713959 |
| VR Game | 901313710103 |
| Scholar Duel | 901313710122 |

## Commands

### Create a task
```
/clickup create [space] "task title"
```
Ask for:
- Target list (if the space has several)
- Type (feature/bug/task)
- Assignee
- Priority
- Due date
- Description (markdown supported)

### Search tasks
```
/clickup search [query]
```
Possible filters:
- by space, list, assignee, status, priority
- by text in title/description
- by date range (created/updated/due)

Return a table:
| ID | Title | Status | Assignee | Due |

### Update a task
```
/clickup update <task_id>
```
Common changes:
- Status (Open, In Progress, Review, Done, Archived)
- Assignee (one or several)
- Priority (Urgent/High/Normal/Low)
- Due date
- Custom fields

### Comment
```
/clickup comment <task_id> "text"
```

### Docs
```
/clickup doc create [space] "title"
/clickup doc read <doc_id>
/clickup doc update <doc_id>
```

### Time tracking
```
/clickup time start <task_id>
/clickup time stop <task_id>
/clickup time report [period]
```

## Typical Flows

### Daily triage
1. List tasks assigned to me with status "Open" or "In Progress"
2. Group by priority
3. Suggest a reordering if there is misalignment

### Create a feature with full context
1. The user describes the feature
2. Detect the target space (by keywords, or ask)
3. Search for similar tasks to avoid duplicates
4. Generate a structured description:
   ```markdown
   ## Context
   [why it is needed]

   ## Description
   [what it does]

   ## Acceptance criteria
   - [ ] Criterion 1
   - [ ] Criterion 2

   ## References
   - [links to related docs, designs, tickets]
   ```
5. Ask for confirmation before creating
6. Create the task, return the URL

### Bulk update
To update multiple tasks:
1. List the targeted ones (with filters)
2. Show a preview of the change
3. Ask for confirmation
4. Execute one by one with rate limiting

## Rules

- **ALWAYS** confirm before creating/updating/deleting
- **DO NOT** create duplicates — search first
- **DO NOT** change assignees without knowing who is in the space
- **Rate limit**: max 10 consecutive operations, then pause
- Description always in structured markdown
- Write task content in the user's language
