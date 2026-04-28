---
name: database-setup
description: "Migrations, indexing y schema PostgreSQL: zero-downtime expand-contract, golang-migrate/Prisma/drizzle-kit, CREATE INDEX CONCURRENTLY, tipos de índices, composite order, locks, rollback, multi-tenant, ER diagrams. Usar para: database, migration, schema, alter table, index, seq scan, EXPLAIN, db setup, db diagram, ER."
argument-hint: "[setup|migrate|index|diagram] [table]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# database-setup — Migrations, Indexing & Schema

## Cuándo usar

Setup DB local (Docker+migrations), crear/correr/rollback migrations, diseñar/auditar índices, generar diagrama ER, cambios schema en producción.

## 1. Migrations

### Herramienta

| Stack | Tool | Notas |
|-------|------|-------|
| Go | `golang-migrate/migrate` | CLI + librería, SQL puro |
| TS + Prisma | `prisma migrate` | Integrado con ORM |
| TS + Drizzle | `drizzle-kit` | SQL-like, type-safe |
| TS sin ORM | `node-pg-migrate` | SQL puro |

No mezclar herramientas en mismo repo.

### Naming

`YYYYMMDDHHMMSS_description.up.sql` + `.down.sql`. Timestamp UTC, snake_case, verbo al inicio. Nunca editar migration ya mergeada.

### Zero-downtime: expand-contract

| Fase | Qué | Release |
|------|-----|---------|
| Expand | Columna NULLABLE/DEFAULT, tabla nueva, índice CONCURRENTLY | N |
| Backfill | Job async, idempotente, batcheado ~10k, checkpoint | N |
| Dual-write | App escribe viejo Y nuevo | N+1 |
| Migrate reads | Lecturas apuntan a nuevo | N+2 |
| Contract | DROP viejo tras validar (≥1 release estable) | N+3 |

DDL y data SIEMPRE separados. Mezclar causa locks largos y rollbacks imposibles.

### Locks

`SET lock_timeout = '5s'; SET statement_timeout = '30s';` antes de ALTER. ADD COLUMN con DEFAULT no-volátil instantáneo desde PG 11. NOT NULL existente: ADD CHECK NOT VALID → VALIDATE en migration separada.

### Rollback

| Cambio | Rollback |
|--------|----------|
| DDL aditivo (ADD/CREATE) | Reversible con DROP |
| DDL destructivo (DROP, ALTER TYPE lossy) | One-way, documentar |
| Data transformation lossy | One-way |

Siempre `.down.sql` aunque sea vacío documentado. CI: `up → down → up`.

## 2. Indexing

### Tipos

| Tipo | Cuándo | Cuándo NO |
|------|--------|-----------|
| **B-tree** | Equality, range, ORDER BY (95%) | Full-text, arrays, geo |
| **GIN** | Arrays, jsonb, tsvector, trigram | Tablas muchos writes |
| **GiST** | Geo, ranges, nearest-neighbor | Queries igualdad simples |
| **BRIN** | Tablas enormes ordenadas (timestamps) | Datos no correlacionados |

### Composite: orden columnas

Igualdad primero (`tenant_id =`) → rango (`created_at >`) → ORDER BY. Índice `(a,b,c)` sirve para `a`, `a,b`, `a,b,c` — no para solo `b` o `c`.

### Variantes

- **Partial:** `WHERE deleted_at IS NULL` — reduce tamaño cuando mayoría no matchea
- **Covering (INCLUDE):** evita heap access si todo el SELECT está en el índice
- **Expression:** `lower(email)` — necesario cuando WHERE usa funciones

### CONCURRENTLY

Obligatorio en tablas con tráfico. No bloquea writes. No puede correr en transacción — usar `-- +migrate NoTransaction`. Si falla → INVALID → detectar con `pg_index WHERE NOT indisvalid` → DROP y recrear.

### FK child columns

Postgres NO indexa automático. Siempre crear índice en child FK.

### JSONB

`@>` (containment): GIN con `jsonb_path_ops` (4x más chico). Un solo key: expression index `(preferences->>'role')`.

### Detectar faltantes/no usados

Faltantes: `pg_stat_user_tables WHERE seq_scan > idx_scan AND n_live_tup > 10000`. No usados: `pg_stat_user_indexes WHERE idx_scan = 0` tras ≥1 mes. Bloat: `REINDEX INDEX CONCURRENTLY`.

## 3. Multi-tenant

`tenant_id` como primera columna en todo composite. RLS como defense in depth. Backfills considerar todos tenant_id. Schema-per-tenant: iterar lista, trackear progreso parcial.

## 4. ER Diagram

Escanear migrations SQL / ORM models → generar Mermaid erDiagram. >20 tablas: agrupar por dominio. Marcar nullable, PK, FK. Relaciones: `||--o{` (1:N), `||--||` (1:1), `}o--o{` (N:M).

## Anti-patterns

- DDL + data en mismo archivo
- DROP COLUMN sin período gracia
- CREATE INDEX sin CONCURRENTLY en prod
- Editar migration mergeada
- ADD COLUMN NOT NULL con DEFAULT volátil
- Composite orden incorrecto
- Indexar baja cardinalidad sola (boolean)
- No indexar FK child
- Nunca REINDEX

## Checklist

### Setup
- [ ] Docker Compose o script setup local documentado
- [ ] .env.example con DATABASE_URL

### Migrations
- [ ] Naming YYYYMMDDHHMMSS, un cambio lógico por migration
- [ ] DDL y data separados
- [ ] .down.sql existe o documenta one-way
- [ ] lock_timeout + statement_timeout en ALTER
- [ ] CI: up → down → up
- [ ] Breaking: plan expand-contract documentado

### Indexing
- [ ] Query concreta, EXPLAIN muestra Seq Scan
- [ ] Tipo índice correcto
- [ ] Composite: igualdad → rango → ORDER BY
- [ ] CONCURRENTLY fuera de transacción
- [ ] FKs con índice en child
- [ ] Post-creación: EXPLAIN ANALYZE confirma plan

### ER
- [ ] Diagrama actualizado tras cambio schema
