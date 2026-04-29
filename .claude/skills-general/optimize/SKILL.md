---
name: optimize
description: "Analiza performance del proyecto: hot paths, N+1 queries, re-renders, missing indexes, memory leaks. Propone fixes con impacto medible."
category: "workflow"
argument-hint: "[file-path | empty for whole project]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Edit, Bash
---

Analyze the current project or specified file for performance bottlenecks:

1. **Identify hot paths** — Find the most performance-critical code paths
2. **Check for common issues:**
   - N+1 queries or redundant database calls
   - Unnecessary re-renders (React) or recomputations
   - Missing indexes on frequently queried fields
   - Large bundle sizes or unoptimized imports
   - Synchronous operations that should be async
   - Memory leaks or excessive allocations
   - Missing caching opportunities
3. **Propose concrete fixes** — For each issue found, provide:
   - What the problem is
   - Why it matters (estimated impact)
   - The specific code change to fix it
4. **Implement** — Apply the fixes after confirmation

Only suggest optimizations that have measurable impact. Avoid premature optimization.
