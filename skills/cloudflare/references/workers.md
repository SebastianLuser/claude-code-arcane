# Workers and static assets

Cloudflare points new projects to **Workers with static assets** (a Worker that serves the built frontend and handles the API in the same deploy); Pages remains supported for existing projects. Check the current docs before choosing for a new project.

## Config

```jsonc
// wrangler.jsonc
{
  "name": "app",
  "main": "src/index.ts",
  "compatibility_date": "<date of the first deploy>",
  "assets": { "directory": "./dist" },
  "kv_namespaces": [{ "binding": "CACHE", "id": "<id>" }],
  "r2_buckets": [{ "binding": "UPLOADS", "bucket_name": "app-uploads" }],
  "vars": { "APP_ENV": "production" },
  "env": {
    "staging": {
      "vars": { "APP_ENV": "staging" },
      "r2_buckets": [{ "binding": "UPLOADS", "bucket_name": "app-uploads-staging" }]
    }
  }
}
```

- `compatibility_date` pins runtime behavior; move it forward on purpose, with tests, not by default.
- **Bindings** (KV, R2, D1, Queues, Durable Objects, service bindings) are the way to reach resources: no connection strings in code.
- Each environment needs its own bindings: bindings are not inherited from the top level into `env.*`.
- `vars` are plain config. **Secrets** go through `npx wrangler secret put <NAME>` (and `--env staging`), never in the config file or the repo. For local development, `.dev.vars` (or `.env`) holds secrets and must be gitignored.

## Deploy

```bash
npx wrangler deploy                 # production
npx wrangler deploy --env staging
npx wrangler versions list          # deployed versions
npx wrangler rollback               # back to the previous version
```

From CI: `cloudflare/wrangler-action` or `npx wrangler deploy` with `CLOUDFLARE_API_TOKEN` (a token scoped to "Edit Workers" on one account) and `CLOUDFLARE_ACCOUNT_ID`.

## Limits that shape the design

- CPU time per request is limited (higher on the paid plan); long work goes to **Queues** or Workflows, not into a request.
- Node.js APIs are available with the `nodejs_compat` compatibility flag, but not every npm package works: test the ones that touch the filesystem or native modules.
- Database access from Workers: D1, or an external Postgres through **Hyperdrive** (connection pooling and caching) instead of opening a new connection per request.

## Debug

```bash
npx wrangler dev                    # local, with bindings simulated
npx wrangler tail                   # live logs from production
npx wrangler tail --env staging --status error
```

Turn on Workers Logs (observability) in the config to keep logs after the fact; `console.log` output is otherwise only visible while tailing.
