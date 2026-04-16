# Coding Standards

Estándares de código globales. Las rules específicas por path viven en `.claude/rules/`.

## Principios Generales

1. **Simplicidad primero:** Código que se entiende sin comentarios es mejor que código clever con comments.
2. **Boundaries claros:** Validar input en los boundaries (API endpoints, form handlers). Confiar en código interno.
3. **No premature optimization:** Optimizar solo cuando hay evidencia (profiling, métricas).
4. **Test de lo que importa:** Cobertura alta en lógica de negocio, no en getters/setters.

## Naming

- **Variables/funciones:** camelCase (JS/TS/Java) o snake_case (Python/Rust) o PascalCase (Go exports)
- **Clases/tipos:** PascalCase en todos los lenguajes
- **Constants:** UPPER_SNAKE_CASE
- **Files:** kebab-case para web/scripts, PascalCase para componentes, snake_case para Python/Go

## Comentarios

- **Escribí el porqué, no el qué.** El código ya dice qué hace.
- **Doc comments para APIs públicas.** Las privadas no los necesitan.
- **TODOs con owner y fecha:** `// TODO(@alice, 2026-05-01): ...`

## Error Handling

- **Fail fast en boundaries, fail soft en UX.**
- **No tragues errores.** Loguealos o propagalos.
- **Error types, no strings.** Facilita manejo programático.

## Security

- **Nunca secrets en código** — variables de entorno o secret managers.
- **Input validation en el boundary** — incluso si viene de tu propio frontend.
- **Prepared statements para SQL.** String concat = SQL injection.
- **CSRF tokens para state-changing operations.**
- **Rate limiting en endpoints públicos.**

## Git

- **Commits atómicos:** un cambio lógico por commit.
- **Conventional commits:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`
- **Mensaje en imperativo inglés:** "fix auth bug" no "fixed" o "fixes".
- **Referencia ticket si existe:** `feat(auth): add OAuth (TUNI-123)`

## Testing

- **AAA pattern:** Arrange, Act, Assert.
- **Nombres descriptivos:** `test_should_return_404_when_user_not_found`.
- **Un assert por test cuando sea posible.**
- **Mocks solo en boundaries externos.** Preferir fakes/stubs para código interno.
