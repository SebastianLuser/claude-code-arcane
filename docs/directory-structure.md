# Estructura de Directorios

Hay dos layouts distintos y conviene no mezclarlos:

- **El repo** (`claude-code-arcane/`): la fuente. Acá se edita el contenido y el instalador.
- **Un proyecto instalado** (`<proyecto>/.claude/`): lo que `npx claude-code-arcane install <profile>` copia. Solo llega lo que algún profile lista.

## El repo

```
claude-code-arcane/
├── CLAUDE.md                          # Guía para trabajar en este repo
├── README.md                          # Documentación pública
├── CHANGELOG.md                       # Generado por semantic-release, no se edita a mano
├── ATTRIBUTION.md                     # Origen del contenido adaptado de terceros
├── LICENSE
├── package.json                       # CLI npm: build (tsup), test (vitest), test:skills (Python)
├── tsconfig.json
├── vitest.config.ts                   # Aísla ARCANE_SOURCE y ARCANE_HOME para la suite
├── .releaserc.json                    # semantic-release
│
├── src/                               # Instalador TypeScript (único código con build y typecheck)
│   ├── cli.ts                         # Entry point: arcane install/add/remove/update/...
│   ├── commands/                      # Un archivo por subcomando
│   ├── installer.ts                   # Copia contenido a .claude/ y genera settings.json
│   ├── profiles.ts                    # Parser y merge de profiles/*.yaml
│   ├── agent-entries.ts               # Entradas de agentes: división entera o agente suelto
│   ├── content-source.ts, cache.ts    # Fuente del contenido: bundled / github / cache
│   ├── manifest.ts, content-hash.ts   # arcane-manifest.json y hashes para update
│   ├── registry.ts                    # ~/.arcane/installations.json
│   ├── worktree.ts                    # Instalación en git worktrees
│   ├── wizard.ts, detect.ts           # Wizard interactivo y auto-detección de stack
│   └── __tests__/                     # Suite vitest, incluidos los invariantes de docs
│
├── profiles/                          # Profiles declarativos (.yaml); core.yaml siempre se carga
│
├── skills/                            # Un directorio por skill: SKILL.md + references/ + scripts/
│
├── agents/                            # 115 agent definitions (root level)
│   ├── ai/                            # 4 agents
│   ├── audio/                         # 6 agents
│   ├── business/                      # 3 agents
│   ├── career/                        # 4 agents
│   ├── clevel/                        # 6 agents
│   ├── devops/                        # 4 agents
│   ├── ecommerce/                     # 1 agent
│   ├── engineering/                   # 19 agents
│   ├── freelance/                     # 4 agents
│   ├── game/                          # 32 agents
│   ├── integrations/                  # 6 agents
│   ├── management/                    # 4 agents
│   ├── marketing/                     # 5 agents
│   ├── product/                       # 5 agents
│   ├── quality/                       # 3 agents
│   ├── regulatory/                    # 3 agents
│   └── visualnovel/                   # 6 agents
│
├── rules/                             # Rules universales (rules.universal en los profiles)
│   └── gamedev/                       # Rules de gamedev (rules.gamedev en los profiles)
│
├── hooks/                             # Scripts bash de lifecycle; statusline.sh incluido
├── output-styles/                     # Output styles (arcane.md)
├── templates/
│   └── gamedev/                       # Plantillas de GDD y docs de juego
├── docs/                              # Documentación; se copia entera a .claude/docs/
│   ├── templates/                     # Plantillas de ADR, PRD, RFC, test plan, etc.
│   ├── gates/                         # Gates de fase (software y gamedev)
│   └── gamedev/, software/            # coding-standards por dominio
│
├── skills-selftest/                   # QA de skills y agentes (no se instala)
│   ├── CLAUDE.md
│   ├── catalog.yaml                   # Registro de skills y agentes con su spec
│   ├── quality-rubric.md              # Métricas por categoría
│   ├── skills/<categoria>/            # Specs de comportamiento por skill
│   ├── agents/<tier>/                 # Specs de comportamiento por agente
│   └── templates/                     # Plantillas para specs nuevos
│
├── tests/                             # Specs Python de los scripts de skills (npm run test:skills)
├── maintainers/                       # Cómo publicar Arcane (release, npm). No se instala ni se publica
├── scripts/                           # Utilidades de mantenimiento del repo
├── .github/workflows/                 # ci.yml (vitest, typecheck, specs Python) y release.yml (semantic-release)
└── .claude/                           # La instalación de Arcane que usa este mismo repo
```

## Un proyecto instalado

```
<proyecto>/
├── .claude/
│   ├── settings.json                  # Generado: permisos, hooks y statusline
│   ├── arcane-manifest.json           # Profiles instalados y content_hashes de cada archivo
│   ├── skills/<skill>/                # Los skills de los profiles elegidos, con sus references/ y scripts/
│   │   └── _templates/                # templates/gamedev/, solo si algún profile trae rules de gamedev
│   ├── agents/<division>/             # Divisiones enteras o agentes sueltos, según el profile
│   ├── rules/                         # Universales y de gamedev juntas, en un solo nivel
│   ├── hooks/                         # Todos los hooks de hooks/ salvo statusline.sh
│   ├── statusline.sh                  # Solo con el profile statusline
│   ├── output-styles/                 # Solo si algún profile declara output_styles
│   ├── docs/                          # Copia de docs/; arcane update la mantiene al día
│   └── .arcane-trash/                 # Lo que arcane update saca; nunca se borra con rm
├── .claude.bak/                       # Backup de .claude/ antes de instalar
└── production/session-state/          # Estado de sesión que escriben los hooks
```

Fuera del proyecto, `~/.arcane/` guarda el registro de instalaciones (`installations.json`) y el contenido descargado de GitHub (`cache/<version>/`). `ARCANE_HOME` lo desvía.

En un git worktree, `hooks/` y `docs/` son symlinks al worktree principal; `skills/`, `agents/` y `rules/` se copian para que puedan divergir por rama.

## Rules: dos carpetas en el repo, una en el proyecto

- **`rules/`**: reglas para cualquier stack de software (backend, frontend, APIs, DBs, infra, apps LLM). Paths genéricos como `src/api/**` o `src/components/**`.
- **`rules/gamedev/`**: reglas exclusivas de gamedev (frame budgets, shaders, IA de NPCs, GDDs, lore). Paths como `src/gameplay/**`, `assets/shaders/**` o `design/gdd/**`.

El installer copia las dos al mismo `.claude/rules/`, sin subcarpeta. Por eso un nombre no puede repetirse entre las dos carpetas: el segundo archivo pisaría al primero. La rule de apps LLM se llama `llm-code.md` justamente para no chocar con `gamedev/ai-code.md`, que es la de IA de NPCs.

Cuando un proyecto es dual (por ejemplo web + juego), las dos familias aplican cada una por sus paths.

## Hooks: cómo se cablean

Los eventos los define `src/installer.ts` al generar `settings.json`, no los profiles. Todo proyecto instalado recibe estos:

| Evento | Hooks |
|--------|-------|
| SessionStart | `session-start.sh` → `detect-division.sh` → `detect-unreal.sh` → `detect-gaps.sh` → `check-update.sh` |
| PreToolUse (`Bash`) | `validate-commit.sh`, `validate-push.sh`, `validate-secrets.sh` |
| PostToolUse (`Write\|Edit`) | `validate-assets.sh`, `validate-skill-change.sh` |
| Notification | `notify.sh` |
| PreCompact / PostCompact | `pre-compact.sh` / `post-compact.sh` |
| Stop | `session-stop.sh` |
| SubagentStart / SubagentStop | `log-agent.sh` / `log-agent-stop.sh` |

La statusline (`statusline.sh`) se configura aparte, solo con el profile `statusline`.
