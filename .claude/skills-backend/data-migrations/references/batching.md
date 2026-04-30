# Batching — Data Migrations Grandes

- Batch size: 10k rows default (ajustar segun carga)
- Keyset pagination (`id > last_id`), nunca OFFSET
- Checkpoint persistente: guardar last_id en tabla control
- Idempotente: N ejecuciones = mismo resultado
- Job separado de migration schema
- Pausas entre batches (100-500ms)
- Observabilidad: log progreso + metricas throughput
