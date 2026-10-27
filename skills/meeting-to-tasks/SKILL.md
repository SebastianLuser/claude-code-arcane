---
name: meeting-to-tasks
description: "Convert meeting notes or transcripts into structured tasks with owners and due dates in ClickUp/Jira."
category: "agile"
argument-hint: "[path to notes file, or paste inline]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task, AskUserQuestion
---
# Meeting Notes → Tasks

Turns notes/transcripts into structured action items, creating tickets in ClickUp or Jira.

## Accepted input

Manual notes (markdown/plain text), transcripts (Otter/Fireflies/Zoom), email/Slack threads.

## Flow

### 1. Parse & Extract

Patterns: "X to/will/needs to Y", "[Action]", "- [ ]", action verbs + dates. For each item: **owner** (match against the team), **action** (verb+object), **due date** (parse "by Friday", "next sprint", "EOW"), **context** (1 sentence), **priority** (urgent/blocker/ASAP keywords).

### 2. Structure

Split into: **Decisions** (recorded facts) + **Action Items** grouped by owner (checkbox, due date, context, priority).

### 3. Confirm

Show the list to the user: are the owners right? Dates OK? Anything to add/remove? Target tool? (ClickUp / Jira / both).

### 4. Create tickets

**ClickUp:** `createTask` with list_id, name, description, assignees, due_date, priority, tags `[from-meeting, date]`.

**Jira:** POST `/issue` with project, summary, description (ADF), assignee, duedate, priority, labels `[meeting-action, date]`.

### 5. Close the loop

Post a Slack/Email summary with links to the tickets. Optional: save to Notion/Coda. Update status.

## Command

`/meeting-to-tasks [--file notes.md | --paste | --transcription file.txt] [--target clickup|jira] [--list-id X]`

## Heuristic parsing

- `<Name> will/to/needs to <verb>` → owner + action
- `- [ ] <task>` → action without an owner (ask)
- `@<username>` → owner by handle
- `ASAP|urgent|blocker` → priority Urgent
- `by Friday|EOD|tomorrow|next week` → parse relative date

## Team mapping

Config in `.claude/config/team.yml`: members with name, email, slack, clickup_id, jira_account_id. If a name does not match → ask.

## Rules

- Never create tickets without confirmation — always show the list first
- Ambiguous dates ("soon", "later") → ask for clarification or leave without a due date
- No owner → ask, do not assign arbitrarily
- Deduplicate: if similar to an existing open ticket → flag it
- Privacy: do not include sensitive meeting info in public descriptions
