#!/usr/bin/env bash
# arcane — Activate Arcane skill packs per-project
# Creates junctions from YOUR project's .claude/skills/ to Arcane source skills.
# Skills only live in that project, not globally.
#
# Usage:
#   arcane list                    Show available packs
#   arcane activate core backend   Activate packs in current project
#   arcane deactivate backend      Remove a pack
#   arcane status                  Show what's active here
#   arcane reset                   Remove all Arcane skills from project
#   arcane cleanup-global          One-time: remove all global junctions

set -euo pipefail

# --- Auto-detect Arcane root from script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCANE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Windows path conversion
to_win() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$1"
  elif [ -d "$1" ]; then
    (cd "$1" && pwd -W 2>/dev/null | sed 's|/|\\|g')
  else
    echo "$1" | sed 's|^/\([a-zA-Z]\)/|\1:\\|;s|/|\\|g'
  fi
}

USERPROFILE_WIN=$(cmd //c "echo %USERPROFILE%" 2>/dev/null | tr -d '\r\n')
_TMPDIR="${TMPDIR:-/tmp}"
TEMP_BAT=$(cygpath -w "$_TMPDIR/_arcane_cmd.bat" 2>/dev/null || echo "$USERPROFILE_WIN\\AppData\\Local\\Temp\\_arcane_cmd.bat")
TEMP_BAT_BASH="$_TMPDIR/_arcane_cmd.bat"

run_cmd() {
  echo "$@" > "$TEMP_BAT_BASH"
  cmd //c "$TEMP_BAT" >/dev/null 2>&1
}

# --- Pack Definitions ---
# Each pack: space-separated skill names
PACK_core="commit create-pr fix-issue check optimize tdd context-prime changelog help start onboard code-review reverse-document skill-improve"
PACK_backend_go="scaffold-go go-clean-architecture doc-rfc deploy-check env-sync db-diagram api-docs deps-audit start-service docker-setup ci-cd-setup query-optimization test-setup logging-setup error-tracking secret-management api-design api-versioning database-indexing rate-limiting jwt-strategy oauth-setup rbac-abac data-migrations audit-dev"
PACK_frontend="scaffold-react-vite state-management form-validation i18n-setup design-system figma-to-code ux-review visual-regression accessibility design-handoff figma-tokens csp-headers audit-dev"
PACK_unity="scaffold-unity unity-game-architecture doc-gdd doc-pas art-bible balance-check map-systems asset-audit asset-spec consistency-check playtest-report audit-game perf-profile prototype"
PACK_agile="jira-tickets sprint-plan sprint-report standup-report create-epics create-stories estimate retrospective incident weekly-digest milestone-review story-done story-readiness bug-report bug-triage meeting-to-tasks sprint-ceremony product-spec scope-check"
PACK_devops="deploy-check deploy-staging docker-setup ci-cd-setup terraform-init observability-setup slo-sli runbooks hotfix release-checklist rollback-strategy backup-strategy cdn-setup distributed-tracing smoke-check perf-profile"
PACK_tools="postman figma clickup slack gdocs gdrive gsheets gh-projects"
PACK_mobile="scaffold-react-native state-management form-validation i18n-setup accessibility figma-to-code design-handoff audit-dev"

ALL_PACKS="core backend-go frontend unity agile devops tools mobile"

# --- Helpers ---
get_pack_skills() {
  local pack="$1"
  local var="PACK_${pack//-/_}"
  echo "${!var:-}"
}

find_skill_source() {
  local name="$1"
  for dir in skills skills-software skills-gamedev skills-agile; do
    local path="$ARCANE_ROOT/.claude/$dir/$name"
    if [ -d "$path" ]; then
      echo "$path"
      return 0
    fi
  done
  return 1
}

ensure_project_skills_dir() {
  if [ ! -d ".claude" ]; then
    mkdir -p ".claude/skills"
  elif [ ! -d ".claude/skills" ]; then
    mkdir -p ".claude/skills"
  fi
}

is_junction() {
  local path="${1%/}"
  [ -L "$path" ] && return 0
  # Check if it's a reparse point (junction) via attributes
  local win_path
  win_path=$(to_win "$path")
  local attr
  attr=$(cmd //c "attrib \"$win_path\"" 2>/dev/null | tr -d '\r\n' || true)
  # Junctions have no special attrib flag but we can test: if rmdir would succeed on a dir, it's a junction
  # Simpler: check if target resolves to Arcane
  [ -d "$path" ] && readlink -f "$path" 2>/dev/null | grep -q "Claude-Code-Arcane" 2>/dev/null && return 0
  # Last resort: check via cmd
  local parent_win name
  parent_win=$(to_win "$(dirname "$path")")
  name=$(basename "$path")
  echo "dir /AL \"$parent_win\" 2>nul | findstr /i \"$name\"" > "$TEMP_BAT_BASH"
  cmd //c "$TEMP_BAT" >/dev/null 2>&1
}

# --- Commands ---
cmd_list() {
  echo "=== Arcane Skill Packs ==="
  echo ""
  for pack in $ALL_PACKS; do
    local skills
    skills=$(get_pack_skills "$pack")
    local count
    count=$(echo "$skills" | wc -w | tr -d ' ')
    printf "  %-14s %s skills\n" "$pack" "$count"
  done
  echo ""
  echo "Detail: arcane list <pack>"
  if [ "${1:-}" != "" ]; then
    local skills
    skills=$(get_pack_skills "$1")
    if [ -z "$skills" ]; then
      echo "Unknown pack: $1"
      return 1
    fi
    echo ""
    echo "=== $1 ==="
    for s in $skills; do echo "  $s"; done
  fi
}

cmd_activate() {
  if [ $# -eq 0 ]; then
    echo "Usage: arcane activate <pack> [pack2...]"
    echo "Packs: $ALL_PACKS"
    return 1
  fi

  ensure_project_skills_dir

  local total=0 skipped=0 failed=0

  for pack in "$@"; do
    local skills
    skills=$(get_pack_skills "$pack")
    if [ -z "$skills" ]; then
      echo "WARN: unknown pack '$pack' — skipping"
      continue
    fi
    echo "--- $pack ---"
    for skill in $skills; do
      local target=".claude/skills/$skill"
      if [ -d "$target" ] || [ -L "$target" ]; then
        skipped=$((skipped + 1))
        continue
      fi

      local source
      if ! source=$(find_skill_source "$skill"); then
        echo "  MISS  $skill (not found in Arcane)"
        failed=$((failed + 1))
        continue
      fi

      local src_win tgt_win
      src_win=$(to_win "$source")
      tgt_win=$(to_win "$(pwd)/$target")
      if run_cmd "mklink /J \"$tgt_win\" \"$src_win\""; then
        echo "  OK    $skill"
        total=$((total + 1))
      else
        echo "  FAIL  $skill"
        failed=$((failed + 1))
      fi
    done
  done

  echo ""
  echo "Activated: $total | Already existed: $skipped | Failed: $failed"
}

cmd_deactivate() {
  if [ $# -eq 0 ]; then
    echo "Usage: arcane deactivate <pack> [pack2...]"
    return 1
  fi

  local total=0

  for pack in "$@"; do
    local skills
    skills=$(get_pack_skills "$pack")
    if [ -z "$skills" ]; then
      echo "WARN: unknown pack '$pack'"
      continue
    fi
    echo "--- removing $pack ---"
    for skill in $skills; do
      local target=".claude/skills/$skill"
      if [ -d "$target" ] && is_junction "$target"; then
        local tgt_win
        tgt_win=$(to_win "$(pwd)/$target")
        run_cmd "rmdir \"$tgt_win\""
        echo "  DEL   $skill"
        total=$((total + 1))
      fi
    done
  done

  echo ""
  echo "Removed: $total junctions"
}

cmd_status() {
  if [ ! -d ".claude/skills" ]; then
    echo "No .claude/skills/ in this project"
    return 0
  fi

  echo "=== Active Arcane Skills ==="
  local count=0
  for d in .claude/skills/*/; do
    [ -d "$d" ] || continue
    local name
    name=$(basename "$d")
    if is_junction "$d"; then
      printf "  %-30s (arcane)\n" "$name"
      count=$((count + 1))
    else
      printf "  %-30s (local)\n" "$name"
    fi
  done
  echo ""
  echo "Total Arcane skills: $count"

  echo ""
  echo "Pack coverage:"
  for pack in $ALL_PACKS; do
    local skills total=0 active=0
    skills=$(get_pack_skills "$pack")
    for skill in $skills; do
      total=$((total + 1))
      if [ -d ".claude/skills/$skill" ]; then
        active=$((active + 1))
      fi
    done
    if [ "$active" -gt 0 ]; then
      printf "  %-14s %d/%d\n" "$pack" "$active" "$total"
    fi
  done
}

cmd_reset() {
  if [ ! -d ".claude/skills" ]; then
    echo "No .claude/skills/ in this project"
    return 0
  fi

  local count=0
  for d in .claude/skills/*/; do
    [ -d "$d" ] || continue
    if is_junction "$d"; then
      local tgt_win
      tgt_win=$(to_win "$(pwd)/$(echo "$d" | sed 's|/$||')")
      run_cmd "rmdir \"$tgt_win\""
      echo "  DEL  $(basename "$d")"
      count=$((count + 1))
    fi
  done

  echo "Removed $count Arcane skill junctions"
}

cmd_cleanup_global() {
  echo "=== Removing global Arcane junctions from ~/.claude/ ==="
  local GLOBAL_WIN="$USERPROFILE_WIN\\.claude"
  local GLOBAL_BASH
  GLOBAL_BASH=$(cygpath "$USERPROFILE_WIN/.claude" 2>/dev/null || echo "$HOME/.claude")
  local targets=(agents skills skills-software skills-gamedev skills-agile rules)
  local count=0

  for d in "${targets[@]}"; do
    local bash_path="$GLOBAL_BASH/$d"
    if [ -L "$bash_path" ] || [ -d "$bash_path" ]; then
      echo "  Removing: $d"
      run_cmd "rmdir \"$GLOBAL_WIN\\$d\"" && count=$((count + 1)) || echo "  FAIL: $d (may not be a junction)"
    else
      echo "  Skip (not found): $d"
    fi
  done

  echo ""
  echo "Removed $count global junctions."
  echo "Skills now load ONLY per-project via: arcane activate <pack>"
}

# --- Main ---
case "${1:-help}" in
  list)       shift; cmd_list "$@" ;;
  activate|a) shift; cmd_activate "$@" ;;
  deactivate|d) shift; cmd_deactivate "$@" ;;
  status|s)   cmd_status ;;
  reset|r)    cmd_reset ;;
  cleanup-global) cmd_cleanup_global ;;
  help|--help|-h)
    echo "arcane — Activate Arcane skill packs per-project"
    echo ""
    echo "Commands:"
    echo "  list [pack]          Show available packs (detail with pack name)"
    echo "  activate <pack...>   Activate packs in current project"
    echo "  deactivate <pack...> Remove packs from current project"
    echo "  status               Show active skills in current project"
    echo "  reset                Remove all Arcane skills from project"
    echo "  cleanup-global       Remove ALL global junctions (one-time)"
    echo ""
    echo "Packs: $ALL_PACKS"
    echo ""
    echo "Examples:"
    echo "  arcane activate core backend-go    # Go backend project"
    echo "  arcane activate core frontend      # React project"
    echo "  arcane activate core unity         # Unity project"
    echo "  arcane status                      # What's active here?"
    ;;
  *)
    echo "Unknown command: $1 (try: arcane help)"
    exit 1
    ;;
esac
