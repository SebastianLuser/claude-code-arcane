---
name: arcane-clean
description: "Remove the entire Arcane installation from the current project."
argument-hint: ""
category: "arcane"
user-invocable: true
allowed-tools: Read, Bash
---
# /arcane-clean — Remove Arcane installation from project

Remove the entire Arcane installation from the current project. This deletes all skills, rules, agents, hooks, and config installed by Arcane.

## Steps

1. Check `.claude/arcane-manifest.json` exists
2. If not, report "No Arcane installation found" and stop
3. Read the manifest and show what will be removed:

```
This will remove:
  - X skills in .claude/skills/
  - Y rules in .claude/rules/
  - Z agent dirs in .claude/agents/
  - hooks/ directory
  - settings.json
  - arcane-manifest.json
```

4. **Ask for confirmation**: "Are you sure? This cannot be undone. (yes/no)"
5. If confirmed:
   - Delete `.claude/skills/` directory
   - Delete `.claude/rules/` directory
   - Delete `.claude/agents/` directory
   - Delete `.claude/hooks/` directory
   - Delete `.claude/settings.json`
   - Delete `.claude/docs/` directory
   - Delete `.claude/statusline.sh`
   - Delete `.claude/arcane-manifest.json`
6. Report what went, what stayed, and how to come back:

```
Removed Arcane from project:
  [ok] 94 skills
  [ok] 8 rules
  [ok] 4 agent dirs
  [ok] hooks/, settings.json, arcane-manifest.json

Preserved (not installed by Arcane):
  CLAUDE.md, settings.local.json

Run `npx claude-code-arcane install <profile>` to reinstall.
COMPLETE
```

## Safety

- ALWAYS ask for confirmation before deleting
- If `.claude/` contains files NOT from Arcane (e.g., CLAUDE.md, user configs), preserve them
- Only delete directories and files that Arcane created (listed in manifest or known paths)

## Next step

This removes **everything**. If the goal was narrower, one of these is the right tool instead:

- `/arcane-remove +profile` — drop one profile and only the assets exclusive to it
- `/arcane-remove <skill>` — drop individual skills
- `/arcane-status` — check what is installed before deciding
- `npx claude-code-arcane install <profile>` — reinstall with a different combination
