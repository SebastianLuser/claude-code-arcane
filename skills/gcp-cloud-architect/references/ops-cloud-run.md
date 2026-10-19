# Operate: Cloud Run

Rollback and blue-green with revisions and tags are in `/rollback-strategy`; this covers configuration, deploys and debugging.

## Settings that matter

| Setting | Rule |
|---|---|
| **Service identity** | Its own service account per service, least privilege (`ops-iam-secrets.md`) |
| **Concurrency** | Requests per instance; lower it for CPU-heavy or memory-heavy handlers, keep it high for I/O-bound APIs |
| **Min instances** | Above 0 for latency-sensitive services to avoid cold starts; it costs money while idle |
| **Max instances** | Always set: it caps cost and protects the database from a connection flood |
| **CPU / memory** | Measure; a container OOM shows as a crash and a restart in the logs |
| **Billing** | Request-based (CPU only during requests) vs instance-based (CPU always allocated): background work after the response needs instance-based |
| **Startup probe** | For slow-starting apps, so traffic does not reach an instance that is not ready |
| **Ingress** | `internal` or `internal-and-cloud-load-balancing` for services that should not be public |
| **Egress to the VPC** | Direct VPC egress (or a Serverless VPC Access connector) for private Cloud SQL, Memorystore or internal services |

## Deploy

```bash
gcloud run deploy api --image <region>-docker.pkg.dev/<project>/<repo>/api:$GIT_SHA \
  --region <region> --service-account api-sa@<project>.iam.gserviceaccount.com
gcloud run revisions list --service api --region <region>
```

Deploy by image digest or a unique tag per commit, never `:latest`, so every revision maps to one build and rollback is exact.

## Debug

```bash
gcloud run services describe api --region <region>                       # current config and traffic split
gcloud run services logs read api --region <region> --limit 100
```

| Symptom | Usual cause |
|---|---|
| Revision fails to become ready | The container does not listen on `$PORT`, crashes at startup, or a startup probe fails: read the revision's logs |
| `403` from the service | IAM: the caller lacks `roles/run.invoker`, or ingress blocks the source |
| `429` / `no available instance` | Max instances reached: raise it or lower request latency |
| Latency spikes on the first request | Cold starts: min instances, smaller image, lazy initialization |
| Cannot reach Cloud SQL or Redis | Missing VPC egress or connector, or the Cloud SQL connection setting |
| Work after the response never finishes | CPU is throttled outside requests with request-based billing |

Metrics to alert on: request count by response class (5xx rate), request latency p95, container instance count near max, and container memory utilization.
