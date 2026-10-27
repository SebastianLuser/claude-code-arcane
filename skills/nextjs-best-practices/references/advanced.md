# 8. Advanced Patterns (LOW)

Edge patterns with `useEffectEvent` and app setup. Low impact, but they prevent subtle bugs.

## 8.4 useEffectEvent for Stable Callback Refs — LOW
Stable callback references for memoized components without re-firing effects.
```tsx
const onTick = useEffectEvent(() => doSomething(latestProp));
useEffect(() => { const id = setInterval(onTick, 1000); return () => clearInterval(id); }, []);
```

## 8.1 Do Not Put Effect Events in Dependency Arrays — LOW
Effect Events do not go in the dependency array; they are called from the effect and do not re-fire it.

## 8.2 Initialize App Once, Not Per Mount — LOW
App setup at module-load level, not in component effects/mounts.

## 8.3 Store Event Handlers in Refs — LOW
Handlers that change often go in refs → they do not cause re-renders.

_Ref: https://react.dev/reference/react/experimental_useEffectEvent_
