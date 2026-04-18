---
name: context-prime
description: "Carga contexto completo del proyecto al inicio de la sesión: stack, estructura, git state, archivos clave. Mejora respuestas posteriores."
argument-hint: ""
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

Prime yourself with comprehensive project understanding before starting work:

1. **Read project config** — package.json, tsconfig.json, pyproject.toml, go.mod, Cargo.toml, etc.
2. **Read CLAUDE.md** — If it exists at root or .claude/ level
3. **Scan directory structure** — `ls` the top-level and key directories (src/, lib/, app/, etc.)
4. **Read key files** — Entry points, main config, router/routes, database schema
5. **Check git state** — Current branch, recent commits, any uncommitted changes
6. **Identify stack** — Framework, language version, package manager, test runner, linter
7. **Summarize** — Give me a brief overview:
   - What this project does
   - Tech stack
   - Key directories and their purpose
   - Current git state
   - Any issues or TODOs visible

This helps you give better answers for the rest of our session.
