# 1. Eliminating Waterfalls (CRITICAL)

The #1 cause of slow TTFB. Operations that wait in series when they could run in parallel.

## 1.5 Promise.all() for Independent Operations — CRITICAL
```ts
// ✗ sequential: 300ms + 300ms
const user = await getUser(id);
const posts = await getPosts(id);
// ✓ parallel: 300ms
const [user, posts] = await Promise.all([getUser(id), getPosts(id)]);
```

## 1.4 Prevent Waterfall Chains in API Routes — CRITICAL
Start independent operations immediately, await only when using them.
```ts
const userP = getUser(id);          // starts now
const settingsP = getSettings(id);  // starts now
return { user: await userP, settings: await settingsP };
```

## 1.3 Dependency-Based Parallelization — CRITICAL
When there are partial dependencies, start each task at the earliest possible moment (libs like `better-all` automate it). Do not serialize everything because of a single dependency.

## 1.7/3.7 Parallel Data Fetching with Component Composition — CRITICAL
Restructure components so independent fetches run simultaneously instead of nested.

## 1.6 Strategic Suspense Boundaries — HIGH
```tsx
<Suspense fallback={<Skeleton/>}>
  <SlowData />   {/* streams; the shell shows right away */}
</Suspense>
```

## 1.1 Check Cheap Conditions Before Async Flags — HIGH
Evaluate synchronous guards before async operations to skip work on cold paths.

## 1.2 Defer Await Until Needed — HIGH
Move the `await` into the branch where it is actually used, do not block branches that do not need it.

_Ref: https://react.dev/reference/react/Suspense_
