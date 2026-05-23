# Game Dev Coding Standards

Estándares específicos para desarrollo de videojuegos (engines, gameplay, shaders, assets). Complementa `docs/coding-standards.md` (core universal).

---

## Arquitectura

### Data-driven values
**Los valores de gameplay NO van hardcoded.** Nunca.

- Damage, HP, velocidades, tiempos, drop rates, precios → config externo (JSON, TSV, ScriptableObject, Resource)
- Diseñadores editan config sin tocar código
- Excepción: valores matemáticos (π, conversiones de unidades)

### ADRs por sistema
Cada sistema de juego debe tener ADR en `docs/architecture/` explicando decisiones técnicas. Usar template `.claude/docs/templates/architecture-decision-record.md`.

### Scene/prefab separation
- **Lógica en código, composición en scenes/prefabs.**
- Scenes no deben tener scripting crítico inline.
- Prefabs son instances configurables, no code containers.

### Dependency injection > Singletons
Para testabilidad, inyectar dependencies (via constructor, factory, o service locator explícito). Singletons solo para casos genuinos (GameManager de alto nivel, AudioBus).

---

## Engine-Specific

### Unity
- **ScriptableObjects para data** (stats, configs, events)
- **Addressables para asset loading** en proyectos medianos/grandes
- **Jobs + Burst o DOTS** solo cuando hay evidencia de performance needed — no preventivo
- **Awake vs Start:** Awake para setup propio, Start para setup que depende de otros
- **Coroutines vs async/await:** coroutines para animation/timing, async para I/O

### Unreal
- **Blueprint vs C++:** gameplay rápido en BP, sistemas críticos y performance en C++
- **GAS (Gameplay Ability System)** para todo ability-based si el juego lo usa extensamente
- **UMG para UI** (no ImGui ni Slate directo a menos que sea debug)
- **Replication:** diseñar networking desde día 1 si es multiplayer — no bolt-on después

---

## Gameplay Code

### State machines
- **Enums + switch** para states simples (<5)
- **State pattern** (clases por state) para >5 states o lógica compleja
- **HFSM (hierarchical)** para AI compleja

### Events / communication
- **Events over direct references** entre sistemas desacoplados
- **Direct references** cuando el coupling es inherente (Player → PlayerHealth)
- **Pub/sub global** solo para cross-cutting (achievement system, analytics)

### Frame-rate independence
- Movimiento usa `delta` time
- Cooldowns en segundos, no frames
- Animaciones con curve + duración, no frame-counted

### Determinism (cuando importa)
- Replay systems, rollback netcode, lockstep multiplayer → requieren determinismo estricto
- Fixed timestep para physics
- Seeds explícitos para RNG
- Floating point: cuidado con order of operations

---

## Shader Code

### General
- **Precision declarada** (highp/mediump/lowp) para mobile
- **Minimizar branches** en pixel shaders (usar `lerp` / `step`)
- **No texture fetches en loops sin bound**
- **Batching-friendly:** mismo material → mismo draw call
- **Variants controlados** — multi_compile genera explosion; preferir keywords específicos

### Performance
- **Quad overdraw:** visualizar en engine antes de shipping
- **Texture sampling count:** medir, minimizar
- **GPU profiler:** corroborar con herramientas del engine (RenderDoc, PIX, Unity Frame Debugger)

---

## UI Code (Games)

- **Separar vista de estado:** UI lee estado, no tiene lógica de negocio
- **Navegación:** keyboard + gamepad + touch desde día 1, no bolt-on
- **Focus management:** siempre hay un elemento con foco (accesibilidad + gamepad)
- **Layout responsive:** anchors, constraints, safe areas (mobile)
- **Localización:** strings externos desde día 1, no hardcoded

---

## Network Code (Games)

### Authority
- **Server-authoritative** para competitive / economy / anti-cheat
- **Client-authoritative** solo para cosméticos y preferences
- **Hybrid** (client predicts, server corrects) para movimiento en juegos rápidos

### Reliability
- **UDP unreliable** para movimiento/posición (stream constante, se corrige)
- **UDP reliable** para events importantes (spawn, death, ability activation)
- **TCP** solo para lobby/matchmaking/chat

### Bandwidth
- **Delta compression** para state updates
- **Interest management:** no mandar data de entities fuera del view
- **Snapshots:** rate configurable según red

---

## Testing (Gamedev-Specific)

### Test evidence por tipo de story

| Tipo | Required | Location | Gate |
|------|----------|----------|------|
| **Logic** (formulas, AI, state machines) | Unit test automático — pass requerido | `tests/unit/[system]/` | BLOCKING |
| **Integration** (multi-sistema) | Integration test O playtest documentado | `tests/integration/[system]/` | BLOCKING |
| **Visual/Feel** (animation, VFX, feel) | Screenshot + sign-off del lead | `production/qa/evidence/` | ADVISORY |
| **UI** (menus, HUD, screens) | Manual walkthrough doc O interaction test | `production/qa/evidence/` | ADVISORY |
| **Config/Data** (balance tuning) | Smoke check pass | `production/qa/smoke-[date].md` | ADVISORY |

### Automated test rules
- **Naming:** `[system]_[feature]_test.[ext]`; función: `test_[scenario]_[expected]`
- **Determinismo:** tests dan mismo resultado cada run — no random seeds libres, no time-dependent
- **Aislamiento:** cada test setup/teardown; no depender de orden
- **Sin hardcoded data:** fixtures en archivos constantes o factory functions
- **Sin external calls:** no APIs reales, no file I/O sin mock, no engine subsystems no aislados

### Qué NO automatizar
- Visual fidelity (shader output, VFX appearance, animation curves)
- "Feel" (input responsiveness, perceived weight, timing feel)
- Platform rendering (correr en target hardware, no headless)
- Full gameplay sessions (playtesting, no automation)

### CI/CD por engine

- **Unity:** `game-ci/unity-test-runner@v4` (GitHub Actions)
- **Unreal:** headless runner con `-nullrhi` flag

---

## Design Document Standards

Todos los design docs en `design/gdd/` siguen estas 8 secciones obligatorias:

1. **Overview** — summary de un párrafo
2. **Player Fantasy** — feeling intended + experiencia
3. **Detailed Rules** — mecánicas sin ambigüedad
4. **Formulas** — toda la matemática con variables definidas + ejemplos
5. **Edge Cases** — situaciones inusuales resueltas
6. **Dependencies** — otros sistemas listados (bidireccional: si A depende de B, B menciona A)
7. **Tuning Knobs** — valores configurables identificados
8. **Acceptance Criteria** — condiciones de éxito testables (no "debe sentirse bien")

### Reglas adicionales
- Balance values linkean a formula de origen o rationale
- Formulas: incluir rango esperado de valores + ejemplo de cálculo
- Edge cases: decir qué pasa explícitamente, no "handle gracefully"
- Tuning knobs: especificar rangos seguros + qué aspecto afectan
- Acceptance criteria: testable — un QA debe poder verificar pass/fail

---

## Asset Conventions

### Naming
- **Textures:** `t_[category]_[name]_[type]` ej `t_env_rock_albedo.png`
- **Meshes:** `sm_[category]_[name]` (static mesh) / `sk_[character]_[variant]` (skeletal)
- **Materials:** `m_[category]_[name]` / `mi_[name]` (material instance)
- **Audio:** `sfx_[category]_[name]` / `music_[context]` / `vo_[character]_[line_id]`

### Organization
- Por feature, no por tipo de asset
- `assets/characters/hero/{meshes, textures, materials, anims}`, no `assets/meshes/all`

### Version control
- LFS para binarios grandes (>1MB)
- `.gitignore` para caches del engine (Library/, Intermediate/, Saved/)
