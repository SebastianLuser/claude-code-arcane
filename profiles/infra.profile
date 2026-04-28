#!/usr/bin/env bash
# Profile: +infra
# Description: DevOps/Platform — Terraform, tracing, SLOs, deploy, K8s
# Type: addon

DESCRIPTION="DevOps/Platform — Terraform, tracing, SLOs, deploy, K8s"

SKILLS_GENERAL=(
  observability
  feature-flags
  gate-check
)

SKILLS_GAMEDEV=()

SKILLS_SOFTWARE=(
  terraform-init
  observability-ops
  read-replicas
  start-service
  deploy-staging
  deploy-check
  docker-setup
)

SKILLS_AGILE=()
SKILLS_DESIGN=()

RULES_UNIVERSAL=(infra-code)
RULES_GAMEDEV=()

AGENTS=()

PERMISSIONS_ALLOW=(
  "Bash(kubectl get*)"
  "Bash(kubectl describe*)"
  "Bash(docker ps*)"
  "Bash(docker images*)"
)

PERMISSIONS_DENY=()
