# Operate: Secrets Manager and Parameter Store

| Store | Use for |
|---|---|
| **Secrets Manager** | Credentials that rotate (database passwords, API keys); cross-account sharing; managed rotation for RDS |
| **SSM Parameter Store** (`SecureString`) | Configuration and secrets that do not rotate; cheaper, standard parameters are free |

## Reading secrets

- **ECS:** `secrets` in the task definition with `valueFrom: <secret-arn>` (or `<secret-arn>:<json-key>::`); the execution role needs `secretsmanager:GetSecretValue` and `kms:Decrypt` if a customer key is used.
- **Lambda:** read at runtime and cache (the AWS Parameters and Secrets Lambda Extension caches for you); do not bake values into env vars at deploy time.
- **CI:** fetch with the OIDC role at deploy time; never copy secrets into GitHub repository secrets when the workload can read them directly.
- Scope IAM to the exact secret ARNs (or a name prefix per service), not `*`.

## Rotation

- RDS and Aurora: `--manage-master-user-password` lets RDS rotate the master password in Secrets Manager with no Lambda to maintain.
- Other secrets: a rotation Lambda (AWS provides templates for common databases) with a schedule; the app must re-read the secret after rotation, or connections break when the old value is retired.
- Rotate immediately after any suspected exposure (`aws secretsmanager rotate-secret --secret-id <id>`), then check CloudTrail for `GetSecretValue` calls you do not recognize.

## Hygiene

```bash
aws secretsmanager list-secrets --query "SecretList[].[Name,LastAccessedDate,LastRotatedDate]" --output table
```

Delete secrets nobody reads (deletion has a recovery window of 7–30 days), and alarm on secrets that should rotate but have not. Never log secret values; never put them in `describe`-able places such as task definition environment variables or CloudFormation parameters without `NoEcho`.
