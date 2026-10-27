# Mobile Rollback (React Native)

There is no instant rollback because of App Store review.

## Mitigations

- **Server-driven feature flags** — toggle without a release
- **OTA updates** (Expo Updates / CodePush) for the JS bundle
- **Forced minimum version** (force update) — require an update if a version is broken
- **API compatibility with N-2 versions** — never break old clients
