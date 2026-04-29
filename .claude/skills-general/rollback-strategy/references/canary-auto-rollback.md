# Canary + Auto-rollback

## Canary Progression

5% -> 25% -> 50% -> 100% con pausas y checks entre cada paso.

## Auto-rollback Triggers

- SLO burn rate >2x en 10min
- Error rate 5xx >baseline+3sigma por 3min
- p95 latency >umbral definido
- Health check failures >20% replicas

## Herramientas

- **GKE:** Argo Rollouts, Flagger
- **Cloud Run:** Cloud Deploy
