---
name: tdd
description: "Guía Test-Driven Development con ciclo Red-Green-Refactor. Tests primero, mínimo código para pasar, luego refactor."
argument-hint: "[feature description]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

Guide me through Test-Driven Development using the Red-Green-Refactor cycle:

1. **RED** — Write a failing test first that describes the desired behavior
   - Run the test to confirm it fails for the right reason
   - Commit: `test: add failing test for <feature>`

2. **GREEN** — Write the minimum code to make the test pass
   - No extra logic, no optimization, just make it green
   - Run the test to confirm it passes
   - Commit: `feat: implement <feature> (green)`

3. **REFACTOR** — Clean up the code while keeping tests green
   - Remove duplication, improve naming, simplify logic
   - Run tests after each change to ensure they still pass
   - Commit: `refactor: clean up <feature> implementation`

Rules:
- NEVER write production code without a failing test first
- Each cycle should be small and focused
- Ask me what behavior to test next if unclear
