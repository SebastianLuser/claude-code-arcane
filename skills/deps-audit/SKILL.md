---
name: deps-audit
description: "Audit dependencies: outdated packages, vulnerabilities, unused deps, license compliance."
category: "operations"
argument-hint: "[full|security|outdated|unused|licenses]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Dependencies Audit

Full audit of the project's dependencies.

## Process

### 1. Detect the package manager

| Manager | File | Outdated command | Audit command |
|---------|---------|-----------------|---------------|
| Go modules | `go.mod` | `go list -m -u all` | `govulncheck ./...` |
| npm | `package.json` | `npm outdated` | `npm audit` |
| yarn | `yarn.lock` | `yarn outdated` | `yarn audit` |
| pnpm | `pnpm-lock.yaml` | `pnpm outdated` | `pnpm audit` |
| pip | `requirements.txt` | `pip list --outdated` | `pip-audit` / `safety check` |
| poetry | `pyproject.toml` | `poetry show --outdated` | `poetry audit` |
| cargo | `Cargo.toml` | `cargo outdated` | `cargo audit` |

### 2. Checks to run

#### A. Known vulnerabilities
Run the package manager's audit tool. Classify by severity: critical, high, medium, low.

#### B. Outdated dependencies
- **Major version behind** → incompatibility risk + missing security patches
- **Minor version behind** → features and fixes available
- **Patch behind** → bugfixes available

#### C. Unused dependencies
```bash
# Go
go mod tidy -v 2>&1 | grep "unused"

# Node (with depcheck)
npx depcheck 2>/dev/null

# Manual: search for imports
```

#### D. Lock file
- Does a lock file exist? (`go.sum`, `package-lock.json`, `yarn.lock`, `poetry.lock`)
- Is it in git?
- Is it in sync with the manifest?

#### E. Typosquatting
For each **direct** dependency, look for names that imitate a well-known package: one letter more or less (`expresss`, `lodahs`), a changed separator (`python-dateutil` vs `dateutil`), a fake scope (`@types-node/x`). When in doubt:
```bash
npm view <pkg> time.created maintainers repository   # created days ago, 1 maintainer, no repo → suspicious
npm view <pkg> scripts                               # postinstall in a library that compiles nothing → suspicious
```
`npm audit signatures` verifies the registry signatures and the provenance of what is installed.

#### F. Lockfile diff
If the audit runs on a branch or a PR, compare the lockfile against the base:
```bash
git diff <base> -- package-lock.json pnpm-lock.yaml yarn.lock go.sum poetry.lock
```
Signals: new packages nobody added to the manifest, `resolved` pointing to a host other than the registry, `integrity` changing without a version change. In CI: `lockfile-lint --path package-lock.json --allowed-hosts npm --validate-https`.

For install-time defenses (scripts, minimum version age) and the response to a compromised package: `/supply-chain-security`.

### 3. Report

```markdown
# Dependencies Audit — [project] — [date]
**Package manager:** [go/npm/pip/etc.]
**Total dependencies:** [N direct, M transitive]

## Status: [CLEAN / WARNINGS / CRITICAL]

## Vulnerabilities
| Severity | Package | Current version | Fix available | CVE |
|-----------|---------|---------------|----------------|-----|
| CRITICAL | pkg-x | 1.2.3 | 1.2.4 | CVE-2024-... |

## Outdated (major)
| Package | Current | Latest | Change |
|---------|--------|--------|--------|

## Outdated (minor/patch)
| Package | Current | Latest |
|---------|--------|--------|

## Unused
| Package | Evidence |
|---------|-----------|

## Typosquatting and lockfile
| Package | Signal | Action |
|---------|-------|--------|

## Lock file
- Exists: [YES/NO]
- In git: [YES/NO]
- In sync: [YES/NO]

## Recommendations
1. [Priority action + command to run]
```

## Rules
- Prioritize CRITICAL and HIGH vulnerabilities
- For each vulnerability, include the fix command if it is simple
- Do not run automatic updates without the user's confirmation
- Write the report in the user's language
