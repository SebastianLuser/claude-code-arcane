#!/usr/bin/env bash
# Profile: flutter
# Description: Flutter + Dart cross-platform development
# Type: base

DESCRIPTION="Flutter + Dart cross-platform development"

SKILLS=(
  testing
  i18n-setup
  deps-audit
  env-sync
  observability
  release
  onboard
  perf-profile
  flutter-dev
  state-management
  form-validation
  accessibility
  auth-strategy
  ci-cd-setup
  deploy-check
)

RULES_UNIVERSAL=(frontend-code)
RULES_GAMEDEV=()

AGENTS=(engineering)

PERMISSIONS_ALLOW=(
  "Bash(flutter *)"
  "Bash(dart *)"
  "Bash(pub *)"
)

PERMISSIONS_DENY=()
