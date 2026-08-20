---
name: arcane-add
description: "Add individual skills or entire profiles to the current Arcane installation without reinstalling."
category: "arcane"
argument-hint: "[skill-name|+profile]"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---
# /arcane-add — Add skills or profiles to current project

Add individual skills or entire profiles to the current Arcane installation without reinstalling everything.

## Arguments

`/arcane-add [skill-name|+profile] [skill2] [skill3] ...`

Examples:
- `/arcane-add` — no args: show what can be added and ask
- `/arcane-add docker-setup` — add a single skill
- `/arcane-add security-audit owasp-top10-check` — add multiple skills
- `/arcane-add +security` — add all skills from the +security profile
- `/arcane-add +database` — add all skills from the +database profile

## Sin argumentos

Mismo criterio que el picker de `arcane install`: mostrar solo lo que **no** esta instalado y dejar
elegir. No listar los 400 skills.

1. Read `.claude/arcane-manifest.json` (`profiles`, `installed_skills`)
2. List `profiles/*.yaml` from the source, skip `core.yaml` and the ones already in `profiles`
3. Print the remaining profiles grouped by their `category` field, in the order of
   `CATEGORY_ORDER` (Backend, Frontend & Design, Mobile, Gamedev, Platform & Quality,
   Project Management, Business, Personal, Utilities), each with its description
4. Say how many individual skills are available on top of that (`/arcane-list` shows them)
5. Ask which profiles or skills to add, then continue with the steps below

The CLI does the same thing interactively: `arcane add` with no args opens the wizard
(`src/wizard.ts` → `runAddWizard`).

## Steps

1. Read `.claude/arcane-manifest.json` to find the `source` path
2. If no manifest, error: "Run `arcane install` first"
3. For each argument:
   - If it starts with `+`, it's a profile name:
     - Read `profiles/<name>.yaml` from source
     - Extract skills, rules, and agents lists
     - Copy each skill, rule, and agent directory that isn't already installed
   - Otherwise it's a skill name:
     - Search `skills/` directory in source for a matching folder
     - Copy it to `.claude/skills/<skill-name>/`
4. Update `arcane-manifest.json`:
   - Increment `total_skills` count
   - Add profile name to `profiles` array if a profile was added
5. Report what was added:

```
Added 3 skills:
  [ok] docker-setup
  [ok] terraform-init
  [skip] ci-cd-setup (already installed)

Updated arcane-manifest.json
COMPLETE
```

Un skill que ya esta instalado se saltea, no se sobreescribe. Si el usuario quiere reemplazar una
copia modificada localmente, preguntar antes de escribir encima.

## Next step

- `/arcane-status` — confirmar que el manifest quedo bien
- `/arcane-list` — ver que mas hay disponible
- `/arcane-remove` — deshacer si se agrego de mas
