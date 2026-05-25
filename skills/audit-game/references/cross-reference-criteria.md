# Cross-Reference Criteria

## A. Contradicciones (CRITICAL)
- **Doc vs Doc**: Comparar secciones del GDD contra spec docs. Flaggear donde describan la misma mecánica de forma diferente (fórmulas, valores, flujo, terminología).
- **Doc vs Code**: Comparar comportamiento documentado vs implementado. Flaggear donde el código hace algo diferente a lo que dicen los docs.
- **Contradicciones internas**: Flaggear donde el MISMO documento dice dos cosas diferentes sobre la misma mecánica.

Para cada contradicción:
```
| Aspecto | Fuente A dice | Fuente B dice | Severidad | Recomendación |
```

## B. Gaps y contenido faltante (HIGH)
- Secciones con [TBD], vacías o placeholder
- Mecánicas referenciadas pero nunca definidas
- Sistemas que dependen de decisiones no tomadas (dependencias bloqueantes)
- Fórmulas, valores o números de balance faltantes
- Items/enemigos/bosses listados sin stats concretos

Clasificar cada gap:
- **Bloqueante**: No se puede implementar sin esta decisión
- **Importante**: Debe definirse antes del vertical slice / milestone actual
- **Nice to have**: Puede esperar

## C. Coherencia y lógica (MEDIUM)
- El sistema tiene sentido lógico? (mecánica que contradice pilares del juego)
- Edge cases no cubiertos? ("qué pasa cuando X Y Z al mismo tiempo?")
- Las fórmulas producen valores razonables? Correr math mental con escenarios ejemplo
- Terminología consistente? (mismo concepto con nombres diferentes en distintos lugares)
- Las curvas de dificultad tienen sentido?

## D. Balance Red Flags (MEDIUM)
- Estrategias dominantes sin counterplay
- Opciones inútiles que son estrictamente peores que alternativas
- Mecánicas de snowball / death spiral
- Economía rota (items muy baratos/caros relativo al income)
- Ratios de daño/HP que hacen combates muy rápidos o muy lentos

## E. Completitud para milestone actual (HIGH)
- El scope del milestone/prototype lista todo lo necesario?
- Todos los sistemas en scope están definidos en el doc?
- Hay dependencias ocultas (Sistema A necesita Sistema B que no está en scope)?
