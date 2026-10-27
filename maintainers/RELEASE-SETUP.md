# Release Setup Guide

Arcane uses **semantic-release** to publish to npm automatically on every push to `main`. This guide explains how to configure the secrets the pipeline needs.

## Release architecture

```
Push to main → GitHub Actions → build + test → semantic-release → npm publish + GitHub Release
```

semantic-release analyzes the commits (conventional commits) to determine the version:
- `fix:` → patch (1.0.0 → 1.0.1)
- `feat:` → minor (1.0.0 → 1.1.0)
- `BREAKING CHANGE:` → major (1.0.0 → 2.0.0)
- `chore:`, `docs:`, `test:`, `refactor:` → no release

## Prerequisites

- An account on [npmjs.com](https://www.npmjs.com) with access to the `claude-code-arcane` package
- Admin access to the GitHub repository

## Step 1: Create an npm token

1. Go to **https://www.npmjs.com** and log in
2. Click the avatar (top right) → **Access Tokens**
3. Click **Generate New Token** → choose **Granular Access Token**
4. Configure:
   - **Token name:** `arcane-release`
   - **Expiration:** no expiration (or whichever you prefer)
   - **Packages and scopes:** select **Read and write**
   - **Select packages:** choose `claude-code-arcane`
5. Click **Generate Token**
6. **Copy the token** — it is shown only once

## Step 2: Add the secret on GitHub

1. Go to [Settings > Secrets > Actions](https://github.com/SebastianLuser/Claude-Code-Arcane/settings/secrets/actions)
2. Click **New repository secret**
3. Fill in:
   - **Name:** `NPM_TOKEN`
   - **Secret:** paste the token copied in the previous step
4. Click **Add secret**

> **Note:** `GITHUB_TOKEN` is provided automatically by GitHub Actions; there is no need to configure it.

## Step 3: Verify

1. Push to `main` with a `feat:` or `fix:` commit
2. Go to [Actions](https://github.com/SebastianLuser/Claude-Code-Arcane/actions) and verify that the **Release** workflow runs successfully
3. Verify on npm that the new version shows up: `npm view claude-code-arcane version`
4. Verify that a [GitHub Release](https://github.com/SebastianLuser/Claude-Code-Arcane/releases) was created with an automatic changelog

## Configuration files

| File | Purpose |
|---------|-----------|
| `.releaserc.json` | semantic-release configuration (plugins, branches) |
| `.github/workflows/release.yml` | GitHub Actions workflow that runs semantic-release |
| `.github/workflows/ci.yml` | Separate CI (build + test + typecheck) |

## Troubleshooting

### The workflow fails with "NPM_TOKEN is not set"
The secret is not configured. Follow Step 2.

### The workflow runs but does not publish
semantic-release only publishes when there are commits that justify a version bump. `chore:`, `docs:` and `test:` commits do not produce a release. Use `feat:` or `fix:`.

### Error "npm ERR! 403 Forbidden"
The token has no write permission on the package, or it expired. Regenerate it following Step 1.

### CHANGELOG.md is not updated
semantic-release commits the changelog automatically with `[skip ci]` to avoid a loop. If it does not show up, verify that the `@semantic-release/git` plugin is in `.releaserc.json`.

## Hybrid Distribution

Besides the automatic release, Arcane supports hybrid distribution:

- **GitHub source:** `npx claude-code-arcane install backend-typescript --source github` downloads content straight from the repo
- **Local cache:** downloaded content is cached in `~/.arcane/cache/`
- **Bundled fallback:** if GitHub is unavailable, it uses the content packaged in npm
- **Auto:** `--source auto` (default) tries GitHub → cache → bundled

Environment variable: `ARCANE_SOURCE=bundled|github|auto`

## Smart Update

`arcane update` compares the installed content with the latest available version:

```bash
arcane update            # update content (three-way merge)
arcane update --dry-run  # show what would change without applying it
arcane update --force    # overwrite even locally modified files
```

The three-way merge detects:
- Upstream changes not touched locally → **updates**
- Locally customized files with no upstream changes → **preserves**
- Conflicts (both changed) → **backup + update + warn**
