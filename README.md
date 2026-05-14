# Claude Code Arcane

> **305 skills, 80 agents, 14 hooks and 9 rules for Claude Code — selective deploy by profile.**

A configuration harness that projects import via CLI. Instead of loading everything into every project, you pick a **profile** that matches your stack and only the relevant tools get installed.

---

## Quick Start

```bash
# 1. Clone and install the CLI
git clone https://github.com/SebastianLuser/claude-code-arcane.git
cd claude-code-arcane
pip install -e .

# 2. Navigate to your project
cd ~/projects/my-app

# 3. Install a profile
arcane install backend-ts+agile

# 4. Open Claude Code
claude
```

If `arcane` is not on PATH, use `python -m arcane` instead.

## Interactive Selector

Without arguments, `arcane install` opens an arrow-key selector:

```bash
arcane install
```

---

## Available Profiles

### Base (pick one or combine several)

| Profile | Stack | Skills | Agents |
|---------|-------|--------|--------|
| `unity-dev` | Unity programmer — C#, architecture, performance, builds | 25 | game |
| `unity-design` | Game designer — GDDs, balance, art bible, playtesting | 17 | game |
| `backend-ts` | Backend TypeScript — Fastify, Prisma, Zod, API design | 25 | engineering |
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

### Core (always included)

21 universal skills (commit, create-pr, changelog, check, code-review, context-prime, help, start, fix-issue, hotfix, brainstorm, scope-check, reverse-document, skill-improve, skill-test, tech-debt, + 5 arcane self-management), 14 hooks, 3 base rules, 1 agent dir (quality), and security permissions.

---

## CLI Commands

```bash
arcane install                            # Interactive selector
arcane install unity-dev                  # Direct profile
arcane install backend-ts+agile+database  # Combo with +
arcane install unity-dev --dry-run        # Preview without installing

arcane list                               # List available profiles
arcane status                             # Show current installation
arcane clean                              # Remove Arcane from project
```

## In-Session Skills (arcane self-management)

Once installed, manage the installation from within Claude Code:

| Skill | Description |
|-------|-------------|
| `/arcane-status` | Show installed profiles, skills and agents |
| `/arcane-list` | List everything available in Arcane |
| `/arcane-add <skill>` | Add skills or profiles without reinstalling |
| `/arcane-remove <skill>` | Remove individual skills |
| `/arcane-clean` | Uninstall Arcane from the project |

## Examples by Project

```bash
# Unity dev only
arcane install unity-dev

# Unity with team and management
arcane install unity-dev+unity-design+agile+clickup

# Go microservice with infra
arcane install backend-go+infra+agile+jira

# Full-stack monorepo
arcane install backend-ts+frontend+testing+database

# Mobile app with CI/CD
arcane install mobile+agile+clickup+testing

# Secure backend with docs
arcane install backend-ts+security+docs+database

# AI/ML project with data pipelines
arcane install backend-go+ai+infra

# SaaS with full marketing stack
arcane install backend-ts+marketing+business+finance

# Regulated medical device
arcane install backend-ts+regulatory+security+testing

# Founder advisory setup
arcane install clevel+business+finance+marketing
```

---

## What Gets Installed

```
my-project/.claude/
├── settings.json          # Permissions (allow/deny) + hooks
├── arcane-manifest.json   # Installation metadata
├── statusline.sh          # Claude Code status line
├── hooks/                 # 14 lifecycle hooks
├── skills/                # Only your profile's skills
│   └── */references/      # Per-skill reference docs
├── rules/                 # Stack-specific rules
├── agents/                # Agent dirs per profile
└── docs/                  # General documentation
```

## Architecture

```
claude-code-arcane/
├── arcane/                # Python CLI (installer, profiles, cli)
├── profiles/              # 27 profiles (.profile)
├── agents/                # 12 dirs, 80 agents (.md)
│   ├── quality/           # Code review, testing, standards
│   ├── engineering/       # Architecture, API design, performance
│   ├── game/              # Unity, game design, playtesting
│   ├── devops/            # CI/CD, infra, monitoring
│   ├── management/        # Sprint planning, estimation
│   ├── product/           # UX, design systems, requirements
│   ├── integrations/      # External service agents
│   ├── ai/                # AI/ML architecture, data science
│   ├── clevel/            # C-suite advisory
│   ├── business/          # Revenue ops, finance, sales
│   ├── marketing/         # Content, growth, SEO, analytics
│   └── regulatory/        # Regulatory affairs, QMS, compliance
├── .claude/
│   ├── skills-git/        # Git, workflow, code review skills
│   ├── skills-testing/    # Testing skills
│   ├── skills-docs/       # Documentation generation
│   ├── skills-frontend/   # Frontend-specific skills
│   ├── skills-mobile/     # Mobile-specific skills
│   ├── skills-backend/    # Backend, API, auth skills
│   ├── skills-devops/     # Infra, CI/CD, observability
│   ├── skills-agile/      # Project management skills
│   ├── skills-design/     # UX, design system skills
│   ├── skills-gamedev/    # Unity, game design skills
│   ├── skills-integrations/ # Slack, Postman, GitHub Projects
│   ├── skills-release/    # Release, versioning skills
│   ├── skills-security/   # Security audit skills
│   ├── skills-arcane/     # In-session self-management
│   ├── skills-ai/         # AI/ML, RAG, data engineering
│   ├── skills-business/   # Contracts, revenue ops, sales
│   ├── skills-clevel-advisors/   # C-suite advisors
│   ├── skills-clevel-operations/ # Board meetings, org health
│   ├── skills-finance/    # Financial analysis, SaaS metrics
│   ├── skills-marketing-content/  # Copywriting, social, video
│   ├── skills-marketing-growth/   # Ads, email, launches
│   ├── skills-marketing-seo/     # SEO, CRO, site architecture
│   ├── skills-marketing-strategy/ # Pricing, analytics, PMM
│   ├── skills-regulatory/ # FDA, GDPR, ISO, SOC 2
│   ├── hooks/             # 14 lifecycle hooks
│   └── rules/             # 9 rules
└── tools/                 # Migration scripts
```

## Philosophy

- **Selective:** install only what you need — fewer tokens, better performance
- **Replaceable:** switching profiles replaces the previous config (with automatic backup)
- **Deduplicated:** combined profiles never duplicate skills
- **Self-managing:** `/arcane-add` and `/arcane-remove` from within Claude Code

---

## Compatibility

- **OS:** Windows 10/11, macOS, Linux
- **Python:** 3.9+
- **Claude Code:** v1.0+
