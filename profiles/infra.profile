#!/usr/bin/env bash
# Profile: +infra
# Description: DevOps/Platform/Ops — deploy, observability, secrets, rollback
# Type: addon

DESCRIPTION="DevOps/Platform/Ops — deploy, observability, secrets, rollback"

SKILLS=(
  observability
  observability-ops
  observability-setup
  feature-flags
  gate-check
  terraform-init
  start-service
  deploy-staging
  deploy-check
  docker-setup
  distributed-tracing
  error-tracking
  logging-setup
  runbooks
  rollback-strategy
  release-announce
  doc-rfc
  aws-solution-architect
  azure-cloud-architect
  gcp-cloud-architect
  helm-chart-builder
  incident-commander
  incident-response
  git-worktree-manager
)

RULES_UNIVERSAL=(infra-code)
RULES_GAMEDEV=()

AGENTS=(devops)

PERMISSIONS_ALLOW=(
  "Bash(kubectl get*)"
  "Bash(kubectl describe*)"
  "Bash(docker ps*)"
  "Bash(docker images*)"
)

PERMISSIONS_DENY=()
