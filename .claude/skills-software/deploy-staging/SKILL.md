---
name: deploy-staging
description: "Despliega el proyecto a staging: verifica branch, identifica método de deploy (CI/CD o script), ejecuta y reporta status. No deploya prod sin confirmación."
category: "operations"
argument-hint: ""
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Skill: deploy-staging

## Trigger
When the user says "deploy", "deploy a staging", "subir a staging", or similar.

## Workflow

1. Verify the current branch and status:
   ```bash
   git status
   git log --oneline -3
   ```

2. Check if there are uncommitted changes — warn the user if so

3. Identify the deployment method:
   - Check for CI/CD pipeline (`.github/workflows/`, `cloudbuild.yaml`)
   - Check for deploy scripts in `Makefile` or `package.json`

4. For tich-cronos (GCP Cloud Functions):
   - Push the branch to GitHub
   - CI/CD pipeline handles deployment via GitHub Actions
   - Cloud functions follow naming: `b2b-cronos-<http|queue>-<METHOD>-<VERSION>-<RESOURCE>`

5. For tuni-ai-webapp (GCS CDN):
   - Build the widget: `npm run build`
   - Upload to GCS bucket: `gs://educabot-aec-cdn-1/aliz-ia/tuni-widget.iife.js`
   - Verify the deployed version

6. Report the deploy status to the user

## Notes
- Never deploy directly to production without explicit confirmation
- Always verify staging works before suggesting production deploy
- Check if the PR has been approved before deploying
