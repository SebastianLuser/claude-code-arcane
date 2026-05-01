#!/usr/bin/env bash
# Profile: +testing
# Description: Testing avanzado — contract, performance, regression, flakiness
# Type: addon

DESCRIPTION="Testing avanzado — contract, performance, regression, flakiness"

SKILLS=(
  contract-testing
  performance-test
  smoke-check
  regression-suite
  test-flakiness
  visual-regression
  qa-plan
  test-helpers
  test-setup
)

RULES_UNIVERSAL=()
RULES_GAMEDEV=()

AGENTS=(quality)

PERMISSIONS_ALLOW=(
  "Bash(python -m pytest*)"
  "Bash(py -m pytest*)"
)

PERMISSIONS_DENY=()
