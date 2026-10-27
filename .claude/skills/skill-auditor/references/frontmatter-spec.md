# Frontmatter Specification -- Arcane Skills

Frontmatter format for every skill in the Claude Code Arcane repo.

**Source of truth:** the list of fields Claude Code actually reads lives at
`code.claude.com/docs/en/skills`. This document mirrors it and adds the repo's
only local convention (`category`). Do not invent fields: the runtime ignores any
field missing from the table below, and that silence is where drift hides.

## Required format

```yaml
---
name: skill-name
description: "What the skill does and when to use it, 1-2 sentences."
category: "domain-name"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
```

## Official Claude Code fields

All are optional for the runtime; the "Arcane" column marks what this repo
requires by its own convention.

| Field | Arcane | What it does |
|-------|--------|----------|
| `name` | **required** | Label shown in listings. In personal or project skills the command comes from the directory name, not from this field. |
| `description` | **required** | What it does and when to use it. Claude uses this to decide whether to apply the skill. `description` + `when_to_use` are truncated together at 1,536 characters. |
| `when_to_use` | optional | Extra invocation context: trigger phrases, example requests. Appended to `description` and counts toward the 1,536 cap. |
| `argument-hint` | optional | Autocomplete hint. E.g. `[issue-number]`, `[filename] [format]`. |
| `arguments` | optional | Structured argument declaration. |
| `user-invocable` | **required** | `false` when only Claude should invoke it: hides it from the `/` menu. Default `true`. |
| `disable-model-invocation` | optional | `true` stops Claude from loading it on its own. Also stops it from being preloaded into subagents. |
| `allowed-tools` | **required** | Tools Claude may use without asking for permission during the turn that invokes the skill. The permission clears with the next message. |
| `disallowed-tools` | optional | Tool denylist. |
| `model` | optional | Model for the turn in which the skill is active. With `context: fork`, sets the subagent's model. |
| `effort` | optional | Reasoning effort level. |
| `context` | optional | **Only valid value: `fork`.** Runs the skill in a forked subagent. |
| `agent` | optional | Which subagent type to use. **Only takes effect when `context: fork` is set.** |
| `background` | optional | Runs in the background. |
| `hooks` | optional | Hooks scoped to this skill. |
| `paths` | optional | Associated paths. |
| `shell` | optional | Shell for the body's `` !`command` ``: `bash` (default) or `powershell`. |
| `metadata` | optional | Free-form YAML map for your own data. **Claude Code does not act on its contents** — it is the right place for fields only our tooling reads. The value is discarded if it is not a map. |
| `license` | optional | License. |
| `compatibility` | optional | Declared compatibility. |

### `category` — local convention, not an official field

`category` does not exist in the Claude Code docs: the runtime ignores it. Arcane
requires it anyway because `src/skills-catalog.ts` and the profiles use it for
grouping. It is harmless. If `src/` ever stops using it, move it under
`metadata:` instead of leaving it loose.

Standard categories: `arcane`, `backend`, `frontend`, `ai`, `devops`,
`security`, `testing`, `gamedev`, `agile`, `business`, `marketing-content`,
`marketing-growth`, `marketing-seo`, `marketing-strategy`, `finance`,
`regulatory`, `git`, `clevel-advisors`, `clevel-operations`, `observability`,
`database`, `workflow`, `visualnovel`, `audio`.

## Per-field rules

### `name`
- kebab-case, and it must match the directory that contains the SKILL.md.

### `description`
- 1-2 sentences. Under 200 characters preferred, 300 max.
- In double quotes.
- Do not just repeat the skill name.
- Put the main use case first: it is truncated at 1,536 characters.

### `allowed-tools`
- Read-only: `Read, Glob, Grep, Bash`
- Authoring: `Read, Write, Edit, Bash, Glob, Grep`
- Orchestration: `Read, Write, Edit, Bash, Glob, Grep, Task`
- Valid names: `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `Task`,
  `WebFetch`, `WebSearch`, `NotebookEdit`

### `agent` + `context`
They always go together. `agent:` without `context: fork` **does nothing**:

```yaml
# WRONG - the declared agent never comes into play
agent: qa-director

# RIGHT
context: fork
agent: qa-director
```

And the named agent must exist in `agents/` **and** its division must be in the
`agents:` list of every profile that ships the skill. Otherwise the fork falls
back to a generic agent with no specialized system prompt.

## Dynamic context injection

There is no frontmatter field for this. The mechanism is `` !`command` `` **in the
body**, and its output replaces the placeholder before Claude sees the skill:

```markdown
## Current state

- Branch: !`git branch --show-current`
- Sprints: !`ls production/sprints/ 2>/dev/null || echo "no sprints"`
```

The `!` is recognized only at the start of a line or after whitespace, and the
command goes between backticks. `!echo foo` without backticks is literal text.

## Format to convert (legacy)

If the frontmatter has `version`, `author`, `updated`, `python-tools` or
`tech-stack`, it is an imported format and must be converted: those fields exist
neither in the official docs nor in Arcane.

**`license` and `metadata` are NOT part of this group** — both are official
Claude Code fields and must be left alone.
