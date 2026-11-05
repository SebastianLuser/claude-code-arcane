---
name: arcane-author
description: "Creates a new Arcane skill or profile with every registration the repo's tests require: catalogs, doc counts, links, English. Use it whenever a skill or profile is added to this repo."
category: "arcane"
argument-hint: "skill <name> [purpose] | profile <name> [purpose]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

# Arcane Author

Adds one skill or one profile to this repository the way its tests expect. A new skill touches up to seven files (the skill, its profile, two catalogs and three docs with counts), and the tests fail on any one that is missed. This skill is for contributors: it lives in `maintainers/skills/`, which npm never publishes.

## Before writing

Settle these with the user first, because each one changes several files and is costly to rename later:

| For | Ask | Why it matters |
|---|---|---|
| Both | Kind (`skill` or `profile`) and name | The name is a folder, a catalog key and a `/command` |
| Both | Purpose in one sentence | It becomes the description, the first thing Claude reads to pick it |
| Skill | Category, and which profile lists it | Decides its catalog section and who gets it installed |
| Profile | Category, and its skills, agents and workflows | Decides where `arcane list` shows it and what it installs |

If the arguments already answer all of them, restate the plan in one line and go on without asking. Check the name before writing:

- kebab-case, not taken in `skills/`, `maintainers/skills/` or `profiles/`;
- not the name of a Claude Code command (the list is in `src/__tests__/native-command-names.test.ts`): a skill with that name hides the command;
- a profile rename is not a new profile: follow `PROFILE_RENAMES` in `CLAUDE.md` instead.

If the name fails a check, say which one and ask for another name. Write nothing until the name passes: a half-registered skill fails more tests than a missing one.

Never add `model:` to a skill or profile. The model belongs to the user's session or to a role, not to the content.

## Sources

The tests are the rules; this list only says where they are. Read the ones the change touches, every time, since they change more often than this file:

| Source | What it decides |
|---|---|
| `CLAUDE.md` | "Adding content" and "Invariants that fail the tests" |
| `src/__tests__/skill-static.test.ts` | Required frontmatter, `name` equal to the folder, `##` sections past 40 lines, the catalog entry |
| `src/__tests__/agents-integrity.test.ts` | The frontmatter keys Claude Code reads (`SKILL_FIELDS`); agent and skill references in profiles |
| `src/__tests__/skill-layout.test.ts` | What a skill folder may hold; every bundled file named by another |
| `src/__tests__/skill-links.test.ts` | Relative links; a skill naming another profile's skill |
| `src/__tests__/doc-counts.test.ts` | Every count in the docs and the profiles table |
| `src/__tests__/profiles.test.ts` | Profile keys and categories |
| `src/__tests__/workflows.test.ts` | Which profile categories need `workflows: [code-flow]` |
| `src/__tests__/language.test.ts` | English everywhere except `*.<lang>.json` packs |
| `src/profiles.ts` | `CATEGORY_ORDER`, the profile categories |
| `src/hook-commands.ts` | `HOOK_IDS`, the only hook ids a profile may list |
| `skills-selftest/catalog.yaml` | Catalog entry shape; copy a sibling's |
| `docs/SKILLS-CATALOG.md` | Where a skill's row goes and the counts above it |
| `README.md` | Headline and tree counts, the "Available Profiles" table |
| `docs/USER-GUIDE.md` | Skill counts and the profile category table |

## Create a skill

1. Pick a sibling in the same category as the model to follow (search `skills-selftest/catalog.yaml` for the category).
2. Write `skills/<name>/SKILL.md`. Frontmatter keys in this order: `name`, `description`, `category`, `argument-hint`, `user-invocable: true`, `allowed-tools`. Keep the description under 200 characters, saying what it does and when to use it. The frontmatter `category` takes a value its siblings use; the catalog entry has its own `category` list, so the two can differ. Past 40 lines, use at least two `##` sections, and end with the next step (another skill or follow-up). Anything long goes to `references/`, named from SKILL.md, so the skill stays under 200 lines.
3. List it under `skills:` in each profile that ships it. If it mentions another `/skill`, that skill has to ship in the same profile or in core, or `skill-links` fails.
4. Add its entry to `skills-selftest/catalog.yaml` under the matching `# Stack:` banner, with `spec: null`. Add `verdict:` only if the skill judges something; every value must then appear in the skill as written.
5. Add a row to its section of `docs/SKILLS-CATALOG.md` in the form `` | `/name` | Description | `args` | ``, then raise the section header count and the intro counts.
6. Raise the skill counts in `README.md` (headline and tree) and in `docs/USER-GUIDE.md` (both places).

## Create a profile

1. Write `profiles/<name>.yaml` with `name` equal to the filename, a `description` without `|`, a `category` from `CATEGORY_ORDER`, and only the keys the profile uses: `skills`, `rules`, `agents`, `hooks`, `workflows`. A backend, frontend, mobile, gamedev or platform profile takes `workflows: [code-flow]` unless `workflows.test.ts` lists it as non-code.
2. Every skill, agent and hook it lists must exist: skills in `skills/`, agents as a division or `division/agent` under `agents/`, hooks in `HOOK_IDS`. An agent also brings what it needs: open each agent's file, and the skills in its `skills:` and the agents its body names must be installed by this profile or by core, or `agents-integrity` fails. Add them to the profile and say which you added and why; if the user ruled one out, propose another agent instead.
3. Add its row to the "Available Profiles" table in `README.md`, with the number of its own `skills:` entries.
4. If it uses a category that `docs/USER-GUIDE.md` does not list yet, add it to the category table there.

## Verify

Run the tests that cover what changed, and fix the content, never the test:

```bash
npx vitest run src/__tests__/skill-static.test.ts src/__tests__/doc-counts.test.ts src/__tests__/skill-links.test.ts src/__tests__/skill-layout.test.ts src/__tests__/agents-integrity.test.ts src/__tests__/profiles.test.ts src/__tests__/workflows.test.ts src/__tests__/language.test.ts src/__tests__/native-command-names.test.ts
```

For a new skill, also run `/skill-test static <name>`. On Windows, `agent-entries-real.test.ts` fails on CRLF line endings whatever you change; that one is not yours.

## Report and next step

List the files created and changed, the test command with its real result, and anything not verified. Then suggest `/skill-test spec <name>` once the skill has a spec, and `/commit` when the user wants to keep it.
