# Claude Code Arcane — User Guide

## What is Arcane?

Arcane is a configuration harness for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). It provides a curated library of **skills**, **rules**, **agents**, and **hooks** that you selectively deploy into any project. Instead of shipping 160+ skills to every project (wasting tokens and degrading performance), you pick a **profile** that matches your stack and only the relevant tools get installed.

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands Reference](#commands-reference)
- [Profiles](#profiles)
  - [Base Profiles](#base-profiles)
  - [Add-on Profiles](#add-on-profiles)
  - [Core (always included)](#core-always-included)
- [Profile Composition](#profile-composition)
- [Recipes by Project Type](#recipes-by-project-type)
- [Changing Profiles](#changing-profiles)
- [Cleaning Up](#cleaning-up)
- [What Gets Installed](#what-gets-installed)
- [Manifest & Tracking](#manifest--tracking)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Requirements

- **Python 3.9+** (for the CLI)
- **Claude Code** CLI installed ([installation guide](https://docs.anthropic.com/en/docs/claude-code))
- The target project directory must already exist

## Installation

Clone the Arcane repository and install the CLI:

```bash
git clone https://github.com/SebastianLuser/claude-code-arcane.git
cd claude-code-arcane
pip install -e .
```

This installs the `arcane` command globally. You can now run it from any project directory.

> **Note:** If `arcane` is not found after install, you can always use `python -m arcane` instead.

### Legacy: setup.sh

The Bash script `setup.sh` is still available as an alternative:

```bash
./setup.sh --profile unity-dev --target ~/projects/my-game
```

## Quick Start

```bash
# 1. Navigate to your project
cd ~/projects/my-game

# 2. Interactive mode — pick profiles from a menu
arcane install

# 3. Or specify profiles directly
arcane install unity-dev

# 4. Open Claude Code
claude
```

That's it. No need to know where Arcane lives, no `--target` flags — it installs into the current directory.

---

## Commands Reference

### `arcane install` — Install profiles

```bash
# Interactive mode — shows a menu to pick profiles
arcane install

# Direct mode — specify profiles with +
arcane install unity-dev
arcane install unity-dev+agile+clickup

# Install to a specific directory (default: current dir)
arcane install unity-dev -t ~/projects/my-game

# Preview without installing
arcane install unity-dev --dry-run
```

This is a **destructive replace** — if `.claude/` already exists, it gets backed up to `.claude.bak/` and replaced entirely.

**Why destructive?** More skills = more tokens consumed per session = worse Claude performance. Replacing ensures you only have what you need.

### `arcane list` — List available profiles

```bash
arcane list
```

Shows all base profiles and add-ons with their descriptions.

### `arcane status` — Check current installation

```bash
arcane status
```

Shows what profile is installed in the current directory, when it was installed, and how many skills/rules.

### `arcane clean` — Remove Arcane from a project

```bash
arcane clean
arcane clean -t ~/projects/my-game
```

Removes `.claude/` and `.claude.bak/` from the target directory. Shows what profile was installed before cleaning.

### `arcane --help` — Show help

```bash
arcane --help
arcane install --help
```

---

## Profiles

### Base Profiles

Base profiles define the primary stack for a project. Pick one or combine multiple.

#### `unity-dev` — Unity Programmer

For C# developers working on Unity projects.

| Category | Skills |
|----------|--------|
| **Gamedev** | scaffold-unity, unity-game-architecture, map-systems, asset-audit, consistency-check, audit-game |
| **General** | test-setup, perf-profile, optimize, deps-audit, env-sync, security-audit, release-checklist, patch-notes, onboard |
| **Software** | ci-cd-setup |
| **Rules** | gameplay-code, engine-code, shader-code, network-code, ui-code, ai-code |

**Total: 17 skills + 6 rules**

#### `unity-design` — Game Designer

For game designers — GDDs, balance, art bible, playtesting. No programming skills.

| Category | Skills |
|----------|--------|
| **Gamedev** | doc-gdd, doc-pas, art-bible, balance-check, map-systems, playtest-report, asset-spec, consistency-check, audit-game |
| **Design** | quick-design, ux-design, design-system |
| **General** | user-persona |
| **Rules** | design-docs, narrative |

**Total: 13 skills + 2 rules**

#### `backend-go` — Go Backend

For Go services with clean architecture, databases, auth, and API design.

| Category | Skills |
|----------|--------|
| **Software** | scaffold-go, go-clean-architecture, database-indexing, db-diagram, data-migrations, run-migrations, local-database-setup, query-optimization, data-seeding, api-design, api-docs, api-versioning, oauth-setup, jwt-strategy, rate-limiting, rbac-abac, caching-strategy, webhooks, job-scheduling, audit-log, ci-cd-setup |
| **General** | test-setup, deps-audit, security-audit, env-sync, error-tracking, logging-setup, observability-setup |
| **Rules** | backend-code, api-code, migration-code |
| **Permissions** | `go *`, `docker ps*`, `docker images*` |

**Total: 29 skills + 3 rules**

#### `backend-ts` — TypeScript Backend

For TypeScript services with Fastify, Prisma, and Zod.

| Category | Skills |
|----------|--------|
| **Software** | scaffold-fastify-ts, database-indexing, db-diagram, data-migrations, run-migrations, local-database-setup, query-optimization, data-seeding, api-design, api-docs, api-versioning, oauth-setup, jwt-strategy, rate-limiting, rbac-abac, caching-strategy, webhooks, job-scheduling, audit-log, monorepo-setup, ci-cd-setup |
| **General** | test-setup, deps-audit, security-audit, env-sync, error-tracking, logging-setup, observability-setup |
| **Rules** | backend-code, api-code, migration-code |
| **Permissions** | `npm *`, `yarn *`, `pnpm *`, `docker ps*`, `docker images*` |

**Total: 29 skills + 3 rules**

#### `frontend` — React + Vite + TypeScript

For frontend web apps with React, Vite, and TypeScript.

| Category | Skills |
|----------|--------|
| **Software** | scaffold-react-vite, state-management, form-validation, accessibility, csp-headers, owasp-top10-check, ci-cd-setup, cdn-setup, file-uploads |
| **General** | test-setup, test-helpers, i18n-setup, deps-audit, security-audit, env-sync, error-tracking, release-checklist, patch-notes, onboard |
| **Rules** | frontend-code |
| **Permissions** | `npm *`, `yarn *`, `pnpm *` |

**Total: 20 skills + 1 rule**

#### `mobile` — React Native + Expo

For mobile apps with React Native and Expo.

| Category | Skills |
|----------|--------|
| **Software** | scaffold-react-native, state-management, form-validation, accessibility, oauth-setup, jwt-strategy, file-uploads, ci-cd-setup, deploy-check |
| **General** | test-setup, test-helpers, i18n-setup, deps-audit, security-audit, env-sync, error-tracking, release-checklist, patch-notes, onboard, perf-profile |
| **Rules** | frontend-code |
| **Permissions** | `npm *`, `yarn *`, `pnpm *` |

**Total: 21 skills + 1 rule**

---

### Add-on Profiles

Add-ons extend a base profile with extra capabilities. Combine them with `+`.

#### `+agile` — Project Management

Sprints, standups, retros, estimation, and integration tools.

| Category | Skills |
|----------|--------|
| **Agile** | bug-report, bug-triage, create-epics, create-stories, create-ticket, estimate, meeting-to-tasks, milestone-review, product-spec, retrospective, sprint-ceremony, sprint-plan, sprint-report, standup-report, story-done, story-readiness, weekly-digest, incident |
| **General** | gh-projects, slack, gdocs, gdrive, gsheets, postman |

**Total: 24 skills**

#### `+clickup` — ClickUp Integration

ClickUp task management via MCP tools.

| Skills |
|--------|
| clickup |

**Total: 1 skill** (requires ClickUp MCP server configured)

#### `+jira` — Jira Integration

Jira issue tracking via curl/REST API.

| Skills |
|--------|
| jira-tickets |

**Total: 1 skill**

#### `+design` — Design Workflow

Figma, UX review, and handoff workflows.

| Category | Skills |
|----------|--------|
| **Design** | figma, figma-to-code, figma-tokens, design-handoff, prototype, ux-review |
| **General** | user-persona |

**Total: 7 skills**

#### `+infra` — DevOps / Platform

Terraform, distributed tracing, SLOs, Kubernetes, Docker.

| Category | Skills |
|----------|--------|
| **Software** | terraform-init, distributed-tracing, slo-sli, read-replicas, start-service, deploy-staging, deploy-check, docker-setup |
| **General** | observability-setup, feature-flags, gate-check |
| **Rules** | infra-code |
| **Permissions** | `kubectl get*`, `kubectl describe*`, `docker ps*`, `docker images*` |

**Total: 11 skills + 1 rule**

#### `+testing` — Advanced Testing

Contract testing, performance testing, regression suites, flakiness detection.

| Category | Skills |
|----------|--------|
| **General** | contract-testing, performance-test, smoke-check, regression-suite, test-flakiness, visual-regression |
| **Permissions** | `python -m pytest*`, `py -m pytest*` |

**Total: 6 skills**

#### `+teams` — Game Team Orchestration

Specialized game development team workflows with AI agents.

| Category | Skills |
|----------|--------|
| **Gamedev** | team-combat, team-level, team-narrative, team-ui, team-audio, team-qa, team-polish, team-release |
| **Agents** | game/ (full game agent roster) |

**Total: 8 skills + ~40 agents**

#### `+ops` — Operations

Runbooks, rollback strategies, backup, secret management.

| Category | Skills |
|----------|--------|
| **General** | runbooks, rollback-strategy, backup-strategy, secret-management, release-announce |
| **Software** | doc-rfc |

**Total: 6 skills**

---

### Core (always included)

The `core` profile is automatically included in every installation. You never need to specify it.

| Category | Contents |
|----------|----------|
| **Skills (15)** | commit, create-pr, changelog, check, code-review, context-prime, help, start, fix-issue, hotfix, brainstorm, scope-check, reverse-document, skill-improve, skill-test |
| **Rules (3)** | data-files, prototype-code, test-standards |
| **Hooks (14)** | session-start, detect-division, detect-gaps, validate-commit, validate-push, validate-secrets, validate-assets, validate-skill-change, notify, pre-compact, post-compact, session-stop, log-agent, log-agent-stop, statusline |
| **Permissions allow** | `git status/diff/log/branch/rev-parse`, `ls`, `gh`, `curl -s` |
| **Permissions deny** | `rm -rf`, `git push --force/-f`, `git reset --hard`, `git clean -f`, `sudo`, `chmod 777`, `.env` read/write, credentials/keys read |

---

## Profile Composition

Profiles are combined using the `+` separator. The system deduplicates skills automatically — if both `backend-go` and `+infra` include `observability-setup`, it's only installed once.

```
arcane install <base>[+<base>][+<addon>][+<addon>]
```

### Rules

1. **Always explicit** — there is no "full" or "all" profile. You choose what you need.
2. **Core is automatic** — the 15 universal skills and all hooks are always included.
3. **Multiple bases are OK** — combine `unity-dev+unity-design` or `backend-go+frontend`.
4. **Add-ons extend** — `+agile`, `+clickup`, etc. add capabilities to any base.
5. **Deduplication is automatic** — overlapping skills across profiles are installed once.
6. **Replace, not merge** — installing a new profile replaces the previous one entirely.

---

## Recipes by Project Type

### Unity Game (solo developer)

```bash
cd ~/projects/my-game
arcane install unity-dev
```

### Unity Game (with team management)

```bash
cd ~/projects/my-game
arcane install unity-dev+agile+clickup
```

### Unity Game (dev + designer roles, full team)

```bash
cd ~/projects/my-game
arcane install unity-dev+unity-design+teams+agile+clickup
```

### Go Microservice

```bash
cd ~/projects/my-api
arcane install backend-go
```

### Go Microservice (with infra and Jira)

```bash
cd ~/projects/my-api
arcane install backend-go+infra+agile+jira
```

### TypeScript API + Frontend Monorepo

```bash
cd ~/projects/my-app
arcane install backend-ts+frontend
```

### React Web App (with design and testing)

```bash
cd ~/projects/my-webapp
arcane install frontend+design+testing
```

### Mobile App (with agile and ClickUp)

```bash
cd ~/projects/my-mobile-app
arcane install mobile+agile+clickup
```

### Full-stack (Go + React + Infra + Ops)

```bash
cd ~/projects/my-platform
arcane install backend-go+frontend+infra+ops
```

---

## Changing Profiles

When you re-run `arcane install` on a project that already has Arcane installed, the system:

1. **Detects the current profile** from `arcane-manifest.json`
2. **Shows you** what's currently installed vs. what's new
3. **Backs up** `.claude/` to `.claude.bak/`
4. **Replaces** with the new profile

```bash
# Currently has unity-design installed, switching to unity-dev
cd ~/projects/my-game
arcane install unity-dev
```

You can check the current installation at any time:

```bash
arcane status
```

### Why replace instead of merge?

Every skill loaded by Claude Code consumes system prompt tokens. More skills = more tokens per request = slower and less focused responses. By replacing, you ensure optimal performance for the current phase of work.

---

## Cleaning Up

Remove all Arcane configuration from a project:

```bash
cd ~/projects/my-game
arcane clean
```

This removes:
- `.claude/` (the active configuration)
- `.claude.bak/` (the backup from previous install, if any)

The command shows what profile was installed before cleaning.

---

## What Gets Installed

When you run `arcane install X`, the following structure is created inside your project:

```
my-project/
└── .claude/
    ├── settings.json          # Permissions, hooks, statusline
    ├── arcane-manifest.json   # Metadata (profiles, date, counts)
    ├── statusline.sh          # Status bar script
    ├── hooks/                 # Session, validation, notification hooks
    │   ├── session-start.sh
    │   ├── validate-commit.sh
    │   ├── validate-push.sh
    │   ├── validate-secrets.sh
    │   └── ...
    ├── skills/                # Only the skills from your profile
    │   ├── commit/SKILL.md
    │   ├── code-review/SKILL.md
    │   └── ...
    ├── rules/                 # Code rules for your stack
    │   ├── data-files.md
    │   └── ...
    ├── agents/                # AI agents (if profile includes them)
    │   └── game/
    │       ├── gameplay-programmer.md
    │       └── ...
    └── docs/                  # Reference documentation
```

### settings.json

Generated automatically with merged permissions from all selected profiles. Includes:
- **Permissions allow/deny** — auto-approved and blocked commands
- **Hooks** — lifecycle hooks for session, tool usage, compaction, agents
- **Status line** — shows branch, context, and session info

---

## Manifest & Tracking

Every installation creates `.claude/arcane-manifest.json`:

```json
{
  "arcane_version": "1.0.0",
  "profile_command": "unity-dev+agile+clickup",
  "profiles": ["core", "unity-dev", "agile", "clickup"],
  "installed_at": "2026-04-18T15:30:00Z",
  "total_skills": 56,
  "total_rules": 9,
  "source": "/home/user/claude-code-arcane"
}
```

This file is used to:
- Show the current profile on re-install
- Track when the installation was made
- Provide context for `--clean`

---

## Troubleshooting

### "Profile not found" error

```
Error: Profile 'unity' not found
```

Check available profiles with `arcane list`. Profile names are exact: `unity-dev`, not `unity`.

### "Target directory does not exist"

```
Error: Target directory does not exist
```

Make sure you're running `arcane install` from inside the project directory, or use `-t` to specify the path.

### `arcane` command not found

If `pip install -e .` warns about Scripts not being on PATH, use:

```bash
python -m arcane install unity-dev
```

Or add the Python Scripts directory to your PATH.

### Skills show as "WARN: not found"

```
WARN: Skill 'some-skill' not found in skills-general/
```

The skill is referenced in the profile but doesn't exist in the Arcane pool. This may happen if a skill was removed or renamed. The installation continues — only that skill is skipped.

### Hooks not running

Make sure you opened Claude Code **inside the target project directory**:

```bash
cd ~/projects/my-game
claude
```

Hooks are relative to `.claude/` in the working directory.

### Restoring from backup

If something went wrong, your previous configuration is in `.claude.bak/`:

```bash
rm -rf ~/projects/my-game/.claude
mv ~/projects/my-game/.claude.bak ~/projects/my-game/.claude
```

---

## FAQ

### Can I use multiple base profiles together?

Yes. `backend-go+frontend` gives you both Go backend and React frontend skills. Duplicate skills are automatically deduplicated.

### Does the profile persist between Claude Code sessions?

Yes. The `.claude/` directory is part of your project. It persists until you run `--clean` or install a different profile.

### Can I add a single skill without changing profiles?

Not through `setup.sh`. The philosophy is that profiles are atomic — you install a complete set and replace it when needs change. Manually copying a skill into `.claude/skills/` works but isn't tracked by the manifest.

### How do I update Arcane skills after a new release?

```bash
cd claude-code-arcane
git pull
pip install -e .  # if there were CLI changes

# Then from your project directory:
cd ~/projects/my-game
arcane install <same-profile>
```

Re-running the same profile picks up any updated skill content.

### What's the difference between `+clickup` and `+jira`?

- **`+clickup`** uses MCP (Model Context Protocol) tools — requires a ClickUp MCP server configured in Claude Code
- **`+jira`** uses `curl` and the Jira REST API directly — no MCP needed, just API credentials

### Do I need `+agile` to use `+clickup` or `+jira`?

Not strictly, but `+agile` gives you sprint planning, standup reports, story management, and other project management skills that complement the tracker integration. Without `+agile`, you only get the tracker-specific skill.

### Can I commit `.claude/` to my project's git repo?

Yes, and it's recommended. This way everyone on the team gets the same Claude Code configuration.

### How many tokens does a profile consume?

Each skill adds ~30-100 tokens to the system prompt. A typical base profile (20-30 skills) adds ~1-2k tokens. The core profile adds ~500 tokens. Compare that to loading all 160+ skills (~8k+ tokens), which is why selective deploy matters.
