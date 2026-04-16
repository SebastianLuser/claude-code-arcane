#!/usr/bin/env bash
# Detect which division is most relevant based on project files

DIVISION="general"

# Detect by project files
if [[ -f "ProjectSettings/ProjectVersion.txt" ]]; then
  DIVISION="game (Unity)"
elif [[ -f "project.godot" ]]; then
  DIVISION="game (Godot)"
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

# Update session state if exists
if [[ -d "production/session-state" ]]; then
  echo "Division: $DIVISION" > production/session-state/division.txt
fi

exit 0
