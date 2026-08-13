---
name: arcane-list
description: "List all available Arcane profiles and skills from the source repo, marking installed ones."
argument-hint: ""
category: "arcane"
user-invocable: true
allowed-tools: Read, Bash, Glob, Grep
---
# /arcane-list — List available profiles and skills

List all profiles and skills available in the Arcane source repo, so you can see what's available to add.

## Steps

1. Read `.claude/arcane-manifest.json` to find the `source` path (Arcane repo location)
2. If no manifest, ask the user for the Arcane repo path
3. From the source repo, list:
   - **Profiles** from `profiles/*.yaml`, grouped by their `category` field (backend, frontend, mobile, gamedev, platform, management, business, personal, utilities)
   - **All skills** in `skills/` directory, grouped by category from SKILL.md frontmatter
4. Mark skills that are already installed in the current project with `[installed]`
5. Close with a one-line summary (`COMPLETE — N profiles, M skills, K installed`)

## Output format

```
=== Available Profiles ===
Backend:
  backend-ts     Backend TypeScript — Fastify, Prisma, Zod
  backend-go     Backend Go — scaffold, DB, auth, API design
  ...

Project Management:
  agile          Gestión de proyecto — sprints, standups
  jira           Jira via curl/REST API — issues, sprints, boards
  ...

=== Skills by Category ===
arcane (5):
  arcane-add [installed], arcane-clean [installed], arcane-list [installed], ...
workflow (12):
  commit [installed], create-pr [installed], changelog [installed], ...
testing (4):
  skill-test [installed], check [installed], ...
...

COMPLETE — 37 profiles, 427 skills, 52 installed
```

## Next steps

If the user wants something from the list, suggest `/arcane-add <skill>` or `/arcane-add +<profile>` to install it.
