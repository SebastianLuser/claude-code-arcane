#!/usr/bin/env bash
# Profile: ios-native
# Description: iOS native — Swift + UIKit/SwiftUI + Apple HIG
# Type: base

DESCRIPTION="iOS native — Swift + UIKit/SwiftUI + Apple HIG"

SKILLS=(
  testing
  deps-audit
  env-sync
  observability
  release
  onboard
  perf-profile
  ios-application-dev
  state-management
  form-validation
  accessibility
  auth-strategy
  ci-cd-setup
  deploy-check
)

RULES_UNIVERSAL=()
RULES_GAMEDEV=()

AGENTS=(engineering)

PERMISSIONS_ALLOW=(
  "Bash(xcodebuild *)"
  "Bash(swift *)"
  "Bash(pod *)"
  "Bash(xcrun *)"
)

PERMISSIONS_DENY=()
