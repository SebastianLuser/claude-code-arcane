---
name: doc-rfc
description: "Generate RFC docs: epics, user stories, tasks in Alizia-BE format. Trigger: RFC, technical docs, epic, user story, spec, technical breakdown."
category: "documentation"
argument-hint: "[rfc-title or feature-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
---
# RFC Documentation Generator — Alizia-BE Style

Generates structured technical documentation: Epics → User Stories (US) → Tasks.

## Input

1. **What to document** (new feature, system, refactor, migration)
2. **Project name** (for `docs/rfc-{project}/`)
3. **Level of detail** — `epic` (epic only), `stories` (epic + user stories), `full` (epic + user stories + tasks)
4. **Technical context** (stack, dependencies, constraints)

## Folder structure

`US-` numbers user stories and `T-` numbers tasks.

```
docs/rfc-{project}/
├── decisions/                    # Decision logs, technical comparisons
├── epics/{NN}-{slug}/
│   ├── {NN}-{slug}.md             # Epic overview
│   └── US-{N}.{M}-{slug}/
│       ├── US-{N}.{M}-{slug}.md  # User story
│       └── tasks/T-{N}.{M}.{P}-{slug}.md
└── operations/                   # Operational guides
```

## Templates

> → Read templates/epic.md for the epic document skeleton
> → Read templates/user-story.md for the user story document skeleton
> → Read templates/task.md for the task document skeleton
> → Read templates/decision.md for the technical decision document skeleton

## Numbering

- Epics: `00`, `01`, `02` (2 digits, chronological)
- Stories: `US-{epic}.{sequential}` → `US-0.1`, `US-1.2`
- Tasks: `T-{epic}.{US}.{sequential}` → `T-0.1.1`, `T-1.2.3`

## Rules

- Write the documents in the user's language
- Verifiable acceptance criteria (yes/no, not ambiguous)
- Tasks small enough for 1 PR
- Include file paths whenever possible
- Acceptance tests in the user story, unit tests in the task
- Technical decisions with ≥2 options compared
- Relative links between documents
- If the project already has epics → number sequentially
