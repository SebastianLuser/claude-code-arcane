#!/usr/bin/env bash
set -euo pipefail

ARCANE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILES_DIR="$ARCANE_DIR/profiles"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

usage() {
  cat <<EOF
${BOLD}Claude Code Arcane — Profile Setup${NC}

Usage:
  ./setup.sh --profile <profiles> --target <path>
  ./setup.sh --list
  ./setup.sh --dry-run --profile <profiles>

Options:
  --profile <profiles>   Profiles to install, joined with + (e.g. unity-dev+agile+clickup)
  --target <path>        Target project directory (must exist)
  --list                 List available profiles
  --dry-run              Show what would be copied without doing it
  --clean                Remove Arcane from target (deletes .claude/)
  -h, --help             Show this help

Base profiles (pick 1 or combine):
  unity-dev         Programador Unity — C#, arquitectura, performance
  unity-design      Game Designer — GDDs, balance, art bible, playtesting
  backend-go        Backend Go — Clean Arch, DB, auth, API
  backend-ts        Backend TypeScript — Fastify, Prisma, Zod
  frontend          React + Vite + TypeScript
  mobile            React Native + Expo

Add-ons (combine with +):
  +agile            Sprints, standups, retros, estimates
  +clickup          ClickUp via MCP
  +jira             Jira via REST API
  +design           Figma, UX review, handoff
  +infra            Terraform, tracing, SLOs, K8s
  +testing          Contract, performance, regression testing
  +teams            Game team orchestration + agents
  +ops              Runbooks, rollback, backup, secrets

Examples:
  ./setup.sh --profile unity-dev --target ~/projects/my-game
  ./setup.sh --profile backend-go+agile+jira --target ~/projects/my-api
  ./setup.sh --profile unity-dev+unity-design+agile+clickup --target ~/projects/my-game
  ./setup.sh --profile frontend+design+testing --target ~/projects/my-app
EOF
  exit 0
}

list_profiles() {
  echo -e "${BOLD}Available profiles:${NC}\n"
  echo -e "${CYAN}Base profiles${NC}"
  for f in "$PROFILES_DIR"/*.profile; do
    local name=$(basename "$f" .profile)
    [[ "$name" == "core" ]] && continue
    local type=$(grep "^# Type:" "$f" | sed 's/# Type: //')
    [[ "$type" != "base" ]] && continue
    local desc=$(grep "^DESCRIPTION=" "$f" | sed 's/DESCRIPTION="//' | sed 's/"//')
    printf "  ${GREEN}%-16s${NC} %s\n" "$name" "$desc"
  done

  echo -e "\n${CYAN}Add-ons${NC}"
  for f in "$PROFILES_DIR"/*.profile; do
    local name=$(basename "$f" .profile)
    [[ "$name" == "core" ]] && continue
    local type=$(grep "^# Type:" "$f" | sed 's/# Type: //')
    [[ "$type" != "addon" ]] && continue
    local desc=$(grep "^DESCRIPTION=" "$f" | sed 's/DESCRIPTION="//' | sed 's/"//')
    printf "  ${GREEN}+%-15s${NC} %s\n" "$name" "$desc"
  done

  echo -e "\n${CYAN}Core (always included)${NC}"
  local desc=$(grep "^DESCRIPTION=" "$PROFILES_DIR/core.profile" | sed 's/DESCRIPTION="//' | sed 's/"//')
  printf "  ${GREEN}%-16s${NC} %s\n" "core" "$desc"
  echo ""
  exit 0
}

# Collectors — deduplicated arrays
declare -A SEEN_SKILLS=()
declare -A SEEN_RULES_U=()
declare -A SEEN_RULES_G=()
declare -A SEEN_AGENTS=()
declare -A SEEN_PERM_ALLOW=()
declare -A SEEN_PERM_DENY=()

ALL_SKILLS_GENERAL=()
ALL_SKILLS_GAMEDEV=()
ALL_SKILLS_SOFTWARE=()
ALL_SKILLS_AGILE=()
ALL_SKILLS_DESIGN=()
ALL_RULES_UNIVERSAL=()
ALL_RULES_GAMEDEV=()
ALL_AGENTS=()
ALL_PERM_ALLOW=()
ALL_PERM_DENY=()
LOADED_PROFILES=()

load_profile() {
  local profile_name="$1"
  local profile_file="$PROFILES_DIR/${profile_name}.profile"

  if [[ ! -f "$profile_file" ]]; then
    echo -e "${RED}Error: Profile '$profile_name' not found at $profile_file${NC}" >&2
    exit 1
  fi

  # Reset per-profile arrays before sourcing
  SKILLS_GENERAL=()
  SKILLS_GAMEDEV=()
  SKILLS_SOFTWARE=()
  SKILLS_AGILE=()
  SKILLS_DESIGN=()
  RULES_UNIVERSAL=()
  RULES_GAMEDEV=()
  AGENTS=()
  HOOKS=()
  PERMISSIONS_ALLOW=()
  PERMISSIONS_DENY=()
  DESCRIPTION=""

  source "$profile_file"
  LOADED_PROFILES+=("$profile_name")

  # Merge with dedup
  for s in "${SKILLS_GENERAL[@]}"; do
    [[ -z "${SEEN_SKILLS[$s]:-}" ]] && ALL_SKILLS_GENERAL+=("$s") && SEEN_SKILLS[$s]=1
  done
  for s in "${SKILLS_GAMEDEV[@]}"; do
    [[ -z "${SEEN_SKILLS[$s]:-}" ]] && ALL_SKILLS_GAMEDEV+=("$s") && SEEN_SKILLS[$s]=1
  done
  for s in "${SKILLS_SOFTWARE[@]}"; do
    [[ -z "${SEEN_SKILLS[$s]:-}" ]] && ALL_SKILLS_SOFTWARE+=("$s") && SEEN_SKILLS[$s]=1
  done
  for s in "${SKILLS_AGILE[@]}"; do
    [[ -z "${SEEN_SKILLS[$s]:-}" ]] && ALL_SKILLS_AGILE+=("$s") && SEEN_SKILLS[$s]=1
  done
  for s in "${SKILLS_DESIGN[@]}"; do
    [[ -z "${SEEN_SKILLS[$s]:-}" ]] && ALL_SKILLS_DESIGN+=("$s") && SEEN_SKILLS[$s]=1
  done
  for r in "${RULES_UNIVERSAL[@]}"; do
    [[ -z "${SEEN_RULES_U[$r]:-}" ]] && ALL_RULES_UNIVERSAL+=("$r") && SEEN_RULES_U[$r]=1
  done
  for r in "${RULES_GAMEDEV[@]}"; do
    [[ -z "${SEEN_RULES_G[$r]:-}" ]] && ALL_RULES_GAMEDEV+=("$r") && SEEN_RULES_G[$r]=1
  done
  for a in "${AGENTS[@]}"; do
    [[ -z "${SEEN_AGENTS[$a]:-}" ]] && ALL_AGENTS+=("$a") && SEEN_AGENTS[$a]=1
  done
  for p in "${PERMISSIONS_ALLOW[@]}"; do
    [[ -z "${SEEN_PERM_ALLOW[$p]:-}" ]] && ALL_PERM_ALLOW+=("$p") && SEEN_PERM_ALLOW[$p]=1
  done
  for p in "${PERMISSIONS_DENY[@]}"; do
    [[ -z "${SEEN_PERM_DENY[$p]:-}" ]] && ALL_PERM_DENY+=("$p") && SEEN_PERM_DENY[$p]=1
  done
}

copy_skill() {
  local pool="$1"
  local skill="$2"
  local src="$ARCANE_DIR/.claude/$pool/$skill"
  local dst="$TARGET/.claude/skills/$skill"

  if [[ ! -d "$src" ]]; then
    echo -e "  ${YELLOW}WARN: Skill '$skill' not found in $pool/${NC}" >&2
    return 0
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo -e "  ${BLUE}[dry-run]${NC} $pool/$skill → skills/$skill"
    return 0
  fi

  cp -r "$src" "$dst"
  echo -e "  ${GREEN}✓${NC} $skill"
}

copy_rule() {
  local type="$1"
  local rule="$2"

  if [[ "$type" == "universal" ]]; then
    local src="$ARCANE_DIR/.claude/rules/${rule}.md"
  else
    local src="$ARCANE_DIR/.claude/skills-gamedev/_rules/${rule}.md"
  fi

  local dst="$TARGET/.claude/rules/${rule}.md"

  if [[ ! -f "$src" ]]; then
    echo -e "  ${YELLOW}WARN: Rule '${rule}.md' not found${NC}" >&2
    return 0
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo -e "  ${BLUE}[dry-run]${NC} ${rule}.md"
    return 0
  fi

  cp "$src" "$dst"
  echo -e "  ${GREEN}✓${NC} ${rule}.md"
}

copy_hooks() {
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "  ${BLUE}[dry-run]${NC} hooks/ → .claude/hooks/"
    echo -e "  ${BLUE}[dry-run]${NC} statusline.sh → .claude/statusline.sh"
    return 0
  fi

  if [[ -d "$ARCANE_DIR/.claude/hooks" ]]; then
    cp -r "$ARCANE_DIR/.claude/hooks" "$TARGET/.claude/hooks"
    echo -e "  ${GREEN}✓${NC} hooks/"
  fi

  if [[ -f "$ARCANE_DIR/.claude/statusline.sh" ]]; then
    cp "$ARCANE_DIR/.claude/statusline.sh" "$TARGET/.claude/statusline.sh"
    echo -e "  ${GREEN}✓${NC} statusline.sh"
  fi
}

copy_agents() {
  for agent_dir in "${ALL_AGENTS[@]}"; do
    local src="$ARCANE_DIR/.claude/agents/$agent_dir"
    local dst="$TARGET/.claude/agents/$agent_dir"

    if [[ ! -d "$src" ]]; then
      echo -e "  ${YELLOW}WARN: Agents dir '$agent_dir' not found${NC}" >&2
      continue
    fi

    if [[ "$DRY_RUN" == true ]]; then
      local count=$(find "$src" -name "*.md" | wc -l)
      echo -e "  ${BLUE}[dry-run]${NC} agents/$agent_dir/ ($count agents)"
      continue
    fi

    cp -r "$src" "$dst"
    local count=$(find "$dst" -name "*.md" | wc -l)
    echo -e "  ${GREEN}✓${NC} agents/$agent_dir/ ($count agents)"
  done
}

generate_settings() {
  local settings_file="$TARGET/.claude/settings.json"

  # Build permissions JSON arrays
  local allow_json=""
  for p in "${ALL_PERM_ALLOW[@]}"; do
    [[ -n "$allow_json" ]] && allow_json+=","
    allow_json+=$'\n'"      \"$p\""
  done

  local deny_json=""
  for p in "${ALL_PERM_DENY[@]}"; do
    [[ -n "$deny_json" ]] && deny_json+=","
    deny_json+=$'\n'"      \"$p\""
  done

  if [[ "$DRY_RUN" == true ]]; then
    echo -e "  ${BLUE}[dry-run]${NC} settings.json (${#ALL_PERM_ALLOW[@]} allow, ${#ALL_PERM_DENY[@]} deny)"
    return 0
  fi

  cat > "$settings_file" <<SETTINGS
{
  "\$schema": "https://json.schemastore.org/claude-code-settings.json",
  "statusLine": {
    "type": "command",
    "command": "bash .claude/statusline.sh"
  },
  "permissions": {
    "allow": [$allow_json
    ],
    "deny": [$deny_json
    ]
  },
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/session-start.sh", "timeout": 10 },
          { "type": "command", "command": "bash .claude/hooks/detect-division.sh", "timeout": 10 },
          { "type": "command", "command": "bash .claude/hooks/detect-gaps.sh", "timeout": 10 }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/validate-commit.sh", "timeout": 15 },
          { "type": "command", "command": "bash .claude/hooks/validate-push.sh", "timeout": 10 },
          { "type": "command", "command": "bash .claude/hooks/validate-secrets.sh", "timeout": 10 }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/validate-assets.sh", "timeout": 10 },
          { "type": "command", "command": "bash .claude/hooks/validate-skill-change.sh", "timeout": 5 }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/notify.sh", "timeout": 10 }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/pre-compact.sh", "timeout": 10 }
        ]
      }
    ],
    "PostCompact": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/post-compact.sh", "timeout": 10 }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/session-stop.sh", "timeout": 10 }
        ]
      }
    ],
    "SubagentStart": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/log-agent.sh", "timeout": 5 }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/log-agent-stop.sh", "timeout": 5 }
        ]
      }
    ]
  }
}
SETTINGS

  echo -e "  ${GREEN}✓${NC} settings.json"
}

generate_manifest() {
  local manifest="$TARGET/.claude/arcane-manifest.json"
  local profiles_str=$(printf '"%s",' "${LOADED_PROFILES[@]}")
  profiles_str="[${profiles_str%,}]"

  local total_skills=$(( ${#ALL_SKILLS_GENERAL[@]} + ${#ALL_SKILLS_GAMEDEV[@]} + ${#ALL_SKILLS_SOFTWARE[@]} + ${#ALL_SKILLS_AGILE[@]} + ${#ALL_SKILLS_DESIGN[@]} ))

  if [[ "$DRY_RUN" == true ]]; then
    echo -e "  ${BLUE}[dry-run]${NC} arcane-manifest.json"
    return 0
  fi

  local profile_cmd="${PROFILES[*]}"
  profile_cmd="${profile_cmd// /+}"

  cat > "$manifest" <<MANIFEST
{
  "arcane_version": "1.0.0",
  "profile_command": "$profile_cmd",
  "profiles": $profiles_str,
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total_skills": $total_skills,
  "total_rules": $(( ${#ALL_RULES_UNIVERSAL[@]} + ${#ALL_RULES_GAMEDEV[@]} )),
  "source": "$ARCANE_DIR"
}
MANIFEST

  echo -e "  ${GREEN}✓${NC} arcane-manifest.json"
}

# ─── Main ───

PROFILE_ARG=""
TARGET=""
DRY_RUN=false
CLEAN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE_ARG="$2"; shift 2 ;;
    --target)  TARGET="$2"; shift 2 ;;
    --list)    list_profiles ;;
    --dry-run) DRY_RUN=true; shift ;;
    --clean)   CLEAN=true; shift ;;
    -h|--help) usage ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; usage ;;
  esac
done

# ─── Clean mode ───
if [[ "$CLEAN" == true ]]; then
  if [[ -z "$TARGET" ]]; then
    echo -e "${RED}Error: --clean requires --target${NC}"
    exit 1
  fi
  if [[ ! -d "$TARGET/.claude" ]]; then
    echo -e "${YELLOW}No .claude/ found in $TARGET — nothing to clean.${NC}"
    exit 0
  fi

  echo -e "\n${BOLD}Claude Code Arcane — Clean${NC}"
  echo -e "Target: ${CYAN}$TARGET${NC}"

  if [[ -f "$TARGET/.claude/arcane-manifest.json" ]]; then
    PREV_PROFILES=$(grep '"profiles"' "$TARGET/.claude/arcane-manifest.json" | sed 's/.*\[//;s/\].*//;s/"//g;s/,/ + /g;s/core + //')
    PREV_DATE=$(grep '"installed_at"' "$TARGET/.claude/arcane-manifest.json" | sed 's/.*": "//;s/".*//')
    echo -e "  Profile:   ${YELLOW}$PREV_PROFILES${NC}"
    echo -e "  Installed: ${YELLOW}$PREV_DATE${NC}"
  fi

  rm -rf "$TARGET/.claude"
  rm -rf "$TARGET/.claude.bak"
  echo -e "\n  ${GREEN}✓${NC} Removed .claude/ and .claude.bak/ (if any)"
  echo -e "\n${GREEN}${BOLD}Clean!${NC} Arcane removed from $TARGET\n"
  exit 0
fi

if [[ -z "$PROFILE_ARG" ]]; then
  echo -e "${RED}Error: --profile is required${NC}"
  echo "Run ./setup.sh --help for usage"
  exit 1
fi

if [[ "$DRY_RUN" == false && -z "$TARGET" ]]; then
  echo -e "${RED}Error: --target is required (or use --dry-run)${NC}"
  exit 1
fi

if [[ "$DRY_RUN" == false && ! -d "$TARGET" ]]; then
  echo -e "${RED}Error: Target directory '$TARGET' does not exist${NC}"
  exit 1
fi

# Parse profiles (split by +)
IFS='+' read -ra PROFILES <<< "$PROFILE_ARG"

echo -e "\n${BOLD}Claude Code Arcane — Setup${NC}"
echo -e "Profiles: ${CYAN}${PROFILES[*]}${NC}"
[[ -n "$TARGET" ]] && echo -e "Target:   ${CYAN}$TARGET${NC}"

# Detect existing profile
if [[ -n "$TARGET" && -f "$TARGET/.claude/arcane-manifest.json" ]]; then
  PREV_PROFILES=$(grep '"profiles"' "$TARGET/.claude/arcane-manifest.json" | sed 's/.*\[//;s/\].*//;s/"//g;s/,/ + /g;s/core + //')
  PREV_DATE=$(grep '"installed_at"' "$TARGET/.claude/arcane-manifest.json" | sed 's/.*": "//;s/".*//')
  echo ""
  echo -e "  ${YELLOW}Current profile:${NC} $PREV_PROFILES"
  echo -e "  ${YELLOW}Installed:${NC}       $PREV_DATE"
  echo -e "  ${GREEN}New profile:${NC}     ${PROFILES[*]}"
  echo -e "  ${CYAN}→ Will replace current installation${NC}"
fi

echo ""

# Always load core first
echo -e "${BOLD}Loading profiles...${NC}"
load_profile "core"
echo -e "  ${GREEN}✓${NC} core (always included)"

for profile in "${PROFILES[@]}"; do
  profile=$(echo "$profile" | xargs) # trim whitespace
  load_profile "$profile"
  echo -e "  ${GREEN}✓${NC} $profile"
done

# Summary
total_skills=$(( ${#ALL_SKILLS_GENERAL[@]} + ${#ALL_SKILLS_GAMEDEV[@]} + ${#ALL_SKILLS_SOFTWARE[@]} + ${#ALL_SKILLS_AGILE[@]} + ${#ALL_SKILLS_DESIGN[@]} ))
total_rules=$(( ${#ALL_RULES_UNIVERSAL[@]} + ${#ALL_RULES_GAMEDEV[@]} ))

echo ""
echo -e "${BOLD}Summary:${NC}"
echo -e "  Skills:      ${GREEN}$total_skills${NC}"
[[ ${#ALL_SKILLS_GENERAL[@]} -gt 0 ]]  && echo -e "    general:   ${#ALL_SKILLS_GENERAL[@]}"
[[ ${#ALL_SKILLS_GAMEDEV[@]} -gt 0 ]]  && echo -e "    gamedev:   ${#ALL_SKILLS_GAMEDEV[@]}"
[[ ${#ALL_SKILLS_SOFTWARE[@]} -gt 0 ]] && echo -e "    software:  ${#ALL_SKILLS_SOFTWARE[@]}"
[[ ${#ALL_SKILLS_AGILE[@]} -gt 0 ]]    && echo -e "    agile:     ${#ALL_SKILLS_AGILE[@]}"
[[ ${#ALL_SKILLS_DESIGN[@]} -gt 0 ]]   && echo -e "    design:    ${#ALL_SKILLS_DESIGN[@]}"
echo -e "  Rules:       ${GREEN}$total_rules${NC}"
echo -e "  Agents:      ${GREEN}${#ALL_AGENTS[@]} dirs${NC}"
echo -e "  Permissions: ${GREEN}${#ALL_PERM_ALLOW[@]} allow / ${#ALL_PERM_DENY[@]} deny${NC}"

if [[ "$DRY_RUN" == true ]]; then
  echo -e "\n${YELLOW}Dry run — nothing was copied.${NC}"
  echo -e "Add ${BOLD}--target <path>${NC} to install.\n"
  exit 0
fi

# ─── Install ───

echo ""
echo -e "${BOLD}Installing to $TARGET/.claude/ ...${NC}"

# Clean existing .claude if present
if [[ -d "$TARGET/.claude" ]]; then
  echo -e "  ${YELLOW}Existing .claude/ found — backing up to .claude.bak/${NC}"
  rm -rf "$TARGET/.claude.bak"
  mv "$TARGET/.claude" "$TARGET/.claude.bak"
fi

# Create directory structure
mkdir -p "$TARGET/.claude/skills"
mkdir -p "$TARGET/.claude/rules"
mkdir -p "$TARGET/.claude/agents"
mkdir -p "$TARGET/.claude/docs"

# Copy hooks
echo -e "\n${BOLD}Hooks:${NC}"
copy_hooks

# Copy skills
echo -e "\n${BOLD}Skills:${NC}"
for s in "${ALL_SKILLS_GENERAL[@]}"; do  copy_skill "skills-general" "$s"; done
for s in "${ALL_SKILLS_GAMEDEV[@]}"; do  copy_skill "skills-gamedev" "$s"; done
for s in "${ALL_SKILLS_SOFTWARE[@]}"; do copy_skill "skills-software" "$s"; done
for s in "${ALL_SKILLS_AGILE[@]}"; do    copy_skill "skills-agile" "$s"; done
for s in "${ALL_SKILLS_DESIGN[@]}"; do   copy_skill "skills-design" "$s"; done

# Copy gamedev templates and rules subdirs if any gamedev skills included
if [[ ${#ALL_SKILLS_GAMEDEV[@]} -gt 0 ]]; then
  if [[ -d "$ARCANE_DIR/.claude/skills-gamedev/_templates" ]]; then
    cp -r "$ARCANE_DIR/.claude/skills-gamedev/_templates" "$TARGET/.claude/skills/_templates"
    echo -e "  ${GREEN}✓${NC} _templates/"
  fi
fi

# Copy rules
echo -e "\n${BOLD}Rules:${NC}"
for r in "${ALL_RULES_UNIVERSAL[@]}"; do copy_rule "universal" "$r"; done
for r in "${ALL_RULES_GAMEDEV[@]}"; do   copy_rule "gamedev" "$r"; done

# Copy agents
if [[ ${#ALL_AGENTS[@]} -gt 0 ]]; then
  echo -e "\n${BOLD}Agents:${NC}"
  copy_agents
fi

# Generate settings.json
echo -e "\n${BOLD}Config:${NC}"
generate_settings
generate_manifest

# Copy docs
if [[ -d "$ARCANE_DIR/.claude/docs" ]]; then
  cp -r "$ARCANE_DIR/.claude/docs/"* "$TARGET/.claude/docs/" 2>/dev/null || true
  echo -e "  ${GREEN}✓${NC} docs/"
fi

echo -e "\n${GREEN}${BOLD}Done!${NC} Installed ${total_skills} skills + ${total_rules} rules to $TARGET/.claude/"
echo -e "Open Claude Code in ${CYAN}$TARGET${NC} and run ${CYAN}/start${NC} to begin.\n"
