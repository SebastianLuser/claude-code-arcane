#!/usr/bin/env bash
# Import CCGS (Claude-Code-Game-Studios) content
# Usage: bash scripts/import-ccgs.sh

set -e

CCGS_URL="https://github.com/Donchitos/Claude-Code-Game-Studios.git"
TEMP_DIR="/tmp/ccgs-import-$$"

echo "🎮 Importing Claude-Code-Game-Studios content..."

# Clone
echo "📥 Cloning CCGS..."
git clone --depth 1 "$CCGS_URL" "$TEMP_DIR"

# Agents: copy tier-3 specialists (don't overwrite our adapted directors/leads)
echo "👥 Importing tier-3 specialists..."
ADAPTED_AGENTS=(
  "creative-director" "technical-director" "producer"
  "game-designer" "lead-programmer" "art-director"
  "audio-director" "narrative-director" "qa-lead"
  "release-manager" "localization-lead"
)

for agent_file in "$TEMP_DIR/.claude/agents"/*.md; do
  agent_name=$(basename "$agent_file" .md)
  skip=false
  for adapted in "${ADAPTED_AGENTS[@]}"; do
    if [[ "$agent_name" == "$adapted" ]]; then
      skip=true
      break
    fi
  done
  if ! $skip; then
    cp "$agent_file" ".claude/agents/game/"
    echo "  + $agent_name"
  fi
done

# Skills: copy all except ones we already have
echo "🛠️ Importing skills..."
EXISTING_SKILLS=$(ls .claude/skills/ 2>/dev/null)

for skill_dir in "$TEMP_DIR/.claude/skills"/*/; do
  skill_name=$(basename "$skill_dir")
  if [[ ! -d ".claude/skills/$skill_name" ]]; then
    cp -r "$skill_dir" ".claude/skills/"
    echo "  + $skill_name"
  else
    echo "  = $skill_name (already exists, skipping)"
  fi
done

# Rules: copy game-related rules
echo "📜 Importing rules..."
mkdir -p .claude/rules
for rule in gameplay-code engine-code ai-code shader-code network-code design-docs narrative prototype-code ui-code test-standards data-files; do
  src="$TEMP_DIR/.claude/rules/${rule}.md"
  if [[ -f "$src" ]] && [[ ! -f ".claude/rules/${rule}.md" ]]; then
    cp "$src" ".claude/rules/"
    echo "  + ${rule}.md"
  fi
done

# Templates
echo "📋 Importing templates..."
mkdir -p .claude/docs/templates
if [[ -d "$TEMP_DIR/.claude/docs/templates" ]]; then
  cp -r "$TEMP_DIR/.claude/docs/templates/"* ".claude/docs/templates/"
  echo "  + $(ls .claude/docs/templates/ | wc -l) templates"
fi

# Cleanup
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Import complete!"
echo ""
echo "📊 Final counts:"
echo "  Agents: $(find .claude/agents -name '*.md' | wc -l)"
echo "  Skills: $(find .claude/skills -name 'SKILL.md' -o -name 'skill.md' | wc -l)"
echo "  Rules: $(find .claude/rules -name '*.md' 2>/dev/null | wc -l)"
echo "  Templates: $(find .claude/docs/templates -name '*.md' 2>/dev/null | wc -l)"
echo ""
echo "Next: run /start in Claude Code to begin"
