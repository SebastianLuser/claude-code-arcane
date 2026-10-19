---
name: vercel-deploy
description: "Deploy and operate web apps on Vercel: project setup, environments and env vars, preview deployments, promotion and instant rollback, functions config, protection and the firewall. Set up or review a Vercel project."
category: "infrastructure"
argument-hint: "[setup | env | release | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Vercel Deploy

Vercel builds every push into an immutable deployment with its own URL; production is a pointer to one of them. Most operations are about which deployment the pointer targets and which environment variables each deployment got.

## Phase 1: Scope

| Mode | Does |
|---|---|
| `setup` | Links the project, root directory, build settings, environments |
| `env` | Environment variables per environment, pulling them locally, rotating a secret |
| `release` | Controlled production cutover, promotion and rollback |
| `review` | Checks a project against Phase 5 and gives a verdict |

Read `vercel.json`, `package.json`, the framework config (`next.config.*`) and `.vercel/project.json` first. Check the CLI version (`npx vercel --version`): flags change between majors.

## Phase 2: Setup

```bash
npx vercel link                    # connects the folder to a project; writes .vercel/ (gitignored)
```

- **Monorepos:** one Vercel project per app, with its **Root Directory** set; skip builds of untouched apps with the ignored build step.
- Framework detection sets the build command and output; override in `vercel.json` only when needed.
- Function settings (memory, max duration, region) per route in the framework config or `vercel.json`. Put functions in the region of the database: a function far from its database pays the round trip on every query.

## Phase 3: Environments and variables

| Environment | Gets deployed from | Variables |
|---|---|---|
| **Production** | The production branch | Production values |
| **Preview** | Every other branch and every PR | Staging values, never production credentials |
| **Development** | `vercel dev` / `vercel env pull` | Local values |

```bash
npx vercel env ls
npx vercel env add DATABASE_URL preview          # prompts for the value; never put it in the command line
npx vercel env pull .env.local                   # gitignored
```

- Store secrets with the **Secret** type (formerly "Sensitive"): write-only after saving, so their values cannot be read back from the dashboard or the CLI.
- A deployment keeps the variables it was built with: after changing a variable, **redeploy** for it to take effect. A rollback also brings back the old values, which breaks if a secret was rotated in between.
- `NEXT_PUBLIC_*` (and other framework public prefixes) are inlined into the browser bundle: never put a secret behind them.

## Phase 4: Release and rollback

- Default: every push to the production branch goes live. For a controlled cutover, deploy without assigning production domains, check the deployment URL, then promote:

```bash
npx vercel promote <deployment-url>
npx vercel rollback                      # production back to the previous deployment
npx vercel inspect <deployment-url> --logs
```

- **Skew protection**, where available, keeps old clients talking to the deployment they loaded, so a release does not break open tabs.
- Database migrations must stay backward compatible: a rollback brings back old code, not the old schema (`/rollback-strategy`).

## Phase 5: Protection and review

| Area | Baseline |
|---|---|
| **Deployment Protection** | Preview deployments require Vercel authentication (or a password); production is public only if it should be |
| **Firewall** | Managed WAF rules where the plan allows; rate limits on login, signup and expensive endpoints |
| **Team access** | Members with the narrowest role; SSO where available; tokens for CI scoped to the team and with an expiry |
| **Logs and alerts** | Log drains or the observability integration for production; alerts on 5xx and function errors |
| **Spend** | Spend management limits or alerts set, so a traffic spike or a loop does not produce a surprise bill |

| Verdict | When |
|---|---|
| **PASS** | Baseline met, previews use non-production credentials, rollback path known |
| **CONCERNS** | Previews unprotected, no spend alert, functions far from the database |
| **FAIL** | Production secrets in Preview or in a public variable, secrets committed, no way to roll back a bad migration |

## Protocol

- Ask before `vercel --prod`, `promote`, `rollback` and env changes on Production.
- Never print secret values; use `vercel env pull` into a gitignored file.

## Next steps

- `/nextjs-best-practices` for the app itself.
- `/rollback-strategy` → blue-green for the cutover pattern.
- `/ci-cd-setup` if deploys run from GitHub Actions instead of the Git integration.
