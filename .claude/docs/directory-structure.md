# Estructura de Directorios

```
Claude-Code-Mega-Studios/
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
│   ├── skills/                        # 244 skills (subdir per skill)
│   │   ├── [skill-name]/
│   │   │   └── SKILL.md
│   │   └── ...
│   │
│   ├── hooks/                         # Shell scripts para eventos
│   │   ├── session-start.sh
│   │   ├── session-stop.sh
│   │   ├── validate-commit.sh
│   │   ├── validate-push.sh
│   │   ├── validate-secrets.sh
│   │   ├── validate-assets.sh
│   │   ├── validate-skill-change.sh
│   │   ├── detect-division.sh
│   │   ├── notify.sh
│   │   ├── pre-compact.sh
│   │   ├── post-compact.sh
│   │   ├── log-agent.sh
│   │   └── log-agent-stop.sh
│   │
│   ├── rules/                         # Path-scoped coding standards
│   │   ├── backend-code.md
│   │   ├── frontend-code.md
│   │   ├── gameplay-code.md
│   │   ├── engine-code.md
│   │   ├── ai-code.md
│   │   ├── shader-code.md
│   │   ├── network-code.md
│   │   ├── ui-code.md
│   │   ├── data-files.md
│   │   ├── design-docs.md
│   │   ├── narrative.md
│   │   ├── prototype-code.md
│   │   ├── test-standards.md
│   │   ├── infra-code.md
│   │   ├── api-code.md
│   │   └── migration-code.md
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
├── design/                            # Design docs (GDDs, UX specs)
│   ├── gdd/                           # Game design documents
│   ├── ux/                            # UX specs per screen
│   └── registry/                      # Entity/formula registry
│
├── docs/                              # Documentación técnica
│   ├── architecture/                  # ADRs
│   ├── engine-reference/              # Engine-specific reference
│   └── api/                           # API documentation
│
├── tests/                             # Test suites
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── performance/
│
├── tools/                             # Build tools, scripts
├── prototypes/                        # Throwaway prototypes
└── production/                        # Production state
    ├── session-state/                 # Current session tracking
    ├── sprints/                       # Sprint plans
    ├── milestones/                    # Milestone tracking
    └── incidents/                     # Post-mortems
```
