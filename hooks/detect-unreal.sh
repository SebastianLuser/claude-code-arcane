#!/usr/bin/env bash
# SessionStart hook: inject a short note identifying the session as operating inside
# an Unreal Engine project, so Claude defaults to UE conventions and reaches for the
# ue-* skills. Walks upward from $PWD so sessions started in a subdirectory
# (Source/, Content/, Plugins/, ...) are still detected.
#
# Adapted from EpicGames/unreal-engine-skills-for-claude-code-plugin (MIT).
# Opt-in debug logging: set CLAUDE_UE_HOOK_DEBUG to any non-empty value.
set +e

debug() {
  [[ -n "$CLAUDE_UE_HOOK_DEBUG" ]] && echo "detect-unreal.sh: $*" >&2
}

is_project_root() {
  # Reliable top-level markers only. A bare `Engine` directory is NOT a marker: the
  # Unreal source tree contains an `Engine` module at Engine/Source/Runtime/Engine,
  # so walking up from a Runtime module would otherwise short-circuit at
  # Source/Runtime and mis-identify it as the root.
  local directory="$1"
  [[ -f "$directory/GenerateProjectFiles.bat" ]] && return 0
  [[ -f "$directory/GenerateProjectFiles.sh" ]] && return 0
  [[ -f "$directory/GenerateProjectFiles.command" ]] && return 0
  for candidate in "$directory"/*.uproject; do
    [[ -e "$candidate" ]] && return 0
  done
  return 1
}

find_project_root() {
  local directory="$1"
  while [[ -n "$directory" ]]; do
    if is_project_root "$directory"; then
      echo "$directory"
      return 0
    fi
    local parent
    parent="$(dirname "$directory")"
    [[ "$parent" == "$directory" ]] && break
    directory="$parent"
  done
  return 1
}

main() {
  local project_root
  project_root="$(find_project_root "$PWD")"
  if [[ -z "$project_root" ]]; then
    debug "no Unreal Engine project marker found walking up from $PWD"
    return 0
  fi

  local project_type="game"
  [[ -d "$project_root/Engine" ]] && project_type="engine"

  local uproject_filename=""
  for candidate in "$project_root"/*.uproject; do
    if [[ -e "$candidate" ]]; then
      uproject_filename="$(basename "$candidate")"
      break
    fi
  done

  debug "project root: $project_root (type=$project_type, uproject=$uproject_filename)"

  local context="This working directory is an Unreal Engine project."
  if [[ "$project_type" == "engine" ]]; then
    context="$context It is an Engine source tree."
  elif [[ -n "$uproject_filename" ]]; then
    context="$context The project is \`$uproject_filename\`."
  fi
  context="$context Prefer Unreal Engine conventions (C++/UObject patterns, Slate, UHT reflection) when suggesting code."
  context="$context Arcane ships ue-* skills for this stack; run /ue-project-context first if docs/unreal/project-context.md does not exist yet."
  context="$context Unreal ships its own MCP server as engine plugins; run /install-mcp to enable and connect it."

  if [[ -f "$project_root/.mcp.json" ]]; then
    context="$context An \`.mcp.json\` is already present at the project root."
  else
    context="$context No \`.mcp.json\` is present yet. Run \`ModelContextProtocol.GenerateClientConfig ClaudeCode\` in the editor console to generate one."
  fi

  # JSON-escape the dynamic content: backslash first, then double quote.
  local escaped="${context//\\/\\\\}"
  escaped="${escaped//\"/\\\"}"

  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$escaped"
}

main 2>/dev/null
exit 0
