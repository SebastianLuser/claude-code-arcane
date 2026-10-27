---
name: dotnet-best-practices
description: "ASP.NET Core / C# production best practices: 40 rules in 10 categories (architecture, DI, errors, security, performance, async, EF Core, testing, API, devops) prioritized by impact. Use when writing/reviewing .NET backend code."
category: "backend"
argument-hint: "[architecture|di|errors|security|performance|async|database|testing|api|all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# dotnet-best-practices — Guide prioritized by impact

40 rules for production-ready ASP.NET Core (.NET 10) applications, organized into 10 categories and prioritized from **CRITICAL** to **LOW-MEDIUM**. Each rule in the catalog (in `references/`) comes with its impact, an incorrect example, a correct example and a link to the docs.

## MANDATORY WORKFLOW

**Do not apply the 40 rules blindly. Diagnose first, prioritize by impact.**

### Step 0: Determine scope

1. **New code or an audit of existing code?** If it is an audit, read the target feature/project first.
2. **Which category applies?** Map the problem area (see table) or use `all` for a full review.
3. **Are there concrete symptoms?** (deadlocks, N+1, inconsistent 500s, leaks) → go straight to the relevant category.

### Step 1: Prioritize by impact

Apply in this order — do not drop a level until the previous one is resolved:

| Priority | Category | Impact | Reference |
|-----------|-----------|---------|-----------|
| 1 | Architecture | CRITICAL | `references/architecture.md` |
| 2 | Dependency Injection | CRITICAL | `references/dependency-injection.md` |
| 3 | Async & Concurrency | HIGH | `references/async.md` |
| 4 | Error Handling | HIGH | `references/error-handling.md` |
| 5 | Security | HIGH | `references/security.md` |
| 6 | Performance | HIGH | `references/performance.md` |
| 7 | Database & EF Core | MEDIUM-HIGH | `references/database.md` |
| 8 | Testing | MEDIUM-HIGH | `references/testing.md` |
| 9 | API Design | MEDIUM | `references/api-design.md` |
| 10 | DevOps & Deployment | LOW-MEDIUM | `references/devops.md` |

### Step 2: Apply + verify

For each relevant rule: read the correct example in the reference, apply it, and verify against the closing checklist.

### Step 3: Closing checklist

- [ ] `<Nullable>enable</Nullable>` + warnings as errors; zero `#nullable disable`
- [ ] Async end-to-end with `CancellationToken`; zero `.Result`/`.Wait()`/`.GetAwaiter().GetResult()`
- [ ] Constructor DI with the correct scope; no manual `BuildServiceProvider()` or service locator
- [ ] Errors via `ProblemDetails` (RFC 7807); no exposed stack traces
- [ ] No N+1 in EF Core (`Include`/projection); `AsNoTracking()` on reads
- [ ] Versioned migrations; never `EnsureCreated()` in prod
- [ ] AuthZ through declarative policies; secrets in a secret manager (not in `appsettings.json`)
- [ ] Structured logging (Serilog JSON) + health checks
- [ ] Tests with xUnit; integration against a real Postgres (Testcontainers), not DbContext mocks

If the whole checklist passes → the code is **COMPLIANT**. Before writing significant changes, confirm the approach with the user (Question → Decision → Approval).

## Symptom → category mapping table

| Symptom | Category |
|---------|-----------|
| Deadlocks / thread pool starvation / app hangs | Async, Performance |
| Slow endpoints, many queries | Performance, Database |
| DI `InvalidOperationException` / scopes / captured dependency | DI, Architecture |
| Inconsistent 500 errors / stack trace leaks | Error Handling |
| Exposed endpoints / brute force / sensitive data in logs | Security |
| Brittle tests, or tests that hit real services/DB without control | Testing |
| Inconsistent responses / entity over-fetching | API Design |

## Next steps

To structure the project → `/dotnet-architecture`. To start a new backend with these defaults → `/dotnet-scaffold`.

---

_Adapted from [github/awesome-copilot](https://github.com/github/awesome-copilot) (dotnet-best-practices), [dotnet/skills](https://github.com/dotnet/skills) and [Aaronontheweb/dotnet-skills](https://github.com/Aaronontheweb/dotnet-skills). Reorganized into Arcane's skill+references format._
