# 8. Advanced Patterns (LOW)

Patrones de borde con `useEffectEvent` y setup de app. Impacto bajo pero evitan bugs sutiles.

## 8.4 useEffectEvent for Stable Callback Refs — LOW
Referencias de callback estables para componentes memoizados sin re-disparar effects.
```tsx
const onTick = useEffectEvent(() => doSomething(latestProp));
useEffect(() => { const id = setInterval(onTick, 1000); return () => clearInterval(id); }, []);
```

## 8.1 Do Not Put Effect Events in Dependency Arrays — LOW
Los Effect Events no van en el array de dependencias; se llaman desde el effect, no lo re-disparan.

## 8.2 Initialize App Once, Not Per Mount — LOW
Setup de app a nivel module-load, no en effects/mounts de componente.

## 8.3 Store Event Handlers in Refs — LOW
Handlers que cambian seguido en refs → no causan re-render.

_Ref: https://react.dev/reference/react/experimental_useEffectEvent_
