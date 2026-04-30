# Anti-patterns — Data Migrations

- DDL y data migration en mismo archivo
- DROP COLUMN sin período de gracia (>=1 release)
- CREATE INDEX sin CONCURRENTLY en tablas grandes
- Sin `.down.sql`
- Backfill síncrono un solo UPDATE sobre millones
- Editar migration ya mergeada
- ADD COLUMN NOT NULL DEFAULT volátil en tabla grande
- Correr en prod sin staging previo
- Seeds mezclados con migrations productivas
- Asumir ALTER TYPE es gratis (reescribe tabla)
- Orden alfabético en vez de timestamp UTC
- Rollback en prod sin validar `.down.sql`
