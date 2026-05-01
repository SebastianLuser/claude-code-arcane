---
name: arcane-clean
description: "Remove the entire Arcane installation from the current project."
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
6. Report: "Arcane removed from project. Run `arcane install` to reinstall."

## Safety

- ALWAYS ask for confirmation before deleting
- If `.claude/` contains files NOT from Arcane (e.g., CLAUDE.md, user configs), preserve them
- Only delete directories and files that Arcane created (listed in manifest or known paths)
