# Error Tracking Setup per Stack

## Go Backend
- `bugsnag-go/v2`: Configure with APIKey, ReleaseStage, AppVersion, ProjectPackages
- Gin middleware: `defer bugsnag.AutoNotify(ctx, req)`. Panics auto-recovered
- Manual: `bugsnag.Notify(err, ctx, bugsnag.MetaData{...})`

## Node/TS (Fastify/Express)
- `@bugsnag/js` + express plugin. `redactedKeys` for PII
- `onError` filter so ValidationError is not reported
- `process.on('unhandledRejection', Bugsnag.notify)`

## React + Vite
- `@bugsnag/plugin-react` ErrorBoundary wrapping `<App />`
- **Source maps are critical:** upload with `@bugsnag/source-maps upload-browser` in CI. Do not serve public `.map` files

## React Native / Expo
- `@bugsnag/react-native` with `codeBundleId` for OTA updates
- **Symbolication:** iOS dSYM (`bugsnag-dsym-upload`), Android Proguard, Hermes source maps
- Without symbolication -> unusable obfuscated stacks

## Release Tracking
- CI post-deploy: upload source maps + Build API report (`appVersion`, `revision`, `releaseStage`)
- Stability score per release -> regressions become visible
