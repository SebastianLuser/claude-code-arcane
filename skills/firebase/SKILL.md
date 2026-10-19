---
name: firebase
description: "Firebase for web and mobile apps: projects per environment, Authentication, Firestore and Storage security rules tested in the Emulator Suite, App Check, Cloud Functions, Hosting, and cost guards. Set up or review a Firebase project."
category: "infrastructure"
argument-hint: "[setup | rules | functions | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Firebase

In Firebase the client talks to the database directly, so **security rules are the backend's authorization layer**. Most Firebase incidents are rules that allow too much, and most surprise bills are reads nobody counted.

## Phase 1: Scope

| Mode | Does |
|---|---|
| `setup` | Projects per environment, SDK config, Auth, Emulator Suite, deploy targets |
| `rules` | Writes or reviews Firestore and Storage rules, with tests in the emulator |
| `functions` | Cloud Functions for Firebase: triggers, secrets, regions, deploys |
| `review` | Checks a project against Phase 6 and gives a verdict |

Read `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json` and the functions folder first. Check `firebase --version` (firebase-tools) and the SDK versions in the lockfile: APIs differ between majors.

## Phase 2: Projects and setup

- **One Firebase project per environment** (dev, staging, prod), aliased in `.firebaserc` and selected with `firebase use <alias>`. Never test against production.
- The web config object (`apiKey`, `projectId`…) identifies the project and is **not a secret**; protection comes from rules, App Check and API key restrictions in Google Cloud, not from hiding it.
- **Emulator Suite** (`firebase emulators:start`) for Auth, Firestore, Storage and Functions in local development and in CI tests.

## Phase 3: Security rules

```js
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      // request.resource is the document as it will be after a write: keep write checks in their own rule
      allow update: if request.auth != null && request.auth.uid == userId
        && request.resource.data.get('role', null) == resource.data.get('role', null);
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;     // deny by default
    }
  }
}
```

- **Deny by default**; open each collection with the narrowest condition. `allow read, write: if true` or rules based only on `request.auth != null` (any signed-in user can read everyone's data) are findings.
- Validate writes: allowed fields, types, sizes, and that users cannot change their own role, owner or price fields.
- Rules are not filters: a query must be constrained to what the rules allow, or it fails.
- **Test rules** with `@firebase/rules-unit-testing` against the emulator, in CI, for both allowed and denied cases. Storage rules get the same treatment.
- Server-side code (Admin SDK, Functions) bypasses rules: it needs its own authorization checks.

## Phase 4: Auth and App Check

- Enable only the sign-in providers in use; restrict authorized domains; email enumeration protection on.
- Custom claims for roles, set only from trusted server code; rules read them from `request.auth.token`.
- **App Check** (Play Integrity, App Attest / DeviceCheck, reCAPTCHA Enterprise on the web) enforced on Firestore, Storage and callable functions once the apps send tokens: it blocks scripts that reuse the public config. Roll out in monitor mode first.

## Phase 5: Functions and Hosting

- Cloud Functions for Firebase 2nd gen run on Cloud Run: set `region` near the database, `maxInstances` to cap cost, `minInstances` only where cold starts hurt.
- Secrets through `defineSecret` (stored in Secret Manager), never in source or plain environment config.
- Background triggers retry only if enabled; make them idempotent either way.
- Deploy only what changed: `firebase deploy --only functions:<name>,firestore:rules`.
- Hosting: preview channels (`firebase hosting:channel:deploy <name>`) for PR previews; App Hosting for frameworks like Next.js where supported.

## Phase 6: Review and cost

| Area | Baseline |
|---|---|
| **Rules** | Deny by default, ownership checks, write validation, tests in CI |
| **App Check** | Enforced on data services used by clients |
| **Environments** | Separate projects; no production credentials in dev |
| **Cost** | On the pay-as-you-go plan, a **budget alert** in Google Cloud Billing; queries paginated and indexed; no listeners on large collections; `maxInstances` on functions |
| **Backups** | Firestore scheduled backups or PITR enabled for production (`/backup-strategy`) |

| Verdict | When |
|---|---|
| **PASS** | Baseline met and rules tested |
| **CONCERNS** | App Check not enforced, no budget alert, untested rules, functions without `maxInstances` |
| **FAIL** | Rules that let any user read or write other users' data, `if true` on real data, production used for testing, Admin credentials in client code |

## Protocol

- Ask before `firebase deploy` to production and before changing rules there.
- Never download or paste production user data to inspect a problem; reproduce it in the emulator.

## Next steps

- `/accessibility` and `/frontend-dev` for the client app.
- `/backup-strategy` for Firestore backups and restores.
- `/supply-chain-security` for the functions' dependencies.
