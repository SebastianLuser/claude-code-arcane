---
name: arcane-status
description: "Show installed Arcane profiles, skills, rules and agents from arcane-manifest.json."
category: "arcane"
user-invocable: true
allowed-tools: Read, Bash, Glob
---
# /arcane-status — Show Arcane installation status

Show what profiles, skills, rules, and agents are installed in the current project.

## Steps

1. Read `.claude/arcane-manifest.json` in the project root
2. If it doesn't exist, report "No Arcane installation found"
3. Display:
   - **Profiles:** list of installed profiles
   - **Installed at:** timestamp
   - **Total skills:** count
   - **Total rules:** count
4. List the actual skill directories in `.claude/skills/` (skip `_templates`)
5. List agent directories in `.claude/agents/`
6. List rule files in `.claude/rules/`

## Output format

```
=== Arcane Status ===
Profiles:  backend-ts + agile + testing
Installed: 2026-05-01T12:00:00Z
Source:    /path/to/Claude-Code-Arcane

Skills (74):
  commit, create-pr, changelog, check, ...

Rules (6):
  data-files, prototype-code, test-standards, ...

Agents (4 dirs):
  quality/ (3), engineering/ (11), management/ (4), product/ (5)
```
