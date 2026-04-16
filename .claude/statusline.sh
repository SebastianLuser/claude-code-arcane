#!/usr/bin/env bash
# Claude Code Mega Studios - Status Line

# Detectar branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "no-git")

# Detectar división activa (si existe session state)
DIVISION="?"
if [[ -f "production/session-state/active.md" ]]; then
  DIVISION=$(grep -m1 "^Division:" "production/session-state/active.md" 2>/dev/null | sed 's/Division: //' || echo "?")
fi

# Contar agentes y skills disponibles
AGENTS=$(find .claude/agents -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
SKILLS=$(find .claude/skills -name "SKILL.md" -o -name "skill.md" 2>/dev/null | wc -l | tr -d ' ')

# Output
echo "🎬 Mega Studios | 🌿 ${BRANCH} | 🏢 Div: ${DIVISION} | 👥 ${AGENTS} agents | 🛠️ ${SKILLS} skills"
