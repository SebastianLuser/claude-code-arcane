# /arcane-remove — Remove skills from current project

Remove individual skills from the current Arcane installation.

## Arguments

`/arcane-remove <skill-name> [skill2] [skill3] ...`

Examples:
- `/arcane-remove docker-setup` — remove a single skill
- `/arcane-remove slack postman` — remove multiple skills

## Steps

1. Check `.claude/arcane-manifest.json` exists, error if not
2. For each skill name:
   - Check if `.claude/skills/<skill-name>/` exists
   - If yes, delete the directory
   - If no, report "[skip] <skill-name> not installed"
3. Update `arcane-manifest.json` total_skills count
4. Report what was removed:

```
Removed 2 skills:
  [ok] docker-setup
  [ok] terraform-init
  [skip] ci-cd-setup (not installed)

Updated arcane-manifest.json
```

## Safety

- NEVER remove skills from `core.profile` without explicit confirmation
- Core skills: commit, create-pr, changelog, check, code-review, context-prime, help, start, fix-issue, hotfix, brainstorm, scope-check, reverse-document, skill-improve, skill-test, tech-debt, arcane-status, arcane-list, arcane-add, arcane-remove, arcane-clean
- If the user tries to remove a core skill, warn: "This is a core skill. Are you sure?"
