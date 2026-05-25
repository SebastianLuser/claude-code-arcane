# Software Coding Standards

Estándares específicos para desarrollo de software (backend, frontend, APIs, infra). Complementa `docs/coding-standards.md` (core universal).

---

## Arquitectura

### Boundaries
- **Input validation al borde del sistema** — API endpoints, form handlers, message consumers
- **Dominio interno confiable** — asumir input ya validado
- **Output encoding al renderizar** — prevenir XSS/injection downstream

### Layered architecture
```
Controller/Handler (recibe input, valida, llama dominio)
  ↓
Domain/Service (lógica de negocio, no sabe de HTTP/DB)
  ↓
Repository/Infrastructure (DB, APIs externas, filesystem)
```

### ADRs obligatorios
Cada decisión arquitectónica significativa (choice de framework, patrón de auth, estrategia de cache, shape de API) va a un ADR en `docs/architecture/`. Usar template `.claude/docs/templates/architecture-decision-record.md`.

---

## Backend Specifics

### APIs REST
- **Versionado:** URL path (`/v1/users`) o header (`Accept: application/vnd.api+json;v=1`)
- **Error responses:** shape consistente con `{ code, message, details }`
- **Rate limiting:** por IP + por API key si aplica
- **Idempotency keys** para operaciones state-changing desde cliente inseguro
- **OpenAPI spec** mantenido (no solo en comentarios)

### APIs GraphQL
- **N+1 prevention:** dataloaders siempre para resolvers de colecciones
- **Query complexity limits:** reject queries con depth/breadth excesivo
- **Autorización por resolver:** no confiar solo en autenticación
- **Persisted queries** en producción si es público

### Databases
- **Migrations forward-only.** Nunca editar migration existente mergeada.
- **Nunca hardcoded connection strings.** ENV vars siempre.
- **Transactions explícitas** para operaciones multi-statement
- **Prepared statements siempre** — no string concat
- **Índices:** crear cuando hay query lenta documentada, no preventivamente
- **N+1 en ORMs:** usar eager loading explícito (`Include`, `prefetch_related`, `preload`)

### Async/concurrency
- **Context cancellation:** propagate timeouts/cancellation hasta DB calls
- **Goroutine/task leaks:** tener mecanismo de shutdown graceful
- **Deadlocks:** lock ordering consistente, timeouts en locks distribuidos
- **Race conditions:** tests deterministic-enough con seeds fijos

---

## Frontend Specifics

### Componentes
- **Single Responsibility:** un componente una concern. `UserTable` no fetchea, recibe data.
- **Props over state global:** usar Context/Redux/Zustand solo cuando múltiples ramas del tree lo necesitan.
- **No business logic en componentes.** Extraer a hooks/services.

### State management
- **Server state vs client state separados:** TanStack Query / SWR para server; useState/context para UI.
- **Form state separado:** react-hook-form / Formik, no mezclar con estado de negocio.
- **No prop drilling >3 niveles:** si pasa, component composition o context.

### Rendering
- **Key estable en listas** — nunca `key={index}` si el orden puede cambiar
- **useMemo/useCallback solo con evidencia** — no preventivamente
- **Suspense boundaries para async** cuando el framework lo soporta
- **Skeleton states** para loading >300ms

### Accessibility (baseline)
- Imágenes con `alt`
- Labels asociados a inputs (`htmlFor`)
- Contraste mínimo WCAG AA (4.5:1)
- Keyboard navigation funcional
- ARIA solo cuando HTML semántico no alcanza

---

## API Design

### REST
- Verbos HTTP correctos (GET idempotente, POST crea, PUT replace, PATCH update parcial, DELETE idempotente)
- Status codes correctos (200/201/204/400/401/403/404/409/422/429/500)
- Pagination con cursor (no offset) para datasets grandes
- HATEOAS cuando hace sentido, no por default

### Contracts
- OpenAPI/Swagger para REST
- GraphQL schema como source of truth
- Breaking changes requieren nueva versión, deprecation path de 6+ meses

---

## Security (expandido)

### OWASP Top 10 baseline
- **Injection:** prepared statements, query builders
- **Broken auth:** hashing con bcrypt/argon2, session rotation post-login, MFA opcional
- **Sensitive data:** TLS mandatory, nunca logs con PII/tokens
- **XXE/XSS:** sanitize input, encode output, CSP headers
- **Broken access control:** tests para autorización en cada endpoint
- **Security misconfig:** headers (HSTS, X-Frame-Options, CSP)
- **Vulnerable deps:** `/deps-audit` regular
- **Logging/monitoring:** audit log de operaciones críticas

### Secret management
- **Nunca** secrets en código, config, o logs
- Rotación cada 90 días para secrets de producción
- Usar secret manager (GCP Secret Manager / AWS Secrets / Vault)

---

## Testing (Software-Specific)

### Test types & coverage
| Tipo | Coverage target | Herramientas |
|------|-----------------|-------------|
| **Unit** | >80% lógica de dominio | Jest, Vitest, pytest, go test |
| **Integration** | >60% capa data/API | supertest, httptest, TestContainers |
| **E2E** | Flujos críticos del user | Playwright, Cypress |
| **Performance/Load** | Endpoints críticos | k6, Artillery, Locust |
| **Security** | Pipelines | OWASP ZAP, Burp, snyk |

### Test evidence por tipo de story
| Tipo | Required | Gate |
|------|----------|------|
| **Logic** (cálculos, validación, state machines) | Unit test automático | BLOCKING |
| **Integration** (multi-service, DB + app) | Integration test | BLOCKING |
| **UI** (menús, forms, screens) | E2E test o walkthrough documentado | BLOCKING |
| **Performance** (endpoints críticos) | Load test con threshold | BLOCKING |
| **Security** (auth, authz) | Security test + manual review | BLOCKING |
| **Visual** (responsive, tema) | Screenshot + sign-off | ADVISORY |

### No testear
- Getters/setters triviales
- Código de framework (trust the framework)
- Lógica que depende de terceros sin wrapping propio

---

## CI/CD

### Pipeline mínimo
1. **Lint** (ESLint, golangci-lint, ruff, rubocop)
2. **Type check** (tsc --noEmit, mypy, pyright)
3. **Unit tests** (con coverage report)
4. **Integration tests** (si aplica)
5. **Build** (verifica que compila/bundlea)
6. **Security scan** (deps + SAST)
7. **Deploy a staging** (en merge a main)
8. **E2E en staging** (post-deploy)
9. **Deploy a prod** (manual o automatizado con gates)

### Reglas
- Tests fallando = merge bloqueado
- Nunca disable/skip tests para pasar CI
- Coverage decrease → warning, no auto-merge
- Scans de seguridad con findings HIGH/CRITICAL → bloqueo
