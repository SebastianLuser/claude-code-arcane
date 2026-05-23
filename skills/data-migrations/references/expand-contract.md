# Zero-downtime: Expand-Contract

Todo breaking change se divide en multiples releases:

| Fase | Que | Compatibilidad |
|------|-----|----------------|
| **1. Expand** | Agregar nuevo (columna NULLABLE/DEFAULT, tabla, indice CONCURRENTLY) | Codigo viejo funciona |
| **2. Backfill** | Rellenar datos — job background, idempotente, batcheado | Separado del DDL |
| **3. Dual-write** | App escribe viejo Y nuevo | Rollback sin perder datos |
| **4. Migrate reads** | App lee del nuevo, viejo solo-escritura | Validar trafico |
| **5. Contract** | Drop viejo — minimo 1 release despues | Solo tras validar nadie lee viejo |

## Breaking changes SIEMPRE multi-step

- `DROP COLUMN` — stop-writing -> stop-reading -> drop
- `ALTER COLUMN TYPE` lossy — nueva columna + backfill + swap
- `RENAME COLUMN/TABLE` — alias/vista temporal o expand-contract
- `NOT NULL` existente — check constraint NOT VALID -> validar -> NOT NULL
- Cambio PK/FK
