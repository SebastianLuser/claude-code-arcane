---
name: nestjs-best-practices
description: "NestJS production best practices: 40 rules in 10 categories (architecture, DI, errors, security, performance, testing, DB/ORM, API, microservices, devops) prioritized by impact. Use when writing/reviewing NestJS code."
category: "backend"
argument-hint: "[architecture|di|security|performance|testing|database|api|all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# nestjs-best-practices — Guide prioritized by impact

40 rules for production-ready NestJS applications, organized in 10 categories and prioritized from **CRITICAL** to **LOW-MEDIUM**. Each rule in the catalog (in `references/`) comes with impact, an incorrect example, a correct example and a link to the docs.

## MANDATORY WORKFLOW

**Do not apply the 40 rules blindly. Diagnose first, prioritize by impact.**

### Step 0: Determine scope

1. **New code or an audit of existing code?** If it is an audit, read the target module/service first.
2. **Which category applies?** Map the problem area (see table) or use `all` for a full review.
3. **Are there concrete symptoms?** (crashes, slowness, N+1, leaks) → go straight to the relevant category.

### Step 1: Prioritize by impact

Apply in this order — do not move down a level until the previous one is resolved:

| Priority | Category | Impact | Reference |
|-----------|-----------|---------|-----------|
| 1 | Architecture | CRITICAL | `references/architecture.md` |
| 2 | Dependency Injection | CRITICAL | `references/dependency-injection.md` |
| 3 | Error Handling | HIGH | `references/error-handling.md` |
| 4 | Security | HIGH | `references/security.md` |
| 5 | Performance | HIGH | `references/performance.md` |
| 6 | Database & ORM | MEDIUM-HIGH | `references/database.md` |
| 7 | Testing | MEDIUM-HIGH | `references/testing.md` |
| 8 | API Design | MEDIUM | `references/api-design.md` |
| 9 | Microservices | MEDIUM | `references/microservices-devops.md` |
| 10 | DevOps & Deployment | LOW-MEDIUM | `references/microservices-devops.md` |

### Step 2: Apply + verify

For each relevant rule: read the correct example in the reference, apply it, and verify against the closing checklist.

### Step 3: Closing checklist

- [ ] No circular dependencies (`madge --circular` or equivalent)
- [ ] Constructor injection in every provider; zero `ModuleRef.get()` at runtime
- [ ] Global `ValidationPipe` + decorated DTOs on every endpoint
- [ ] Declarative guards for auth/authz (no manual checks)
- [ ] No N+1 (eager loading / joins where appropriate)
- [ ] Versioned migrations, `synchronize: false` in prod
- [ ] Graceful shutdown (SIGTERM) + health checks
- [ ] Structured logging (JSON)

If the whole checklist passes → code is **COMPLIANT**. Before writing significant changes, confirm the approach with the user (Question → Decision → Approval).

## Symptom → category mapping table

| Symptom | Category |
|---------|-----------|
| Crash on startup / modules do not resolve | Architecture, DI |
| Slow endpoints, many queries | Performance, Database |
| Inconsistent 500 errors / leaked stack traces | Error Handling |
| Exposed endpoints / brute force / sensitive data | Security |
| Brittle tests or tests that call real services | Testing |
| Inconsistent responses / circular refs | API Design |

---

_Adapted from [kadajett/agent-nestjs-skills](https://github.com/kadajett/agent-nestjs-skills). The original repo compiles atomic rules (`rules/*.md`) into an `AGENTS.md` via a build script; here it was reorganized into Arcane's skill+references format._
