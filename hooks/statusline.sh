#!/usr/bin/env bash
# Claude Code Arcane - Status Line
# Reads Claude Code session JSON from stdin and prints a status line.

INPUT=$(cat)

PROJECT=$(basename "$(pwd)")

if command -v git &>/dev/null && git rev-parse --is-inside-work-tree &>/dev/null; then
  BRANCH=$(git branch --show-current 2>/dev/null)
else
  BRANCH=""
fi

# Skills/agents Claude can actually invoke = global (~/.claude) + project (.claude),
# deduped by name (project overrides global). Follow -L so .claude/skills junctions count.
# Top-level only (mindepth/maxdepth 2) so bundled sub-skills don't inflate the total.
#
# Names are extracted with a single awk, never `xargs -n1 dirname|basename`: that spawned one
# process per file (~160 here), which cost ~1.7s of the ~2.5s total on Windows and made the
# status line miss its execution window under load — Claude Code drops the output on a
# non-zero exit or an abort, so the bar vanished at random.
SKILLS=$( { find -L "$HOME/.claude/skills" -mindepth 2 -maxdepth 2 -name "SKILL.md" 2>/dev/null;
            find -L .claude/skills          -mindepth 2 -maxdepth 2 -name "SKILL.md" 2>/dev/null; } \
          | awk -F/ 'NF>1{print $(NF-1)}' | sort -u | wc -l | tr -d ' ')
AGENTS=$( { find -L "$HOME/.claude/agents" -name "*.md" 2>/dev/null;
            find -L .claude/agents         -name "*.md" 2>/dev/null; } \
          | awk -F/ '{print $NF}' | sort -u | wc -l | tr -d ' ')

# Model and context come from statusline.mjs. Installed, this script sits at
# .claude/statusline.sh and the .mjs in .claude/hooks/; in the repo they are side by side.
HERE=$(dirname "${BASH_SOURCE[0]}")
MJS="$HERE/statusline.mjs"
[ -f "$MJS" ] || MJS="$HERE/hooks/statusline.mjs"

MODEL=""
EXTRA=""
if [ -f "$MJS" ] && command -v node &>/dev/null; then
  OUT=$(node "$MJS" <<< "$INPUT" 2>/dev/null)
  MODEL=$(echo "$OUT" | grep '^MODEL=' | head -1 | sed 's/^MODEL=//')
  EXTRA=$(echo "$OUT" | grep '^EXTRA=' | head -1 | sed 's/^EXTRA=//')
fi

PREFIX="🔮 ${PROJECT}"
[ -n "$MODEL" ] && PREFIX="⚡ ${MODEL} | ${PREFIX}"

PARTS="${PREFIX}"
[ -n "$BRANCH" ] && PARTS="${PARTS} | 🌿 ${BRANCH}"
PARTS="${PARTS} | 🛠️ ${SKILLS:-0} skills"
case "$AGENTS" in
  ''|*[!0-9]*) ;;
  0) ;;
  *) PARTS="${PARTS} | 🤖 ${AGENTS} agents" ;;
esac
[ -n "$EXTRA" ] && PARTS="${PARTS} | ${EXTRA}"

echo "$PARTS"

# Claude Code discards the status line on a non-zero exit, so never inherit one from the
# last conditional above.
exit 0
