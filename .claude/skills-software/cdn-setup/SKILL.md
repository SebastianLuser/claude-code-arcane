---
name: cdn-setup
description: "CDN decision guide: provider selection, cache strategies, invalidation, edge security, performance. Use for: cdn, cloudflare, cloudfront, cache-control, edge, image optimization, purge."
category: "infrastructure"
argument-hint: "[provider: cloudflare|aws|gcp]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# cdn-setup — Decision Guide

Goal: **cache hit >90% on assets, TTFB <100ms** in target regions.

## Provider Decision

| Provider | Best For | Key Strength |
|---|---|---|
| **Cloudflare** | Default | LatAm PoPs, free tier, Workers, R2, WAF included |
| **CloudFront** | AWS stacks | S3 + Lambda@Edge integration |
| **GCP Cloud CDN** | GCP stacks | GCS + LB integration, IAM |
| **Fastly** | Strict SLA media | VCL control, instant purge |

## Monitoring

| Metric | Target |
|---|---|
| Cache hit (assets) | >90% |
| Cache hit (API) | >70% |
| p95 TTFB | <100ms |
| Edge 5xx | <0.1% |

> → Read references/cache-strategy-and-invalidation.md for TTL table, invalidation approaches, and cache key hygiene

> → Read references/security-and-anti-patterns.md for edge security, performance checklist, and anti-patterns
