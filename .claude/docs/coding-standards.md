# Coding Standards (Core Universal)

Estándares que aplican a cualquier código (software o gamedev). Para estándares específicos:
- Software (backend / frontend / APIs / infra): ver `docs/software/coding-standards.md`
- Game dev (engines, shaders, gameplay): ver `docs/gamedev/coding-standards.md`

Las rules path-scoped específicas viven en `.claude/rules/`.

---

## Principios Generales

1. **Simplicidad primero:** Código que se entiende sin comentarios es mejor que código clever con comments.
2. **Boundaries claros:** Validar input en los boundaries (API endpoints, form handlers, player input). Confiar en código interno.
3. **No premature optimization:** Optimizar solo cuando hay evidencia (profiling, métricas).
4. **Test de lo que importa:** Cobertura alta en lógica de negocio / gameplay systems, no en getters/setters.
5. **Verification-driven development:** Tests primero cuando agregás lógica crítica. Para cambios visuales, verificá con screenshots. Comparar expected vs actual output antes de marcar trabajo como completo.

---

## Naming

- **Variables/funciones:** camelCase (JS/TS/Java/C#) o snake_case (Python/Rust) o PascalCase (Go exports)
- **Clases/tipos:** PascalCase en todos los lenguajes
- **Constants:** UPPER_SNAKE_CASE
- **Files:** kebab-case para web/scripts, PascalCase para componentes/clases, snake_case para Python/Go

---

## Comentarios

- **Escribí el porqué, no el qué.** El código ya dice qué hace.
- **Doc comments para APIs públicas.** Las privadas no los necesitan.
- **TODOs con owner y fecha:** `// TODO(@alice, 2026-05-01): descripción`
- **Anti-pattern:** comentarios que explican el obvio (`// increment counter` sobre `counter++`)

---

## Error Handling

- **Fail fast en boundaries, fail soft en UX.** Error al input inválido; UX degrada gracefully.
- **No tragues errores.** Loguealos o propagalos.
- **Error types, no strings.** Facilita manejo programático.
- **Logs con contexto:** userID/sessionID/requestID para traceability.

---

## Security

- **Nunca secrets en código** — variables de entorno o secret managers.
- **Input validation en el boundary** — incluso si viene de tu propio frontend/cliente.
- **Prepared statements para SQL.** String concat = SQL injection.
- **CSRF tokens para state-changing operations** (web).
- **Rate limiting en endpoints públicos**.
- **Validate URLs de entrada** antes de hacer fetch (SSRF).

---

## Git

- **Commits atómicos:** un cambio lógico por commit.
- **Conventional commits:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `style:`
- **Mensaje en imperativo inglés:** "fix auth bug" no "fixed" o "fixes".
- **Referencia ticket si existe:** `feat(auth): add OAuth (TUNI-123)`
- **Commits referencian ADR/design doc si aplica:** `feat(combat): implement hitbox system per ADR-0012`

---

## Testing (Universal)

### AAA Pattern
Arrange / Act / Assert. Cada test tiene setup, acción, verificación — separados.

```
test_damage_calculator_reduces_health_correctly:
  # Arrange
  player = Player(health=100)
  
  # Act
  player.take_damage(25)
  
  # Assert
  assert player.health == 75
```

### Naming
`test_should_[expected_behavior]_when_[condition]` o `test_[system]_[scenario]_[expected]`

### Determinism
- Tests deben dar mismo resultado cada corrida
- Sin random seeds no-fijados, sin time-dependent assertions
- Aislamiento: cada test setup+teardown propio, sin depender de orden

### Mocking
- Mocks solo en boundaries externos (network, filesystem, DB, engine APIs)
- Para código interno, preferir fakes/stubs
- No hardcoded magic numbers en fixtures (excepción: boundary value tests)

### Regression tests
Cada bug fix debe llevar un test que hubiera atrapado el bug original.

### CI/CD
- Test suite corre en cada push a main y cada PR
- No merge si tests fallan — tests son gate bloqueante
- Nunca disable/skip tests para que CI pase — fix el root cause

---

## Verification-Driven Development

Antes de marcar trabajo como completo:

1. **Si agregaste lógica:** ¿hay test automatizado que verifique?
2. **Si cambiaste UI/visual:** ¿tenés screenshot o video antes/después?
3. **Si es integración:** ¿corriste end-to-end al menos una vez?
4. **Si es performance:** ¿medí before/after con métricas?

"Parece que funciona" no es verification. Tenés que poder mostrar evidencia concreta.

---

## Comments / Docs Anti-Patterns

**NO escribir:**
- Comentarios que describen WHAT (el código ya dice)
- Comentarios referenciando el task/PR actual ("added for JIRA-123")
- Docstrings multi-párrafo en funciones simples
- Comentarios `// removed X` para código borrado
- `// used by Y` (el tooling lo dice mejor)

**SÍ escribir comentarios cuando:**
- Explican el WHY que no es obvio
- Documentan workaround de un bug específico (con link al bug)
- Marcan invariantes o preconditions no-obvios
- APIs públicas consumidas por terceros
