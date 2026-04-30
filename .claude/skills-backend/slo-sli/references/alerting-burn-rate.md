# Alerting Multi-window Multi-burn-rate

Reemplaza fixed-threshold. Dos alertas por SLO:

- **Fast burn (page):** ventana 5min+1h, burn rate 14.4x -> consume 2% budget en 1h. Page a on-call.
- **Slow burn (ticket):** ventana 30min+6h, burn rate 6x -> consume 10% budget en 6h. Ticket no-urgente.

Implementar con Prometheus recording rules (pre-compute error ratios a 5m, 1h, 30m, 6h) + Alertmanager rules. Formula: threshold = `burn_rate x (1 - SLO)`. Ej: SLO 99.9% -> `14.4 x 0.001 = 0.0144`.

## GCP Cloud Monitoring (Terraform)

Alternativa nativa si ya usas Cloud Monitoring: `google_monitoring_custom_service` + `google_monitoring_slo` (request_based_sli, rolling_period_days 30) + `google_monitoring_alert_policy` (select_slo_burn_rate, threshold 14.4).

## Dashboard interno

Publico para producto + ingenieria. Minimo: SLO actual (30d rolling) por servicio/tier, error budget remaining (%, minutos), burn rate actual (1h, 6h), top 5 endpoints que mas budget consumen, historial incidentes con link postmortem.

## Review trimestral

- **Sobrecumple consistente** (ej: SLO 99.9% real 99.99% 2 trimestres): SLO laxo, subir o permitir mas experimentacion
- **Incumple consistente:** target irreal o deuda tecnica, bajar SLO temporalmente + plan mejora
- **Flujos cambiaron:** reevaluar que SLIs importan
