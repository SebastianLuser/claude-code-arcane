---
name: check
description: "Auditoría rápida de calidad y seguridad: lint, type-check, tests, secrets, deps vulnerables. Reporta findings con severidad."
category: "workflow"
argument-hint: ""
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

Run a comprehensive code quality and security check on the current project:

1. **Identify the stack** — Look at package.json, requirements.txt, go.mod, Cargo.toml, etc.
2. **Run linters** — Execute the project's configured linter (eslint, ruff, golangci-lint, clippy, etc.)
3. **Run type checks** — tsc --noEmit, mypy, etc. if applicable
4. **Run tests** — Execute the test suite and report results
5. **Security scan** — Check for:
   - Hardcoded secrets, API keys, tokens in source code
   - Known vulnerable dependencies (npm audit, pip audit, etc.)
   - SQL injection, XSS, or command injection patterns
6. **Report** — Summarize findings with severity levels and suggested fixes

Focus on actionable issues, not style nitpicks.
