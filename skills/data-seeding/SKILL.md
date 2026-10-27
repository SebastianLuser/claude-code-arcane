---
name: data-seeding
description: "Seed databases with fixtures, test data, and demo data for dev/staging. Go + TS, Postgres. Trigger: seed, fixtures, faker, factory, test data."
category: "database"
argument-hint: "[env: dev|staging|demo|test]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Data Seeding

Populate DBs in an **idempotent, safe and realistic** way. Seeding = data. NOT migrations (schema) nor prod data.

## Seed Types

| Type | Environment | Versioned | Examples |
|------|---------|------------|----------|
| **Reference/lookups** | ALL (incl. prod) | Yes, in the repo | roles, countries, grades, subjects, curricula |
| **Dev/local fixtures** | local dev | Yes, opt-in | fake users/courses/grades |
| **Test fixtures** | CI/tests | Yes, per suite | controlled scenarios |
| **Demo/staging** | staging | Yes, opt-in | demo tenant for sales |

**Rule:** reference can go to prod; the rest, never.

## Structure

`db/seeds/reference/` (always), `fixtures/` (opt-in --fixtures), `demo/` (opt-in --demo), `anonymize/` (sanitizing prod dumps).

## Stack

**TS (Prisma/Drizzle):** `prisma/seed.ts` with `@faker-js/faker/locale/es`. Flags `--fixtures`, `--demo`. Factory pattern: `userFactory(overrides)` returns an object with defaults + spread.

**Go (GORM/sqlx):** `cmd/seed/main.go` with `gofakeit.Seed(42)`. Flags via stdlib `flag`. Factory: `UserFactory(overrides ...func(*User))`.

## Idempotency (non-negotiable)

Running it N times = same result. Use upserts: `ON CONFLICT DO NOTHING` (SQL), `prisma.upsert` (TS), `clause.OnConflict{DoNothing: true}` (Go).

## Relationships

Parents → children. Cache IDs. Educabot order: `tenants → users → courses → enrollments → grades`.

## Volume

Dev: 10-100. Staging demo: 100-1000. Perf tests: 10k-1M.

## LatAm Locales

Always `faker/locale/es` (AR/MX/CO/CL/PE) or `pt_BR` (Brazil) for believable demos.

## Educabot Standard Fixtures

1 tenant "Escuela San Martín", 1 super_admin, 1 tenant_admin, 3 teachers, 5 courses/teacher, 30 students/course, 10 grades/student. Password: `dev12345` (bcrypt/argon2). Red banner on staging: "TEST ENVIRONMENT" (in the product's UI language).

## CLI

`npm run seed` (reference only) / `--fixtures` / `--demo --tenant=X` / `--reset` (DEV ONLY) / `--count users=1000`. Go: `go run ./cmd/seed --fixtures`.

## CI/Tests

**A) Transaction rollback per test** (fast). **B) Testcontainers** (Go, fresh DB per suite). Deterministic seed: `faker.seed(42)` / `gofakeit.Seed(42)`.

## Anonymization for Staging

NEVER copy prod as is. Flow: dump with the DPO → temporary DB → anonymization script → redump → staging. Replace: email → `user-{id}@staging`, name → faker, DNI/CUIT/CPF → valid generator, phone/address → faker, password → fixed dev hash.

## Performance (1M+ rows)

Disable triggers/indexes → `COPY FROM CSV` (or `pgx.CopyFrom` / Prisma `createMany` in 10k chunks) → rebuild indexes → `ANALYZE`.

## Anti-prod Guardrails

Required in every seeder: check `NODE_ENV !== 'production'` / `APP_ENV != "production"` → throw/fatal. Undocumented `--confirm-prod-unsafe` flag.

## Anti-patterns

- Seeding inside migrations (mixes schema+data)
- Copying real prod PII → staging (GDPR/LGPD)
- Non-idempotent seed, random without a fixed seed in tests
- Seeds without version control, run in prod "by accident"
- Dev passwords with a weak, reused hash
- Demo data = literal copy of prod
- Children before parents (FK violations)

## Checklist

- [ ] Classified: reference/fixtures/test/demo
- [ ] Idempotent (runs 2x without breaking/duplicating)
- [ ] NODE_ENV guardrail present
- [ ] Deterministic (faker.seed(42))
- [ ] Locale es/pt_BR
- [ ] No real PII or prod passwords
- [ ] Relationships in the right order
- [ ] CLI documented in the README
- [ ] Dev credentials marked "NOT FOR PROD"
- [ ] If staging: anonymization script reviewed
- [ ] CI tests pass with a fresh seed
