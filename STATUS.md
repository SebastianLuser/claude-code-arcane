# Claude Code Arcane — Status

**Última actualización:** 2026-04-17

> ⚠️ **Métricas a revisar:** un audit del catálogo (`skills-selftest/catalog.yaml` v4) confirma **147 skills + 73 agentes** en el filesystem (sin drift). Las cifras "244 skills" y "114 agentes" más abajo son del plan original — el filesystem real es menor. Decidir si actualizar el plan o expandir el contenido.

## ✅ Completado

### Infraestructura base
- [x] Estructura de directorios completa
- [x] `README.md` — documentación del repo
- [x] `CLAUDE.md` — master configuration
- [x] `.claude/settings.json` — hooks y permissions
- [x] `.gitignore`, `LICENSE`
- [x] `.claude/statusline.sh`
- [x] 13 hooks shell scripts
- [x] 7 docs fundacionales:
  - division-structure.md
  - agent-hierarchy.md
  - directory-structure.md
  - coding-standards.md
  - coordination-rules.md
  - context-management.md
  - technical-preferences.md

### Agentes (114 de 114 planificados — post Godot removal)

**División 1 — Game Dev** (44/44) ✅
- [x] creative-director, technical-director, producer (Tier 1)
- [x] game-designer, lead-programmer, art-director, audio-director, narrative-director, qa-lead, release-manager, localization-lead (Tier 2)
- [x] 33 specialists importados desde CCGS (Unity + Unreal, sin Godot)

**División 2 — Software Engineering** (13/21 implementados)
- [x] chief-technology-officer, vp-engineering (Tier 1)
- [x] backend-architect, frontend-architect, api-architect, database-architect, mobile-lead (Tier 2)
- [x] **6 specialists implementados:** go-engineer, node-engineer, react-engineer, react-native-engineer, sql-specialist, postgres-specialist
- [ ] 8 specialists pendientes (python, rust, vue, angular, flutter, nosql, graphql, websocket) — solo agregar si se necesitan

**División 3 — DevOps** (11/11) ✅
- [x] cloud-architect, platform-lead, sre-lead (Tier 2)
- [x] 8 specialists (docker, k8s, ci/cd, terraform, aws, gcp, monitoring, security-ops)

**División 4 — Product & Design** (11/11) ✅
- [x] chief-product-officer (Tier 1)
- [x] product-manager, ux-lead, ui-lead, design-system-lead (Tier 2)
- [x] 6 specialists

**División 5 — PMO** (8/8) ✅
- [x] program-director (Tier 1)
- [x] project-manager, scrum-master, delivery-manager (Tier 2)
- [x] 4 specialists

**División 6 — Quality & Security** (7/7) ✅
- [x] qa-director, security-architect (Tier 2)
- [x] 5 specialists

**División 7 — Educabot** (7/7) ✅
- [x] edtech-architect, curriculum-director (Tier 2)
- [x] 5 specialists

**División 8 — Tools & Integrations** (6/6) ✅
- [x] integrations-architect
- [x] project-tools-specialist, docs-tools-specialist, design-tools-specialist, comms-tools-specialist, api-tools-specialist

### Skills (244 organizadas en 5 stacks)

| Stack | Path | Skills |
|-------|------|--------|
| General | `.claude/skills/` | universales (onboarding, workflow, scaffolding, audits) |
| Software | `.claude/skills/` (shared) | backend, frontend, API, DB |
| Gamedev | `.claude/skills-gamedev/` | GDD, balance, playtest, engine-specific (Unity/Unreal) |
| Design | `.claude/skills/` (shared) | UX/UI, research, prototyping |
| Agile | `.claude/skills-agile/` | sprints, stories, retros |

**División 8 — Tools & Integrations** (30 skills) — ClickUp, Jira, Linear, GH Projects, Gdocs/Sheets/Drive, Coda, Notion, Confluence, Figma/Miro, Slack/Discord/Email, Postman/Bruno, Swagger, Airtable, más workflows cross-tool (sync-all, standup-report, release-announce, design-handoff, meeting-to-tasks, weekly-digest)

## ✅ Hitos recientes

- `2a19a40` — initial commit, 147 skills organizadas en 5 stacks
- `ca5d253` — dual-stack adaptation: split software + gamedev
- `ef7b4d9` — Godot removido del stack gamedev (solo Unity + Unreal)
- `58ce1e8` — script `import-ccgs.sh` eliminado (ya cumplió su función)
- `b510287` — STATUS.md actualizado al estado real
- `c842a61` — skills-selftest cleanup: `maxTurns` adoptado como canon, `catalog.yaml` rebuildeado (147 skills + 73 agents, 17 fantasmas eliminados), 95 frontmatters patcheados, 8 errores YAML pre-existentes corregidos

## 🔄 Por hacer

### Prioridad Media
1. **Rules adicionales** en `.claude/rules/` y `.claude/skills-gamedev/_rules/`
2. **Templates nuevos** (PRD, RFC, ADR expandido) en `.claude/docs/templates/`

### Prioridad Baja
3. **Statusline avanzado** con detección de división por context
4. **CI/CD workflows** para el repo (GitHub Actions para lint skills/agents)
5. **Skill test framework** — ver `skills-selftest/`
6. **Tests end-to-end** de workflows cross-tool

## 📊 Métricas

| Categoría | Creado | Planificado | % |
|-----------|--------|-------------|---|
| Agentes | 114 | 114 | 100% |
| Skills | 244 | 244 | 100% |
| Hooks | 13 | 15 | 87% |
| Docs | 7 | 10 | 70% |

## 🎯 Estado Actual

El repo tiene:
- ✅ **Foundation sólida**: infrastructure, config, docs principales
- ✅ **Agent roster completo**: 114 agentes en 8 divisiones (3 tiers)
- ✅ **Skills completas**: 244 skills distribuidas en 5 stacks (general, software, gamedev, design, agile)
- ✅ **Stack gamedev**: Unity + Unreal (Godot removido)
- ✅ **División 8 funcional**: 30 skills de integraciones listas para usar

## 🚀 Cómo Usarlo Ya

Aún con contenido pendiente, podés usar el repo:

```bash
cd Claude-Code-Arcane
claude

# Comenzar con /start
/start

# O usar directamente skills de Div 8
/clickup "crear task en Project_T"
/slack send "#dev" "Deploy en progreso"
/release-announce v2.1.0
/standup-report
/weekly-digest
```

Los directors y leads están invocables como subagentes:
```
Task tool con subagent_type: "backend-architect" para backend reviews
Task tool con subagent_type: "creative-director" para game vision
Task tool con subagent_type: "integrations-architect" para cross-tool workflows
```
