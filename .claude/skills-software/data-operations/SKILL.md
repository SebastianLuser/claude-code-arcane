---
name: data-operations
description: "Query optimization y data seeding PostgreSQL. EXPLAIN ANALYZE, pg_stat_statements, N+1, cursor pagination, CTEs, LATERAL, materialized views, factories, fixtures, anonimización, seeding masivo. Usar para: query lenta, EXPLAIN, performance DB, N+1, optimizar SQL, seed, fixtures, datos demo, faker, factory, test data."
argument-hint: "[optimize <query>|seed <env>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# data-operations — Query Optimization & Seeding

## Route

| Intención del usuario | Modo | Sección |
|----------------------|------|---------|
| "query lenta", "EXPLAIN", "N+1", "optimizar SQL", "OFFSET", "índice" | OPTIMIZE | → Sección 1: Query Optimization |
| "seed", "fixtures", "datos demo", "faker", "factory", "test data", "anonimizar" | SEED | → Sección 2: Data Seeding |

**Regla:** si la intención es ambigua, preguntar antes de ejecutar.

---

## Cuándo usar

Diagnosticar/optimizar queries lentas, crear seeders dev/test/staging, anonimizar dumps prod.

## 1. Query Optimization

### EXPLAIN primero

Siempre: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) <query>;`. Visualizar planes complejos: explain.dalibo.com.

| Señal en plan | Significa | Acción |
|---------------|-----------|--------|
| Seq Scan tabla grande | Falta índice | Crear índice → `/database-setup` |
| rows estimado vs actual >10x | Stats desactualizadas | `ANALYZE tabla;` |
| Buffers shared read alto | Working set > shared_buffers | Tune config o reducir resultado |
| Rows Removed by Filter grande | Índice no filtra suficiente | Partial o covering index |
| Sort external merge | Sort no cabe en work_mem | Aumentar work_mem o índice ORDER BY |

Top queries lentas: `pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20`. Cloud managed: Query Insights / Performance Insights.

### Problemas comunes

| Problema | Fix | Excepción |
|----------|-----|-----------|
| **N+1** | JOIN, subquery, DataLoader/Preload | Relación rara vez accedida |
| **SELECT \*** | Solo columnas necesarias | Tablas chicas pocas columnas |
| **OFFSET pagination** | Cursor keyset: `WHERE id > $last ORDER BY id LIMIT N` | Tablas <1k o admin panels |
| **COUNT(\*)** en listados | Cachear, aproximar (`reltuples`), eliminar | Count exacto requisito negocio |
| **OR columnas distintas** | UNION ALL de queries indexadas | Pocas rows |
| **Función en WHERE** | Expression index | Función ya indexada |
| **Subquery correlacionada** | Reescribir como JOIN o LATERAL | Scalar subquery OK |

### CTEs

`WITH x AS MATERIALIZED (...)` fuerza ejecución separada — útil cuando PG inline CTE pierde filtro. Desde PG 12 optimizer decide auto; forzar solo si EXPLAIN muestra plan peor.

### LATERAL joins (top-N por grupo)

`CROSS JOIN LATERAL (SELECT ... WHERE fk = parent.id ORDER BY col DESC LIMIT N)`. Requiere índice en `(fk, col DESC)`.

### Materialized views

`CREATE MATERIALIZED VIEW` + unique index → `REFRESH CONCURRENTLY` (no bloquea reads). Refresh via cron o trigger según tolerancia staleness. No usar si datos necesitan ser real-time.

## 2. Data Seeding

### Tipos

| Tipo | Entornos | En prod? | Ejemplo |
|------|----------|----------|---------|
| **Reference** | Todos | Sí | roles, países, categorías |
| **Dev fixtures** | local | No | usuarios fake |
| **Test fixtures** | CI | No | escenarios controlados |
| **Demo** | staging | No | tenant demo comerciales |

### Estructura

`db/seeds/`: reference/ (siempre), fixtures/ (opt-in), demo/ (opt-in), anonymize/ (sanitización).

### Idempotencia

Upserts: `ON CONFLICT DO UPDATE/NOTHING`. Seeds corren N veces sin error ni duplicados.

### Factory pattern

Go: `FakeUser(overrides ...func(*User))` con `gofakeit`. TS: `buildUser(overrides: Partial<User>)` con `faker/locale/es`. Tests determinísticos: `faker.seed(42)`.

### Relaciones

Top-down: tenants → users → hijas. Cachear IDs parents para FK.

### Performance (10k+ rows)

Desactivar triggers/índices → COPY FROM CSV o batch INSERT ~10k → recrear índices CONCURRENTLY → ANALYZE.

### Anonimización staging

Sanitizar: email→`user_ID@anon.test`, name→`User ID`, phone→NULL. Nunca dumps prod sin anonimizar. Campos: email, nombre, documento, teléfono, dirección, password hash.

### Guardrail anti-prod

Check `APP_ENV != "production"` → fatal/throw. Obligatorio en todo seeder.

## Anti-patterns

**Queries:** optimizar sin EXPLAIN, SELECT * en queries calientes, OFFSET tablas grandes, N+1 no detectado, COUNT(*) sin cache.

**Seeding:** seeds en producción (falta guardrail), no idempotentes, PII real en fixtures, dump prod sin anonimizar, IDs hardcodeados.

## Checklist

### Query optimization
- [ ] EXPLAIN ANALYZE antes y después
- [ ] pg_stat_statements top queries revisado
- [ ] N+1 eliminados (JOIN/Preload/DataLoader)
- [ ] Paginación cursor, no OFFSET
- [ ] Índices validados → `/database-setup`

### Seeding
- [ ] Reference data separado de fixtures
- [ ] Upserts idempotentes
- [ ] Guardrail anti-prod
- [ ] Sin PII real en fixtures
- [ ] Factory pattern para datos random
- [ ] faker.seed() para tests determinísticos
