# Operate: Cloud Run functions (formerly Cloud Functions)

Functions created as 2nd gen run on Cloud Run and are now called **Cloud Run functions**; most of `ops-cloud-run.md` (identity, concurrency, min/max instances, VPC egress) applies. 1st gen functions are legacy: plan their migration.

## Deploy

```bash
gcloud functions deploy process-upload --gen2 --region <region> --runtime nodejs22 \
  --entry-point handler --source . \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=<bucket>" \
  --service-account fn-sa@<project>.iam.gserviceaccount.com
```

Check the runtime identifiers supported today (`gcloud functions runtimes list --region <region>`) before pinning one.

## Event-driven functions

- Event triggers go through **Eventarc**; delivery is at-least-once, so handlers must be **idempotent** (dedupe on the event ID).
- Turn on **retry on failure** only for idempotent handlers, and add a dead-letter topic (Pub/Sub) so poison events stop retrying.
- Pub/Sub push to a function: acknowledge only after the work is done; a function that times out is a redelivery.
- Scheduled work: Cloud Scheduler calling an HTTP function with an OIDC token for a service account that has `roles/run.invoker`; keep the function private.

## Debug

```bash
gcloud functions describe process-upload --region <region> --gen2
gcloud functions logs read process-upload --region <region> --gen2 --limit 50
```

| Symptom | Check |
|---|---|
| Deploy fails at build | Build logs in Cloud Build; dependency install or missing entry point |
| Never triggers | The Eventarc trigger's filters, the trigger service account's permissions, and that the event type is enabled (audit-log triggers need Data Access logs) |
| Runs twice | At-least-once delivery or retries: make it idempotent |
| Timeouts | The function timeout and downstream calls without their own timeout |
