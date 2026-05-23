# Claude Code Arcane

> **321 skills, 86 agents, 15 hooks and 19 rules for Claude Code — selective deploy by profile.**

A configuration harness installable via `npx`. Pick a **profile** that matches your stack and only the relevant tools get installed into your project's `.claude/` directory.

---

## Quick Start

```bash
# Navigate to your project
cd ~/projects/my-app

# Install a profile (no clone needed)
npx arcane install backend-ts+agile

# Open Claude Code
claude
```

That's it. Your project now has skills, agents, hooks, rules, and permissions tailored for your stack.

---

## How It Works

### 1. Profiles define what gets installed

Each profile is a YAML file that bundles skills, agents, rules, and permissions:

```yaml
# profiles/backend-ts.yaml
name: backend-ts
type: base
skills: [api-design, auth-strategy, jwt-strategy, ...]
rules:
  universal: [backend-code, api-code, migration-code]
agents: [engineering]
permissions:
  allow: ["Bash(npm *)", "Bash(docker ps*)"]
```

### 2. Combine profiles with `+`

```bash
npx arcane install backend-ts+agile+testing
#                  ^^^^^^^^^^  ^^^^^  ^^^^^^^
#                  base        addon  addon
```

The installer merges all profiles, deduplicates skills, and installs only what's needed.

### 3. Core is always included

Every installation automatically loads `core.yaml` first:
- 21 essential skills (commit, create-pr, code-review, help, etc.)
- 15 lifecycle hooks (session start/stop, commit validation, secret scanning, etc.)
- 3 base rules (data-files, prototype-code, test-standards)
- 1 agent dir (quality)
- Security permissions (9 allow + 14 deny)

### 4. What gets generated

```
my-project/.claude/
├── settings.json          # Permissions + hooks + optional statusline
├── arcane-manifest.json   # Installation metadata (tracks what's installed)
├── statusline.sh          # Only if you used +statusline
├── hooks/                 # 14 lifecycle hooks
├── skills/                # Only your profile's skills
│   └── */SKILL.md         # Each skill = one directory
├── rules/                 # Stack-specific rules
├── agents/                # Agent dirs per profile
└── docs/                  # General documentation
```

---

## CLI Commands

### Install a profile

```bash
npx arcane install backend-ts+agile     # Install profile combination
npx arcane install                       # Show available profiles (interactive)
npx arcane install unity-dev --dry-run   # Preview without installing
```

### Add skills or profiles to an existing installation

```bash
npx arcane add api-design                # Add a single skill
npx arcane add security-audit owasp      # Add multiple skills
npx arcane add +security                 # Add an entire profile as addon
npx arcane add +database +testing        # Add multiple profiles
```

### Remove skills, profiles, or agents

```bash
npx arcane remove api-design             # Remove a single skill
npx arcane remove slack postman          # Remove multiple skills
npx arcane remove +agile                 # Remove entire profile (skills + agents + rules)
npx arcane remove +testing api-design    # Mix: remove a profile and a skill
```

When removing a profile, Arcane only deletes assets **exclusive** to that profile. Skills, agents, and rules shared with other active profiles are preserved.

Core skills (21) and the core profile cannot be removed.

### Other commands

```bash
npx arcane list                          # List all profiles and skills
npx arcane status                        # Show current installation
npx arcane update                        # Check for updates
npx arcane clean --force                 # Remove Arcane entirely from project
```

---

## In-Session Skills (inside Claude Code)

Once installed, manage the installation from within a Claude Code session:

| Skill | Description |
|-------|-------------|
| `/arcane-status` | Show installed profiles, skills, rules, and agents |
| `/arcane-list` | List everything available in Arcane (profiles + skills) |
| `/arcane-add <skill\|+profile>` | Add skills or profiles without reinstalling |
| `/arcane-remove <skill\|+profile>` | Remove skills, profiles and their agents/rules |
| `/arcane-clean` | Uninstall Arcane from the project (asks confirmation) |

### Examples from inside Claude Code

```
/arcane-add docker-setup              Add one skill
/arcane-add +security                 Add entire security profile
/arcane-remove +agile                 Remove agile profile + its exclusive skills/agents
/arcane-remove api-design slack       Remove specific skills
/arcane-status                        See what's installed
/arcane-list                          Browse what's available
```

---

## Available Profiles

### Base (pick one or combine several)

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

### Add-ons (combine with `+`)

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

21 universal skills (commit, create-pr, changelog, check, code-review, context-prime, help, start, fix-issue, hotfix, brainstorm, scope-check, reverse-document, skill-improve, skill-test, tech-debt, + 5 arcane self-management), 15 hooks, 3 base rules, 1 agent dir (quality), and security permissions.

---

## Examples by Project

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

# Founder advisory setup
npx arcane install clevel+business+finance+marketing

# With status bar
npx arcane install backend-ts+agile+statusline
```

---

## Add/Remove Workflow

```bash
# Start with a base profile
npx arcane install backend-ts

# Later, add testing and security
npx arcane add +testing +security

# Add a specific skill you need
npx arcane add docker-setup

# Realize you don't need testing anymore
npx arcane remove +testing

# Remove a specific skill
npx arcane remove docker-setup

# Check what you have now
npx arcane status

# Start over
npx arcane clean --force
npx arcane install backend-ts+agile
```

---

## Worktree Support

Work on multiple features in parallel using git worktrees, each with its own Arcane installation.

### Create a worktree with Arcane pre-installed

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
```

### Worktree-aware installation

When you run `npx arcane install` inside a git worktree, Arcane automatically:
- Detects it's in a worktree
- Finds the main worktree's Arcane installation
- **Shares** hooks/ and docs/ via symlink (read-only, identical across worktrees)
- **Copies** skills/, agents/, and rules/ independently (can diverge per worktree)

```bash
# Manual: share from a specific installation
npx arcane install backend-ts --share-from /path/to/main/worktree

# Disable sharing
npx arcane worktree feat/api --no-share
```

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

### Status shows worktree info

```bash
npx arcane status
# === Arcane Status ===
#   Profiles:  backend-ts + agile
#   Worktree:  yes (main: /path/to/main/checkout)
#   Shared:    hooks, docs (symlinked)
#   ...
```

---

## Architecture

```
claude-code-arcane/
├── package.json               # npm package (bin: arcane)
├── src/                       # TypeScript CLI (15 files)
│   ├── cli.ts                 # Entry point (Commander.js)
│   ├── commands/              # 8 commands (install, add, remove, list, status, update, clean, worktree)
│   ├── profiles.ts            # YAML profile parser + merge
│   ├── installer.ts           # Copy logic (skills, hooks, rules, agents, docs)
│   ├── worktree.ts            # Git worktree detection, creation, sharing
│   ├── manifest.ts            # Read/write arcane-manifest.json
│   ├── types.ts               # TypeScript interfaces
│   └── utils.ts               # Cross-platform helpers
├── skills/                    # 321 skills (flat, one dir per skill)
├── profiles/                  # 29 profiles (YAML)
├── agents/                    # 13 dirs, 86+ agents (Markdown)
├── hooks/                     # 15 lifecycle hooks (Bash)
├── rules/                     # 19 rules (Markdown)
├── templates/                 # Gamedev templates
├── docs/                      # Documentation
└── skills-selftest/           # QA framework
```

## Philosophy

- **Selective:** install only what you need — fewer tokens, better performance
- **Replaceable:** switching profiles replaces the previous config (with automatic backup)
- **Deduplicated:** combined profiles never duplicate skills
- **Self-managing:** add, remove, and list from within Claude Code
- **Safe removal:** removing a profile only deletes assets not shared with other active profiles

---

## Compatibility

- **OS:** Windows 10/11, macOS, Linux
- **Node:** 18+
- **Claude Code:** v1.0+
