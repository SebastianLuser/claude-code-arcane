---
name: data-seeding
description: Poblar bases de datos con datos de referencia, fixtures dev, datos de test e información demo para staging. Stack Educabot (Go + TS, Postgres). Usar cuando se mencione seed, seeder, fixtures, datos demo, poblar DB, faker, factory, anonimización, dump de staging, test data.
argument-hint: "[env: dev|staging|demo|test]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Data Seeding

Skill para poblar bases de datos de forma **idempotente**, **segura** y **realista** en los entornos dev / test / staging de Educabot (EdTech LatAm).

> Seeding = poblar DB con **datos**. NO confundir con:
> - **Migrations** → cambian el **schema** (ver `/data-migrations`).
> - **Production data** → NUNCA se toca desde seeds.

---

## Cuándo usar

- Levantar entorno local desde cero con datos utilizables.
- Crear fixtures reproducibles para integration tests.
- Generar data realista para demos comerciales en staging.
- Anonimizar un dump de prod para usarlo en staging sin PII.
- Cargar volumen grande (10k–1M filas) para tests de performance.
- Definir datos de referencia (roles, países, grados, curricula) que viven en todos los entornos.

## Cuándo NO usar

- Para cambios de **schema** → usá migrations (`/data-migrations`).
- Para setup inicial de la DB local (puerto, user, extensions) → usá `/local-database-setup`.
- Para mover data **real** entre entornos → flujo de backup/restore con DPO, no seeding.
- En producción. **Nunca.** Ni para “arreglar un dato”.

---

## 1. Tipos de seed (clasificar antes de escribir)

| Tipo | Entorno | Versionado | Ejemplos |
|------|---------|------------|----------|
| **Reference / lookups** | TODOS (incluye prod) | Sí, parte del repo | roles, países, provincias, grados, materias, curricula |
| **Dev / local fixtures** | dev local | Sí, opt-in | usuarios fake, cursos fake, notas fake |
| **Test fixtures** | CI / tests | Sí, atados a cada suite | escenarios controlados por test |
| **Demo / staging** | staging | Sí, opt-in | tenant demo “Escuela San Martín” para comerciales |

Regla de oro: **reference data puede ir a prod; el resto, jamás.**

---

## 2. Estructura de carpetas recomendada

```
db/
  migrations/        # schema → ver /data-migrations
  seeds/
    reference/       # roles, países, grados → SIEMPRE
    fixtures/        # dev local → opt-in (--fixtures)
    demo/            # staging demo → opt-in (--demo)
    anonymize/       # scripts de sanitización de dumps prod
```

---

## 3. Herramientas por stack

### TypeScript (Prisma)

```ts
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';

const prisma = new PrismaClient();

async function main() {
  await seedReference();
  if (process.argv.includes('--fixtures')) await seedFixtures();
  if (process.argv.includes('--demo')) await seedDemo();
}

main().finally(() => prisma.$disconnect());
```

### TypeScript (Drizzle / custom)

Script `scripts/seed.ts` invocado con `tsx scripts/seed.ts`, mismo patrón que Prisma pero usando el query builder de Drizzle.

### Go (GORM / sqlx + gofakeit)

```go
// cmd/seed/main.go
package main

import (
    "flag"
    "github.com/brianvoe/gofakeit/v7"
)

func main() {
    fixtures := flag.Bool("fixtures", false, "load dev fixtures")
    demo := flag.Bool("demo", false, "load demo data")
    flag.Parse()

    gofakeit.Seed(42) // seed fijo → reproducible
    seedReference(db)
    if *fixtures { seedFixtures(db) }
    if *demo { seedDemo(db) }
}
```

### Factory libraries

- **TS:** [`@faker-js/faker`](https://fakerjs.dev/) + factory propio, o `fishery` / `factory.ts`.
- **Go:** `gofakeit`, o `factory-go` para patrón Factory Bot.

---

## 4. Factory pattern

### TypeScript

```ts
import { faker } from '@faker-js/faker/locale/es';

export const userFactory = (overrides?: Partial<User>): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: 'student',
  tenantId,
  createdAt: new Date(),
  ...overrides,
});

// Uso
const docente = userFactory({ role: 'teacher', email: 'maria@demo.educabot.com' });
```

### Go

```go
func UserFactory(overrides ...func(*User)) *User {
    u := &User{
        ID:       uuid.NewString(),
        Email:    gofakeit.Email(),
        Name:     gofakeit.Name(),
        Role:     "student",
        TenantID: tenantID,
    }
    for _, fn := range overrides { fn(u) }
    return u
}

// Uso
docente := UserFactory(func(u *User) { u.Role = "teacher" })
```

---

## 5. Idempotencia (no negociable)

Correr el seed N veces = mismo resultado. Usar upserts:

```sql
INSERT INTO roles (code, name) VALUES ('admin', 'Administrador')
ON CONFLICT (code) DO NOTHING;
```

```ts
await prisma.role.upsert({
  where: { code: 'admin' },
  update: {},
  create: { code: 'admin', name: 'Administrador' },
});
```

```go
db.Clauses(clause.OnConflict{DoNothing: true}).Create(&role)
```

---

## 6. Relaciones: crear de arriba hacia abajo

Cachear IDs de parents, reusar en children:

```ts
const tenant = await createTenant({ name: 'Escuela San Martín' });
const teachers = await Promise.all(
  Array.from({ length: 3 }, () => createUser({ tenantId: tenant.id, role: 'teacher' }))
);
const courses = await Promise.all(
  teachers.flatMap(t =>
    Array.from({ length: 5 }, () => createCourse({ teacherId: t.id, tenantId: tenant.id }))
  )
);
// ... alumnos → notas
```

Orden típico Educabot: `tenants → users → courses → enrollments → grades`.

---

## 7. Volumen realista

| Entorno | Por entidad |
|---------|-------------|
| Dev local | 10–100 |
| Staging demo | 100–1000 |
| Perf tests | 10k–1M |

Para 1M+ filas: ver sección 13 (COPY + batch).

---

## 8. Locales LatAm

Siempre usar locale regional para que los datos sean creíbles en demos:

```ts
import { faker } from '@faker-js/faker/locale/es';      // AR, MX, CO, CL, PE
import { faker as fakerBR } from '@faker-js/faker/locale/pt_BR'; // Brasil
```

```go
gofakeit.GlobalFaker = gofakeit.NewCrypto() // default en
// o usar listas custom para nombres hispanos/lusos si hace falta
```

---

## 9. Fixtures Educabot estándar

Demo mínima para que un comercial pueda loguear y mostrar el producto:

- 1 tenant: `Escuela San Martín` (slug `demo-san-martin`).
- 1 `super_admin`: `super@dev.educabot.com`.
- 1 `tenant_admin`: `admin@demo-san-martin.local`.
- 3 docentes con nombres en español.
- 5 cursos por docente.
- 30 alumnos por curso.
- 10 notas por alumno.

### Credenciales dev

```
password: dev12345
```

> ⚠️ **NUNCA USAR EN PROD.** En staging, mostrar banner UI rojo: “ENTORNO DE PRUEBA — DATOS FALSOS”.

Hashear con el mismo algoritmo que prod (bcrypt/argon2), pero con datos obviamente falsos.

---

## 10. CLI del seeder

Interfaz estándar para todos los proyectos Educabot:

```bash
npm run seed                                  # reference only (safe default)
npm run seed -- --fixtures                    # + dev fixtures
npm run seed -- --demo --tenant=demo-san-martin
npm run seed -- --reset                       # drop + re-seed (DEV ONLY)
npm run seed -- --count users=1000            # volumen custom
```

Go equivalente:

```bash
go run ./cmd/seed --fixtures
go run ./cmd/seed --demo --tenant=demo-san-martin
```

---

## 11. CI / Integration tests

Dos patrones válidos:

**A) Transaction rollback por test** (rápido, mismo DB):
```ts
beforeEach(() => prisma.$transaction(async tx => { /* test */; throw ROLLBACK; }));
```

**B) Testcontainers (Go)** — DB fresca por suite:
```go
pg, _ := tcpostgres.Run(ctx, "postgres:16",
    tcpostgres.WithInitScripts("./testdata/schema.sql", "./testdata/seed.sql"),
)
```

Regla: `faker.seed(42)` / `gofakeit.Seed(42)` para que los tests sean **deterministas**.

---

## 12. Anonimización para staging

**NUNCA** copiar prod → staging tal cual. Flujo correcto:

1. Dump de prod (solo con DPO aprobando).
2. Restaurar en DB temporal.
3. Correr script de anonimización.
4. Redump → cargar en staging.

Reemplazos mínimos:

| Campo | Reemplazo |
|-------|-----------|
| `email` | `user-{id}@staging.educabot.com` |
| `name`, `last_name` | `faker.person.fullName()` con locale `es` |
| `dni`, `cuit`, `cpf` | generador con check digit válido |
| `phone` | faker con prefijo país |
| `address` | faker |
| `password_hash` | hash fijo de `dev12345` para todos |

Herramientas:
- [`pg_anonymize`](https://github.com/rjuju/postgresql_anonymizer) extensión Postgres.
- Scripts custom en SQL/Go con `UPDATE ... SET email = 'user-'||id||'@staging.educabot.com'`.

---

## 13. Performance seeding (1M+ rows)

```sql
-- 1. Deshabilitar índices/triggers
ALTER TABLE grades DISABLE TRIGGER ALL;
DROP INDEX IF EXISTS grades_student_id_idx;

-- 2. COPY en vez de INSERT
COPY grades (student_id, course_id, value) FROM '/tmp/grades.csv' WITH (FORMAT csv);

-- 3. Rebuild
CREATE INDEX grades_student_id_idx ON grades(student_id);
ALTER TABLE grades ENABLE TRIGGER ALL;
ANALYZE grades;
```

Batch ideal: **10.000 rows/insert**. En Go usar `pgx.CopyFrom`; en TS con Prisma usar `createMany({ skipDuplicates: true })` con chunks.

---

## 14. Snapshot reusable (dev rápido)

Una vez seedeado, dumpear para cargar en segundos:

```bash
pg_dump --data-only --inserts alizia_dev > db/seeds/snapshot.sql
# reload
psql alizia_dev < db/seeds/snapshot.sql
```

Útil para nuevos devs: `make db-seed-snapshot` en vez de esperar 5 minutos al seeder full.

---

## 15. Guardrails anti-prod

**Obligatorio** en todo seeder:

```ts
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--confirm-prod-unsafe')) {
  throw new Error('Seeding bloqueado en producción');
}
```

```go
if os.Getenv("APP_ENV") == "production" {
    log.Fatal("seed bloqueado en producción")
}
```

La flag `--confirm-prod-unsafe` **NO** se expone en `package.json`, Makefile, ni README. Solo existe para casos de emergencia con aprobación explícita.

---

## Anti-patterns

- ❌ **Seed dentro de migrations** → mezclás schema y data, rompe rollbacks.
- ❌ **Copiar PII real de prod a staging** → violación GDPR/LGPD/Ley 25.326.
- ❌ **Seed no idempotente** → segundo run explota o duplica filas.
- ❌ **Random puro sin seed fijo en tests** → tests flaky.
- ❌ **Seeds sin control de versión ni owner** → nadie sabe qué corre ni por qué.
- ❌ **Correr seed en prod “por accidente”** → sin guardrail de `NODE_ENV`.
- ❌ **Passwords dev con hash débil** que alguien reutiliza en prod.
- ❌ **Seeds sin documentación** → nadie sabe qué usuarios existen ni cómo loguear.
- ❌ **Demo data = copia literal de prod** → riesgo legal + datos viejos.
- ❌ **Crear children antes que parents** → FK violations en cascada.

---

## Checklist antes de mergear un seed

- [ ] Clasificado como `reference | fixtures | test | demo`.
- [ ] Idempotente (corre 2 veces sin romper ni duplicar).
- [ ] Guardrail `NODE_ENV !== 'production'` presente.
- [ ] Seed determinista (`faker.seed(42)` / `gofakeit.Seed(42)`).
- [ ] Locale `es` o `pt_BR` para datos LatAm.
- [ ] Sin PII real ni passwords de prod.
- [ ] Relaciones creadas en orden correcto (parents → children).
- [ ] CLI documentada en README del proyecto.
- [ ] Credenciales dev documentadas y marcadas “NO PROD”.
- [ ] Si toca staging: script de anonimización revisado.
- [ ] Tests de CI pasan con el seed fresco.

---

## Output esperado ✅

Al terminar la tarea deberías entregar:

1. ✅ Script(s) de seed en `db/seeds/` clasificados por tipo.
2. ✅ Factories reutilizables por entidad.
3. ✅ CLI con flags `--fixtures`, `--demo`, `--reset`.
4. ✅ Guardrail anti-prod activo y testeado.
5. ✅ README actualizado con credenciales dev y comandos.
6. ✅ Snapshot SQL opcional para onboarding rápido.
7. ✅ Tests de CI verdes usando el seed.

---

## Delegación a otras skills

- **Schema / DDL** → `/data-migrations`.
- **Setup de Postgres local, puertos, extensions** → `/local-database-setup`.
- **Correr migrations antes del seed** → `/run-migrations`.
- **Levantar servicios que dependen de la DB seedeada** → `/start-service`.
- **Crear usuarios puntuales para QA** → `/create-test-user`.
- **Deploy a staging con data demo** → `/deploy-staging` + `/deploy-check`.
- **Diagrama ER para entender relaciones antes de seedear** → `/db-diagram`.
- **Onboarding de dev nuevo** → `/onboard` (referenciar este skill).
