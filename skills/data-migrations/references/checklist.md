# Checklist — Data Migrations

- [ ] Naming: `YYYYMMDDHHMMSS_description.up.sql` + `.down.sql`
- [ ] One logical change per migration
- [ ] DDL and data migration in separate files
- [ ] Indexes with CONCURRENTLY
- [ ] `lock_timeout` on ALTER over large tables
- [ ] `.down.sql` exists or documents one-way
- [ ] CI verifies up -> down -> up
- [ ] Staging OK with timing metrics
- [ ] Breaking: expand-contract plan + tickets per phase
- [ ] Backfills idempotent, checkpointed, batched
- [ ] Multi-tenant: the runner iterates, or the migration is tenant-agnostic
- [ ] PR describes impact, risk, rollback plan
