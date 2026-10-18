---
name: supply-chain-security
description: "Software supply chain: lockfiles, install scripts, release-age gates, typosquatting, lockfile diffs, provenance, SBOM, and the response playbook for a compromised package. Prevent, audit or respond."
category: "security"
argument-hint: "[prevent | audit | respond <package>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Supply Chain Security

The npm worms of 2025 (Shai-Hulud and others) spread through install scripts of hijacked packages and stole the tokens on every machine and CI runner that installed them. Most of the defense is configuration that costs minutes. `/deps-audit` finds known CVEs; this skill stops the unknown ones from running.

## Phase 1: Scope

| Mode | Does |
|---|---|
| `prevent` | Proposes the missing defenses below and writes them after approval |
| `audit` | Checks them and gives a verdict |
| `respond <package>` | Runs the playbook in Phase 5 for a compromised package |
| No arg | `audit` |

Detect the package managers from the lockfiles and read their **installed versions** (`npm -v`, `pnpm -v`, `yarn -v`): the options below changed between majors.

## Phase 2: Install defenses

| Defense | npm | pnpm | yarn (Berry) |
|---|---|---|---|
| **Locked installs in CI** | `npm ci` | `pnpm install --frozen-lockfile` | `yarn install --immutable` |
| **No install scripts by default** | `ignore-scripts=true` in `.npmrc`; then `npm rebuild <pkg>` for the few that need a build | Dependency builds are blocked unless approved. Approve with the `allowBuilds` map in `pnpm-workspace.yaml` (10.26+). pnpm 11 removed `onlyBuiltDependencies` and `neverBuiltDependencies` in its favor; `strictDepBuilds` (default true) fails the install on an unreviewed build | `enableScripts: false` in `.yarnrc.yml`; allow per package with `dependenciesMeta` |
| **Release-age gate** | `min-release-age=<days>` in `.npmrc` (recent npm 11; off by default) | `minimumReleaseAge: <minutes>` in `pnpm-workspace.yaml` (default 1440 since pnpm 11, 0 before); `minimumReleaseAgeExclude` for your own scope | `npmMinimalAgeGate: "1w"` in `.yarnrc.yml` |
| **Bot updates wait too** | Renovate `minimumReleaseAge`, Dependabot `cooldown` | | |

A hijacked version is usually found and pulled within hours to a few days, so a gate of 1–7 days stops most of them. Exclude only your own packages from it. Check each option's name against the installed version's docs before writing it.

Other ecosystems: Python `pip install --require-hashes -r requirements.txt` or a `uv`/`poetry` lockfile, plus `pip-audit`; Go `go mod verify` and `-mod=readonly` in CI, plus `govulncheck`.

## Phase 3: Before adding a dependency

Arcane's guard asks before `npm install <pkg>`, `pip install <pkg>` or `go get`. Before saying yes:

- **Exact name:** compare letter by letter with the official docs; typosquats differ by one character (`expresss`), a separator (`python-dateutil` vs `dateutil`) or a scope.
- **Evidence:** `npm view <pkg> time.created maintainers repository dist-tags`. A package created last week, with one maintainer and no repository, needs a reason.
- **Install scripts:** `npm view <pkg> scripts`. A `postinstall` in a library that does not compile anything is a red flag.
- **Size of the tree:** prefer the standard library or a dependency already installed (see the `implementation-workflow` rule).

## Phase 4: Review and provenance

- **Lockfile diff in every PR:** new packages, changed `resolved` hosts and changed `integrity` hashes without a version change are the signals. `lockfile-lint --path package-lock.json --allowed-hosts npm --validate-https` in CI.
- **Signatures:** `npm audit signatures` checks registry signatures and provenance attestations of what is installed.
- **Publish with provenance:** `npm publish --provenance` from CI with OIDC (trusted publishing), never from a laptop with a long-lived token.
- **SBOM:** generate per release (`npm sbom --sbom-format cyclonedx`, `syft`, or `cdxgen`) and keep it with the artifact, so Phase 5 can answer "were we exposed?" in minutes.
- **CI workflows** are part of the supply chain: see `/ci-cd-setup` (permissions per job, `pull_request_target`, actions pinned by SHA, OIDC).

## Phase 5: Respond to a compromised package

1. **Contain:** pause deploys and CI runs that install dependencies. Pin the last known-good version for direct and transitive uses: `overrides` in npm (`package.json`), `overrides` in pnpm (`pnpm-workspace.yaml` in pnpm 11, `pnpm.overrides` in `package.json` before), `resolutions` in yarn.
2. **Measure exposure:** grep every lockfile and SBOM for the package and bad versions; `git log -p -- package-lock.json` gives when it entered; CI logs give which runners installed it.
3. **Hunt indicators:** use the advisory's list (files the payload writes, domains it calls). For the 2025 npm worms also check for new GitHub workflows or repositories created by your accounts and changed `~/.npmrc` files.
4. **Rotate:** every credential reachable from a machine or runner that installed it: npm tokens, GitHub tokens, cloud keys, `.env` secrets. Assume they are stolen; rotation is cheaper than certainty.
5. **Rebuild clean:** delete `node_modules`, run `npm cache clean --force` (or `pnpm store prune`), reinstall from the fixed lockfile with scripts off, redeploy, and write the incident note (`/incident-response`).

Ask before every command that changes the repo, the registry or credentials.

## Phase 6: Verdict (audit)

| Verdict | When |
|---|---|
| **PASS** | Lockfiles committed, locked installs in CI, install scripts gated, a release-age gate, lockfile changes reviewed |
| **CONCERNS** | Any of those partial, or no provenance/SBOM for published packages |
| **FAIL** | CI installs without the lockfile, or install scripts run unreviewed with publish or deploy tokens in the same job |

Report: verdict, one row per defense (status, evidence, fix), then the fixes in order of risk.

## Next steps

- `/deps-audit` for known vulnerabilities and outdated packages.
- `/ci-cd-setup` to harden the workflows.
- `/coding-agent-guardrails` for what agents may install and run.
