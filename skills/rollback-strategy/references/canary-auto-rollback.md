# Canary + Auto-rollback

## Canary Progression

5% -> 25% -> 50% -> 100% with pauses and checks between each step.

## Auto-rollback Triggers

- SLO burn rate >2x in 10min
- Error rate 5xx >baseline+3sigma for 3min
- p95 latency >defined threshold
- Health check failures >20% replicas

## Tools

- **GKE:** Argo Rollouts, Flagger
- **Cloud Run:** Cloud Deploy
