#!/usr/bin/env bash
set +e

main() {
  local DIVISION="general"

  if [[ -f "ProjectSettings/ProjectVersion.txt" ]]; then
    DIVISION="game (Unity)"
  elif ls *.uproject 2>/dev/null | grep -q .; then
    DIVISION="game (Unreal)"
  elif [[ -f "package.json" ]] && grep -q "next" package.json 2>/dev/null; then
    DIVISION="engineering (Next.js)"
  elif [[ -f "package.json" ]] && grep -q "react-native" package.json 2>/dev/null; then
    DIVISION="engineering (React Native)"
  elif [[ -f "pubspec.yaml" ]]; then
    DIVISION="engineering (Flutter)"
  elif [[ -f "go.mod" ]]; then
    DIVISION="engineering (Go)"
  elif [[ -f "Cargo.toml" ]]; then
    DIVISION="engineering (Rust)"
  elif [[ -f "pyproject.toml" || -f "requirements.txt" ]]; then
    DIVISION="engineering (Python)"
  fi

  [[ -d "production/session-state" ]] && echo "Division: $DIVISION" > production/session-state/division.txt
}
main 2>/dev/null
exit 0
