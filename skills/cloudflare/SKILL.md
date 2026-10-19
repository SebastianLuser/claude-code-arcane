---
name: cloudflare
description: "Cloudflare as a platform: Workers and static sites, R2 object storage, Zero Trust (Tunnel and Access) for internal tools, plus WAF and DNS basics. Set up, deploy or review a Cloudflare project with wrangler."
category: "infrastructure"
argument-hint: "[workers | r2 | zero-trust | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Cloudflare

Cloudflare beyond the CDN: running code at the edge (Workers), storing files without egress fees (R2), and exposing internal tools without opening ports (Tunnel + Access). Caching rules and purges are in `/cdn-setup`.

## Phase 1: Scope

| Mode | Does |
|---|---|
| `workers` | A Worker or a full-stack app (static assets + API) with `wrangler`: config, bindings, secrets, environments, deploy |
| `r2` | Buckets, access from Workers or the S3 API, presigned URLs, public access through a custom domain |
| `zero-trust` | Cloudflare Tunnel to publish an origin with no public IP, and Access policies in front of internal tools |
| `review` | Checks an existing account or project against the baseline in Phase 3 and gives a verdict |

Read `wrangler.jsonc` / `wrangler.toml`, `package.json` and the deploy workflow first. Check the installed `wrangler` version (`npx wrangler --version`): config keys and defaults change between majors.

## Phase 2: References

| Product | Reference |
|---|---|
| Workers and static assets (and Pages projects) | `references/workers.md` |
| R2 | `references/r2.md` |
| Tunnel and Access | `references/zero-trust.md` |

Read only the one in scope.

## Phase 3: Account baseline

| Area | Baseline |
|---|---|
| **DNS** | Records proxied (orange cloud) for anything served through Cloudflare; no DNS-only record exposing the origin IP of a proxied service |
| **TLS** | SSL/TLS mode Full (strict); Always Use HTTPS; minimum TLS 1.2 |
| **Origin** | Reachable only from Cloudflare: a Tunnel, or a firewall allowing Cloudflare's IP ranges only |
| **WAF** | Managed rules on; rate limiting on login, signup and other abuse-prone endpoints |
| **Access to the account** | Members with the narrowest role, SSO or 2FA required; API tokens scoped to one zone or account and the permissions they need, never the Global API Key |
| **CI** | Deploys with `wrangler` using a scoped API token stored as a CI secret |

## Phase 4: Verdict (review mode)

| Verdict | When |
|---|---|
| **PASS** | Baseline met; secrets in Worker secrets, not in config; internal tools behind Access |
| **CONCERNS** | Missing WAF rate limits, broad API tokens, or a Worker without environments for staging |
| **FAIL** | Origin reachable directly while proxied, Flexible SSL, secrets in `wrangler` config or the repo, an internal tool on the internet without Access |

## Protocol

- Show config changes and ask "May I write these?" before editing `wrangler` config or workflows.
- `wrangler deploy`, DNS changes and Access policy changes affect production: give the command and ask before running it.
- Never paste API tokens or secret values into the conversation.

## Next steps

- `/cdn-setup` for cache rules and purging.
- `/ci-cd-setup` for the deploy workflow.
- `/coding-agent-guardrails` when Workers are deployed by agents or CI with broad tokens.
