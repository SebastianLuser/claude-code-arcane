#!/usr/bin/env bash
# A-lite migration: symlink Arcane skills/agents/rules into ~/.claude/
# Leaves CLAUDE.md, settings.json, hooks/ untouched (no extra tokens per session).
# Backs up legacy ~/.claude/commands/ and ~/.claude/skills/ (conflict with Arcane skills).
#
# Usage:
#   bash tools/migrate-to-arcane-global.sh
#
# Override paths if Arcane lives elsewhere:
#   ARCANE_WIN='C:\path\to\Arcane' ARCANE_BASH=/c/path/to/Arcane bash tools/migrate-to-arcane-global.sh

set -euo pipefail

: "${ARCANE_WIN:=C:\\Users\\Educabot\\Desktop\\Personal\\Claude-Code-Arcane}"
: "${ARCANE_BASH:=$HOME/Desktop/Personal/Claude-Code-Arcane}"
: "${GLOBAL_WIN:=C:\\Users\\Educabot\\.claude}"
: "${GLOBAL_BASH:=$HOME/.claude}"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$HOME/.claude-backup-$TIMESTAMP"

TARGETS=(agents skills skills-software skills-gamedev skills-agile rules)
EXTRA_BACKUP=(commands)

echo "=== Arcane -> Global symlink (A-lite) ==="
echo "  Source : $ARCANE_BASH/.claude"
echo "  Target : $GLOBAL_BASH"
echo "  Backup : $BACKUP_DIR"
echo ""

[ -d "$ARCANE_BASH/.claude" ] || { echo "ERROR: Arcane not found at $ARCANE_BASH/.claude"; exit 1; }
for d in "${TARGETS[@]}"; do
  [ -d "$ARCANE_BASH/.claude/$d" ] || { echo "ERROR: missing $ARCANE_BASH/.claude/$d"; exit 1; }
done

echo "Plan:"
for d in "${TARGETS[@]}";    do echo "  symlink  $GLOBAL_BASH/$d -> $ARCANE_BASH/.claude/$d"; done
for d in "${EXTRA_BACKUP[@]}"; do echo "  backup   $GLOBAL_BASH/$d (legacy, conflicts with Arcane skills)"; done
echo "  KEEP     $GLOBAL_BASH/{CLAUDE.md, settings.json, hooks/, ...}"
echo ""
read -rp "Proceed? [y/N] " ans
[[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

# Step 1: backup existing dirs
mkdir -p "$BACKUP_DIR"
for d in "${TARGETS[@]}" "${EXTRA_BACKUP[@]}"; do
  path="$GLOBAL_BASH/$d"
  if [ -L "$path" ]; then
    echo "  rm existing symlink: $path"
    rm "$path"
  elif [ -e "$path" ]; then
    echo "  mv to backup: $path"
    mv "$path" "$BACKUP_DIR/"
  fi
done

# Step 2: create junctions
for d in "${TARGETS[@]}"; do
  src="$ARCANE_WIN\\.claude\\$d"
  tgt="$GLOBAL_WIN\\$d"
  echo "  mklink /J \"$tgt\" \"$src\""
  cmd //c "mklink /J \"$tgt\" \"$src\"" >/dev/null
done

# Step 3: verify
echo ""
echo "=== Verification ==="
ok=1
for d in "${TARGETS[@]}"; do
  if [ -d "$GLOBAL_BASH/$d" ]; then
    n=$(ls "$GLOBAL_BASH/$d" 2>/dev/null | wc -l)
    printf "  OK   %s (%s entries)\n" "$GLOBAL_BASH/$d" "$n"
  else
    printf "  FAIL %s\n" "$GLOBAL_BASH/$d"
    ok=0
  fi
done

echo ""
if [ "$ok" = "1" ]; then
  echo "Migration complete."
else
  echo "WARNING: some junctions failed. Restore from backup if needed."
fi
echo "  Backup: $BACKUP_DIR"
echo ""
echo "Rollback (if needed):"
echo "  for d in ${TARGETS[*]} ${EXTRA_BACKUP[*]}; do rm -rf \"$GLOBAL_BASH/\$d\"; done"
echo "  mv $BACKUP_DIR/* $GLOBAL_BASH/"
echo ""
echo "Test from any directory:"
echo "  cd \$HOME && claude"
echo "  Then check: /scaffold-go, /jira-tickets, etc. should be available."
