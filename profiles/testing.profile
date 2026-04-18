#!/usr/bin/env bash
# Profile: +testing
# Description: Testing avanzado — contract, performance, regression, flakiness
# Type: addon

DESCRIPTION="Testing avanzado — contract, performance, regression, flakiness"

SKILLS_GENERAL=(
  contract-testing
  performance-test
  smoke-check
  regression-suite
  test-flakiness
  visual-regression
)

SKILLS_GAMEDEV=()
SKILLS_SOFTWARE=()
SKILLS_AGILE=()
SKILLS_DESIGN=()

RULES_UNIVERSAL=()
RULES_GAMEDEV=()

AGENTS=()

PERMISSIONS_ALLOW=(
  "Bash(python -m pytest*)"
  "Bash(py -m pytest*)"
)

PERMISSIONS_DENY=()
