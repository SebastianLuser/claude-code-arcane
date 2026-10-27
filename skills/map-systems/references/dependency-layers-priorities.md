# Dependency Heuristics & Priority Tiers

## Dependency Heuristics

- **Input/output**: A produces data that B needs
- **Structural**: A provides a framework that B plugs into
- **UI**: every gameplay system has UI that depends on it

## Layers (dependency order)

1. **Foundation** — zero dependencies (design first)
2. **Core** — depends only on Foundation
3. **Feature** — depends on Core
4. **Presentation** — UI and feedback
5. **Polish** — meta-systems, tutorials, analytics, accessibility

## Risk Detection

- **Circular** → propose a resolution (interface, contract, simultaneous design)
- **Bottlenecks** → many systems depend on them = high risk
- **Leaf nodes** → no dependents = low risk, design late

## Priority Tiers

| Tier | Criterion |
|------|----------|
| **MVP** | Required for the core loop + Foundation dependencies |
| **Vertical Slice** | Needed for a complete experience in one area |
| **Alpha** | Remaining gameplay systems |
| **Full Vision** | Polish, meta, nice-to-have |

## Design Order

Combine dependency layer + priority tier: MVP Foundation → MVP Core → MVP Feature → VS Foundation → ...

"Why" column: mix technical need with player experience. Not just "X depends on Y" — connect it to the pillars and the player experience.
