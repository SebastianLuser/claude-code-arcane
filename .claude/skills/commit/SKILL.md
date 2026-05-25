---
name: commit
description: "Crea un git commit siguiendo conventional commit format. Revisa diffs, sugiere type/scope, escribe mensaje conciso. No hace push."
category: "workflow"
argument-hint: ""
user-invocable: true
allowed-tools: Read, Bash
---

Review all staged and unstaged changes using `git diff` and `git status`.

Create a git commit following conventional commit format:
- Use the appropriate type: feat, fix, refactor, docs, test, chore, style, perf, ci, build
- Write a concise subject line (max 72 chars) that explains the WHY, not the WHAT
- Add a body if the change is non-trivial
- Stage only the relevant files (avoid `git add .`)

Format: `type(scope): description`

Examples:
- feat(auth): add OAuth2 login flow
- fix(api): handle null response from payment gateway
- refactor(db): simplify query builder chain

Do NOT push. Just commit locally.
