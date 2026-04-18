# Claude Code Arcane

> **Skills, agents, hooks y rules para Claude Code — deploy selectivo por perfil.**

Un harness de configuración que proyectos importan copiando `.claude/`. En vez de cargar 150+ skills en cada proyecto (tokens desperdiciados), elegís un **perfil** que matchee tu stack y solo se instalan las herramientas relevantes.

---

## Quick Start

```bash
# 1. Clonar e instalar el CLI
git clone https://github.com/SebastianLuser/claude-code-arcane.git
cd claude-code-arcane
pip install -e .

# 2. Ir a tu proyecto
cd ~/projects/my-game

# 3. Instalar un perfil
arcane install unity-dev

# 4. Abrir Claude Code
claude
```

Si `arcane` no está en PATH, usá `python -m arcane` en su lugar.

## Menú Interactivo

Sin argumentos, `arcane install` abre un selector de perfiles:

```bash
cd ~/projects/my-game
arcane install
```

Usá flechas para navegar, espacio para seleccionar, enter para confirmar.

---

## Perfiles Disponibles

### Base (elegí uno o combiná varios)

| Perfil | Stack |
|--------|-------|
| `unity-dev` | Programador Unity — C#, arquitectura, performance |
| `unity-design` | Game Designer — GDDs, balance, art bible, playtesting |
| `backend-go` | Backend Go — Clean Arch, DB, auth, API |
| `backend-ts` | Backend TypeScript — Fastify, Prisma, Zod |
| `frontend` | React + Vite + TypeScript |
| `mobile` | React Native + Expo |

### Add-ons (combiná con `+`)

| Add-on | Agrega |
|--------|--------|
| `+agile` | Sprints, standups, retros, estimates |
| `+clickup` | ClickUp via MCP |
| `+jira` | Jira via REST API |
| `+design` | Figma, UX review, handoff |
| `+infra` | Terraform, tracing, SLOs, K8s |
| `+testing` | Contract, performance, regression testing |
| `+teams` | Game team orchestration + 40 agents |
| `+ops` | Runbooks, rollback, backup, secrets |

### Core (siempre incluido)

15 skills universales (commit, create-pr, changelog, check, code-review, etc.), 14 hooks, 3 rules base, y permissions de seguridad.

---

## Comandos

```bash
arcane install                          # Menú interactivo
arcane install unity-dev                # Perfil directo
arcane install unity-dev+agile+clickup  # Combo
arcane install --dry-run unity-dev      # Preview sin instalar

arcane list                             # Ver perfiles disponibles
arcane status                           # Ver instalación actual
arcane clean                            # Remover Arcane del proyecto
```

## Ejemplos por Proyecto

```bash
# Unity solo dev
arcane install unity-dev

# Unity con equipo completo
arcane install unity-dev+unity-design+teams+agile+clickup

# Go microservice con infra
arcane install backend-go+infra+agile+jira

# Full-stack monorepo
arcane install backend-ts+frontend+testing

# Mobile app
arcane install mobile+agile+clickup
```

---

## Qué se Instala

```
my-project/.claude/
├── settings.json          # Permissions + hooks
├── arcane-manifest.json   # Metadata de la instalación
├── statusline.sh
├── hooks/                 # 14 hooks de lifecycle
├── skills/                # Solo los skills de tu perfil
├── rules/                 # Rules de tu stack
├── agents/                # Agents (si el perfil los incluye)
└── docs/                  # Documentación de referencia
```

## Filosofía

- **Selectivo:** solo instalás lo que necesitás — menos tokens, mejor performance
- **Reemplazable:** cambiar de perfil reemplaza la config anterior (con backup)
- **Colaborativo:** Question → Options → Decision → Draft → Approval
- **Deduplicado:** perfiles combinados no duplican skills

---

## Docs

- **[User Guide](docs/USER-GUIDE.md)** — guía completa con todos los perfiles detallados
- **[Skills Catalog](docs/SKILLS-CATALOG.md)** — catálogo completo de skills

## Legacy

El script `setup.sh` sigue disponible como alternativa al CLI:

```bash
./setup.sh --profile unity-dev --target ~/projects/my-game
```

---

## Compatibilidad

- **OS:** Windows 10/11, macOS, Linux
- **Python:** 3.9+
- **Claude Code:** v1.0+
- **Idioma:** Español (comunicación) + English (código/commits)
