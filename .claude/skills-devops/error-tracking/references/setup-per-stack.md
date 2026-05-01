# Error Tracking Setup per Stack

## Go Backend
- `bugsnag-go/v2`: Configure con APIKey, ReleaseStage, AppVersion, ProjectPackages
- Gin middleware: `defer bugsnag.AutoNotify(ctx, req)`. Panics auto-recovered
- Manual: `bugsnag.Notify(err, ctx, bugsnag.MetaData{...})`

## Node/TS (Fastify/Express)
- `@bugsnag/js` + plugin express. `redactedKeys` para PII
- `onError` filter para no reportar ValidationError
- `process.on('unhandledRejection', Bugsnag.notify)`

## React + Vite
- `@bugsnag/plugin-react` ErrorBoundary wrapping `<App />`
- **Source maps critico:** upload con `@bugsnag/source-maps upload-browser` en CI. No servir `.map` publicos

## React Native / Expo
- `@bugsnag/react-native` con `codeBundleId` para OTA updates
- **Symbolication:** dSYM iOS (`bugsnag-dsym-upload`), Proguard Android, Hermes source maps
- Sin symbolication -> stacks ofuscados inutilizables

## Release Tracking
- CI post-deploy: upload source maps + Build API report (`appVersion`, `revision`, `releaseStage`)
- Stability score por release -> regressions visibles
