# /arcane-add — Add skills or profiles to current project

Add individual skills or entire profiles to the current Arcane installation without reinstalling everything.

## Arguments

`/arcane-add <skill-name|profile-name> [skill2] [skill3] ...`

Examples:
- `/arcane-add docker-setup` — add a single skill
- `/arcane-add security-audit owasp-top10-check` — add multiple skills
- `/arcane-add +security` — add all skills from the +security profile
- `/arcane-add +database` — add all skills from the +database profile

## Steps

1. Read `.claude/arcane-manifest.json` to find the `source` path
2. If no manifest, error: "Run `arcane install` first"
3. For each argument:
   - If it starts with `+`, it's a profile name:
     - Read `profiles/<name>.profile` from source
     - Extract SKILLS, RULES, and AGENTS arrays
     - Copy each skill, rule, and agent directory that isn't already installed
   - Otherwise it's a skill name:
     - Search all `skills-*` directories in source for a matching folder
     - Copy it to `.claude/skills/<skill-name>/`
4. Update `arcane-manifest.json`:
   - Increment `total_skills` count
   - Add profile name to `profiles` array if a profile was added
5. Report what was added:

```
Added 3 skills:
  [ok] docker-setup (from skills-devops)
  [ok] terraform-init (from skills-devops)
  [skip] ci-cd-setup (already installed)

Updated arcane-manifest.json
```
