# Runbook — Comandos de Rollback

## Cloud Run

```bash
# 1. Listar revisions disponibles
gcloud run revisions list --service=<service-name> --region=<region> \
  --format="table(name,status.observedGeneration,spec.containerConcurrency)"

# 2. Ver tráfico actual
gcloud run services describe <service-name> --region=<region> \
  --format="value(status.traffic)"

# 3. Rollback a revision anterior (redirigir 100% del tráfico)
gcloud run services update-traffic <service-name> \
  --region=<region> \
  --to-revisions=<revision-name>=100

# 4. Verificar
gcloud run services describe <service-name> --region=<region> \
  --format="value(status.traffic)"
curl https://<service-url>/health
```

## GKE / Kubernetes

```bash
# 1. Ver historial de rollouts
kubectl rollout history deployment/<deployment-name> -n <namespace>

# 2. Rollback a versión anterior (revision - 1)
kubectl rollout undo deployment/<deployment-name> -n <namespace>

# 3. Rollback a revision específica
kubectl rollout undo deployment/<deployment-name> -n <namespace> --to-revision=<N>

# 4. Monitorear rollback
kubectl rollout status deployment/<deployment-name> -n <namespace>

# 5. Verificar pods
kubectl get pods -n <namespace> -l app=<app-name>
kubectl logs -n <namespace> -l app=<app-name> --tail=50
```

## Feature Flag (kill switch inmediato sin redeploy)

```bash
# Unleash
curl -X PATCH https://unleash.educabot.com/api/admin/features/<flag-name> \
  -H "Authorization: <token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# LaunchDarkly
curl -X PATCH https://app.launchdarkly.com/api/v2/flags/<project>/<flag-key> \
  -H "Authorization: <token>" \
  -H "Content-Type: application/json" \
  -d '[{"op": "replace", "path": "/environments/<env>/on", "value": false}]'
```

## GitHub Actions — Workflow de Rollback

```yaml
# .github/workflows/rollback.yml
name: Rollback
on:
  workflow_dispatch:
    inputs:
      revision_sha:
        description: 'Git SHA to roll back to'
        required: true
      service:
        description: 'Service name'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production  # approval gate requerido
    steps:
      - name: Deploy previous image
        run: |
          gcloud run services update-traffic ${{ inputs.service }} \
            --region=us-central1 \
            --to-revisions=$(gcloud run revisions list \
              --service=${{ inputs.service }} \
              --filter="metadata.labels.commit-sha=${{ inputs.revision_sha }}" \
              --format="value(name)" --limit=1)=100

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {"text": "🔴 ROLLBACK ejecutado en ${{ inputs.service }} → SHA ${{ inputs.revision_sha }} por ${{ github.actor }}"}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_OPS_WEBHOOK }}
```

## Post-rollback — Pasos inmediatos

```bash
# 1. Capturar logs del período malo (antes de rotación)
gcloud logging read \
  "resource.type=cloud_run_revision AND timestamp>=\"$(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=500 \
  --format=json > incident-logs-$(date +%Y%m%d-%H%M%S).json

# 2. Verificar health
curl -sf https://<service-url>/health || echo "STILL DOWN"
curl -sf https://<service-url>/ready || echo "NOT READY"

# 3. Monitorear error rate (primeros 10 min post-rollback)
watch -n 30 'gcloud logging read "resource.type=cloud_run_revision AND httpRequest.status>=500" \
  --freshness=5m --format="value(httpRequest.status)" | wc -l'
```

## DB Data — PITR (Point-in-Time Recovery)

```bash
# Cloud SQL — restaurar a timestamp específico
gcloud sql instances clone <instance-name> <new-instance-name> \
  --point-in-time=$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)

# Verificar restore
gcloud sql instances describe <new-instance-name> --format="value(state)"

# Tiempo estimado: 30min–2h según tamaño. Documentar en runbook del servicio.
# Luego: reconciliar writes entre restore point y now.
```

## Cache y CDN post-rollback

```bash
# Redis — invalidar todas las keys de app (si es necesario)
redis-cli -h <host> --scan --pattern "app:*" | xargs redis-cli -h <host> DEL

# Cloud CDN
gcloud compute url-maps invalidate-cdn-cache <url-map> \
  --path="/*" \
  --async

# Cloudflare
curl -X POST "https://api.cloudflare.com/client/v4/zones/<zone_id>/purge_cache" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything": true}'
```
