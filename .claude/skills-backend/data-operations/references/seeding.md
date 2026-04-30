# Data Seeding Details - Data Operations

## Tipos

| Tipo | Entornos | En prod? | Ejemplo |
|------|----------|----------|---------|
| **Reference** | Todos | Si | roles, paises, categorias |
| **Dev fixtures** | local | No | usuarios fake |
| **Test fixtures** | CI | No | escenarios controlados |
| **Demo** | staging | No | tenant demo comerciales |

## Estructura

`db/seeds/`: reference/ (siempre), fixtures/ (opt-in), demo/ (opt-in), anonymize/ (sanitizacion).

## Idempotencia

Upserts: `ON CONFLICT DO UPDATE/NOTHING`. Seeds corren N veces sin error ni duplicados.

## Factory Pattern

Go: `FakeUser(overrides ...func(*User))` con `gofakeit`. TS: `buildUser(overrides: Partial<User>)` con `faker/locale/es`. Tests deterministicos: `faker.seed(42)`.

## Relaciones

Top-down: tenants -> users -> hijas. Cachear IDs parents para FK.

## Performance (10k+ rows)

Desactivar triggers/indices -> COPY FROM CSV o batch INSERT ~10k -> recrear indices CONCURRENTLY -> ANALYZE.

## Anonimizacion Staging

Sanitizar: email->`user_ID@anon.test`, name->`User ID`, phone->NULL. Nunca dumps prod sin anonimizar. Campos: email, nombre, documento, telefono, direccion, password hash.

## Guardrail Anti-prod

Check `APP_ENV != "production"` -> fatal/throw. Obligatorio en todo seeder.
