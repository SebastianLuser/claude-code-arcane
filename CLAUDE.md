# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Claude Code Arcane

Configuration repo: skills, agents, hooks and rules for Claude Code. Installed with `npx claude-code-arcane install <profile>`.

Almost the whole repo is **content** (Markdown + Bash + Python) that is copied into the `.claude/` of the user's project. `src/` is the TypeScript installer that decides what to copy — the only code with a build and a typecheck.

## Commands

```bash
npm run build                     # tsup src/cli.ts -> dist/cli.js
npm test                          # vitest, src/__tests__/** only
npx vitest run src/__tests__/installer.test.ts        # one file
npx vitest run -t "test name"                         # one test
npx tsc --noEmit                  # typecheck (separate CI job)
npm run test:skills               # Python specs for skill scripts (tests/)
python -m compileall -q skills    # syntax gate over every shipped script
for f in hooks/*.sh skills/*/hooks/*.sh; do bash -n "$f"; done   # hook lint
for f in hooks/*.mjs skills/*/scripts/*.mjs; do node --check "$f"; done   # lint for what runs on Node
```

Try the CLI by hand **always isolated**:

```bash
ARCANE_SOURCE=bundled ARCANE_HOME=/tmp/arcane-test node dist/cli.js install backend-typescript --target /tmp/proj --dry-run
```

`ARCANE_SOURCE=bundled` uses the working tree instead of downloading content from GitHub. `ARCANE_HOME` redirects `~/.arcane`: that is where the **registry** (`installations.json`) lives, and `arcane update` without `--here` rewrites **every** installation registered on the machine. Without isolation, a test or a manual try deploys the working tree over real repos. `vitest.config.ts` already pins both for the suite — do not remove that.

## Architecture

**Content source** (`content-source.ts`, `cache.ts`): content does not necessarily come from the working tree. `resolveContentSource()` picks `bundled` (local npm package), `github` (tarball of main, cached in `~/.arcane/cache/<version>`) or `cache`, in that fallback order. `remove` and `update` use `resolveContentSourceForVersion()` to read the definitions of the **installed version**: if a profile grew since then, resolving "auto" would delete the wrong set.

**Profiles** (`profiles/*.yaml` → `profiles.ts`): declarative, all equal (no base/addon), combined with `+`, `core.yaml` always loaded first. `mergeProfiles()` dedupes skills, rules, agents and permissions. **Nothing is installed unless some profile lists it.** Renaming a profile needs a `PROFILE_RENAMES` entry and a bridge file under the old name (`renamed_to:`): `arcane update` downloads content from `main` but runs with the already installed CLI code, and a CLI older than the rename only finds the old name; without the bridge it sends that profile's skills to the trash.

**Installer** (`installer.ts`): copies `skills/ rules/ agents/ hooks/ output-styles/` into the target's `.claude/` (after a backup to `.claude.bak/`), and from `docs/` only what something installed names as `.claude/docs/<path>` (`referencedDocs()` in `content-hash.ts`; the rest stays in the repo); writes `settings.json` (permissions + hooks + statusline) and `arcane-manifest.json` with the `content_hashes` of what it installed.

**Update** (`commands/update.ts`): a three-way comparison — manifest hash vs. file on disk vs. source — that decides `update` / `skip-unchanged` / `skip-customized` (you edited it; untouched unless `--force`) / `conflict` (both diverged: backup and apply) / `add` / `remove` (goes to `.claude/.arcane-trash/`, never `rm`) / `keep-foreign`. Deleting is the only decision that needs the manifest: "not in the source" means *outdated*, not *foreign*. What the installer writes but `computeSourceHashes()` does not model — `_templates`, agents from granular entries, `statusline.sh`, output styles — is refreshed in `syncUnhashedFiles()`, not through the hashed plan. `docs/` does go through the plan, file by file; with a manifest older than that, only the documents in `RETIRED_DOCS` are deleted and the rest of `.claude/docs/` is treated as the user's.

**Worktrees** (`worktree.ts`): `hooks/` and `docs/` are shared by symlink from the main worktree; `skills/ agents/ rules/` are copied so they can diverge per branch.

**Agents** (`agent-entries.ts`): an `agents:` entry in a profile names a whole division (`game`, 32 agents) or a single agent (`game/qa-lead`). The granular form exists so wanting one agent does not drag in 32.

## Invariants that fail the tests

These are the ones that are hard to find by hand — all live in `src/__tests__/`:

- **`doc-counts.test.ts`**: adding or deleting a skill, agent, rule or hook breaks the counts written in `README.md` (headline + tree), `docs/USER-GUIDE.md`, `docs/agent-hierarchy.md`, `docs/directory-structure.md` (total **and** per division) and `docs/SKILLS-CATALOG.md` (intro, declared coverage and every `## X (N skills)` header). Fix the doc, not the test.
- **`skill-static.test.ts`**: every skill has the 5 frontmatter fields (`name` equal to its folder), `##` sections when longer than 40 lines, and an entry in `skills-selftest/catalog.yaml` with a category. A skill that judges something (audit, review, check) carries `verdict:` in the catalog with its values, and the skill must keep defining them.
- **`profiles.test.ts`**: every old name in `PROFILE_RENAMES` has its bridge file identical to the new profile. Editing a renamed profile means editing its bridge too.
- **`agents-integrity.test.ts`**: frontmatter may only declare fields Claude Code actually reads; `agent:` requires `context: fork`, that the agent exists and that it is reachable from every profile shipping that skill; each agent's `skills:` and delegations must resolve to files on disk. The `KNOWN_DEAD_REFS` allowlist **only shrinks**: a new dead reference is a failing test, not one more line.
- **`agent-specs.test.ts`**: the specs in `skills-selftest/` must match the agent's model tier and division, and coverage cannot drop.
- **`skill-specs.test.ts`**: every spec in `skills-selftest/skills/` must name a skill that exists in `skills/`. Deleting a skill means deleting its spec.
- **`language.test.ts`**: repo content is English. Files still in Spanish are listed in `SPANISH_FILES`, a list that **only shrinks**; a new file in another language fails the test. Language data packs (`*.<lang>.json`) are exempt by rule.
- **`tests/repo/test_python_floor.py`**: the Python floor is 3.9, so a skill script with `X | Y` annotations needs `from __future__ import annotations` (it compiles on 3.9 but fails on import).

## Adding content

| What | Where | Also |
|---|---|---|
| Skill | `skills/<name>/SKILL.md` | list it in the profile YAML(s), in `docs/SKILLS-CATALOG.md` and in `skills-selftest/catalog.yaml` |
| Agent | `agents/<division>/<name>.md` | `docs/agent-hierarchy.md` + `docs/directory-structure.md` |
| Rule | `rules/<name>.md` or `rules/gamedev/<name>.md` | the profile's `rules.universal` / `rules.gamedev` |
| Hook | `hooks/<name>.sh` | the profile's `hooks:` (usually `core.yaml`) |

## Stack

TypeScript (CLI installer) + Markdown (skills, agents, rules, docs) + Bash (hooks) + Python (skill scripts/helpers). QA: `skills-selftest/`. Skills: `skills/`. Profiles: `profiles/*.yaml`.

The runtime context picks the language: **TS only in `src/`** (it has a build and a typecheck), **Bash in hooks** (and build-free `.mjs` for logic that does not fit Bash), **stdlib-only Python in `skills/*/scripts/`** (copied into the user's project and run without a build). Another language only when a required dependency imposes it, justified in the SKILL.md. Details and current cases: `docs/coding-standards.md`.

## Rules

- **Everything in this repo is English**: skills, agents, rules, docs, code, comments, script output and data contracts. Claude replies in the language the user writes in, whatever language a skill is written in (`rules/user-language.md` ships that to every project). Language-specific data (detection patterns, lexicons) lives in `*.<lang>.json` packs.
- Commits in English (conventional commits).
- Run `/skill-test` before committing changes to skills.
- Collaborative cycle: Question → Options → Decision → Draft → Approval.
- Release: `semantic-release` on every push to main. The commit type sets the version — do not edit `version` in `package.json` or `CHANGELOG.md` by hand.
- Full catalog: `docs/SKILLS-CATALOG.md`.

## References

- **Educabot projects:** Project_T, Scholar Duel, VR Game, Alizia-BE, Tich, TUNI, Vigia
- **ClickUp:** Project_T (90138713959), VR Game (901313710103), Scholar Duel (901313710122)
- **Jira:** ALZ (Alizia), TICH, TUNI, VIA (Vigia)
