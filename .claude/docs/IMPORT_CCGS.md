# Importar Contenido de Claude-Code-Game-Studios

División 1 (Game Development) está basada en [Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) por Donchitos.

Ya tenés los agentes **Tier 1 (directors) y Tier 2 (leads)** adaptados en `.claude/agents/game/`. Pero faltan:
- **38 specialists** (Tier 3)
- **72 skills completas**
- **11 path-scoped rules**
- **39 document templates**

Este doc explica cómo importarlos.

## Opción 1: Clonar y copiar selectivamente (recomendado)

```bash
# Clonar CCGS en temp
git clone https://github.com/Donchitos/Claude-Code-Game-Studios.git /tmp/ccgs

# Copiar specialists que no tenés
cp /tmp/ccgs/.claude/agents/*.md .claude/agents/game/ 2>/dev/null

# Evitar overwrite de los que ya adaptaste
git checkout .claude/agents/game/creative-director.md
git checkout .claude/agents/game/technical-director.md
git checkout .claude/agents/game/producer.md
git checkout .claude/agents/game/game-designer.md
git checkout .claude/agents/game/lead-programmer.md
git checkout .claude/agents/game/art-director.md
git checkout .claude/agents/game/audio-director.md
git checkout .claude/agents/game/narrative-director.md
git checkout .claude/agents/game/qa-lead.md
git checkout .claude/agents/game/release-manager.md
git checkout .claude/agents/game/localization-lead.md

# Copiar skills
cp -r /tmp/ccgs/.claude/skills/* .claude/skills/

# Copiar rules específicas de juegos
cp /tmp/ccgs/.claude/rules/gameplay-code.md .claude/rules/
cp /tmp/ccgs/.claude/rules/engine-code.md .claude/rules/
cp /tmp/ccgs/.claude/rules/ai-code.md .claude/rules/
cp /tmp/ccgs/.claude/rules/shader-code.md .claude/rules/
cp /tmp/ccgs/.claude/rules/network-code.md .claude/rules/
cp /tmp/ccgs/.claude/rules/design-docs.md .claude/rules/
cp /tmp/ccgs/.claude/rules/narrative.md .claude/rules/
cp /tmp/ccgs/.claude/rules/prototype-code.md .claude/rules/

# Copiar templates
mkdir -p .claude/docs/templates
cp /tmp/ccgs/.claude/docs/templates/*.md .claude/docs/templates/

# Cleanup
rm -rf /tmp/ccgs
```

## Opción 2: Solo skills que necesitás

Si solo querés las skills específicas que vas a usar:

```bash
cd .claude/skills
for skill in brainstorm setup-engine art-bible design-system design-review prototype playtest-report; do
  curl -sL "https://raw.githubusercontent.com/Donchitos/Claude-Code-Game-Studios/main/.claude/skills/${skill}/SKILL.md" \
    -o "${skill}/SKILL.md" 2>/dev/null || mkdir -p "$skill" && \
  curl -sL "https://raw.githubusercontent.com/Donchitos/Claude-Code-Game-Studios/main/.claude/skills/${skill}/SKILL.md" \
    -o "${skill}/SKILL.md"
done
```

## Lista completa de skills de CCGS a considerar

### Onboarding & Navigation (5)
start (⚠️ ya tenemos nuestra versión), help, project-stage-detect, setup-engine, adopt

### Game Design (6)
brainstorm, map-systems, design-system, quick-design, review-all-gdds, propagate-design-change

### Art & Assets (3)
art-bible, asset-spec, asset-audit

### UX & Interface Design (2)
ux-design, ux-review

### Architecture (4)
create-architecture, architecture-decision, architecture-review, create-control-manifest

### Stories & Sprints (8)
create-epics, create-stories, dev-story, sprint-plan, sprint-status, story-readiness, story-done, estimate

### Reviews & Analysis (9)
design-review, code-review, balance-check, content-audit, scope-check, perf-profile, tech-debt, gate-check, consistency-check

### QA & Testing (10)
qa-plan, smoke-check, soak-test, regression-suite, test-setup, test-helpers, test-evidence-review, test-flakiness, skill-test, skill-improve

### Production (6)
milestone-review, retrospective, bug-report, bug-triage, reverse-document, playtest-report

### Release (5)
release-checklist, launch-checklist, changelog (⚠️ ya tenemos), patch-notes, hotfix

### Creative & Content (3)
prototype, onboard (⚠️ ya tenemos), localize

### Team Orchestration (9)
team-combat, team-narrative, team-ui, team-release, team-polish, team-audio, team-level, team-live-ops, team-qa

## Lista completa de agentes (specialists) de CCGS

### Engineering (6)
gameplay-programmer, engine-programmer, ai-programmer, network-programmer, tools-programmer, ui-programmer

### Design (3)
systems-designer, level-designer, economy-designer

### Art (6)
technical-artist, sound-designer, writer, world-builder, ux-designer, prototyper

### Ops (8)
performance-analyst, devops-engineer, analytics-engineer, security-engineer, qa-tester, accessibility-specialist, live-ops-designer, community-manager

### Godot (5)
godot-specialist, godot-gdscript-specialist, godot-csharp-specialist, godot-shader-specialist, godot-gdextension-specialist

### Unity (5)
unity-specialist, unity-dots-specialist, unity-shader-specialist, unity-addressables-specialist, unity-ui-specialist

### Unreal (5)
unreal-specialist, ue-gas-specialist, ue-blueprint-specialist, ue-replication-specialist, ue-umg-specialist

## Verificación post-import

```bash
# Contar agentes
find .claude/agents -name "*.md" | wc -l
# Esperado: ~119 (49 game + 70 otros)

# Contar skills
find .claude/skills -name "SKILL.md" -o -name "skill.md" | wc -l
# Esperado: ~244

# Validar que no hay conflictos
ls .claude/skills/ | sort | uniq -d  # debería ser vacío
```

## Licencia

CCGS está bajo MIT License. Mantener el copyright notice en archivos importados.
