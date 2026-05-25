---
name: fix-issue
description: "Fetch un GitHub issue por número, entiende el problema, localiza el código, implementa fix mínimo y commitea referenciando el issue."
category: "workflow"
argument-hint: "<issue-number>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

Fix a GitHub issue. Usage: /fix-issue <issue-number>

1. **Fetch the issue** — Use `gh issue view $ARGUMENTS` to get the full issue details
2. **Understand the problem** — Read the issue description, comments, and any linked PRs
3. **Locate relevant code** — Search the codebase for the affected area
4. **Implement the fix** — Make the minimum changes needed to resolve the issue
5. **Test** — Run relevant tests, add new tests if needed
6. **Commit** — Create a commit referencing the issue: `fix: <description> (closes #<number>)`

If the issue is unclear, ask for clarification before coding.
