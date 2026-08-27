# Estructura de Directorios

```
Claude-Code-Arcane/
├── CLAUDE.md                          # Configuración maestra
├── README.md                          # Documentación del repo
├── pyproject.toml                     # Python package config
├── LICENSE
├── .gitignore
│
├── arcane/                            # Python CLI (installer, profiles parser)
│   ├── cli.py                         # Entry point: arcane install/list/clean
│   ├── installer.py                   # Profile installer logic
│   └── profiles.py                    # Profile parser & merger
│
├── profiles/                          # 27 profile definitions (.profile)
│   ├── core.profile                   # Always included (21 skills, hooks, rules)
│   ├── backend-go.profile             # Base: Go backend
│   ├── backend-ts.profile             # Base: TypeScript backend
│   ├── frontend.profile               # Base: React frontend
│   ├── unity-dev.profile              # Base: Unity programmer
│   ├── ai.profile                     # Add-on: AI/ML
│   ├── clevel.profile                 # Add-on: C-suite advisory
│   ├── business.profile               # Add-on: Business ops
│   ├── marketing.profile              # Add-on: Marketing
│   ├── finance.profile                # Add-on: Finance
│   ├── regulatory.profile             # Add-on: Regulatory & compliance
│   └── ...                            # agile, testing, infra, security, etc.
│
├── agents/                            # 109 agent definitions (root level)
│   ├── ai/                            # 4 agents
│   ├── audio/                         # 6 agents
│   ├── business/                      # 3 agents
│   ├── career/                        # 4 agents
│   ├── clevel/                        # 6 agents
│   ├── devops/                        # 3 agents
│   ├── ecommerce/                     # 1 agent
│   ├── engineering/                   # 16 agents
│   ├── freelance/                     # 4 agents
│   ├── game/                          # 30 agents
│   ├── integrations/                  # 6 agents
│   ├── management/                    # 4 agents
│   ├── marketing/                     # 5 agents
│   ├── product/                       # 5 agents
│   ├── quality/                       # 3 agents
│   ├── regulatory/                    # 3 agents
│   └── visualnovel/                   # 6 agents
│
├── .claude/                           # Claude Code configuration
│   ├── settings.json                  # Hooks, permissions, safety
│   ├── settings.local.json            # User-specific overrides (gitignored)
│   ├── statusline.sh                  # Status line bash script
│   ├── setup-skill-junctions.bat      # Windows: create skill junctions
│   ├── remove-skill-junctions.bat     # Windows: remove skill junctions
│   │
│   ├── skills-agile/                  # 35 agile/PM skills
│   ├── skills-ai/                     # 7 AI/ML skills
│   ├── skills-arcane/                 # 7 Arcane self-management skills
│   ├── skills-backend/                # 45 backend skills
│   ├── skills-business/               # 4 business skills
│   ├── skills-clevel-advisors/        # 10 C-suite advisor skills
│   ├── skills-clevel-operations/      # 18 C-suite operations skills
│   ├── skills-design/                 # 9 design skills
│   ├── skills-devops/                 # 17 DevOps/infra skills
│   ├── skills-docs/                   # 13 documentation skills
│   ├── skills-finance/                # 3 finance skills
│   ├── skills-frontend/               # 9 frontend skills
│   ├── skills-gamedev/                # 19 gamedev skills + _rules/ + _templates/
│   ├── skills-git/                    # 21 git workflow skills
│   ├── skills-integrations/           # 3 integration skills
│   ├── skills-marketing-content/      # 8 content marketing skills
│   ├── skills-marketing-growth/       # 10 growth marketing skills
│   ├── skills-marketing-seo/          # 11 SEO/CRO skills
│   ├── skills-marketing-strategy/     # 15 marketing strategy skills
│   ├── skills-mobile/                 # 5 mobile skills
│   ├── skills-regulatory/             # 13 regulatory/compliance skills
│   ├── skills-release/                # 5 release skills
│   ├── skills-security/               # 9 security skills
│   ├── skills-testing/                # 13 testing skills
│   │
│   ├── hooks/                         # 14 lifecycle hooks
│   │   ├── session-start.sh
│   │   ├── session-stop.sh
│   │   ├── detect-division.sh
│   │   ├── detect-gaps.sh
│   │   ├── validate-commit.sh
│   │   ├── validate-push.sh
│   │   ├── validate-secrets.sh
│   │   ├── validate-assets.sh
│   │   ├── validate-skill-change.sh
│   │   ├── notify.sh
│   │   ├── pre-compact.sh
│   │   ├── post-compact.sh
│   │   ├── log-agent.sh
│   │   └── log-agent-stop.sh
│   │
│   ├── rules/                         # 9 path-scoped rules
│   │   ├── backend-code.md
│   │   ├── frontend-code.md
│   │   ├── api-code.md
│   │   ├── migration-code.md
│   │   ├── infra-code.md
│   │   ├── ai-code.md
│   │   ├── data-files.md
│   │   ├── test-standards.md
│   │   └── prototype-code.md
│   │
│   └── docs/                          # Internal documentation
│       ├── division-structure.md
│       ├── agent-hierarchy.md
│       ├── directory-structure.md      # This file
│       ├── coding-standards.md
│       ├── technical-preferences.md
│       ├── coordination-rules.md
│       ├── context-management.md
│       ├── workflow-catalog.yaml
│       ├── stack-registry.md
│       └── templates/
│
├── docs/                              # Public documentation
│   ├── SKILLS-CATALOG.md              # Complete skill catalog
│   └── USER-GUIDE.md                  # User guide
│
├── tools/                             # Migration & wrapper scripts
│   ├── arcane.sh                      # Legacy bash installer
│   ├── arcane.bat                     # Windows wrapper
│   └── migrate-*.sh                   # Migration tools
│
├── skills-selftest/                   # QA framework for skills/agents
│   ├── CLAUDE.md
│   ├── catalog.yaml                   # Registry: 305 skills + 94 agents
│   ├── quality-rubric.md
│   ├── skills/[category]/             # Behavioral specs per skill
│   ├── agents/[tier]/                 # Behavioral specs per agent
│   ├── templates/
│   └── results/                       # Test outputs (gitignored)
│
└── production/                        # Runtime state
    └── session-state/
```

## Rules Split Policy

- **`.claude/rules/`** — reglas universales que aplican a cualquier stack software (backend APIs, frontends web/mobile, DBs, infra, LLM apps). Usan paths genéricos (`src/api/**`, `src/components/**`, `migrations/**`).
- **`.claude/skills-gamedev/_rules/`** — reglas exclusivas de gamedev (frame budgets, shaders, NPC AI, GDDs, lore). Usan paths gamedev (`src/gameplay/**`, `assets/shaders/**`, `design/gdd/**`, `design/narrative/**`).

Cuando un proyecto es dual (ej. web + game), ambos sets de rules aplican por sus paths scoped.

## Hook Events Wiring

Ver `settings.json`. Los eventos wireados:

| Evento | Hooks |
|--------|-------|
| SessionStart | session-start.sh → detect-division.sh → detect-gaps.sh |
| PreToolUse (Bash) | validate-commit.sh, validate-push.sh, validate-secrets.sh |
| PostToolUse (Write/Edit) | validate-assets.sh, validate-skill-change.sh |
| Notification | notify.sh |
| PreCompact / PostCompact | pre-compact.sh / post-compact.sh |
| Stop | session-stop.sh |
| SubagentStart / SubagentStop | log-agent.sh / log-agent-stop.sh |
