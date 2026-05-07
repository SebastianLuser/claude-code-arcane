# Frontmatter Specification -- Arcane Skills

This is the authoritative frontmatter format for all skills in the Claude Code Arcane repo.

## Required Format

Every `SKILL.md` must begin with a YAML frontmatter block:

```yaml
---
name: skill-name
description: "Brief 1-2 sentence description of what the skill does."
category: "domain-name"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
```

## Field Definitions

### `name` (required, string)

- Must be kebab-case (lowercase, hyphens): `api-design`, `scaffold-go`, `mcp-server-builder`
- Must match the directory name containing the SKILL.md
- No quotes needed unless it contains special YAML characters

### `description` (required, string)

- 1-2 sentences explaining what the skill does and when to use it
- Under 200 characters preferred, 300 max
- Must be quoted (double quotes)
- Should NOT just repeat the skill name ("MCP Server Builder" is bad)
- Good: `"Design and ship production-ready MCP servers from OpenAPI contracts."`

### `category` (required, string)

- Matches the domain folder the skill lives in
- Inferred from parent: `skills-backend/` -> `"backend"`, `skills-ai/` -> `"ai"`
- Standard categories: `arcane`, `backend`, `frontend`, `ai`, `devops`, `security`, `testing`, `gamedev`, `agile`, `business`, `marketing-content`, `marketing-growth`, `marketing-seo`, `marketing-strategy`, `finance`, `regulatory`, `git`, `clevel-advisors`, `clevel-operations`

### `user-invocable` (required, boolean)

- `true` -- skill can be called directly by the user via `/skill-name`
- `false` -- skill is a sub-skill, invoked only by a parent skill
- Sub-skills live inside another skill's directory (e.g., `self-improving-agent/skills/review/SKILL.md`)

### `allowed-tools` (required, comma-separated string)

- Lists the Claude Code tools this skill is permitted to use
- Read-only skills: `Read, Glob, Grep, Bash`
- Authoring skills: `Read, Write, Edit, Bash, Glob, Grep`
- Orchestration skills: `Read, Write, Edit, Bash, Glob, Grep, Task`
- Valid tool names: `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `Task`, `WebFetch`, `WebSearch`, `NotebookEdit`

### `argument-hint` (optional, string)

- Shows usage pattern when user invokes help
- Examples: `"<skill-name|+profile>"`, `"[rest|graphql] [resource-name]"`, `"scan <dir> | fix <path>"`

## Alirezarezvani Format (needs conversion)

Skills imported from `alirezarezvani/claude-skills` use a different frontmatter:

```yaml
---
name: "skill-name"
description: Long description...
license: MIT
metadata:
  version: 1.0.0
  author: Alireza Rezvani
  category: business-growth
  domain: customer-success
  updated: 2026-02-06
  python-tools: tool1.py, tool2.py
  tech-stack: keyword1, keyword2
---
```

### Conversion Rules

1. **Keep**: `name`, `description` (trim to 200 chars if needed)
2. **Drop entirely**: `license`, `metadata` (and all nested: `version`, `author`, `updated`, `python-tools`, `tech-stack`, `domain`)
3. **Add**: `category` -- infer from the `skills-*` parent folder, NOT from `metadata.category`
4. **Add**: `user-invocable: true`
5. **Add**: `allowed-tools` -- default `Read, Glob, Grep, Bash`; add `Write, Edit` if the skill body contains generation/authoring instructions

### Partially Converted Format

Some skills were partially converted (have `name` and `description` but missing our required fields). These need the missing fields added:

```yaml
---
name: "mcp-server-builder"
description: "MCP Server Builder"      # <- too short, needs expansion
---
```

Fix: add `category`, `user-invocable`, `allowed-tools`, and expand `description`.

## Validation Checklist

When auditing frontmatter, check in order:

1. Does the file start with `---` on line 1?
2. Is there a closing `---` before the first `#` heading?
3. Is `name` present and kebab-case?
4. Does `name` match directory name?
5. Is `description` present and substantive (not just the name)?
6. Is `category` present?
7. Is `user-invocable` present and boolean?
8. Is `allowed-tools` present with valid tool names?
9. Are there any alirezarezvani-only fields that should be removed?
