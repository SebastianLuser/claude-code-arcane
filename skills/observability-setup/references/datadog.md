# Datadog

For projects that use Datadog instead of the Prometheus + Grafana + Loki stack. Datadog changes quickly: check the current docs for agent options and integration names before writing config.

## Getting data in

| Runs on | How |
|---|---|
| VM or container host | Datadog Agent on the host |
| Kubernetes | Datadog Operator or Helm chart (one Agent per node) |
| Cloud Run | `serverless-init` wrapper in the container image, or the sidecar option |
| ECS Fargate | Agent as a sidecar container in the task definition |
| Lambda | Datadog Lambda extension and layer |
| Already on OpenTelemetry | Send OTLP to the Agent or the Collector's Datadog exporter: keeps instrumentation vendor-neutral |

**Unified service tagging:** set `DD_ENV`, `DD_SERVICE` and `DD_VERSION` (or the matching OTel resource attributes) on every service. They join traces, logs and metrics, and `version` marks deploys on every graph.

## APM and logs

- Tracing through the language library (`dd-trace` for Node, `dd-trace-go`) or OTel; inject the trace ID into logs so a log line opens its trace.
- Logs as JSON; parse with pipelines only what is not JSON already.
- **Logging without Limits:** ingestion and indexing are billed separately. Ingest everything, index only what you search (exclusion filters for health checks and debug noise), and archive the rest to cheap storage for rehydration.

## Monitors as code

Define monitors and SLOs in Terraform (`datadog_monitor`, `datadog_service_level_objective`) so they are reviewed like code:

```hcl
resource "datadog_monitor" "api_errors" {
  name    = "[api] error rate above 5%"
  type    = "query alert"
  query   = "sum(last_10m):sum:trace.http.request.errors{service:api,env:prod}.as_count() / sum:trace.http.request.hits{service:api,env:prod}.as_count() > 0.05"
  message = <<-EOT
    Error rate {{value}} on api. Runbook: <link>
    @pagerduty-api-oncall
  EOT
  monitor_thresholds { critical = 0.05 }
}
```

The trace metric names depend on the integration (`trace.http.request.*`, `trace.express.request.*`…): copy them from the service page before writing the query. The alert design rules (symptoms, severity, runbook link) in `/slo-sli` apply the same.

## Cost control

- **Custom metrics** are billed per unique combination of metric name and tag values: never tag with user IDs, request IDs or other unbounded values.
- Sample traces at the library or with ingestion controls; keep error and slow traces.
- Review the usage page monthly: the bill usually grows from logs indexed by default and from one high-cardinality tag.
