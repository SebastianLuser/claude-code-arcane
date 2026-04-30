#!/usr/bin/env bash
# Profile: +docs
# Description: Document generation — PDF, PPTX, XLSX, DOCX
# Type: addon

DESCRIPTION="Document generation — PDF, PPTX, XLSX, DOCX"

SKILLS=(
  pdf-generator
  pptx-generator
  xlsx-generator
  docx-generator
)

RULES_UNIVERSAL=()
RULES_GAMEDEV=()

AGENTS=()

PERMISSIONS_ALLOW=(
  "Bash(python3 *)"
  "Bash(python *)"
  "Bash(node *)"
  "Bash(dotnet *)"
  "Bash(pip *)"
  "Bash(npm *)"
)

PERMISSIONS_DENY=()
