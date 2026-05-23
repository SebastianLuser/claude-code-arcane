# Dependency Heuristics & Priority Tiers

## Dependency Heuristics

- **Input/output**: A produce datos que B necesita
- **Structural**: A provee framework donde B se conecta
- **UI**: cada sistema gameplay tiene UI que depende de él

## Layers (dependency order)

1. **Foundation** — cero dependencias (diseñar primero)
2. **Core** — depende solo de Foundation
3. **Feature** — depende de Core
4. **Presentation** — UI y feedback
5. **Polish** — meta-sistemas, tutoriales, analytics, accesibilidad

## Risk Detection

- **Circulares** → proponer resolución (interfaz, contrato, diseño simultáneo)
- **Bottlenecks** → muchos dependen de ellos = alto riesgo
- **Leaf nodes** → sin dependientes = bajo riesgo, diseñar tarde

## Priority Tiers

| Tier | Criterio |
|------|----------|
| **MVP** | Requerido para core loop + dependencias Foundation |
| **Vertical Slice** | Necesario para experiencia completa en un área |
| **Alpha** | Gameplay systems restantes |
| **Full Vision** | Polish, meta, nice-to-have |

## Design Order

Combinar dependency layer + priority tier: MVP Foundation → MVP Core → MVP Feature → VS Foundation → ...

Columna "Why": mezclar necesidad técnica con experiencia de jugador. No solo "X depende de Y" — conectar con pilares y player experience.
