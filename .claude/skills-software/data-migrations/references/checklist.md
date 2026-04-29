# Checklist — Data Migrations

- [ ] Naming: `YYYYMMDDHHMMSS_description.up.sql` + `.down.sql`
- [ ] Un cambio logico por migration
- [ ] DDL y data migration en archivos separados
- [ ] Indices con CONCURRENTLY
- [ ] `lock_timeout` en ALTER sobre tablas grandes
- [ ] `.down.sql` existe o documenta one-way
- [ ] CI verifica up -> down -> up
- [ ] Staging OK con metricas de tiempo
- [ ] Breaking: plan expand-contract + tickets por fase
- [ ] Backfills idempotentes, con checkpoints, batcheados
- [ ] Multi-tenant: runner itera o migration tenant-agnostica
- [ ] PR describe impacto, riesgo, plan rollback
