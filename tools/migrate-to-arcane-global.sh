#!/usr/bin/env bash
# A-lite migration: symlink Arcane skills/agents/rules into %USERPROFILE%\.claude\
# Leaves CLAUDE.md, settings.json, hooks/ untouched.
# Backs up legacy commands/ + skills/ (Arcane has equivalents).
#
# Auto-detects:
#   - ARCANE root from script location (parent of tools/)
#   - Windows %USERPROFILE% via cmd (not $HOME, which differs in MSYS2/WSL)
#
# Usage:  bash tools/migrate-to-arcane-global.sh
# Note:   Must be run OUTSIDE an active Claude Code session
#         (Claude locks ~/.claude/skills and ~/.claude/commands)

set -euo pipefail

# --- Auto-detect paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCANE_BASH="$(cd "$SCRIPT_DIR/.." && pwd)"

# Get the real Windows %USERPROFILE% via cmd (works regardless of $HOME)
USERPROFILE_WIN=$(cmd //c "echo %USERPROFILE%" 2>/dev/null | tr -d '\r\n')
if [ -z "$USERPROFILE_WIN" ]; then
  echo "ERROR: cannot detect Windows %USERPROFILE%. Are you on Windows?"
  exit 1
fi

# Convert Arcane bash path to Windows path
if command -v cygpath >/dev/null 2>&1; then
  ARCANE_WIN=$(cygpath -w "$ARCANE_BASH")
else
  ARCANE_WIN=$(cd "$ARCANE_BASH" && pwd -W 2>/dev/null | sed 's|/|\\|g')
fi
if [ -z "$ARCANE_WIN" ]; then
  echo "ERROR: cannot convert Arcane path to Windows format"
  exit 1
fi

GLOBAL_WIN="$USERPROFILE_WIN\\.claude"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_WIN="$USERPROFILE_WIN\\.claude-backup-$TIMESTAMP"

TARGETS=(agents skills skills-git skills-testing skills-docs skills-frontend skills-mobile skills-backend skills-devops skills-agile skills-design skills-gamedev skills-integrations skills-release skills-security skills-arcane rules)
EXTRA_BACKUP=(commands)

echo "=== Arcane -> Global symlink (A-lite) ==="
echo "  Source : $ARCANE_WIN\\.claude"
echo "  Target : $GLOBAL_WIN"
echo "  Backup : $BACKUP_WIN"
echo ""

# Sanity check via cmd (works even if bash $HOME differs)
for d in "${TARGETS[@]}"; do
  if ! cmd //c "if exist \"$ARCANE_WIN\\.claude\\$d\" (exit 0) else (exit 1)" >/dev/null 2>&1; then
    echo "ERROR: missing $ARCANE_WIN\\.claude\\$d"
    exit 1
  fi
done

echo "Plan:"
for d in "${TARGETS[@]}";    do echo "  symlink  $GLOBAL_WIN\\$d -> $ARCANE_WIN\\.claude\\$d"; done
for d in "${EXTRA_BACKUP[@]}"; do echo "  backup   $GLOBAL_WIN\\$d (legacy, conflicts with Arcane skills)"; done
echo "  KEEP     $GLOBAL_WIN\\{CLAUDE.md, settings.json, hooks\\, ...}"
echo ""
read -rp "Proceed? [y/N] " ans
[[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

# Step 1: backup via cmd's move (handles Windows file locks better than mv)
cmd //c "mkdir \"$BACKUP_WIN\"" >/dev/null 2>&1 || true
for d in "${TARGETS[@]}" "${EXTRA_BACKUP[@]}"; do
  src="$GLOBAL_WIN\\$d"
  dst="$BACKUP_WIN\\$d"
  if cmd //c "if exist \"$src\" (exit 0) else (exit 1)" >/dev/null 2>&1; then
    echo "  move \"$src\" -> \"$dst\""
    if ! cmd //c "move \"$src\" \"$dst\"" >/dev/null 2>&1; then
      echo "  WARN: failed to move \"$src\" — likely locked by an active Claude Code session."
      echo "        Close ALL Claude Code instances and retry."
      exit 1
    fi
  fi
done

# Step 2: junctions
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
  tgt="$GLOBAL_WIN\\$d"
  if cmd //c "if exist \"$tgt\" (exit 0) else (exit 1)" >/dev/null 2>&1; then
    n=$(cmd //c "dir /b \"$tgt\" 2>nul | find /c /v \"\"" 2>/dev/null | tr -d '\r\n')
    printf "  OK   %s (%s entries)\n" "$tgt" "$n"
  else
    printf "  FAIL %s\n" "$tgt"
    ok=0
  fi
done

echo ""
if [ "$ok" = "1" ]; then
  echo "Migration complete."
else
  echo "WARNING: some junctions failed."
fi
echo "  Backup: $BACKUP_WIN"
echo ""
echo "Rollback (if needed):"
for d in "${TARGETS[@]}" "${EXTRA_BACKUP[@]}"; do
  echo "  cmd //c \"rmdir \\\"$GLOBAL_WIN\\\\$d\\\"\" && cmd //c \"move \\\"$BACKUP_WIN\\\\$d\\\" \\\"$GLOBAL_WIN\\\\$d\\\"\""
done
echo ""
echo "Test: open NEW shell anywhere, run \`claude\`, try /scaffold-go"
