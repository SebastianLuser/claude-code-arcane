---
name: data-seeding
description: Poblar bases de datos con datos de referencia, fixtures dev, datos de test e información demo para staging. Stack Educabot (Go + TS, Postgres). Usar cuando se mencione seed, seeder, fixtures, datos demo, poblar DB, faker, factory, anonimización, dump de staging, test data.
argument-hint: "[env: dev|staging|demo|test]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Data Seeding

Poblar DBs de forma **idempotente, segura y realista**. Seeding = datos. NO migrations (schema) ni prod data.

## Tipos de Seed

| Tipo | Entorno | Versionado | Ejemplos |
|------|---------|------------|----------|
| **Reference/lookups** | TODOS (incl prod) | Sí, en repo | roles, países, grados, materias, curricula |
| **Dev/local fixtures** | dev local | Sí, opt-in | usuarios/cursos/notas fake |
| **Test fixtures** | CI/tests | Sí, por suite | escenarios controlados |
| **Demo/staging** | staging | Sí, opt-in | tenant demo para comerciales |

**Regla:** reference puede ir a prod; el resto, jamás.

## Estructura

`db/seeds/reference/` (siempre), `fixtures/` (opt-in --fixtures), `demo/` (opt-in --demo), `anonymize/` (sanitización dumps prod).

## Stack

**TS (Prisma/Drizzle):** `prisma/seed.ts` con `@faker-js/faker/locale/es`. Flags `--fixtures`, `--demo`. Factory pattern: `userFactory(overrides)` retorna objeto con defaults + spread.

**Go (GORM/sqlx):** `cmd/seed/main.go` con `gofakeit.Seed(42)`. Flags via stdlib `flag`. Factory: `UserFactory(overrides ...func(*User))`.

## Idempotencia (no negociable)

Correr N veces = mismo resultado. Usar upserts: `ON CONFLICT DO NOTHING` (SQL), `prisma.upsert` (TS), `clause.OnConflict{DoNothing: true}` (Go).

## Relaciones

Parents → children. Cachear IDs. Orden Educabot: `tenants → users → courses → enrollments → grades`.

## Volumen

Dev: 10-100. Staging demo: 100-1000. Perf tests: 10k-1M.

## Locales LatAm

Siempre `faker/locale/es` (AR/MX/CO/CL/PE) o `pt_BR` (Brasil) para demos creíbles.

## Fixtures Estándar Educabot

1 tenant "Escuela San Martín", 1 super_admin, 1 tenant_admin, 3 docentes, 5 cursos/docente, 30 alumnos/curso, 10 notas/alumno. Password: `dev12345` (bcrypt/argon2). Banner rojo en staging: "ENTORNO DE PRUEBA".

## CLI

`npm run seed` (reference only) / `--fixtures` / `--demo --tenant=X` / `--reset` (DEV ONLY) / `--count users=1000`. Go: `go run ./cmd/seed --fixtures`.

## CI/Tests

**A) Transaction rollback por test** (rápido). **B) Testcontainers** (Go, DB fresca por suite). Seed determinista: `faker.seed(42)` / `gofakeit.Seed(42)`.

## Anonimización para Staging

NUNCA copiar prod tal cual. Flujo: dump con DPO → DB temporal → script anonimización → redump → staging. Reemplazar: email → `user-{id}@staging`, name → faker, DNI/CUIT/CPF → generador válido, phone/address → faker, password → hash fijo dev.

## Performance (1M+ rows)

Disable triggers/índices → `COPY FROM CSV` (o `pgx.CopyFrom` / Prisma `createMany` con chunks 10k) → rebuild índices → `ANALYZE`.

## Guardrails Anti-prod

Obligatorio en todo seeder: check `NODE_ENV !== 'production'` / `APP_ENV != "production"` → throw/fatal. Flag `--confirm-prod-unsafe` no documentada.

## Anti-patterns

- Seed dentro de migrations (mezcla schema+data)
- Copiar PII real prod → staging (GDPR/LGPD)
- Seed no idempotente, random sin seed fijo en tests
- Seeds sin version control, correr en prod "por accidente"
- Passwords dev con hash débil reutilizado
- Demo data = copia literal prod
- Children antes que parents (FK violations)

## Checklist

- [ ] Clasificado: reference/fixtures/test/demo
- [ ] Idempotente (corre 2x sin romper/duplicar)
- [ ] Guardrail NODE_ENV presente
- [ ] Determinista (faker.seed(42))
- [ ] Locale es/pt_BR
- [ ] Sin PII real ni passwords prod
- [ ] Relaciones en orden correcto
- [ ] CLI documentada en README
- [ ] Credenciales dev marcadas "NO PROD"
- [ ] Si staging: script anonimización revisado
- [ ] Tests CI pasan con seed fresco
