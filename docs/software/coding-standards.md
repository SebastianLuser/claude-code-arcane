# Software Coding Standards

Standards specific to software development (backend, frontend, APIs, infra). Complements `docs/coding-standards.md` (universal core).

---

## Architecture

### Boundaries
- **Input validation at the system edge** — API endpoints, form handlers, message consumers
- **Trusted internal domain** — assume input is already validated
- **Output encoding when rendering** — prevent downstream XSS/injection

### Layered architecture
```
Controller/Handler (receives input, validates, calls the domain)
  ↓
Domain/Service (business logic, knows nothing about HTTP/DB)
  ↓
Repository/Infrastructure (DB, external APIs, filesystem)
```

### Mandatory ADRs
Every significant architecture decision (framework choice, auth pattern, cache strategy, API shape) goes into an ADR in `docs/architecture/`. Use the template `.claude/docs/templates/architecture-decision-record.md`.

---

## Backend Specifics

### REST APIs
- **Versioning:** URL path (`/v1/users`) or header (`Accept: application/vnd.api+json;v=1`)
- **Error responses:** consistent shape with `{ code, message, details }`
- **Rate limiting:** per IP + per API key if applicable
- **Idempotency keys** for state-changing operations from an untrusted client
- **OpenAPI spec** maintained (not only in comments)

### GraphQL APIs
- **N+1 prevention:** always dataloaders for collection resolvers
- **Query complexity limits:** reject queries with excessive depth/breadth
- **Per-resolver authorization:** do not rely on authentication alone
- **Persisted queries** in production if it is public

### Databases
- **Forward-only migrations.** Never edit an existing merged migration.
- **Never hardcoded connection strings.** Always ENV vars.
- **Explicit transactions** for multi-statement operations
- **Always prepared statements** — no string concatenation
- **Indexes:** create them when there is a documented slow query, not preemptively
- **N+1 in ORMs:** use explicit eager loading (`Include`, `prefetch_related`, `preload`)

### Async/concurrency
- **Context cancellation:** propagate timeouts/cancellation all the way to DB calls
- **Goroutine/task leaks:** have a graceful shutdown mechanism
- **Deadlocks:** consistent lock ordering, timeouts on distributed locks
- **Race conditions:** deterministic-enough tests with fixed seeds

---

## Frontend Specifics

### Components
- **Single Responsibility:** one component, one concern. `UserTable` does not fetch, it receives data.
- **Props over global state:** use Context/Redux/Zustand only when multiple branches of the tree need it.
- **No business logic in components.** Extract it to hooks/services.

### State management
- **Server state and client state kept separate:** TanStack Query / SWR for server; useState/context for UI.
- **Separate form state:** react-hook-form / Formik, do not mix it with business state.
- **No prop drilling >3 levels:** if it happens, use component composition or context.

### Rendering
- **Stable keys in lists** — never `key={index}` if the order can change
- **useMemo/useCallback only with evidence** — not preemptively
- **Suspense boundaries for async** when the framework supports it
- **Skeleton states** for loading >300ms

### Accessibility (baseline)
- Images with `alt`
- Labels associated with inputs (`htmlFor`)
- Minimum WCAG AA contrast (4.5:1)
- Working keyboard navigation
- ARIA only when semantic HTML falls short

---

## API Design

### REST
- Correct HTTP verbs (GET idempotent, POST creates, PUT replaces, PATCH partial update, DELETE idempotent)
- Correct status codes (200/201/204/400/401/403/404/409/422/429/500)
- Cursor pagination (not offset) for large datasets
- HATEOAS when it makes sense, not by default

### Contracts
- OpenAPI/Swagger for REST
- GraphQL schema as the source of truth
- Breaking changes require a new version, with a deprecation path of 6+ months

---

## Security (expanded)

### OWASP Top 10 baseline
- **Injection:** prepared statements, query builders
- **Broken auth:** hashing with bcrypt/argon2, session rotation after login, optional MFA
- **Sensitive data:** TLS mandatory, never logs with PII/tokens
- **XXE/XSS:** sanitize input, encode output, CSP headers
- **Broken access control:** authorization tests on every endpoint
- **Security misconfig:** headers (HSTS, X-Frame-Options, CSP)
- **Vulnerable deps:** regular `/deps-audit`
- **Logging/monitoring:** audit log of critical operations

### Secret management
- **Never** secrets in code, config, or logs
- Rotate production secrets every 90 days
- Use a secret manager (GCP Secret Manager / AWS Secrets / Vault)

---

## Testing (Software-Specific)

### Test types & coverage
| Type | Coverage target | Tools |
|------|-----------------|-------------|
| **Unit** | >80% domain logic | Jest, Vitest, pytest, go test |
| **Integration** | >60% data/API layer | supertest, httptest, TestContainers |
| **E2E** | Critical user flows | Playwright, Cypress |
| **Performance/Load** | Critical endpoints | k6, Artillery, Locust |
| **Security** | Pipelines | OWASP ZAP, Burp, snyk |

### Test evidence by story type
| Type | Required | Gate |
|------|----------|------|
| **Logic** (calculations, validation, state machines) | Automated unit test | BLOCKING |
| **Integration** (multi-service, DB + app) | Integration test | BLOCKING |
| **UI** (menus, forms, screens) | E2E test or documented walkthrough | BLOCKING |
| **Performance** (critical endpoints) | Load test with threshold | BLOCKING |
| **Security** (auth, authz) | Security test + manual review | BLOCKING |
| **Visual** (responsive, theme) | Screenshot + sign-off | ADVISORY |

### Do not test
- Trivial getters/setters
- Framework code (trust the framework)
- Logic that depends on third parties without your own wrapper

---

## CI/CD

### Minimum pipeline
1. **Lint** (ESLint, golangci-lint, ruff, rubocop)
2. **Type check** (tsc --noEmit, mypy, pyright)
3. **Unit tests** (with coverage report)
4. **Integration tests** (if applicable)
5. **Build** (verifies it compiles/bundles)
6. **Security scan** (deps + SAST)
7. **Deploy to staging** (on merge to main)
8. **E2E on staging** (post-deploy)
9. **Deploy to prod** (manual or automated with gates)

### Rules
- Failing tests = merge blocked
- Never disable/skip tests to pass CI
- Coverage decrease → warning, no auto-merge
- Security scans with HIGH/CRITICAL findings → blocked
