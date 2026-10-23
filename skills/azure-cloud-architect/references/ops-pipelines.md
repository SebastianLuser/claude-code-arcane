# Operate: Azure Pipelines (Azure DevOps)

For teams on Azure DevOps instead of GitHub Actions. The workflow security rules of `/ci-cd-setup` apply the same.

## Pipeline shape

```yaml
trigger:
  branches: { include: [main] }

stages:
  - stage: build
    jobs:
      - job: build
        pool: { vmImage: ubuntu-latest }
        steps:
          - script: npm ci && npm test && npm run build
          - publish: dist
            artifact: app

  - stage: deploy_prod
    dependsOn: build
    jobs:
      - deployment: deploy
        environment: production          # approvals and checks live on the environment
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  artifact: app
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: <service-connection>
                    appName: <app>
                    package: $(Pipeline.Workspace)/app
```

- Build once, deploy the same artifact to every stage.
- **Environments** carry approvals, business-hours checks and exclusive locks; deployment jobs record history per environment.
- Shared steps in **templates** in a separate repo, referenced by a pinned ref.

## Credentials

- **Service connections with workload identity federation** for Azure Resource Manager (Microsoft's recommended option): no client secret to rotate. Scope the identity's RBAC to the target resource group, not the subscription.
- Secrets in **variable groups linked to Key Vault**; mark variables secret so they are masked; never echo them.
- Restrict which pipelines may use each service connection and variable group ("pipeline permissions"); a new pipeline should not inherit production access.

## Common issues

| Problem | Check |
|---|---|
| Deploy fails with authorization error | The service connection's identity lacks a role on the target scope |
| Pipeline waits forever | An approval or check on the environment, or no free agent in the pool |
| Works on Microsoft-hosted, fails on self-hosted agent | Missing tools or network access on the agent; self-hosted agents need patching and should not run untrusted pull requests |
| Secret prints as `***` but the step still fails | The variable is secret but was not mapped into the script's `env:` |
