---
name: env-sync
description: "Compares .env.example against the real .env, detects missing, extra or default-valued variables. Use when the user mentions: env, environment variables, .env, config check, setup."
category: "operations"
argument-hint: "[path to .env root, default .]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Environment Sync Checker

Verifies that environment variables are in sync between `.env.example` and `.env`.

## Process

### 1. Detect files

Look in the current directory for:
- `.env.example` / `.env.sample` / `.env.template`
- `.env` / `.env.local` / `.env.development` / `.env.production`
- `docker-compose.yml` (extract variables from `environment:`)
- `config/` or config files that reference env vars

### 2. Parse variables

From each file, extract:
- Variable name
- Value (or empty)
- Whether it has an explanatory comment

### 3. Compare

| Check | Detail |
|-------|---------|
| **Missing in .env** | Variables in .example that are not in .env |
| **Extra in .env** | Variables in .env that are not in .example (possible leftover old config) |
| **Default values** | Variables in .env that still hold the example value ("your-key-here", "changeme", etc.) |
| **Required but empty** | Variables with no value that are probably required |
| **Secrets in .example** | Values in the .example that look like real tokens/keys (red flag) |

### 4. Check .gitignore

```bash
# Make sure .env is NOT tracked
git ls-files --error-unmatch .env 2>/dev/null
```

If `.env` is tracked → **CRITICAL ALERT**.

### 5. Cross-check with the code

Search the code for environment variables that are NOT in .env.example:

```bash
# Go
grep -rn 'os.Getenv\|viper.Get' --include="*.go" | grep -oP '"[A-Z_]+"'

# Node.js
grep -rn 'process.env\.' --include="*.ts" --include="*.js" | grep -oP '\.[A-Z_]+'

# Python
grep -rn 'os.environ\|os.getenv' --include="*.py" | grep -oP '"[A-Z_]+"'
```

### 6. Report

```markdown
# Env Sync Report — [date]

## Status: [OK / WARN / CRITICAL]

## Variables missing from .env (you need to add them)
| Variable | Description | Suggested value |
|----------|-------------|----------------|

## Variables with a default value (review)
| Variable | Current value | Action |
|----------|-------------|--------|

## Extra variables in .env (possibly obsolete)
| Variable | Value |
|----------|-------|

## Variables in code without .env.example
| Variable | File | Line |
|----------|---------|-------|

## Security
- .env in .gitignore: [YES/NO]
- .env tracked in git: [YES/NO]
- Secrets in .env.example: [list]
```

### 7. Automatic fix (if the user accepts)

- Add the missing variables to `.env` with example values
- Add the variables missing from the code to `.env.example`
- Add `.env` to `.gitignore` if it is missing

## Rules
- NEVER show real secret values in the output
- If there are secrets in .env.example → warn immediately
- Report in the user's language
