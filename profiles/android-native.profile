#!/usr/bin/env bash
# Profile: android-native
# Description: Android native — Kotlin + Jetpack Compose + Material Design 3
# Type: base

DESCRIPTION="Android native — Kotlin + Jetpack Compose + Material Design 3"

SKILLS=(
  testing
  deps-audit
  env-sync
  observability
  release
  onboard
  perf-profile
  android-native-dev
  state-management
  form-validation
  accessibility
  auth-strategy
  ci-cd-setup
  deploy-check
)

RULES_UNIVERSAL=()
RULES_GAMEDEV=()

AGENTS=()

PERMISSIONS_ALLOW=(
  "Bash(./gradlew *)"
  "Bash(gradle *)"
  "Bash(adb *)"
)

PERMISSIONS_DENY=()
