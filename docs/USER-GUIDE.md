# Claude Code Arcane — User Guide

## What is Arcane?

Arcane is a configuration harness for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). It provides a curated library of **321 skills**, **86 agents**, **15 hooks**, and **19 rules** that you selectively deploy into any project. Instead of shipping everything to every project (wasting tokens and degrading performance), you pick a **profile** that matches your stack and only the relevant tools get installed.

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
- [Adding and Removing Skills](#adding-and-removing-skills)
- [Worktree Support](#worktree-support)
- [Global Hooks](#global-hooks)
- [Recipes by Project Type](#recipes-by-project-type)
- [What Gets Installed](#what-gets-installed)
- [Manifest & Tracking](#manifest--tracking)
- [In-Session Skills](#in-session-skills)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Requirements

- **Node.js 20+**
- **Claude Code** CLI installed ([installation guide](https://docs.anthropic.com/en/docs/claude-code))
- The target project directory must already exist

## Installation

No installation needed — Arcane runs via `npx`:

```bash
npx arcane install backend-ts+agile
```

That's it. `npx` downloads and runs the latest version automatically.

## Quick Start

```bash
# 1. Navigate to your project
cd ~/projects/my-app

# 2. Install a profile
npx arcane install backend-ts+agile

# 3. Open Claude Code
claude
```

Your project now has skills, agents, hooks, rules, and permissions tailored for your stack.

---

## Commands Reference

### `npx arcane install` — Install profiles

```bash
# Show available profiles (interactive)
npx arcane install

# Install a specific profile
npx arcane install backend-ts

# Combine profiles with +
npx arcane install backend-ts+agile+testing

# Install to a specific directory (default: current dir)
npx arcane install unity-dev --target ~/projects/my-game

# Preview without installing
npx arcane install unity-dev --dry-run

# Force overwrite without backup
npx arcane install unity-dev --force
```

If `.claude/` already exists, it gets backed up to `.claude.bak/` and replaced.

### `npx arcane add` — Add skills or profiles

```bash
# Add a single skill
npx arcane add api-design

# Add multiple skills
npx arcane add security-audit owasp

# Add an entire profile as addon
npx arcane add +security

# Add multiple profiles
npx arcane add +database +testing
```

### `npx arcane remove` — Remove skills, profiles, or agents

```bash
# Remove a single skill
npx arcane remove api-design

# Remove multiple skills
npx arcane remove slack postman

# Remove entire profile (exclusive skills + agents + rules)
npx arcane remove +agile

# Mix: remove a profile and a skill
npx arcane remove +testing api-design
```

When removing a profile, Arcane only deletes assets **exclusive** to that profile. Skills, agents, and rules shared with other active profiles are preserved. Core skills (21) and the core profile cannot be removed.

### `npx arcane list` — List available profiles and skills

```bash
npx arcane list
```

Shows all base profiles and add-ons with descriptions, and marks which are currently installed.

### `npx arcane status` — Check current installation

```bash
npx arcane status
```

Shows installed profiles, skill count, rules, agents, installation date, and worktree info.

### `npx arcane update` — Check for updates

```bash
npx arcane update

# Quiet mode (for hooks — fails silently)
npx arcane update --quiet
```

### `npx arcane clean` — Remove Arcane from a project

```bash
npx arcane clean --force
```

Removes `.claude/` and `.claude.bak/` from the current directory. Requires `--force` flag.

### `npx arcane worktree` — Create worktrees with Arcane

```bash
# Create worktree + install Arcane in one step
npx arcane worktree feat/new-api --profile backend-ts+agile

# Inherits profile from current installation
npx arcane worktree feat/new-api

# With dependency install and Docker port isolation
npx arcane worktree feat/new-api --install-deps --isolate

# Custom path and base branch
npx arcane worktree feat/new-api --path ../my-api-worktree --base develop

# Preview without creating
npx arcane worktree feat/new-api --dry-run

# Don't share hooks/docs from current installation
npx arcane worktree feat/new-api --no-share
```

### `npx arcane global` — Manage global hooks

```bash
# Install global SessionStart hook (worktree-isolation auto-apply)
npx arcane global

# Show global hooks status
npx arcane global --status

# Remove global hooks
npx arcane global --remove
```

---

## Profiles

### Base Profiles

Base profiles define the primary stack for a project. Pick one or combine multiple.

| Profile | Stack | Skills | Agents |
|---------|-------|--------|--------|
| `unity-dev` | Unity programmer — C#, architecture, performance, builds | 25 | game |
| `unity-design` | Game designer — GDDs, balance, art bible, playtesting | 17 | game |
| `backend-ts` | Backend TypeScript — Fastify, Prisma, Zod, API design | 33 | engineering |
| `backend-go` | Backend Go — Clean Arch, DB, auth, API, CI | 19 | engineering |
| `frontend` | React + Vite + TypeScript | 14 | engineering |
| `mobile` | React Native + Expo + TypeScript | 12 | engineering |
| `flutter` | Flutter + Dart cross-platform | 8 | engineering |
| `android-native` | Kotlin + Jetpack Compose + Material Design 3 | 8 | engineering |
| `ios-native` | Swift + UIKit/SwiftUI + Apple HIG | 8 | engineering |

### Add-on Profiles

Add-ons extend a base profile with extra capabilities. Combine them with `+`.

| Add-on | Adds | Skills | Agents |
|--------|------|--------|--------|
| `+agile` | Sprints, standups, retros, estimates | 10 | management, product |
| `+docs` | PDF, PPTX, XLSX, DOCX, architecture decisions | 8 | — |
| `+testing` | Contract, performance, regression, flakiness | 11 | quality |
| `+infra` | Terraform, observability, secrets, rollback, K8s | 17 | devops |
| `+database` | Indexing, migrations, seeding, replicas, optimization | 8 | — |
| `+security` | Audits, OWASP, secrets, backups | 5 | — |
| `+design` | Figma, UX review, design system, handoff | 6 | product |
| `+integrations` | GitHub Projects, Slack, Postman | 3 | integrations |
| `+clickup` | ClickUp via MCP — tasks, docs, time tracking | 3 | — |
| `+jira` | Jira via REST API — issues, sprints, boards | 3 | — |
| `+ai` | LLM cost optimization, RAG, ML, data engineering | 7 | ai |
| `+business` | Contracts, customer success, revenue ops, sales | 4 | business |
| `+clevel` | C-suite advisors, board prep, strategic ops | 28 | clevel |
| `+finance` | Investment analysis, financial modeling, SaaS metrics | 3 | business |
| `+marketing` | Content, growth, SEO/CRO, strategy, analytics | 44 | marketing |
| `+regulatory` | ISO 13485, GDPR, FDA, SOC 2, ISMS, QMS, MDR | 13 | regulatory |
| `+self-improving` | Agent self-improvement and skill extraction | 2 | — |
| `+statusline` | Claude Code status bar (branch, division, session info) | 0 | — |

### Core (always included)

Every installation automatically loads `core.yaml` first:

| Category | Contents |
|----------|----------|
| **Skills (21)** | commit, create-pr, changelog, check, code-review, context-prime, help, start, fix-issue, hotfix, brainstorm, scope-check, reverse-document, skill-improve, skill-test, tech-debt, arcane-status, arcane-list, arcane-add, arcane-remove, arcane-clean |
| **Rules (3)** | data-files, prototype-code, test-standards |
| **Hooks (15)** | session-start, detect-division, detect-gaps, validate-commit, validate-push, validate-secrets, validate-assets, validate-skill-change, notify, pre-compact, post-compact, session-stop, log-agent, log-agent-stop |
| **Agents (1 dir)** | quality |
| **Permissions** | 9 allow (git, ls, gh, curl) + 14 deny (rm -rf, force push, sudo, .env, etc.) |

---

## Profile Composition

Profiles are combined using the `+` separator. The system deduplicates skills automatically.

```bash
npx arcane install <base>[+<base>][+<addon>][+<addon>]
```

### Rules

1. **Always explicit** — there is no "full" or "all" profile. You choose what you need.
2. **Core is automatic** — the 21 universal skills and all hooks are always included.
3. **Multiple bases are OK** — combine `unity-dev+unity-design` or `backend-go+frontend`.
4. **Add-ons extend** — `+agile`, `+clickup`, etc. add capabilities to any base.
5. **Deduplication is automatic** — overlapping skills across profiles are installed once.
6. **Replace, not merge** — installing a new profile replaces the previous one entirely (with backup).

---

## Adding and Removing Skills

After the initial install, you can incrementally add or remove skills and profiles without reinstalling.

### Add workflow

```bash
# Start with a base profile
npx arcane install backend-ts

# Later, add testing and security
npx arcane add +testing +security

# Add a specific skill you need
npx arcane add docker-setup

# Check what you have
npx arcane status
```

### Remove workflow

```bash
# Remove a profile you no longer need (only exclusive assets are deleted)
npx arcane remove +testing

# Remove a specific skill
npx arcane remove docker-setup

# Start over completely
npx arcane clean --force
npx arcane install backend-ts+agile
```

---

## Worktree Support

Work on multiple features in parallel using git worktrees, each with its own Arcane installation.

### Create a worktree with Arcane

```bash
# Create worktree + install Arcane in one step
npx arcane worktree feat/new-api --profile backend-ts+agile

# Inherits profile from current installation
npx arcane worktree feat/new-api

# With dependency install and Docker port isolation
npx arcane worktree feat/new-api --install-deps --isolate
```

### Worktree-aware installation

When you run `npx arcane install` inside a git worktree, Arcane automatically:
- Detects it's in a worktree
- Finds the main worktree's Arcane installation
- **Shares** hooks/ and docs/ via symlink (read-only, identical across worktrees)
- **Copies** skills/, agents/, and rules/ independently (can diverge per worktree)

### What gets shared vs independent

| Asset | Behavior | Why |
|-------|----------|-----|
| `hooks/` | Shared (symlink) | Same hooks for all worktrees |
| `docs/` | Shared (symlink) | Documentation doesn't change per branch |
| `skills/` | Independent (copy) | Different worktrees may add/remove skills |
| `agents/` | Independent (copy) | Agent definitions could vary |
| `rules/` | Independent (copy) | Rules may differ per profile |
| `settings.json` | Independent (generated) | Permissions/hooks config per profile |
| `arcane-manifest.json` | Independent | Tracks this worktree's installation |

---

## Global Hooks

Install worktree-isolation scripts that auto-apply on every new Claude Code session:

```bash
# Install global hooks
npx arcane global

# Check status
npx arcane global --status

# Remove
npx arcane global --remove
```

This copies scripts to `~/.claude/scripts/worktree-isolation/` and adds a `SessionStart` hook to `~/.claude/settings.json`.

---

## Recipes by Project Type

```bash
# Unity dev only
npx arcane install unity-dev

# Unity with team and management
npx arcane install unity-dev+unity-design+agile+clickup

# Go microservice with infra
npx arcane install backend-go+infra+agile+jira

# Full-stack monorepo
npx arcane install backend-ts+frontend+testing+database

# Mobile app with CI/CD
npx arcane install mobile+agile+clickup+testing

# Secure backend with docs
npx arcane install backend-ts+security+docs+database

# AI/ML project with data pipelines
npx arcane install backend-go+ai+infra

# SaaS with full marketing stack
npx arcane install backend-ts+marketing+business+finance

# Regulated medical device
npx arcane install backend-ts+regulatory+security+testing

# With status bar
npx arcane install backend-ts+agile+statusline
```

---

## What Gets Installed

When you run `npx arcane install`, the following structure is created inside your project:

```
my-project/.claude/
├── settings.json          # Permissions + hooks + optional statusline
├── arcane-manifest.json   # Installation metadata (tracks what's installed)
├── statusline.sh          # Only if you used +statusline
├── hooks/                 # 15 lifecycle hooks
├── skills/                # Only your profile's skills
│   └── */SKILL.md         # Each skill = one directory
├── rules/                 # Stack-specific rules
├── agents/                # Agent dirs per profile
└── docs/                  # General documentation
```

### settings.json

Generated automatically with merged permissions from all selected profiles. Includes:
- **Permissions allow/deny** — auto-approved and blocked commands
- **Hooks** — lifecycle hooks for session, tool usage, compaction, agents
- **Status line** — optional branch/context/session info (with `+statusline`)

---

## Manifest & Tracking

Every installation creates `.claude/arcane-manifest.json`:

```json
{
  "arcane_version": "1.0.0",
  "cli": "npm",
  "profile_command": "backend-ts+agile",
  "profiles": ["core", "backend-ts", "agile"],
  "installed_at": "2026-05-25T15:30:00Z",
  "total_skills": 56,
  "total_rules": 6,
  "installed_skills": ["commit", "create-pr", "..."],
  "installed_rules": ["backend-code", "api-code", "..."],
  "installed_agents": ["engineering", "quality"],
  "source": "/path/to/arcane/package"
}
```

This file is used by `add`, `remove`, `status`, and `clean` commands to track the installation state.

---

## In-Session Skills

Once installed, manage the installation from within a Claude Code session:

| Skill | Description |
|-------|-------------|
| `/arcane-status` | Show installed profiles, skills, rules, and agents |
| `/arcane-list` | List everything available in Arcane (profiles + skills) |
| `/arcane-add <skill\|+profile>` | Add skills or profiles without reinstalling |
| `/arcane-remove <skill\|+profile>` | Remove skills, profiles and their agents/rules |
| `/arcane-clean` | Uninstall Arcane from the project (asks confirmation) |

```
/arcane-add docker-setup              Add one skill
/arcane-add +security                 Add entire security profile
/arcane-remove +agile                 Remove agile profile + its exclusive skills/agents
/arcane-status                        See what's installed
```

---

## Troubleshooting

### "Profile not found" error

Check available profiles with `npx arcane list`. Profile names are exact: `unity-dev`, not `unity`.

### Skills show as "WARN: not found"

The skill is referenced in the profile but doesn't exist in the skills directory. The installation continues — only that skill is skipped.

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

Yes. The `.claude/` directory is part of your project. It persists until you run `clean` or install a different profile.

### Can I add a single skill without changing profiles?

Yes. Use `npx arcane add <skill-name>` to add individual skills. Use `npx arcane remove <skill-name>` to remove them. Changes are tracked in the manifest.

### How do I update Arcane?

```bash
npx arcane update
```

Since Arcane runs via `npx`, you always get the latest version. Use `npx arcane update` to check if a newer version is available.

### What's the difference between `+clickup` and `+jira`?

- **`+clickup`** uses MCP (Model Context Protocol) tools — requires a ClickUp MCP server configured in Claude Code
- **`+jira`** uses `curl` and the Jira REST API directly — no MCP needed, just API credentials

### Do I need `+agile` to use `+clickup` or `+jira`?

Not strictly, but `+agile` gives you sprint planning, standup reports, story management, and other project management skills that complement the tracker integration.

### Can I commit `.claude/` to my project's git repo?

Yes, and it's recommended. This way everyone on the team gets the same Claude Code configuration.

### How many tokens does a profile consume?

Each skill adds ~30-100 tokens to the system prompt. A typical base profile (20-30 skills) adds ~1-2k tokens. The core profile adds ~500 tokens. Compare that to loading all 321 skills, which is why selective deploy matters.

### Why replace instead of merge on install?

Every skill loaded by Claude Code consumes system prompt tokens. More skills = more tokens per request = slower and less focused responses. `install` replaces to ensure optimal performance. Use `add`/`remove` for incremental changes.
