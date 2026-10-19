# Operate: IAM, service accounts and Secret Manager

## Service accounts

- **One service account per service** (each Cloud Run service, function or VM group), with only the roles it needs. Never run workloads as the default Compute Engine service account, which often has the broad Editor role.
- No service account keys: workloads get credentials from the platform, CI from Workload Identity Federation, people through their own accounts with impersonation (`--impersonate-service-account`) when they need a service account's access.
- Grant roles on the resource (the bucket, the secret, the topic) rather than the project when the API supports it.

## GitHub Actions without keys (Workload Identity Federation)

1. A workload identity pool and an OIDC provider for `https://token.actions.githubusercontent.com`. Google requires an **attribute condition** on it: the docs' example limits it to an organization (`assertion.repository_owner == '<org>'`); limiting it to one repository (`assertion.repository == '<org>/<repo>'`) is stricter and better for deploy access.
2. Grant the GitHub principal (`principalSet://iam.googleapis.com/projects/<number>/locations/global/workloadIdentityPools/<pool>/attribute.repository/<org>/<repo>`) either direct access to resources or `roles/iam.workloadIdentityUser` on a deploy service account.
3. In the workflow: `permissions: id-token: write` and `google-github-actions/auth` with `workload_identity_provider` (and `service_account` if impersonating).

Scope production deploys further with an attribute for the environment or ref.

## Secret Manager

- Grant `roles/secretmanager.secretAccessor` **per secret** to the service accounts that read it.
- Cloud Run and Cloud Run functions: reference secrets as environment variables or mounted volumes. Environment variables are resolved when an instance starts, so Google recommends **pinning a version** there instead of `latest` (instances started at different times would otherwise hold different values). A mounted volume fetches the current value each time the file is read.
- Rotation: set `--next-rotation-time` and `--rotation-period` on the secret to publish rotation notifications to Pub/Sub, and have a function create the new version. Disable old versions once nothing reads them, then destroy them.

```bash
gcloud secrets versions access latest --secret=<name>          # needs secretAccessor; never paste the value into chat
gcloud secrets get-iam-policy <name>
```

## Auditing IAM

```bash
gcloud projects get-iam-policy <project> --format=json        # who has what at project level
gcloud iam service-accounts keys list --iam-account=<sa>      # user-managed keys should not exist
```

Use IAM Recommender (role recommendations from actual usage) to shrink over-granted roles, and the organization policy that disables service account key creation (`iam.disableServiceAccountKeyCreation`) where possible.
