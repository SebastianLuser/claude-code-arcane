# Data Seeding Details - Data Operations

## Types

| Type | Environments | In prod? | Example |
|------|----------|----------|---------|
| **Reference** | All | Yes | roles, countries, categories |
| **Dev fixtures** | local | No | fake users |
| **Test fixtures** | CI | No | controlled scenarios |
| **Demo** | staging | No | demo tenant for sales |

## Structure

`db/seeds/`: reference/ (always), fixtures/ (opt-in), demo/ (opt-in), anonymize/ (sanitization).

## Idempotency

Upserts: `ON CONFLICT DO UPDATE/NOTHING`. Seeds run N times with no errors or duplicates.

## Factory Pattern

Go: `FakeUser(overrides ...func(*User))` with `gofakeit`. TS: `buildUser(overrides: Partial<User>)` with `faker/locale/es`. Deterministic tests: `faker.seed(42)`.

## Relations

Top-down: tenants -> users -> children. Cache parent IDs for FKs.

## Performance (10k+ rows)

Disable triggers/indexes -> COPY FROM CSV or batch INSERT ~10k -> recreate indexes CONCURRENTLY -> ANALYZE.

## Staging Anonymization

Sanitize: email->`user_ID@anon.test`, name->`User ID`, phone->NULL. Never prod dumps without anonymizing. Fields: email, name, ID document, phone, address, password hash.

## Anti-prod Guardrail

Check `APP_ENV != "production"` -> fatal/throw. Mandatory in every seeder.
