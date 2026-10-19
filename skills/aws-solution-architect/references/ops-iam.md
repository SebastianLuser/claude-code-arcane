# Operate: IAM

## Principles

- **Roles, not users.** People sign in through IAM Identity Center (SSO); workloads assume roles (ECS task role, Lambda execution role); CI assumes a role through OIDC. Long-lived access keys are the exception and get rotated.
- **Least privilege:** start from the actions the service really calls (IAM Access Analyzer can generate a policy from CloudTrail activity), scope `Resource` to ARNs, add `Condition` keys where possible.
- **Separate accounts** per environment (prod, staging) under AWS Organizations; guardrails with SCPs at the organization level.

## GitHub Actions without stored keys (OIDC)

1. Create the OIDC provider once per account: `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
2. A role whose trust policy accepts only your repo and branch or environment:

```json
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
    "StringLike": { "token.actions.githubusercontent.com:sub": "repo:<org>/<repo>:environment:production" }
  }
}
```

3. In the workflow: `permissions: id-token: write` and `aws-actions/configure-aws-credentials` with `role-to-assume`.

A `sub` condition like `repo:<org>/*` lets every repo in the org assume the role: always scope to one repo and, for deploy roles, one environment or branch.

## Auditing

```bash
aws iam generate-credential-report && aws iam get-credential-report --query Content --output text | base64 -d
aws accessanalyzer list-findings --analyzer-arn <arn>          # resources shared outside the account
aws iam list-access-keys --user-name <user>                    # then check last use:
aws iam get-access-key-last-used --access-key-id <key-id>
```

Look for: users with console access and no MFA, access keys older than 90 days or unused, policies with `"Action": "*"` or `"Resource": "*"` on write actions, roles trusted by `*` or another account you do not recognize.

## Troubleshooting `AccessDenied`

1. Which principal made the call? `aws sts get-caller-identity` (in CI, the assumed role).
2. The error message names the action and, often, which policy type denied it (identity policy, resource policy, SCP, permission boundary, session policy).
3. Test without deploying: `aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names s3:PutObject --resource-arns <arn>`.
4. An explicit `Deny` anywhere wins over every `Allow`.
