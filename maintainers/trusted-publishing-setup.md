# Migrating to Trusted Publishing (OIDC) — future guide

> **Current state (Jun 2026):** the package is published with an **`NPM_TOKEN` token** (Classic Automation, bypasses 2FA) stored as a secret in GitHub Actions. It works and is stable. This document describes how to migrate to **Trusted Publishing (OIDC)** when it makes sense.

---

## 1. What it is and why migrate

**Trusted Publishing** uses **OpenID Connect (OIDC)**: GitHub Actions authenticates against npm with an **ephemeral per-run identity** (a short-lived id-token), instead of a long-lived token stored as a secret.

| | Token (current) | Trusted Publishing (OIDC) |
|---|---|---|
| Long-lived secret | Yes (`NPM_TOKEN`) | **No** |
| Expires / must be rotated | Yes (expires **2026-09-01**) | **No** |
| Risk if leaked | High (valid until it expires) | Low (ephemeral per-run token) |
| Provenance / attestations | Manual | **Automatic** |
| Maintenance | Rotate the token periodically | Zero |

**Main reason to migrate:** remove token rotation and the risk of a release failing silently when the token expires.

---

## 2. ⚠️ Why it was NOT done TODAY (Jun 2026)

The current setup is several pieces behind what OIDC requires. **Verify and resolve these points BEFORE migrating:**

| OIDC requirement | State as of Jun 2026 | Action |
|---|---|---|
| `@semantic-release/npm` **≥ 13.1.0** (OIDC support, Oct 2025) | **12.0.2** (bundled by `semantic-release@24.2.9`) — **does not support OIDC** | Force a plugin upgrade |
| **npm ≥ 11.5.1** in CI | Node 22 ships **npm 10.x** | Add a step that updates npm |
| `permissions: id-token: write` on the job | Missing | Edit `release.yml` |
| Trusted publisher configured on npm | Missing | Configure it on the npm website |
| Package already exists on npm | ✅ (`claude-code-arcane@1.0.0`) | OK — OIDC does **not** allow the *first* publish, but that is already done |

**Known bugs to check before migrating** (they may be fixed in newer versions):
- [semantic-release/npm#1069](https://github.com/semantic-release/npm/issues/1069) — `ENONPMTOKEN` still asks for a token in `verifyConditions` (reported Jan 2026).
- [semantic-release/npm#1023](https://github.com/semantic-release/npm/issues/1023) — the first publish from a maintenance branch fails.

> Before starting, check that these issues are closed or have a clear workaround.

---

## 3. Step-by-step setup

### Step 1 — Update dependencies

Make sure `@semantic-release/npm` ≥ 13.1.0. Since `semantic-release@24.x` may keep bundling an old version, declare it as a direct dependency:

```bash
npm install -D @semantic-release/npm@latest semantic-release@latest
```

Verify it ended up ≥ 13.1.0:

```bash
npm ls @semantic-release/npm
```

### Step 2 — Edit `.github/workflows/release.yml`

Two changes: **(a)** add the `id-token: write` permission, **(b)** update npm to ≥ 11.5.1 before the release.

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  issues: write
  pull-requests: write
  id-token: write          # ← NEW: enables OIDC

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm install -g npm@latest   # ← NEW: npm >= 11.5.1 for OIDC
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # NPM_TOKEN is NO longer needed once OIDC works.
          # Keep it as a fallback during the transition; remove it once confirmed.
        run: npx semantic-release
```

> **Important:** during the transition, **do not delete** the `NPM_TOKEN` secret yet. Token and OIDC can coexist; the token stays as a safety net.

### Step 3 — Configure the Trusted Publisher on npm

1. Go to [npmjs.com](https://www.npmjs.com) → package **claude-code-arcane** → **Settings**.
2. **Trusted Publishers** section (or *Publishing access*).
3. **Add trusted publisher** → GitHub Actions:
   - **Organization / user:** `SebastianLuser`
   - **Repository:** `claude-code-arcane`
   - **Workflow filename:** `release.yml`
   - **Environment:** (leave empty unless the job uses an `environment:`)
4. Save.

### Step 4 — Test release (additive, no risk)

With the token still present as a fallback:

```bash
git commit --allow-empty -m "fix: test trusted publishing via OIDC"
git push origin main
```

Check the log of the **Release** step in Actions:
- ✅ If it publishes via OIDC (it usually logs `provenance` / OIDC authentication) → migration OK.
- ❌ If it fails asking for a token (`ENONPMTOKEN`) → support still has rough edges; **revert** and keep using the token.

### Step 5 — Remove the token (only if Step 4 was green)

1. On GitHub → Settings → Secrets → delete `NPM_TOKEN`.
2. On npm → Access Tokens → delete the automation token.
3. Commit confirming the token is no longer used.

---

## 4. Rollback

If something fails after migrating:

1. Re-add the `NPM_TOKEN` secret (regenerate a Classic Automation token on npm).
2. Revert the `release.yml` changes (`git revert` of the migration commit).
3. The release works with the token again, as before.

---

## 5. Quick checklist

- [ ] `@semantic-release/npm` ≥ 13.1.0 installed and verified
- [ ] Issues #1069 / #1023 closed or with a workaround
- [ ] `id-token: write` added to the workflow
- [ ] `npm install -g npm@latest` step added
- [ ] Trusted publisher configured on npm (repo + `release.yml`)
- [ ] Test release published via OIDC (with the token still present)
- [ ] `NPM_TOKEN` token removed from GitHub and npm
- [ ] Change documented in CHANGELOG / README

---

## References

- [npm trusted publishing GA — GitHub Changelog](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
- [Trusted publishing for npm packages — npm Docs](https://docs.npmjs.com/trusted-publishers/)
- [@semantic-release/npm releases (v13.1.0 = OIDC support)](https://github.com/semantic-release/npm/releases)
- [Issue #1069 — ENONPMTOKEN with OIDC](https://github.com/semantic-release/npm/issues/1069)
- [Issue #1023 — first publish from a maintenance branch](https://github.com/semantic-release/npm/issues/1023)
