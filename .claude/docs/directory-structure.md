# Estructura de Directorios

```
Claude-Code-Arcane/
├── CLAUDE.md                          # Configuración maestra
├── README.md                          # Documentación del repo
├── LICENSE
├── .gitignore
│
├── .claude/                           # Configuración de Claude Code
│   ├── settings.json                  # Hooks, permissions, safety
│   ├── statusline.sh                  # Status line bash script
│   │
│   ├── agents/                        # 119 agent definitions
│   │   ├── game/                      # División 1 (49 agents)
│   │   ├── engineering/               # División 2 (20 agents)
│   │   ├── devops/                    # División 3 (11 agents)
│   │   ├── product/                   # División 4 (11 agents)
│   │   ├── management/                # División 5 (8 agents)
│   │   ├── quality/                   # División 6 (7 agents)
│   │   ├── educabot/                  # División 7 (7 agents)
│   │   └── integrations/              # División 8 (6 agents)
│   │
│   ├── skills/                        # Skills universales/software (subdir per skill)
│   │   ├── [skill-name]/
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-agile/                  # 35 skills (20 existing + 15 new)
│   │   ├── [agile-skill]/             # bug-report, sprint-plan, scrum-master, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-ai/                     # 7 AI/ML skills
│   │   ├── [ai-skill]/               # llm-cost-optimizer, rag-architect, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-arcane/                 # Arcane self-management (add, list, remove, auditor, etc.)
│   │   ├── [arcane-skill]/            # arcane-add, arcane-list, skill-auditor, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-backend/                # 45+ backend skills
│   │   ├── [backend-skill]/           # agent-designer, mcp-server-builder, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-business/               # 4 business skills
│   │   ├── [business-skill]/          # contract-and-proposal-writer, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-clevel-advisors/        # 10 C-suite advisor skills
│   │   ├── [advisor-skill]/           # ceo-advisor, cfo-advisor, cto-advisor, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-clevel-operations/      # 18 C-suite operations skills
│   │   ├── [ops-skill]/              # board-meeting, chief-of-staff, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-devops/                 # 17+ DevOps/infra skills
│   │   ├── [devops-skill]/            # aws-solution-architect, helm-chart-builder, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-finance/                # 3 finance skills
│   │   ├── [finance-skill]/           # financial-analyst, saas-metrics-coach, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-gamedev/                # Skills específicas de gamedev
│   │   ├── _rules/                    # Path-scoped rules gamedev
│   │   │   ├── ai-code.md             # NPC behavior trees, perception
│   │   │   ├── gameplay-code.md       # Delta-time, frame budgets
│   │   │   ├── engine-code.md         # Zero-alloc, hot paths
│   │   │   ├── shader-code.md         # Unity/Unreal shaders
│   │   │   ├── network-code.md        # Server-authoritative, rollback
│   │   │   ├── ui-code.md             # Game UI, gamepad support
│   │   │   ├── design-docs.md         # 8-section GDD structure
│   │   │   └── narrative.md           # Lore canon, dialogue
│   │   ├── _templates/                # Game-specific templates
│   │   ├── [gamedev-skill]/           # art-bible, balance-check, doc-gdd, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-git/                    # Git workflow skills
│   │   ├── [git-skill]/              # changelog, commit, create-pr, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-marketing-content/      # 8 content marketing skills
│   │   ├── [content-skill]/           # copywriting, content-production, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-marketing-growth/       # 10 growth marketing skills
│   │   ├── [growth-skill]/            # launch-strategy, paid-ads, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-marketing-seo/          # 11 SEO/CRO skills
│   │   ├── [seo-skill]/              # seo-audit, page-cro, ai-seo, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-marketing-strategy/     # 15 marketing strategy skills
│   │   ├── [strategy-skill]/          # pricing-strategy, brand-guidelines, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-regulatory/             # 13 regulatory/compliance skills
│   │   ├── [regulatory-skill]/        # gdpr-dsgvo-expert, soc2-compliance, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-security/               # 9+ security skills
│   │   ├── [security-skill]/          # ai-security, red-team, cloud-security, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── skills-testing/                # 13+ testing skills
│   │   ├── [testing-skill]/           # playwright-pro, tdd-guide, qa-plan, etc.
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── hooks/                         # Shell scripts para eventos
│   │   ├── session-start.sh           # Context load (branch, sprint, active.md)
│   │   ├── session-stop.sh
│   │   ├── detect-division.sh         # Multi-stack detection
│   │   ├── detect-gaps.sh             # Stack-aware doc gap analysis
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
│   ├── rules/                         # Path-scoped rules universales (software)
│   │   ├── backend-code.md            # Clean arch, DI, context, typed errors
│   │   ├── frontend-code.md           # React/Vue, server state, a11y, i18n
│   │   ├── api-code.md                # Contract-first, REST/GraphQL, RFC 7807
│   │   ├── migration-code.md          # Immutable, rollback, online schema
│   │   ├── infra-code.md              # IaC, K8s, CI/CD, least privilege
│   │   ├── ai-code.md                 # LLM/ML: prompts, eval, cost, injection
│   │   ├── data-files.md              # JSON/YAML/TOML schemas
│   │   ├── test-standards.md          # AAA, isolation, determinism
│   │   └── prototype-code.md          # Throwaway code boundaries
│   │
│   └── docs/                          # Documentación interna
│       ├── division-structure.md
│       ├── agent-hierarchy.md
│       ├── directory-structure.md
│       ├── coding-standards.md
│       ├── technical-preferences.md
│       ├── coordination-rules.md
│       ├── context-management.md
│       ├── workflow-catalog.yaml
│       ├── stack-registry.md
│       └── templates/                 # Document templates
│
├── src/                               # Código fuente del proyecto
├── assets/                            # Assets (art, audio, data)
├── design/                            # Design docs (GDDs, UX, API specs)
│   ├── gdd/                           # Game design documents
│   ├── ux/                            # UX specs per screen
│   ├── api/                           # OpenAPI / GraphQL / .proto contracts
│   └── registry/                      # Entity/formula registry
│
├── docs/                              # Documentación técnica
│   ├── architecture/                  # ADRs
│   ├── engine-reference/              # Engine-specific reference (gamedev)
│   └── api/                           # API documentation generada
│
├── tests/                             # Test suites
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── performance/
│   └── playtest/                      # Gamedev only
│
├── tools/                             # Build tools, scripts
├── prototypes/                        # Throwaway prototypes
├── skills-selftest/                   # QA framework for Arcane skills/agents themselves
│   ├── README.md                      # (self-contained, optional — safe to delete)
│   ├── CLAUDE.md
│   ├── catalog.yaml                   # Registry: 170 skills + 78 agents
│   ├── quality-rubric.md              # Category pass/fail metrics
│   ├── skills/[category]/             # Behavioral specs per skill
│   ├── agents/[tier]/                 # Behavioral specs per agent
│   ├── templates/                     # Spec templates
│   └── results/                       # Test run outputs (gitignored)
│
└── production/                        # Production state
    ├── session-state/                 # Current session tracking (active.md)
    ├── sprints/                       # Sprint plans
    ├── milestones/                    # Milestone tracking
    └── incidents/                     # Post-mortems
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
