---
name: arcane-remove
description: "Remove skills, profiles, or agents from the current Arcane installation."
category: "arcane"
argument-hint: "<skill|+profile> [item2] ..."
user-invocable: true
allowed-tools: Read, Write, Edit, Bash
---
# /arcane-remove — Remove skills, profiles or agents

Remove items from the current Arcane installation. Supports individual skills, entire profiles (with `+` prefix), or specific agent directories.

## Arguments

`/arcane-remove <item> [item2] [item3] ...`

Items can be:
- **Skill name** — removes a single skill directory
- **+profileName** — removes the profile and all its exclusive skills, agents, and rules (keeps anything shared with other active profiles)

Examples:
- `/arcane-remove docker-setup` — remove a single skill
- `/arcane-remove slack postman` — remove multiple skills
- `/arcane-remove +agile` — remove the agile profile and its exclusive skills/agents
- `/arcane-remove +testing api-design` — remove a profile and a skill in one command

## Steps

1. Read `.claude/arcane-manifest.json` — error if not found
2. For each item:

### If item starts with `+` (profile removal):
   a. Parse the profile YAML from the source repo (`manifest.source`)
   b. Get the list of remaining active profiles (all installed minus this one)
   c. Parse each remaining profile to build sets of shared skills, agents, and rules
   d. Compute exclusive assets = this profile's assets - shared assets
   e. Delete exclusive skills from `.claude/skills/`
   f. Delete exclusive agent dirs from `.claude/agents/`
   g. Delete exclusive rules from `.claude/rules/`
   h. Remove profile name from `manifest.profiles`
   i. Update `manifest.profile_command`

### If item is a skill name:
   a. Check if it's a core skill — warn and skip if so
   b. Delete `.claude/skills/<skill-name>/` if it exists
   c. Remove from `manifest.installed_skills`

3. Update `arcane-manifest.json` with new counts
4. Report results:

```
Removed 12 items:
  [ok] +agile (profile)
  [ok] sprint-planning (skill)
  [ok] estimation (skill)
  [ok] management (agent dir)
  [ok] product (agent dir)
  [skip] commit (core skill)

Updated arcane-manifest.json
```

## Safety

- NEVER remove the `core` profile — it's always required
- Core skills (21) cannot be removed: commit, create-pr, changelog, check, code-review, context-prime, help, start, fix-issue, hotfix, brainstorm, scope-check, reverse-document, skill-improve, skill-test, tech-debt, arcane-status, arcane-list, arcane-add, arcane-remove, arcane-clean
- When removing a profile, only delete assets that are NOT shared with other active profiles
- Always verify the profile is actually installed before attempting removal
